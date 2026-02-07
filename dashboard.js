// Dashboard JavaScript - Real-time updates
// API configuration - prefer configured API URL, fallback to known host
// CRITICAL: Do NOT use window.location.origin as fallback - in Telegram it would be telegram.org!

console.log('=== Dashboard.js Loading ===');
console.log('window.location.origin:', window.location.origin);
console.log('window.location.hostname:', window.location.hostname);
console.log('DASHBOARDCONFIG available:', !!(window.DASHBOARDCONFIG));
console.log('DASHBOARDCONFIG:', window.DASHBOARDCONFIG);

// Initialize API_BASE with proper fallback
let API_BASE;
try {
    API_BASE = (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.APIURL) || 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
    console.log('✅ API_BASE initialized from config:', API_BASE);
} catch (error) {
    console.error('❌ Error initializing API_BASE:', error);
    API_BASE = 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
    console.log('Using fallback API_BASE:', API_BASE);
}

const REFRESH_INTERVAL = (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.REFRESH_INTERVAL) || 5000; // 5 seconds (matching config.js default)
const DEBUG = (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.DEBUG) || false;

// Expose API base to other scripts/pages if needed
try { window.API_BASE = API_BASE; } catch (e) { console.error('Failed to expose API_BASE:', e); }

// Cache to prevent redundant API calls
const API_CACHE = {
    status: { data: null, timestamp: 0 },
    users: { data: null, timestamp: 0 },
    media: { data: null, timestamp: 0 },
    groups: { data: null, timestamp: 0 },
    feedback: { data: null, timestamp: 0 }
};
const CACHE_TTL = 10000; // 10 seconds cache TTL

// Check if we're on localhost and use HTTP
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE = 'http://localhost:3027';
    console.log('🏠 Running locally - using HTTP API:', API_BASE);
}

// Debug logging to verify API_BASE is set correctly
console.log('=== API_BASE Configuration Complete ===');
console.log('Final API_BASE:', API_BASE);
console.log('REFRESH_INTERVAL:', REFRESH_INTERVAL, 'ms');
console.log('DEBUG mode:', DEBUG);
console.log('✅ API_BASE set correctly - will NOT use window.location.origin');
console.log('==============================');

let updateInterval;
let telegramUser = null;

// Initialize Telegram Web App
function initTelegramWebApp() {
    console.log('=== Initializing Telegram Web App ===');
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            console.log('Telegram WebApp object found:', tg);
            
            // CRITICAL: Tell Telegram the app is ready to be displayed
            // This must be called as early as possible
            tg.ready();
            console.log('✅ Called Telegram.WebApp.ready()');
            
            // Expand to full height immediately after ready()
            tg.expand();
            console.log('✅ Called Telegram.WebApp.expand()');
            
            // Get user data
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                telegramUser = tg.initDataUnsafe.user;
                console.log('✅ Telegram user detected:', telegramUser);
                
                // Display user info in header
                displayTelegramUserInfo(telegramUser);
                
                // Send user access data to backend
                trackMiniAppAccess(telegramUser, tg.initData);
            } else {
                console.log('⚠️ No Telegram user data available - running in web browser');
                console.log('initDataUnsafe:', tg.initDataUnsafe);
                
                // For testing: Create a mock user when not in Telegram
                createMockUserForTesting();
            }
            
            // Set theme based on Telegram theme
            if (tg.themeParams && tg.themeParams.bg_color) {
                document.body.style.background = tg.themeParams.bg_color;
            }
            
            return true; // Successfully initialized
        } else {
            console.log('⚠️ Telegram WebApp not available - running in regular browser');
            // For testing: Create a mock user
            createMockUserForTesting();
            return false; // Not in Telegram context
        }
    } catch (error) {
        console.error('❌ Error in initTelegramWebApp:', error);
        showErrorBanner('Failed to initialize Telegram Web App: ' + error.message);
        // For testing: Create a mock user on error
        createMockUserForTesting();
        return false;
    }
}

// Create a mock user for testing outside Telegram
function createMockUserForTesting() {
    console.log('Creating mock user for testing...');
    
    // Show a notification that we're in testing mode
    setTimeout(() => {
        showNotification('Running in test mode with mock user (ID: 7054339190)', 'info');
    }, 1000);
    
    telegramUser = {
        id: 7054339190,
        first_name: 'Raw Queen',
        username: 'RawQueen',
        language_code: 'en'
    };
    console.log('Mock user created:', telegramUser);
    displayTelegramUserInfo(telegramUser);
}

// Display Telegram user info
function displayTelegramUserInfo(user) {
    console.log('=== displayTelegramUserInfo called ===');
    console.log('User data:', user);
    
    const header = document.querySelector('header');
    console.log('Header element:', header);
    
    if (!header) {
        console.error('❌ Header element not found!');
        return;
    }
    
    // Remove any existing user info to prevent duplicates
    const existingUserInfo = document.getElementById('telegramUserInfo');
    if (existingUserInfo) {
        console.log('Removing existing user info');
        existingUserInfo.remove();
    }
    
    // Create user info container
    const userInfo = document.createElement('div');
    userInfo.id = 'telegramUserInfo';
    userInfo.className = 'user-info active'; // Add 'active' class immediately
    console.log('Created user info element with classes:', userInfo.className);
    
    // Build user info HTML with loading state
    let infoHTML = `
        <div class="user-name">
            <i class="fab fa-telegram"></i>
            <span>${escapeHtml(user.first_name || 'User')}</span>
            ${user.username ? `<span class="telegram-badge">@${escapeHtml(user.username)}</span>` : ''}
        </div>
    `;
    
    // Show loading for premium/admin status
    infoHTML += `<div class="premium-status-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    
    infoHTML += `<div class="user-id">ID: ${user.id}</div>`;
    
    userInfo.innerHTML = infoHTML;
    header.appendChild(userInfo);
    
    console.log('✅ User info appended to header');
    
    // Force display and check computed styles
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(userInfo);
        console.log('User info computed styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            position: computedStyle.position,
            width: computedStyle.width,
            height: computedStyle.height
        });
        
        if (computedStyle.display === 'none') {
            console.error('❌ USER INFO IS HIDDEN! Checking for CSS conflicts...');
            console.error('Element classes:', userInfo.className);
            console.error('Element HTML:', userInfo.innerHTML);
        } else {
            console.log('✅ User info is visible!');
        }
    }, 100);
    
    // Fetch detailed user info from backend
    fetchUserDetails(user.id);
}

// Fetch user details including token balance and premium status
async function fetchUserDetails(userId) {
    console.log('=== Fetching user details for ID:', userId);
    try {
        const url = `${API_BASE}/api/user/${userId}/info`;
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ User details fetched:', data);
        
        // Update the display with actual data
        updateUserInfoDisplay(data);
        
    } catch (error) {
        console.error('❌ Error fetching user details:', error);
        
        // Use fallback data for testing
        console.log('Using fallback user data for display');
        updateUserInfoDisplay({
            is_admin: true,
            is_premium: false,
            token_balance: 100
        });
    }
}

// Update user info display with fetched data
function updateUserInfoDisplay(userData) {
    console.log('=== Updating user info display ===');
    console.log('User data received:', userData);
    
    const userInfo = document.getElementById('telegramUserInfo');
    if (!userInfo) {
        console.error('❌ telegramUserInfo element not found!');
        return;
    }
    
    console.log('Found user info element');
    
    // Find the loading element and replace it with actual info
    const loadingEl = userInfo.querySelector('.premium-status-loading');
    console.log('Loading element:', loadingEl);
    
    // Remove any existing user-details to prevent duplicates
    const existingDetails = userInfo.querySelector('.user-details');
    if (existingDetails) {
        console.log('Removing existing user-details');
        existingDetails.remove();
    }
    
    // Create premium/token info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'user-details';
    
    // Add admin badge if user is admin
    if (userData.is_admin) {
        console.log('✅ User is admin - adding admin badge');
        const adminBadge = document.createElement('div');
        adminBadge.className = 'admin-badge';
        adminBadge.innerHTML = `
            <i class="fas fa-user-shield"></i>
            <span>Admin</span>
        `;
        infoContainer.appendChild(adminBadge);
    } else {
        console.log('User is not admin');
    }
    
    // Add premium badge if user is premium
    if (userData.is_premium) {
        console.log('✅ User is premium - adding premium badge');
        const premiumBadge = document.createElement('div');
        premiumBadge.className = 'premium-badge';
        premiumBadge.innerHTML = `
            <i class="fas fa-crown"></i>
            <span>Premium</span>
        `;
        infoContainer.appendChild(premiumBadge);
    } else {
        console.log('User is not premium');
    }
    
    // Add token balance
    const tokenBalance = document.createElement('div');
    tokenBalance.className = 'token-balance';
    tokenBalance.innerHTML = `
        <i class="fas fa-coins"></i>
        <span class="token-count">${userData.token_balance || 0}</span>
        <span class="token-label">Tokens</span>
    `;
    infoContainer.appendChild(tokenBalance);
    
    console.log('Created info container with', infoContainer.children.length, 'children');
    
    // Replace loading with actual info
    if (loadingEl) {
        console.log('Replacing loading element with user details');
        loadingEl.replaceWith(infoContainer);
    } else {
        console.log('No loading element found, appending to userInfo');
        userInfo.appendChild(infoContainer);
    }
    
    console.log('✅ User info display updated successfully');
}

// Track Mini App access
async function trackMiniAppAccess(user, initData) {
    try {
        const response = await fetch(`${API_BASE}/api/track-miniapp-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                username: user.username || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                language_code: user.language_code || '',
                is_premium: user.is_premium || false,
                init_data: initData,
                timestamp: new Date().toISOString(),
                platform: 'mini_app'
            })
        });
        
        const data = await response.json();
        console.log('Mini app access tracked:', data);
        
        // Show welcome message if user is premium
        if (user.is_premium) {
            console.log('⭐ Premium user detected!');
        }
    } catch (error) {
        console.error('Failed to track mini app access:', error);
    }
}

// Debug logging helper
function debugLog(message, data) {
    if (DEBUG) {
        console.log(`[Dashboard] ${message}`, data || '');
    }
}

debugLog('Dashboard initialized', { API_BASE, REFRESH_INTERVAL });

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Update bot status
async function updateStatus() {
    console.log('🔄 updateStatus() starting...');
    try {
        let data;
        const now = Date.now();
        
        // Check cache first
        if (API_CACHE.status.data && (now - API_CACHE.status.timestamp) < CACHE_TTL) {
            data = API_CACHE.status.data;
            console.log('✅ Using cached status data');
        } else {
            const url = `${API_BASE}/api/status`;
            console.log('🌐 Fetching fresh status from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('📥 Response status:', response.status, response.statusText);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response not OK. Body:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            data = await response.json();
            API_CACHE.status = { data, timestamp: now };
            console.log('✅ Status data received:', data);
        }
        
        // Bot Status
        const statusElement = document.getElementById('statusIndicator');
        const statusText = document.getElementById('botStatus');
        
        if (statusElement && statusText) {
            if (data.bot_status === 'online') {
                statusElement.classList.remove('offline');
                statusElement.classList.add('online');
                statusText.textContent = 'Online';
            } else {
                statusElement.classList.remove('online');
                statusElement.classList.add('offline');
                statusText.textContent = 'Offline';
            }
        }
        
        // Uptime
        const uptimeEl = document.getElementById('uptime');
        if (uptimeEl) uptimeEl.textContent = data.uptime || '--';
        
        // CPU & Memory
        const cpuEl = document.getElementById('cpuUsage');
        const memEl = document.getElementById('memoryUsage');
        if (cpuEl) cpuEl.textContent = `${data.cpu_percent || 0}%`;
        if (memEl) memEl.textContent = `${data.memory_percent || 0}%`;
        
        // Downloads & Uploads
        const downloadsEl = document.getElementById('totalDownloads');
        const uploadsEl = document.getElementById('totalUploads');
        if (downloadsEl) downloadsEl.textContent = formatNumber(data.total_downloads || 0);
        if (uploadsEl) uploadsEl.textContent = formatNumber(data.total_uploads || 0);
        
        // System Resources
        updateResourceBar('cpu', data.cpu_percent || 0);
        updateResourceBar('memory', data.memory_percent || 0);
        updateResourceBar('disk', data.disk_percent || 0);
        
        const cpuDetailsEl = document.getElementById('cpuDetails');
        const memDetailsEl = document.getElementById('memoryDetails');
        const diskDetailsEl = document.getElementById('diskDetails');
        
        if (cpuDetailsEl) cpuDetailsEl.textContent = `${data.cpu_percent || 0}%`;
        if (memDetailsEl) memDetailsEl.textContent = `${data.memory_used_gb || 0} GB / ${data.memory_total_gb || 0} GB`;
        if (diskDetailsEl) diskDetailsEl.textContent = `${data.disk_used_gb || 0} GB / ${data.disk_total_gb || 0} GB`;
        
    } catch (error) {
        console.error('❌ Error in updateStatus:', error);
        console.error('❌ API_BASE:', API_BASE);
        console.error('❌ Error type:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Stack trace:', error.stack);
        
        // Set offline status on error
        const statusElement = document.getElementById('statusIndicator');
        const statusText = document.getElementById('botStatus');
        if (statusElement && statusText) {
            statusElement.classList.remove('online');
            statusElement.classList.add('offline');
            statusText.textContent = 'Error';
        }
        
        // Rethrow to let updateAllData handle it
        throw error;
    }
}

// Update user statistics
async function updateUsers() {
    console.log('👥 updateUsers() starting...');
    try {
        const url = `${API_BASE}/api/users`;
        console.log('🌐 Fetching users from:', url);
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Users data received:', data);
        
        const totalUsersEl = document.getElementById('totalUsers');
        const activeUsersEl = document.getElementById('activeUsers');
        const inactiveUsersEl = document.getElementById('inactiveUsers');
        const premiumUsersEl = document.getElementById('premiumUsers');
        const recentUsersEl = document.getElementById('recentUsers');
        
        if (totalUsersEl) totalUsersEl.textContent = formatNumber(data.total_users || 0);
        if (activeUsersEl) activeUsersEl.textContent = formatNumber(data.active_users || 0);
        if (inactiveUsersEl) inactiveUsersEl.textContent = formatNumber(data.inactive_users || 0);
        if (premiumUsersEl) premiumUsersEl.textContent = formatNumber(data.premium_users || 0);
        if (recentUsersEl) recentUsersEl.textContent = formatNumber(data.recent_users_7d || 0);
        
    } catch (error) {
        console.error('❌ Error in updateUsers:', error);
        console.error('❌ API_BASE:', API_BASE);
        throw error;
    }
}

// Update media statistics
async function updateMedia() {
    console.log('📸 updateMedia() starting...');
    try {
        const url = `${API_BASE}/api/media`;
        console.log('🌐 Fetching media from:', url);
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Media data received:', data);
        
        const totalMediaEl = document.getElementById('totalMedia');
        if (totalMediaEl) totalMediaEl.textContent = formatNumber(data.total_media || 0);
        
    } catch (error) {
        console.error('❌ Error in updateMedia:', error);
        throw error;
    }
}

// Update groups statistics
async function updateGroups() {
    console.log('👥 updateGroups() starting...');
    try {
        const url = `${API_BASE}/api/groups`;
        console.log('🌐 Fetching groups from:', url);
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Groups data received:', data);
        
        const totalGroupsEl = document.getElementById('totalGroups');
        if (totalGroupsEl) totalGroupsEl.textContent = formatNumber(data.total_groups || 0);
        
    } catch (error) {
        console.error('❌ Error in updateGroups:', error);
        throw error;
    }
}

// Update feedback statistics
async function updateFeedback() {
    console.log('💬 updateFeedback() starting...');
    try {
        const url = `${API_BASE}/api/feedback`;
        console.log('🌐 Fetching feedback from:', url);
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('✅ Feedback data received:', data);
        
        const totalFeedbackEl = document.getElementById('totalFeedback');
        if (totalFeedbackEl) totalFeedbackEl.textContent = formatNumber(data.total_feedback || 0);
        
    } catch (error) {
        console.error('❌ Error in updateFeedback:', error);
        throw error;
    }
}

// Update resource progress bars
function updateResourceBar(resource, percentage) {
    const progressBar = document.getElementById(`${resource}Progress`);
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        
        // Change color based on usage
        if (percentage > 80) {
            progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (percentage > 60) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #f97316)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        }
    }
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) lastUpdateEl.textContent = timeString;
}

// Check if all required elements exist
function checkDashboardElements() {
    const requiredElements = [
        'statusIndicator', 'botStatus', 'uptime', 'cpuUsage', 'memoryUsage',
        'totalUsers', 'activeUsers', 'inactiveUsers', 'premiumUsers', 'recentUsers',
        'totalDownloads', 'totalUploads', 'totalMedia', 'totalGroups', 'totalFeedback'
    ];
    
    const missing = [];
    for (const id of requiredElements) {
        if (!document.getElementById(id)) {
            missing.push(id);
        }
    }
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing dashboard elements:', missing);
        return false;
    }
    
    console.log('✅ All dashboard elements found');
    return true;
}

// Update all data
async function updateAllData() {
    console.log('📊 updateAllData() called');
    try {
        // Use Promise.allSettled instead of Promise.all to get results even if some fail
        const results = await Promise.allSettled([
            updateStatus(),
            updateUsers(),  
            updateMedia(),
            updateGroups(),
            updateFeedback()
        ]);
        
        // Check results and log any failures
        const apiNames = ['updateStatus', 'updateUsers', 'updateMedia', 'updateGroups', 'updateFeedback'];
        const failed = [];
        
        results.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(`❌ ${apiNames[i]} failed:`, r.reason);
                failed.push({ name: apiNames[i], error: r.reason });
            } else {
                console.log(`✅ ${apiNames[i]} succeeded`);
            }
        });
        
        updateLastUpdateTime();
        
        // If ALL failed, throw an error with details
        if (failed.length === results.length) {
            const errorMsg = `All ${failed.length} API calls failed. First error: ${failed[0].error.message || failed[0].error}`;
            throw new Error(errorMsg);
        }
        
        // If some failed, log warning but continue
        if (failed.length > 0) {
            console.warn(`⚠️ ${failed.length} out of ${results.length} API calls failed`);
            const failedNames = failed.map(f => f.name.replace('update', '')).join(', ');
            console.warn(`Failed APIs: ${failedNames}`);
            
            // Show a non-blocking warning
            const banner = document.getElementById('errorBanner');
            if (banner && failed.length > 1) {
                showErrorBanner(`⚠️ Some data couldn't load (${failedNames}). Retrying...`, true);
                // Auto-hide after 5 seconds
                setTimeout(hideErrorBanner, 5000);
            }
        }
        
        console.log('✅ updateAllData() completed');
    } catch (error) {
        console.error('❌ FATAL Error in updateAllData:', error);
        console.error('Error stack:', error.stack);
        // RETHROW the error so calling code can handle it
        throw error;
    }
}

// Show error banner to users
function showErrorBanner(message, canRetry = true) {
    console.error('Showing error banner:', message);
    
    const banner = document.getElementById('errorBanner');
    if (!banner) {
        console.warn('Error banner element not found in HTML');
        return;
    }
    
    const messageEl = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryBtn');
    
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    if (retryBtn) {
        retryBtn.style.display = canRetry ? 'inline-block' : 'none';
    }
    
    banner.style.display = 'block';
}

// Hide error banner
function hideErrorBanner() {
    const banner = document.getElementById('errorBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Retry loading data
function retryLoadData() {
    console.log('Retrying data load...');
    hideErrorBanner();
    updateAllData().catch(err => {
        showErrorBanner('Still unable to load data. Please check your connection and try again.');
    });
}

// Expose critical functions to global window object for inline onclick handlers
window.retryLoadData = retryLoadData;
window.initDashboard = initDashboard;
window.initTelegramWebApp = initTelegramWebApp;
window.showErrorBanner = showErrorBanner;
window.hideErrorBanner = hideErrorBanner;

// Initialize dashboard with proper Telegram Web App support
function initDashboard() {
    console.log('========================================');
    console.log('🚀 initDashboard() STARTED');
    console.log('API_BASE:', API_BASE);
    console.log('Window location:', window.location.href);
    console.log('========================================');
    
    debugLog('Initializing dashboard...');
    
    // Check if all required elements exist
    checkDashboardElements();
    
    // Initialize Telegram Web App first and wait for it
    const isInTelegram = initTelegramWebApp();
    
    // Wait a bit for Telegram SDK to fully initialize before making API calls
    const initDelay = isInTelegram ? 500 : 0;
    
    console.log(`⏱️ Waiting ${initDelay}ms for ${isInTelegram ? 'Telegram SDK' : 'browser'} initialization...`);
    
    setTimeout(async () => {
        // Initial load
        console.log('📡 Calling updateAllData()...');
        try {
            await updateAllData();
            console.log('✅ Initial load completed successfully');
            hideErrorBanner();
        } catch (err) {
            console.error('❌ Initial load failed:', err);
            console.error('Error message:', err.message);
            console.error('Stack trace:', err.stack);
            console.error('API_BASE being used:', API_BASE);
            showErrorBanner('Failed to load dashboard data: ' + err.message + '. Check console for details.');
        }
        
        // Auto-refresh using configured interval
        updateInterval = setInterval(async () => {
            try {
                await updateAllData();
                hideErrorBanner();
            } catch (err) {
                console.error('Auto-refresh failed:', err);
                // Don't show banner on auto-refresh failures to avoid spam
            }
        }, REFRESH_INTERVAL);
        
        debugLog('Auto-refresh enabled', { interval: REFRESH_INTERVAL });
        console.log('⏰ Auto-refresh enabled, interval:', REFRESH_INTERVAL);
    }, initDelay);
    
    // Add visibility change handler to pause/resume updates
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(updateInterval);
            debugLog('Page hidden - pausing updates');
        } else {
            debugLog('Page visible - resuming updates');
            updateAllData().catch(err => console.error('Resume update failed:', err));
            updateInterval = setInterval(updateAllData, REFRESH_INTERVAL);
        }
    });
}

// Start the dashboard when page loads - ONLY on appropriate pages
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOMContentLoaded Event Fired ===');
    console.log('Current URL:', window.location.href);
    console.log('Hostname:', window.location.hostname);
    console.log('API_BASE:', API_BASE);
    console.log('DASHBOARDCONFIG:', window.DASHBOARDCONFIG);
    
    if (document.getElementById('groupsGrid')) {
        // Group management page - only load groups
        console.log('📋 Group Management page detected');
        loadGroups();
    } else if (document.getElementById('statusIndicator')) {
        // Main dashboard page - initialize full dashboard
        console.log('📊 Main Dashboard page detected');
        console.log('Status indicator element found, initializing dashboard...');
        try {
            initDashboard();
        } catch (error) {
            console.error('❌ Fatal error initializing dashboard:', error);
            console.error('Stack trace:', error.stack);
            showErrorBanner('Failed to initialize dashboard: ' + error.message);
        }
    } else {
        console.log('⚠️ Unknown page - no initialization');
        console.log('Looking for groupsGrid:', !!document.getElementById('groupsGrid'));
        console.log('Looking for statusIndicator:', !!document.getElementById('statusIndicator'));
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});


// ============================================
// TELEGRAM LINKS BROWSER FUNCTIONALITY
// ============================================

let currentUserId = null;
let currentUserBalance = 0;
let currentPage = 0;
let linksPerPage = 20;
let totalLinks = 0;
let currentSearchQuery = '';
let allLinks = [];

// Initialize links browser
function initLinksBrowser() {
    const searchInput = document.getElementById('linkSearchInput');
    const searchBtn = document.getElementById('searchBtn');
    const showAllBtn = document.getElementById('showAllBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    // Search button click
    searchBtn.addEventListener('click', () => {
        performSearch();
    });
    
    // Enter key in search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // Input event for clear button visibility
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim()) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        currentSearchQuery = '';
    });
    
    // Show all links button
    showAllBtn.addEventListener('click', () => {
        currentSearchQuery = '';
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        currentPage = 0;
        loadLinks();
    });
    
    // Pagination buttons
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadLinks();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(totalLinks / linksPerPage) - 1;
        if (currentPage < maxPage) {
            currentPage++;
            loadLinks();
        }
    });
    
    // Submit link button
    const submitLinkBtn = document.getElementById('submitLinkBtn');
    if (submitLinkBtn) {
        submitLinkBtn.addEventListener('click', submitNewLink);
    }
    
    // Auto-load user from Telegram Web App if available
    if (telegramUser && telegramUser.id) {
        setTimeout(() => {
            loadUserForLinks(telegramUser.id);
        }, 1500); // Wait for user details to be fetched first
    }
    
    // Don't auto-load links - wait for user to search
    console.log('Links browser ready. Use search or "Show All Links" to view content.');
}

// Load user information for links browser
async function loadUserForLinks(userId) {
    try {
        currentUserId = userId;
        
        console.log('Loading user for links browser:', userId);
        
        // Fetch token balance
        const response = await fetch(`${API_BASE}/api/user/${userId}/info`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading user tokens:', data.error);
            // Still allow searching even if token fetch fails
            currentUserBalance = 0;
        } else {
            currentUserBalance = data.token_balance || 0;
        }
        
        // Show token info and hide notice
        const tokenBalanceEl = document.getElementById('userTokenBalance');
        if (tokenBalanceEl) {
            tokenBalanceEl.textContent = currentUserBalance;
        }
        
        const tokenInfoEl = document.getElementById('userTokenInfo');
        if (tokenInfoEl) {
            tokenInfoEl.style.display = 'block';
        }
        
        const notice = document.getElementById('linksSearchNotice');
        if (notice) {
            notice.style.display = 'none';
        }
        
        console.log(`Links browser ready for user ${userId} with ${currentUserBalance} tokens`);
        
        // Show submit link form for all users
        const submitSection = document.getElementById('submitLinkSection');
        if (submitSection) {
            submitSection.style.display = 'block';
        }
        
        // Load admin sections if user is admin
        if (data.is_admin) {
            await loadReportedLinks(userId);
            await loadPendingLinks(userId);
        }
        
    } catch (error) {
        console.error('Error loading user for links:', error);
        // Still set user ID to allow searching
        currentUserBalance = 0;
        const tokenInfoEl = document.getElementById('userTokenInfo');
        if (tokenInfoEl) {
            tokenInfoEl.style.display = 'block';
            const tokenBalanceEl = document.getElementById('userTokenBalance');
            if (tokenBalanceEl) {
                tokenBalanceEl.textContent = '0';
            }
        }
    }
}

// Perform search
async function performSearch() {
    try {
        const searchInput = document.getElementById('linkSearchInput');
        currentSearchQuery = searchInput.value.trim();
        currentPage = 0;
        console.log('Performing search with query:', currentSearchQuery);
        await loadLinks();
    } catch (error) {
        console.error('Error in performSearch:', error);
        hideLoading();
        showNotification('Search failed: ' + error.message, 'error');
    }
}

// Load links from API
async function loadLinks() {
    try {
        showLoading('Loading links...');
        
        const offset = currentPage * linksPerPage;
        let url = `${API_BASE}/api/links/search?limit=${linksPerPage}&offset=${offset}`;
        
        if (currentSearchQuery) {
            // Send lowercase query for case-insensitive search
            url += `&q=${encodeURIComponent(currentSearchQuery.toLowerCase())}`;
        }
        
        // Include user_id to filter reported links
        if (currentUserId) {
            url += `&user_id=${currentUserId}`;
        }
        
        console.log('Fetching links from:', url);
        
        let response;
        try {
            response = await fetch(url);
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            
            // If HTTPS fails and we're not on localhost, try HTTP
            if (API_BASE.startsWith('https://') && !window.location.hostname.includes('localhost')) {
                console.log('HTTPS failed, trying HTTP...');
                const httpUrl = url.replace('https://', 'http://');
                try {
                    response = await fetch(httpUrl);
                    // Update API_BASE if HTTP works
                    API_BASE = API_BASE.replace('https://', 'http://');
                    console.log('✅ HTTP connection successful, updated API_BASE:', API_BASE);
                } catch (httpError) {
                    throw new Error('Cannot connect to server (tried both HTTPS and HTTP): ' + httpError.message);
                }
            } else {
                throw fetchError;
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Links API response:', data);
        
        if (!data.success) {
            showNotification('Error loading links: ' + (data.error || 'Unknown error'), 'error');
            displayLinks([]);
            hideLoading();
            return;
        }
        
        allLinks = data.links || [];
        totalLinks = data.total || 0;
        
        console.log(`✅ Loaded ${allLinks.length} links, total: ${totalLinks}`);
        
        displayLinks(allLinks);
        updatePagination();
        hideLoading();
        
        // Restore scroll position if saved
        restoreScrollPosition();
        
    } catch (error) {
        console.error('❌ Error loading links:', error);
        showNotification('Failed to load links: ' + error.message, 'error');
        displayLinks([]);
        hideLoading();
    }
}

// Display links in the container
function displayLinks(links) {
    const container = document.getElementById('linksContainer');
    
    if (!container) {
        console.error('linksContainer element not found');
        return;
    }
    
    console.log('Displaying links:', links.length);
    
    if (!links || links.length === 0) {
        const searchHint = currentSearchQuery 
            ? `<p class="hint">No results found for "<strong>${escapeHtml(currentSearchQuery)}</strong>"</p>
               <p class="hint">Try different keywords or check spelling</p>`
            : `<p class="hint">Use the search bar above or click "Show All Links" to browse</p>`;
        
        container.innerHTML = `
            <div class="links-placeholder">
                <i class="fas fa-search"></i>
                <p>No links found</p>
                ${searchHint}
            </div>
        `;
        return;
    }
    
    // Show search results count
    if (currentSearchQuery) {
        const resultsInfo = document.createElement('div');
        resultsInfo.className = 'search-results-info';
        resultsInfo.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Found <strong>${totalLinks}</strong> result${totalLinks !== 1 ? 's' : ''} for "<strong>${escapeHtml(currentSearchQuery)}</strong>"
        `;
        container.innerHTML = '';
        container.appendChild(resultsInfo);
    } else {
        container.innerHTML = '';
    }
    
    // Create cards immediately (non-blocking)
    links.forEach((link, index) => {
        const linkCard = createLinkCard(link, index);
        container.appendChild(linkCard);
    });
    
    console.log(`Successfully displayed ${links.length} link cards`);
}

// Helper function to highlight search terms in text
function highlightSearchTerms(text, query) {
    if (!query || !text) return escapeHtml(text);
    
    // Split query into terms and make case-insensitive
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    let highlightedText = escapeHtml(text);
    
    // Highlight each search term (case-insensitive matching)
    searchTerms.forEach(term => {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
}

// Restore scroll position after page load/refresh
function restoreScrollPosition() {
    const savedPosition = sessionStorage.getItem('dashboardScrollPosition');
    if (savedPosition) {
        // Use setTimeout to ensure DOM is fully rendered
        setTimeout(() => {
            window.scrollTo({
                top: parseInt(savedPosition, 10),
                behavior: 'smooth'
            });
            console.log('✅ Restored scroll position:', savedPosition);
        }, 100);
    }
}

// Helper to escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Create a link card element
function createLinkCard(linkData, index) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.index = index;
    
    // Extract proper title and username
    let title = linkData.title || linkData.name || 'Untitled';
    const description = linkData.description || 'No description available';
    const url = linkData.link || '#';
    
    // Get username from username_display field
    let username = linkData.username_display || linkData.username || null;
    
    // Check if title is an invite code (starts with + or is alphanumeric hash)
    const isInviteCode = title.startsWith('+') || (title.length > 15 && /^[a-zA-Z0-9_-]+$/.test(title));
    
    // If title is invite code, try to use username or extract from URL
    if (isInviteCode) {
        if (username) {
            title = username;
        } else {
            username = extractUsername(url);
            if (username) {
                title = username;
            } else {
                // Last resort: make invite code more readable
                title = 'Invite Link';
            }
        }
    }
    
    // If title starts with @, it's a username - extract it
    if (title.startsWith('@')) {
        username = title.substring(1); // Store username without @
        title = username; // Display name without @
    } else if (title.includes('@')) {
        // Extract username from title if it contains @
        const usernameMatch = title.match(/@(\w+)/);
        if (usernameMatch) {
            username = usernameMatch[1];
            // Clean title by removing @username
            title = title.replace(/@\w+/g, '').trim();
        }
    }
    
    // If no username yet, try to extract from URL
    if (!username) {
        username = extractUsername(url);
    }
    
    // Clean up title - remove "Group" and "Channel" keywords
    title = title.replace(/\s*(Group|Channel)\s*/gi, '').trim();
    
    // If title is empty after cleanup, use username
    if (!title && username) {
        title = username;
    }
    
    // Capitalize first letter of title
    if (title && title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    // Determine type from description
    const descLower = description.toLowerCase();
    let displayType = 'Telegram';
    if (descLower.includes('channel')) {
        displayType = 'Channel';
    } else if (descLower.includes('group')) {
        displayType = 'Group';
    }
    
    // Create profile picture with first letter of the cleaned title
    let firstLetter = 'T';
    if (title && title.length > 0) {
        firstLetter = title.charAt(0).toUpperCase();
    }
    
    // Generate a color based on the first letter
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Orange
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Teal
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Light
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Rose
    ];
    const colorIndex = firstLetter.charCodeAt(0) % colors.length;
    const bgGradient = colors[colorIndex];
    
    // Check if linkData has profile_photo or photo_url
    let photoUrl = linkData.profile_photo || linkData.photo_url || linkData.avatar_url;
    let profileImageHtml = '';
    
    if (photoUrl) {
        profileImageHtml = `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(title)}" onerror="this.style.display='none'; this.parentElement.querySelector('.profile-letter').style.display='block';">`;
    }
    
    console.log('Creating card:', { title, username, displayType, firstLetter, colorIndex, hasPhoto: !!photoUrl, url });
    
    // Highlight search terms in title and description if searching
    const displayTitle = currentSearchQuery ? highlightSearchTerms(title, currentSearchQuery) : escapeHtml(title);
    const displayDescription = currentSearchQuery ? highlightSearchTerms(extractCleanDescription(description), currentSearchQuery) : escapeHtml(extractCleanDescription(description));
    
    card.innerHTML = `
        <div class="link-card-header">
            <div class="link-profile-pic" style="background: ${bgGradient};">
                ${profileImageHtml}
                <div class="profile-letter" style="${profileImageHtml ? 'display: none;' : ''}">${firstLetter}</div>
            </div>
            <div class="link-info">
                <h3 class="link-title">${displayTitle}</h3>
            </div>
        </div>
        <div class="link-preview-container" id="preview-${index}">
            <div class="link-preview">
                <div class="preview-content">
                    <p class="preview-desc">${displayDescription}</p>
                </div>
            </div>
        </div>
        <div class="link-card-footer">
            <div class="link-actions">
                <button class="btn-access" data-url="${escapeHtml(url)}" data-title="${escapeHtml(title)}">
                    <i class="fas fa-external-link-alt"></i> Access (10 tokens)
                </button>
                <button class="btn-report" data-url="${escapeHtml(url)}" data-title="${escapeHtml(title)}">
                    <i class="fas fa-flag"></i> Report
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const accessBtn = card.querySelector('.btn-access');
    accessBtn.addEventListener('click', () => accessLink(url, title));
    
    const reportBtn = card.querySelector('.btn-report');
    reportBtn.addEventListener('click', () => reportLink(url, title));
    
    // If no photo URL, try to fetch from backend in the background (non-blocking)
    if (!photoUrl) {
        fetchProfilePhoto(url, card, title);
    }
    
    return card;
}

// Fetch profile photo in the background
async function fetchProfilePhoto(url, card, title) {
    try {
        const response = await fetch(`${API_BASE}/api/chat/photo/${encodeURIComponent(url)}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.photo_url) {
                // Update the card with the photo
                const profilePic = card.querySelector('.link-profile-pic');
                const profileLetter = card.querySelector('.profile-letter');
                
                if (profilePic && profileLetter) {
                    const img = document.createElement('img');
                    img.src = data.photo_url;
                    img.alt = title;
                    img.onerror = function() {
                        this.style.display = 'none';
                        profileLetter.style.display = 'block';
                    };
                    img.onload = function() {
                        profileLetter.style.display = 'none';
                    };
                    
                    profilePic.insertBefore(img, profileLetter);
                    console.log('✅ Updated profile photo for:', title);
                }
            }
        }
    } catch (error) {
        console.log('Could not fetch profile photo:', error);
    }
}

// Extract username from URL
function extractUsername(url) {
    const match = url.match(/@([a-zA-Z0-9_]+)/);
    if (match) return match[1];
    
    const tmeMatch = url.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (tmeMatch && !tmeMatch[1].startsWith('+')) return tmeMatch[1];
    
    return null;
}

// Extract clean description without technical details
function extractCleanDescription(desc) {
    if (!desc) return 'Community submitted channel/group';
    
    // Remove technical type information
    if (desc.includes('Type:')) {
        return 'Community submitted channel/group';
    }
    
    // Return the description but limit length
    return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
}

// Access a link (deduct tokens and open)
async function accessLink(url, title) {
    // Save scroll position before opening link
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem('dashboardScrollPosition', scrollPosition.toString());
    
    // Auto-load user if Telegram user is available but currentUserId not set
    if (!currentUserId && telegramUser && telegramUser.id) {
        await loadUserForLinks(telegramUser.id);
    }
    
    if (!currentUserId) {
        showNotification('Please open from Telegram to access links', 'warning');
        return;
    }
    
    if (currentUserBalance < 10) {
        showNotification('Insufficient tokens! You need 10 tokens to access a link.', 'error');
        return;
    }
    
    try {
        showLoading('Processing...');
        
        console.log('Accessing link for user:', currentUserId);
        console.log('Current balance before:', currentUserBalance);
        
        const response = await fetch(`${API_BASE}/api/links/access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUserId,
                link: url
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Access response:', data);
        
        if (data.success) {
            // Update balance from server response
            const newBalance = data.remaining_balance;
            currentUserBalance = newBalance;
            
            console.log('New balance after deduction:', newBalance);
            
            // Update token balance in links section
            const linksTokenEl = document.getElementById('userTokenBalance');
            if (linksTokenEl) {
                linksTokenEl.textContent = newBalance;
                console.log('Updated links token display:', newBalance);
            }
            
            // Update token balance in header if it exists
            const headerTokenCount = document.querySelector('.token-count');
            if (headerTokenCount) {
                headerTokenCount.textContent = newBalance;
                console.log('Updated header token display:', newBalance);
            }
            
            // Show success message
            const message = data.tokens_deducted === 0 ? 
                `Admin access - No tokens deducted` :
                `${data.tokens_deducted} tokens deducted. Remaining: ${newBalance}`;
            
            showNotification(message, 'success');
            
            // Open the link
            window.open(url, '_blank');
        } else {
            showNotification('Error: ' + (data.error || 'Failed to access link'), 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error accessing link:', error);
        showNotification('Failed to access link: ' + error.message, 'error');
        hideLoading();
    }
}

// Report a link
async function reportLink(url, title) {
    if (!currentUserId) {
        showNotification('Please load user first', 'warning');
        return;
    }
    
    // Confirm the report
    if (!confirm(`Are you sure you want to report this link?\n\n"${title}"\n\nReported links will be hidden from all users and reviewed by admins.`)) {
        return;
    }
    
    showLoading('Reporting link...');
    
    try {
        const response = await fetch(`${API_BASE}/api/links/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUserId,
                link: url,
                title: title
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Report response:', data);
        
        if (data.success) {
            showNotification(data.message || 'Link reported successfully. Thank you for helping us maintain quality!', 'success');
            
            // Immediately remove the reported link from the displayed list
            allLinks = allLinks.filter(link => link.link !== url);
            totalLinks = Math.max(0, totalLinks - 1);
            
            // Update the display
            displayLinks(allLinks);
            updatePagination();
            
            // If the current page is now empty and it's not the first page, go back one page
            if (allLinks.length === 0 && currentPage > 0) {
                currentPage--;
                await loadLinks();
            }
        } else {
            showNotification('Error: ' + (data.error || 'Failed to report link'), 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error reporting link:', error);
        showNotification('Failed to report link: ' + error.message, 'error');
        hideLoading();
    }
}

// Update pagination controls
function updatePagination() {
    const maxPage = Math.ceil(totalLinks / linksPerPage) - 1;
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (totalLinks > 0) {
        paginationContainer.style.display = 'flex';
        
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage >= maxPage;
        
        // Better formatted pagination info
        pageInfo.innerHTML = `
            <div class="pagination-info">
                <div class="page-number">Page ${currentPage + 1} / ${maxPage + 1}</div>
                <div class="total-links">${totalLinks.toLocaleString()} total links</div>
            </div>
        `;
    } else {
        paginationContainer.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Show loading overlay
function showLoading(message = 'Loading...') {
    console.log('Showing loading overlay:', message);
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="loading-content">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    overlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    console.log('Hiding loading overlay');
    try {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            // Immediately hide it
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            
            // Remove from DOM after a short delay
            setTimeout(() => {
                const checkOverlay = document.getElementById('loadingOverlay');
                if (checkOverlay && checkOverlay.style.display === 'none') {
                    checkOverlay.remove();
                    console.log('Loading overlay removed from DOM');
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error hiding loading overlay:', error);
        // Force remove all loading overlays
        document.querySelectorAll('.loading-overlay').forEach(el => {
            el.remove();
        });
    }
}

// Submit new link
async function submitNewLink() {
    if (!currentUserId) {
        showNotification('Please load user first', 'warning');
        return;
    }
    
    const nameInput = document.getElementById('linkNameInput');
    const urlInput = document.getElementById('linkUrlInput');
    const descInput = document.getElementById('linkDescInput');
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const description = descInput.value.trim();
    
    // Validation
    if (!name) {
        showNotification('Please enter a group/channel name', 'warning');
        nameInput.focus();
        return;
    }
    
    if (!url) {
        showNotification('Please enter an invite link', 'warning');
        urlInput.focus();
        return;
    }
    
    // Validate URL format
    if (!url.startsWith('https://t.me/') && !url.startsWith('http://t.me/')) {
        showNotification('Please enter a valid Telegram link (must start with https://t.me/)', 'warning');
        urlInput.focus();
        return;
    }
    
    showLoading('Submitting link...');
    
    try {
        const response = await fetch(`${API_BASE}/api/links/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUserId,
                name: name,
                link: url,
                description: description
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Submit response:', data);
        
        if (data.success) {
            showNotification(data.message || 'Link submitted successfully! Waiting for admin approval.', 'success');
            
            // Clear form
            nameInput.value = '';
            urlInput.value = '';
            descInput.value = '';
        } else {
            showNotification('Error: ' + (data.error || 'Failed to submit link'), 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error submitting link:', error);
        showNotification('Failed to submit link: ' + error.message, 'error');
        hideLoading();
    }
}

// Load pending links for admin
async function loadPendingLinks(adminId) {
    try {
        const response = await fetch(`${API_BASE}/api/links/pending?admin_id=${adminId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Pending links response:', data);
        
        if (data.success) {
            const pendingSection = document.getElementById('pendingLinksSection');
            const container = document.getElementById('pendingLinksContainer');
            
            if (data.pending_links && data.pending_links.length > 0) {
                pendingSection.style.display = 'block';
                displayPendingLinks(data.pending_links);
            } else {
                pendingSection.style.display = 'block';
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <i class="fas fa-check-circle" style="font-size: 2em; color: #7c3aed;"></i>
                        <p>No pending links! All submissions have been reviewed.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading pending links:', error);
    }
}

// Display pending links
function displayPendingLinks(pendingLinks) {
    const container = document.getElementById('pendingLinksContainer');
    
    if (!container) {
        console.error('pendingLinksContainer element not found');
        return;
    }
    
    container.innerHTML = '';
    
    pendingLinks.forEach((submission, index) => {
        const card = document.createElement('div');
        card.className = 'pending-card';
        
        const submitDate = new Date(submission.submitted_at).toLocaleString();
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #1f2937;">${escapeHtml(submission.name || 'Untitled')}</h4>
                    <span class="pending-badge">
                        <i class="fas fa-hourglass-half"></i> Pending Review
                    </span>
                </div>
            </div>
            <p style="margin: 10px 0; color: #6b7280; word-break: break-all;">
                <i class="fas fa-link"></i> ${escapeHtml(submission.link)}
            </p>
            ${submission.description ? `
                <p style="margin: 10px 0; color: #4b5563;">
                    <i class="fas fa-comment"></i> ${escapeHtml(submission.description)}
                </p>
            ` : ''}
            <div class="pending-info">
                <i class="fas fa-user"></i> Submitted by: User ${submission.submitted_by}
                <br>
                <i class="fas fa-clock"></i> Submitted on: ${submitDate}
            </div>
            <div class="approval-actions">
                <button class="btn-open-pending">
                    <i class="fas fa-external-link-alt"></i> Open Link
                </button>
                <button class="btn-approve">
                    <i class="fas fa-check"></i> Approve & Add
                </button>
                <button class="btn-reject">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        `;
        
        // Add event listeners
        const openBtn = card.querySelector('.btn-open-pending');
        const approveBtn = card.querySelector('.btn-approve');
        const rejectBtn = card.querySelector('.btn-reject');
        
        openBtn.addEventListener('click', () => {
            window.open(submission.link, '_blank');
        });
        
        approveBtn.addEventListener('click', () => {
            approvePendingLink(submission.link, submission.name, submission.description);
        });
        
        rejectBtn.addEventListener('click', () => {
            rejectPendingLink(submission.link);
        });
        
        container.appendChild(card);
    });
}

// Approve pending link
async function approvePendingLink(linkUrl, linkName, linkDescription) {
    if (!currentUserId) {
        showNotification('User ID not found', 'error');
        return;
    }
    
    if (!confirm(`Approve this link and add it to the database?\n\n"${linkName}"\n\nThis will make it visible to all users.`)) {
        return;
    }
    
    showLoading('Approving link...');
    
    try {
        const response = await fetch(`${API_BASE}/api/links/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                admin_id: currentUserId,
                link: linkUrl,
                name: linkName,
                description: linkDescription
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Approve response:', data);
        
        if (data.success) {
            showNotification(data.message || 'Link approved and added to database!', 'success');
            
            // Update the groups counter immediately
            const totalGroupsEl = document.getElementById('totalGroups');
            if (totalGroupsEl) {
                const currentCount = parseInt(totalGroupsEl.textContent.replace(/,/g, '')) || 0;
                const newCount = currentCount + 1;
                totalGroupsEl.textContent = formatNumber(newCount);
                console.log(`Updated groups counter: ${currentCount} -> ${newCount}`);
            }
            
            // Reload pending links
            await loadPendingLinks(currentUserId);
            
            // Reload main links to show the new one
            await performSearch();
        } else {
            showNotification('Error: ' + (data.error || 'Failed to approve link'), 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error approving link:', error);
        showNotification('Failed to approve link: ' + error.message, 'error');
        hideLoading();
    }
}

// Reject pending link
async function rejectPendingLink(linkUrl) {
    if (!currentUserId) {
        showNotification('User ID not found', 'error');
        return;
    }
    
    if (!confirm('Reject this link submission?\n\nThis will remove it from the pending list.')) {
        return;
    }
    
    showLoading('Rejecting link...');
    
    try {
        const response = await fetch(`${API_BASE}/api/links/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                admin_id: currentUserId,
                link: linkUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Reject response:', data);
        
        if (data.success) {
            showNotification(data.message || 'Link rejected and removed from pending list.', 'success');
            
            // Reload pending links
            await loadPendingLinks(currentUserId);
        } else {
            showNotification('Error: ' + (data.error || 'Failed to reject link'), 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error rejecting link:', error);
        showNotification('Failed to reject link: ' + error.message, 'error');
        hideLoading();
    }
}

// Load reported links for admin
async function loadReportedLinks(adminId) {
    try {
        const response = await fetch(`${API_BASE}/api/links/reported?admin_id=${adminId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Reported links response:', data);
        
        if (data.success) {
            const reportedSection = document.getElementById('reportedLinksSection');
            const container = document.getElementById('reportedLinksContainer');
            
            if (data.reported_links && data.reported_links.length > 0) {
                reportedSection.style.display = 'block';
                displayReportedLinks(data.reported_links);
            } else {
                reportedSection.style.display = 'block';
                container.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <i class="fas fa-check-circle" style="font-size: 2em; color: #10b981;"></i>
                        <p>No reported links! All links are in good shape.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading reported links:', error);
    }
}

// Display reported links
function displayReportedLinks(reportedLinks) {
    const container = document.getElementById('reportedLinksContainer');
    
    if (!container) {
        console.error('reportedLinksContainer element not found');
        return;
    }
    
    container.innerHTML = '';
    
    reportedLinks.forEach((report, index) => {
        const card = document.createElement('div');
        card.className = 'reported-card';
        
        const reportDate = new Date(report.reported_at).toLocaleString();
        const reportCount = report.report_count || report.reporters.length;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #1f2937;">${escapeHtml(report.title || 'Untitled Link')}</h4>
                    <span class="reported-badge">
                        <i class="fas fa-flag"></i> Reported ${reportCount} time${reportCount > 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <p style="margin: 10px 0; color: #6b7280; word-break: break-all;">
                <i class="fas fa-link"></i> ${escapeHtml(report.link)}
            </p>
            <div class="reported-info">
                <i class="fas fa-clock"></i> Reported on: ${reportDate}
            </div>
            <div class="verify-actions">
                <button class="btn-open-link" data-link="${escapeHtml(report.link)}">
                    <i class="fas fa-external-link-alt"></i> Open Link
                </button>
                <button class="btn-verify-working" data-link="${escapeHtml(report.link)}" data-status="working">
                    <i class="fas fa-check"></i> Link is Working
                </button>
                <button class="btn-verify-broken" data-link="${escapeHtml(report.link)}" data-status="broken">
                    <i class="fas fa-times"></i> Link is Broken (Refund & Remove)
                </button>
            </div>
        `;
        
        // Add event listeners to buttons
        const openBtn = card.querySelector('.btn-open-link');
        const workingBtn = card.querySelector('.btn-verify-working');
        const brokenBtn = card.querySelector('.btn-verify-broken');
        
        openBtn.addEventListener('click', () => {
            window.open(report.link, '_blank');
        });
        
        workingBtn.addEventListener('click', () => {
            verifyLink(report.link, 'working');
        });
        
        brokenBtn.addEventListener('click', () => {
            verifyLink(report.link, 'broken');
        });
        
        container.appendChild(card);
    });
}

// Verify a reported link (admin action)
// Made global so it can be called from dynamically created elements
window.verifyLink = async function(linkUrl, status) {
    if (!currentUserId) {
        showNotification('User ID not found', 'error');
        return;
    }
    
    const statusText = status === 'working' ? 'working' : 'broken';
    const confirmMsg = status === 'working' 
        ? `Mark this link as working?\n\nThe report will be removed and the link will be shown to users again.`
        : `Mark this link as broken?\n\nThis will:\n- Refund 10 tokens to all reporters\n- Remove the link from the database\n- Cannot be undone`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    showLoading(`Verifying link as ${statusText}...`);
    
    try {
        const response = await fetch(`${API_BASE}/api/links/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                admin_id: currentUserId,
                link: linkUrl,
                status: status
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Verify response:', data);
        
        if (data.success) {
            showNotification(data.message, 'success');
            
            // Reload reported links
            await loadReportedLinks(currentUserId);
            
            // Reload main links to update the list
            if (status === 'working') {
                await performSearch();
            } else if (status === 'broken') {
                // Link was removed - update the groups counter immediately
                const totalGroupsEl = document.getElementById('totalGroups');
                if (totalGroupsEl) {
                    const currentCount = parseInt(totalGroupsEl.textContent.replace(/,/g, '')) || 0;
                    const newCount = Math.max(0, currentCount - 1);
                    totalGroupsEl.textContent = formatNumber(newCount);
                    console.log(`Updated groups counter: ${currentCount} -> ${newCount}`);
                }
            }
        } else {
            showNotification('Error: ' + (data.error || 'Failed to verify link'), 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error verifying link:', error);
        showNotification('Failed to verify link: ' + error.message, 'error');
        hideLoading();
    }
}

// Initialize links browser when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing links browser');
    try {
        initLinksBrowser();
        console.log('Links browser initialized successfully');
    } catch (error) {
        console.error('Error initializing links browser:', error);
    }
    
    // Ensure no stuck loading overlays
    setTimeout(() => {
        const stuckOverlay = document.getElementById('loadingOverlay');
        if (stuckOverlay && stuckOverlay.style.display !== 'none') {
            console.warn('Found stuck loading overlay, removing it');
            stuckOverlay.remove();
        }
    }, 5000);
});

// Global error handler to ensure loading overlay is always hidden on errors
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    hideLoading();
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    hideLoading();
});

// Load locks for a specific group (returns the locks object)
async function loadLocksSettingsForGroup(groupId) {
    try {
        const response = await fetch(`${API_BASE}/api/group/${groupId}/locks`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        if (data.success) return data.locks || {};
        console.warn('Failed to load locks:', data.error);
        return {};
    } catch (err) {
        console.error('Error loading locks for group', groupId, err);
        return {};
    }
}

// Update locks for a group (merges single-key change)
window.updateLockForGroup = async function(groupId, key, value, adminId) {
    try {
        // Fetch current locks
        const getResp = await fetch(`${API_BASE}/api/group/${groupId}/locks`);
        const getData = await getResp.json();
        if (!getData.success) {
            throw new Error(getData.error || 'Failed to get locks');
        }

        const locks = getData.locks || {};
        locks[key] = !!value;

        // Include admin_id as query fallback
        const url = `${API_BASE}/api/group/${groupId}/locks?admin_id=${encodeURIComponent(adminId || currentUserId || '0')}`;

        const updateResp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminId || currentUserId || '0', locks: locks })
        });

        const result = await updateResp.json();
        if (result.success) {
            console.log(`Lock ${key} updated for group ${groupId}:`, locks[key]);
            return true;
        } else {
            console.warn('Failed to update lock:', result.error);
            return false;
        }
    } catch (err) {
        console.error('Error updating lock for group', groupId, err);
        return false;
    }
}

// ============================================================================
// GROUP MANAGEMENT DASHBOARD JAVASCRIPT
// ============================================================================

// Group Management Dashboard JavaScript
// Configuration
// Prefer the globally set API base (from dashboard.js) then the configured value,
// otherwise fall back to environment-detection with a localhost default.
let API_BASE_URL = (window.API_BASE) || (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.APIURL) || null;

if (!API_BASE_URL) {
    // If running on developer machine, prefer the local dashboard server
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_BASE_URL = 'http://localhost:3027';
    } else if (window.location.protocol === 'file:') {
        // Opened as a local file - assume local dashboard server
        API_BASE_URL = 'http://localhost:3027';
    } else {
        // Fallback to public dashboard API domain
        API_BASE_URL = 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
    }
}

console.log('DEBUG - Hostname:', window.location.hostname);
console.log('DEBUG - Origin:', window.location.origin);
console.log('DEBUG - API_BASE_URL:', API_BASE_URL);

let currentGroupId = null;
let currentGroupConfig = null;
let userId = null;
let userName = null;

// Initialize Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    userId = tg.initDataUnsafe?.user?.id;
    userName = tg.initDataUnsafe?.user?.username || tg.initDataUnsafe?.user?.first_name;
    
    // Show user info in header
    if (userId) {
        document.querySelector('.subtitle').textContent = `Logged in as: ${userName} (ID: ${userId})`;
    }
}

// Load all groups (filtered by user if userId is available)
async function loadGroups() {
    try {
        const cacheBuster = `_t=${Date.now()}`;
        const separator = userId ? '&' : '?';
        const url = userId ? 
            `${API_BASE_URL}/api/groups/managed?user_id=${userId}&${cacheBuster}` : 
            `${API_BASE_URL}/api/groups/managed?${cacheBuster}`;
        
        console.log('=== API Request Debug ===');
        console.log('API Base URL:', API_BASE_URL);
        console.log('Full URL:', url);
        console.log('User ID:', userId);    
        console.log('Current location:', window.location.href);
        console.log('Protocol:', window.location.protocol);
            
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);

        const loadingSection = document.getElementById('loadingSection');
        const groupsSection = document.getElementById('groupsSection');
        const emptyState = document.getElementById('emptyState');
        const groupsGrid = document.getElementById('groupsGrid');

        loadingSection.style.display = 'none';

        if (data.success && data.groups.length > 0) {
            groupsSection.style.display = 'block';
            emptyState.style.display = 'none';
            
            groupsGrid.innerHTML = data.groups.map(group => `
                <div class="group-card" onclick='openGroupSettings(${JSON.stringify(group.group_id)})'>
                    <div class="group-header">
                        <div>
                            <h3 class="group-title">${escapeHtml(group.group_title)}</h3>
                            <p class="group-id">ID: ${group.group_id}</p>
                            ${group.is_owner ? '<p class="group-id" style="color: #ffd700;"><i class="fas fa-crown"></i> You are the owner</p>' : ''}
                        </div>
                        ${group.bot_is_admin ? '<span class="admin-badge"><i class="fas fa-shield-alt"></i> Admin</span>' : ''}
                    </div>
                    
                    <div class="group-stats">
                        <div class="stat-item">
                            <span class="stat-value">${group.member_count || 0}</span>
                            <span class="stat-label">Members</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${group.filters_count}</span>
                            <span class="stat-label">Filters</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${group.warns_limit}</span>
                            <span class="stat-label">Warn Limit</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${group.bans_count}</span>
                            <span class="stat-label">Bans</span>
                        </div>
                    </div>

                    <div class="group-actions">
                        <button class="action-btn" onclick='event.stopPropagation(); openGroupSettings(${JSON.stringify(group.group_id)})'>
                            <i class="fas fa-cog"></i> Manage
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            groupsSection.style.display = 'none';
            emptyState.style.display = 'block';
            
            if (userId && data.filtered_by_user) {
                document.querySelector('#emptyState h3').textContent = 'No Groups Found';
                document.querySelector('#emptyState p').textContent = 'You are not the owner of any groups where the bot is admin. Add the bot to your groups to manage them here.';
            }
        }
    } catch (error) {
        console.error('=== Error Details ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('API Base URL:', API_BASE_URL);
        
        // Check if this is a network/CORS error
        const isNetworkError = error instanceof TypeError && error.message.includes('Failed to fetch');
        
        const loadingSection = document.getElementById('loadingSection');
        loadingSection.style.display = 'block';
        
        let errorHtml = '';
        if (isNetworkError) {
            errorHtml = `
                <div class="error-message" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; border-radius: 15px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <h3>Connection Failed</h3>
                    <p style="margin: 15px 0;">Cannot connect to the API server.</p>
                    <p style="margin: 15px 0; font-size: 0.9em; opacity: 0.9;">
                        <strong>Possible causes:</strong><br>
                        • Server is not running<br>
                        • Mixed content error (HTTPS page calling HTTP API)<br>
                        • CORS/Network restrictions
                    </p>
                    <button class="btn-primary" onclick="loadGroups()" style="margin-top: 20px; padding: 12px 24px; background: white; color: #ff6b6b; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        } else {
            errorHtml = `
                <div class="error-message" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; border-radius: 15px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <h3>Failed to load groups</h3>
                    <p style="margin: 15px 0;">Server connection error</p>
                    <button class="btn-primary" onclick="loadGroups()" style="margin-top: 20px; padding: 12px 24px; background: white; color: #ff6b6b; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
        
        loadingSection.innerHTML = errorHtml;
    }
}

// Open group settings modal
async function openGroupSettings(groupId) {
    currentGroupId = groupId;

    console.log('=== Opening Group Settings ===');
    console.log('Group ID:', groupId);
    console.log('Type:', typeof groupId);
    console.log('API URL:', `${API_BASE_URL}/api/group/${groupId}/config`);

    try {
        // Add cache buster to prevent browser caching
        const cacheBuster = `?_t=${Date.now()}`;
        const response = await fetch(`${API_BASE_URL}/api/group/${groupId}/config${cacheBuster}`);

        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Server error (${response.status})`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            // Populate settings and open modal
            await populateGroupSettings(data.config);
            document.getElementById('groupModal').classList.add('active');
            document.getElementById('modalGroupTitle').textContent = data.config.group_title || 'Group Settings';
        } else {
            const errorMsg = data.error || 'Unknown error';
            console.error('API error:', errorMsg);
            alert(`Failed to load group settings: ${errorMsg}`);
        }
    } catch (error) {
        console.error('=== Error Loading Group Config ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        alert(`Failed to load group settings: ${error.message}`);
    }
}

// Populate group settings in modal
async function populateGroupSettings(config) {
    // Keep a local reference for other functions
    currentGroupConfig = config || {};
    
    // General settings
    document.getElementById('welcomeEnabled').checked = config.settings?.welcome_enabled || false;
    document.getElementById('goodbyeEnabled').checked = config.settings?.goodbye_enabled || false;
    document.getElementById('antifloodEnabled').checked = config.settings?.antiflood_enabled || false;
    document.getElementById('deleteServiceMessages').checked = config.settings?.delete_service_messages || false;

    // Welcome messages
    document.getElementById('welcomeMessage').value = config.welcome_message || '';
    document.getElementById('goodbyeMessage').value = config.goodbye_message || '';

    // Blocklist
    document.getElementById('blocklistEnabled').checked = config.blocklist?.enabled || false;
    updateBlocklistDisplay(config.blocklist?.words || []);

    // Filters
    updateFiltersDisplay(config.filters || {});

    // Warns limit
    document.getElementById('warnsLimit').value = config.warns?.limit || 3;

    // Bans and warns
    updateBansDisplay(config.bans || {});
    updateWarnsDisplay(config.warns?.users || {});

    // Load clean service settings
    await loadCleanServiceSettings();

    // Load clean message (cleanmsg) settings
    await loadCleanMessageSettings();

    // Load locks settings
    await loadLocksSettings();

    // Load disabled commands
    await loadDisabledCommands();

    // Load federation info (if any)
    await loadFederationInfo();
    
    // Media reactions settings
    document.getElementById('mediaReactionsEnabled').checked = config.media_reactions_enabled || false;
    document.getElementById('mediaReactionEmojis').value = (config.media_reaction_emojis || ["🔥", "❤", "👍", "😍", "🤩", "👌", "😘", "🙊", "💯", "🎉", "😎", "👏", "😁", "🏆", "😱", "🤡"]).join(', ');
    updateEmojiPreview();
}

// Helper Functions
function updateFiltersDisplay(filters) {
    const filtersList = document.getElementById('filtersList');
    
    if (Object.keys(filters).length === 0) {
        filtersList.innerHTML = '<li class="empty-state" style="padding: 20px;"><p>No filters added yet</p></li>';
        return;
    }

    filtersList.innerHTML = Object.entries(filters).map(([trigger, response]) => `
        <li class="filter-item">
            <div>
                <div class="filter-trigger">${escapeHtml(trigger)}</div>
                <div class="filter-response">${escapeHtml(response)}</div>
            </div>
            <button class="delete-btn" onclick='removeFilter(${JSON.stringify(trigger)})'>
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
}

function updateBlocklistDisplay(words) {
    const blocklistItems = document.getElementById('blocklistItems');
    
    if (words.length === 0) {
        blocklistItems.innerHTML = '<li class="empty-state" style="padding: 20px;"><p>No blocked words</p></li>';
        return;
    }

    blocklistItems.innerHTML = words.map(word => `
        <li class="blocklist-item">
            <span>${escapeHtml(word)}</span>
            <button class="delete-btn" onclick='removeBlocklistWord(${JSON.stringify(word)})'>
                <i class="fas fa-trash"></i>
            </button>
        </li>
    `).join('');
}

function updateBansDisplay(bans) {
    const bansList = document.getElementById('bansList');
    const noBans = document.getElementById('noBans');
    
    if (Object.keys(bans).length === 0) {
        bansList.style.display = 'none';
        noBans.style.display = 'block';
        return;
    }

    noBans.style.display = 'none';
    bansList.style.display = 'block';
    bansList.innerHTML = Object.entries(bans).map(([userId, banInfo]) => `
        <li class="ban-item">
            <div>
                <div><strong>User ID:</strong> ${userId}</div>
                <div style="color: #666; margin-top: 5px;">
                    <strong>Reason:</strong> ${escapeHtml(banInfo.reason || 'No reason')}
                </div>
                <div style="color: #999; font-size: 0.85em; margin-top: 3px;">
                    Banned: ${new Date(banInfo.banned_at).toLocaleDateString()}
                </div>
            </div>
        </li>
    `).join('');
}

function updateWarnsDisplay(warns) {
    const warnsList = document.getElementById('warnsList');
    const noWarns = document.getElementById('noWarns');
    
    if (Object.keys(warns).length === 0) {
        warnsList.style.display = 'none';
        noWarns.style.display = 'block';
        return;
    }

    noWarns.style.display = 'none';
    warnsList.style.display = 'block';

    const warnLimit = (currentGroupConfig && currentGroupConfig.warns && currentGroupConfig.warns.limit) ? currentGroupConfig.warns.limit : 3;

    warnsList.innerHTML = Object.entries(warns).map(([userId, warnInfo]) => {
        const lastReason = (warnInfo.reasons && warnInfo.reasons.length > 0) ? escapeHtml(warnInfo.reasons[warnInfo.reasons.length - 1].reason) : null;
        return `
        <li class="ban-item">
            <div>
                <div><strong>User ID:</strong> ${userId}</div>
                <div style="color: #666; margin-top: 5px;">
                    <strong>Warnings:</strong> ${warnInfo.count} / ${warnLimit}
                </div>
                ${lastReason ? `
                    <div style="color: #999; font-size: 0.85em; margin-top: 5px;">
                        Last reason: ${lastReason}
                    </div>
                ` : ''}
            </div>
        </li>
    `}).join('');
}

// Load Settings Functions
async function loadCleanServiceSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/cleanservice?_t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
            const settings = data.clean_service || {};
            // Prioritize 'enabled' over 'all' for backward compatibility
            document.getElementById('csEnabled').checked = settings.enabled !== undefined ? settings.enabled : (settings.all || false);
            document.getElementById('csJoin').checked = settings.join || settings.clean_join || false;
            document.getElementById('csLeave').checked = settings.leave || settings.clean_leave || false;
            document.getElementById('csPin').checked = settings.pin || settings.clean_pinned || false;
            document.getElementById('csPhoto').checked = settings.photo || false;
            document.getElementById('csTitle').checked = settings.title || false;
            document.getElementById('csVideochat').checked = settings.videochat || false;
            document.getElementById('csOther').checked = settings.other || false;
        }
    } catch (error) {
        console.error('Error loading clean service settings:', error);
    }
}

async function loadCleanMessageSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/cleanmessage?_t=${Date.now()}`);
        const data = await response.json();

        if (data.success) {
            const settings = data.clean_message || {};
            // Prioritize 'enabled' over 'all' for backward compatibility
            document.getElementById('cmEnabled').checked = settings.enabled !== undefined ? settings.enabled : (settings.all || false);
            document.getElementById('cmAction').checked = settings.action || false;
            document.getElementById('cmFilter').checked = settings.filter || false;
            document.getElementById('cmNote').checked = settings.note || false;
        }
    } catch (error) {
        console.error('Error loading clean message settings:', error);
    }
}

async function loadLocksSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/locks?_t=${Date.now()}`);
        const data = await response.json();

        if (data.success) {
            const locks = data.locks || {};
            document.getElementById('lockMessages').checked = !!locks.messages;
            document.getElementById('lockMedia').checked = !!locks.media;
            document.getElementById('lockStickers').checked = !!locks.stickers;
            document.getElementById('lockGifs').checked = !!locks.gifs;
            document.getElementById('lockUrl').checked = !!locks.url;
            document.getElementById('lockBots').checked = !!locks.bots;
            document.getElementById('lockForward').checked = !!locks.forward;
            document.getElementById('lockGame').checked = !!locks.game;
            document.getElementById('lockInline').checked = !!locks.inline;
            document.getElementById('lockLocation').checked = !!locks.location;
            document.getElementById('lockPoll').checked = !!locks.poll;
            document.getElementById('lockInvite').checked = !!locks.invite;
            document.getElementById('lockPin').checked = !!locks.pin;
            document.getElementById('lockInfo').checked = !!locks.info;
        }
    } catch (error) {
        console.error('Error loading locks settings:', error);
    }
}

async function loadFederationInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/federation?_t=${Date.now()}`);
        if (!response.ok) {
            console.warn('Federation API returned non-OK status:', response.status);
            return;
        }
        const data = await response.json();
        if (!data.success || !data.in_federation) {
            document.getElementById('fedName').textContent = 'Not in a federation';
            document.getElementById('fedId').textContent = '—';
            document.getElementById('fedOwner').textContent = '—';
            document.getElementById('fedGroupsCount').textContent = '0';
            document.getElementById('fedBannedCount').textContent = '0';
            document.getElementById('fedGroupsList').innerHTML = '';
            return;
        }

        const fed = data.federation || {};
        document.getElementById('fedName').textContent = fed.fed_name || '—';
        document.getElementById('fedId').textContent = fed.fed_id || '—';
        document.getElementById('fedOwner').textContent = fed.owner_id || '—';
        document.getElementById('fedGroupsCount').textContent = (fed.groups || []).length || 0;
        document.getElementById('fedBannedCount').textContent = fed.banned_users_count || 0;

        const groupsList = document.getElementById('fedGroupsList');
        groupsList.innerHTML = '';
        (fed.groups || []).forEach(gid => {
            const li = document.createElement('li');
            li.className = 'ban-item';
            li.innerHTML = `<div><strong>Group ID:</strong> ${escapeHtml(String(gid))}</div>`;
            groupsList.appendChild(li);
        });

    } catch (err) {
        console.error('Error loading federation info:', err);
    }
}

async function loadDisabledCommands() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/disabled-commands?_t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
            updateDisabledCommandsDisplay(data.disabled_commands || []);
            const toggle = document.getElementById('disableAllCommandsToggle');
            if (toggle) toggle.checked = !!data.disable_user_commands;
        }
    } catch (error) {
        console.error('Error loading disabled commands:', error);
    }
}

function updateDisabledCommandsDisplay(commands) {
    const list = document.getElementById('disabledCommandsList');
    
    if (commands.length === 0) {
        list.innerHTML = '<li style="padding: 20px; text-align: center; color: #666;">No commands disabled</li>';
        return;
    }

    list.innerHTML = commands.map(cmd => `
        <li class="filter-item">
            <div>
                <div class="filter-trigger">/${escapeHtml(cmd)}</div>
                <div class="filter-response">This command is disabled in this group</div>
            </div>
            <button class="delete-btn" onclick='enableCommand(${JSON.stringify(cmd)})'>
                <i class="fas fa-check"></i> Enable
            </button>
        </li>
    `).join('');
}

// Update Settings Functions
async function updateSetting(key, value) {
    try {
        const settings = {};
        settings[key] = value;

        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_id: userId || '123456789',
                settings: settings
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Setting updated successfully', 'success');
            
            // Update local config with the persisted config returned by server
            if (data.config) {
                currentGroupConfig = data.config;
                console.log('✅ Updated local config with server response');
            }
        } else {
            console.error('Update setting failed:', data.error);
            showNotification('Failed to update setting: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error updating setting:', error);
        showNotification('Failed to update setting', 'error');
    }
}

async function updateCleanService(key, value) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/cleanservice`);
        const data = await response.json();
        
        if (!data.success) {
            showNot('Failed to get current settings', 'error');
            return;
        }
        
        const cleanService = data.clean_service || {};

        const keyMap = {
            'pin': ['pin', 'clean_pinned'],
            'join': ['join', 'clean_join'],
            'leave': ['leave', 'clean_leave']
        };

        if (keyMap[key]) {
            keyMap[key].forEach(k => cleanService[k] = !!value);
        } else {
            cleanService[key] = value;
        }
        
        // For backward compatibility, also update 'all' when 'enabled' changes
        if (key === 'enabled') {
            cleanService.all = value;
        }
        
        const adminIdFromUrl = (new URLSearchParams(window.location.search)).get('admin_id');
        let adminIdToSend = userId || currentUserId || adminIdFromUrl || '';

        // If we still don't have an admin id, try to derive from the loaded group config
        if (!adminIdToSend && currentGroupConfig) {
            let derived = null;
            if (currentGroupConfig.owner_id) derived = currentGroupConfig.owner_id;
            else if (currentGroupConfig.owner) derived = currentGroupConfig.owner;
            else if (currentGroupConfig.ownerId) derived = currentGroupConfig.ownerId;

            // Try admin lists (take first available)
            if (!derived) {
                const admins = currentGroupConfig.admin_ids || currentGroupConfig.group_admins || currentGroupConfig.admins;
                if (admins) {
                    if (Array.isArray(admins) && admins.length > 0) derived = admins[0];
                    else if (typeof admins === 'string') derived = admins;
                }
            }

            if (derived) {
                adminIdToSend = String(derived);
                console.log('Using derived admin id from group config for updateCleanService:', adminIdToSend);
            }
        }

        if (!adminIdToSend) {
            showNotification('You must be logged in via Telegram or provide admin_id in URL to change this setting', 'error');
            const el = document.getElementById('cs' + capitalizeFirstLetter(key));
            if (el) el.checked = !value;
            return;
        }

        const updateResponse = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/cleanservice?admin_id=${encodeURIComponent(adminIdToSend)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: adminIdToSend,
                clean_service: cleanService
            })
        });

        const result = await updateResponse.json();
        
        if (result.success) {
            showNotification('Clean service setting updated', 'success');
        } else {
            console.error('Clean service update failed:', result.error);
            showNotification('Failed to update: ' + result.error, 'error');
            const el = document.getElementById('cs' + capitalizeFirstLetter(key));
            if (el) el.checked = !value;
        }
    } catch (error) {
        console.error('Error updating clean service:', error);
        showNotification('Failed to update clean service', 'error');
        const el = document.getElementById('cs' + capitalizeFirstLetter(key));
        if (el) el.checked = !value;
    }
}

async function updateCleanMessage(key, value) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/cleanmessage`);
        const data = await response.json();

        if (!data.success) {
            showNotification('Failed to get current cleanmessage settings', 'error');
            return;
        }

        const cleanmsg = data.clean_message || {};
        cleanmsg[key] = value;
        
        // For backward compatibility, also update 'all' when 'enabled' changes
        if (key === 'enabled') {
            cleanmsg.all = value;
        }

        const adminIdFromUrl = (new URLSearchParams(window.location.search)).get('admin_id');
        let adminIdToSend = userId || currentUserId || adminIdFromUrl || '';

        // If missing, try to derive from currentGroupConfig.owner/admin fields
        if (!adminIdToSend && currentGroupConfig) {
            let derived = null;
            if (currentGroupConfig.owner_id) derived = currentGroupConfig.owner_id;
            else if (currentGroupConfig.owner) derived = currentGroupConfig.owner;
            else if (currentGroupConfig.ownerId) derived = currentGroupConfig.ownerId;

            const admins = currentGroupConfig.admin_ids || currentGroupConfig.group_admins || currentGroupConfig.admins;
            if (!derived && admins) {
                if (Array.isArray(admins) && admins.length > 0) derived = admins[0];
                else if (typeof admins === 'string') derived = admins;
            }

            if (derived) {
                adminIdToSend = String(derived);
                console.log('Using derived admin id from group config for updateCleanMessage:', adminIdToSend);
            }
        }

        if (!adminIdToSend) {
            showNotification('You must be logged in via Telegram or provide admin_id in URL to change this setting', 'error');
            const el = document.getElementById('cm' + capitalizeFirstLetter(key));
            if (el) el.checked = !value;
            return;
        }

        const updateResponse = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/cleanmessage?admin_id=${encodeURIComponent(adminIdToSend)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminIdToSend, clean_message: cleanmsg })
        });

        const result = await updateResponse.json();
        if (result.success) {
            showNotification('Clean message setting updated', 'success');
        } else {
            console.error('Clean message update failed:', result.error);
            showNotification('Failed to update: ' + result.error, 'error');
            const el = document.getElementById('cm' + capitalizeFirstLetter(key));
            if (el) el.checked = !value;
        }
    } catch (error) {
        console.error('Error updating clean message:', error);
        showNotification('Failed to update clean message', 'error');
        const el = document.getElementById('cm' + capitalizeFirstLetter(key));
        if (el) el.checked = !value;
    }
}

async function updateLock(key, value) {
    try {
        const getResp = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/locks`);
        const getData = await getResp.json();
        if (!getData.success) {
            showNotification('Failed to get current lock settings', 'error');
            const el = document.getElementById('lock' + capitalizeFirstLetter(key));
            if (el) el.checked = !value;
            return;
        }

        const locks = getData.locks || {};
        locks[key] = !!value;

        const url = `${API_BASE_URL}/api/group/${currentGroupId}/locks?admin_id=${encodeURIComponent(userId || '123456789')}`;

        const updateResp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789', locks: locks })
        });

        const result = await updateResp.json();
        if (result.success) {
            showNotification('Lock updated', 'success');
        } else {
            console.error('Update lock failed:', result.error);
            showNotification('Failed to update lock: ' + (result.error || 'Unknown error'), 'error');
            const el = document.getElementById('lock' + capitalizeFirstLetter(key));
            if (el) el.checked = !value;
        }
    } catch (error) {
        console.error('Error updating lock:', error);
        showNotification('Failed to update lock', 'error');
        const el = document.getElementById('lock' + capitalizeFirstLetter(key));
        if (el) el.checked = !value;
    }
}

async function toggleDisableUserCommands(enabled) {
    try {
        const url = `${API_BASE_URL}/api/group/${currentGroupId}/disable-user-commands?admin_id=${encodeURIComponent(userId || '123456789')}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789', enabled: !!enabled })
        });

        const data = await response.json();
        if (!data.success) {
            showNotification('Failed to update setting: ' + (data.error || 'Unknown error'), 'error');
            const toggle = document.getElementById('disableAllCommandsToggle');
            if (toggle) toggle.checked = !enabled;
        } else {
            showNotification('Setting updated', 'success');
        }
    } catch (err) {
        console.error('Error toggling disable-user-commands:', err);
        showNotification('Failed to update setting', 'error');
        const toggle = document.getElementById('disableAllCommandsToggle');
        if (toggle) toggle.checked = !enabled;
    }
}

async function saveWelcomeMessages() {
    const welcomeMessage = document.getElementById('welcomeMessage').value;
    const goodbyeMessage = document.getElementById('goodbyeMessage').value;

    try {
        const response1 = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: userId || '123456789',
                message: welcomeMessage
            })
        });

        const response2 = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: userId || '123456789',
                settings: {
                    goodbye_message: goodbyeMessage
                }
            })
        });

        const data1 = await response1.json();
        const data2 = await response2.json();

        if (data1.success && data2.success) {
            showNotification('Messages saved successfully', 'success');
        } else {
            console.error('Save messages failed:', data1, data2);
            showNotification('Failed to save messages', 'error');
        }
    } catch (error) {
        console.error('Error saving messages:', error);
        showNotification('Failed to save messages', 'error');
    }
}

// Filter and Blocklist Management
async function addFilter() {
    const trigger = document.getElementById('filterTrigger').value.trim();
    const response = document.getElementById('filterResponse').value.trim();

    if (!trigger || !response) {
        alert('Please fill in both trigger and response');
        return;
    }

    try {
        const apiResponse = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/filters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: userId || '123456789',
                trigger: trigger,
                response: response
            })
        });

        const data = await apiResponse.json();

        if (data.success) {
            document.getElementById('filterTrigger').value = '';
            document.getElementById('filterResponse').value = '';
            openGroupSettings(currentGroupId);
            showNotification('Filter added successfully', 'success');
        } else {
            console.error('Add filter failed:', data.error);
            showNotification('Failed to add filter: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error adding filter:', error);
        showNotification('Failed to add filter', 'error');
    }
}

async function removeFilter(trigger) {
    if (!confirm(`Remove filter for "${trigger}"?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/filters/${encodeURIComponent(trigger)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789' })
        });

        const data = await response.json();

        if (data.success) {
            openGroupSettings(currentGroupId);
            showNotification('Filter removed successfully', 'success');
        } else {
            showNotification('Failed to remove filter', 'error');
        }
    } catch (error) {
        console.error('Error removing filter:', error);
        showNotification('Failed to remove filter', 'error');
    }
}

async function addBlocklistWord() {
    const word = document.getElementById('blocklistWord').value.trim();

    if (!word) {
        alert('Please enter a word to block');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/blocklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: userId || '123456789',
                word: word
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('blocklistWord').value = '';
            openGroupSettings(currentGroupId);
            showNotification('Word added to blocklist', 'success');
        } else {
            showNotification('Failed to add word', 'error');
        }
    } catch (error) {
        console.error('Error adding word:', error);
        showNotification('Failed to add word', 'error');
    }
}

async function removeBlocklistWord(word) {
    if (!confirm(`Remove blocked word "${word}"?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/blocklist/${encodeURIComponent(word)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789' })
        });

        const data = await response.json();
        if (data.success) {
            openGroupSettings(currentGroupId);
            showNotification('Word removed from blocklist', 'success');
        } else {
            console.error('Remove word failed:', data.error);
            showNotification('Failed to remove word', 'error');
        }
    } catch (err) {
        console.error('Error removing word:', err);
        showNotification('Failed to remove word', 'error');
    }
}

async function updateBlocklistEnabled(enabled) {
    await updateSetting('blocklist_enabled', enabled);
}

// Command Management
async function disableCommand() {
    const input = document.getElementById('disableCommandInput');
    const command = input.value.trim().toLowerCase().replace('/', '');

    if (!command) {
        alert('Please enter a command name');
        return;
    }

    try {
        const url = `${API_BASE_URL}/api/group/${currentGroupId}/disabled-commands?admin_id=${encodeURIComponent(userId || '123456789')}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: userId || '123456789',
                command: command
            })
        });

        const data = await response.json();

        if (data.success) {
            input.value = '';
            await loadDisabledCommands();
            showNotification('Command disabled successfully', 'success');
        } else {
            console.error('Disable command failed:', data.error);
            showNotification('Failed to disable command: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error disabling command:', error);
        showNotification('Failed to disable command', 'error');
    }
}

async function enableCommand(command) {
    if (!confirm(`Enable command "/${command}"?`)) return;

    try {
        const url = `${API_BASE_URL}/api/group/${currentGroupId}/disabled-commands/${encodeURIComponent(command)}?admin_id=${encodeURIComponent(userId || '123456789')}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789' })
        });

        const data = await response.json();

        if (data.success) {
            await loadDisabledCommands();
            showNotification('Command enabled successfully', 'success');
        } else {
            console.error('Enable command failed:', data.error);
            showNotification('Failed to enable command: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error enabling command:', error);
        showNotification('Failed to enable command', 'error');
    }
}

// Federation Management
function refreshFederationInfo() {
    if (!currentGroupId) return;
    loadFederationInfo();
    showNotification('Federation info refreshed', 'success');
}

async function createFederation() {
    const fedNameEl = document.getElementById('newFedName');
    const name = fedNameEl ? fedNameEl.value.trim() : '';
    if (!name) {
        showNotification('Please provide a federation name', 'error');
        return;
    }
    if (!currentGroupId) {
        showNotification('No group selected', 'error');
        return;
    }

    try {
        const resp = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/federation/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789', fed_name: name })
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Federation created and group joined', 'success');
            if (document.getElementById('joinFedId')) document.getElementById('joinFedId').value = data.fed_id || '';
            await loadFederationInfo();
        } else {
            showNotification('Failed to create federation: ' + (data.error || 'Unknown'), 'error');
        }
    } catch (err) {
        console.error('Error creating federation:', err);
        showNotification('Error creating federation', 'error');
    }
}

async function joinFederation() {
    const fedIdEl = document.getElementById('joinFedId');
    const fedId = fedIdEl ? fedIdEl.value.trim() : '';
    if (!fedId) {
        showNotification('Please provide a federation ID to join', 'error');
        return;
    }
    if (!currentGroupId) {
        showNotification('No group selected', 'error');
        return;
    }

    try {
        const resp = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/federation/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789', fed_id: fedId })
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Group joined federation', 'success');
            await loadFederationInfo();
        } else {
            showNotification('Failed to join federation: ' + (data.error || 'Unknown'), 'error');
        }
    } catch (err) {
        console.error('Error joining federation:', err);
        showNotification('Error joining federation', 'error');
    }
}

async function leaveFederation() {
    if (!currentGroupId) return showNotification('No group selected', 'error');

    if (!confirm('Are you sure you want this group to leave its federation?')) return;

    try {
        const resp = await fetch(`${API_BASE_URL}/api/group/${currentGroupId}/federation/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: userId || '123456789' })
        });
        const data = await resp.json();
        if (data.success) {
            showNotification('Group left federation', 'success');
            await loadFederationInfo();
        } else {
            showNotification('Failed to leave federation: ' + (data.error || 'Unknown'), 'error');
        }
    } catch (err) {
        console.error('Error leaving federation:', err);
        showNotification('Error leaving federation', 'error');
    }
}

// UI Functions
function switchTab(tabName, evt) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    const content = document.getElementById(tabName + 'Tab');
    if (content) content.classList.add('active');

    try {
        const e = evt || (window.event || null);
        let target = null;
        if (e) target = e.currentTarget || e.target || e.srcElement || null;

        if (target && typeof target.closest === 'function') {
            const tabBtn = target.closest('.tab');
            if (tabBtn) tabBtn.classList.add('active');
        }
    } catch (e) {
        // Ignore if we cannot determine the clicked tab button
    }
}

function closeModal() {
    document.getElementById('groupModal').classList.remove('active');
    currentGroupId = null;
    currentGroupConfig = null;
}

function capitalizeFirstLetter(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function updateEmojiPreview() {
    const emojiInput = document.getElementById('mediaReactionEmojis');
    const emojiList = document.getElementById('emojiList');
    
    if (!emojiInput || !emojiList) return;
    
    const emojis = emojiInput.value.split(',').map(e => e.trim()).filter(e => e);
    
    emojiList.innerHTML = emojis.map(emoji => 
        `<span class="emoji-item" title="${emoji}">${emoji}</span>`
    ).join('');
}

// NOTE: Page-specific initialization is handled by DOMContentLoaded listener above
