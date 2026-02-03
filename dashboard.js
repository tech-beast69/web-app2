// Dashboard JavaScript - Real-time updates
// Configuration - loaded from external config file (not in GitHub)
// Make sure config.js exists (copy from config.example.js)
let API_BASE;
try {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_BASE) {
        API_BASE = CONFIG.API_BASE;
    } else {
        throw new Error('CONFIG not loaded');
    }
} catch (e) {
    console.error('⚠️ config.js not loaded. Using fallback (this will fail in production)');
    API_BASE = 'http://localhost:5000'; // Fallback for development
}
const REFRESH_INTERVAL = window.DASHBOARDCONFIG?.REFRESH_INTERVAL || 30000; // 30 seconds
const DEBUG = window.DASHBOARDCONFIG?.DEBUG || false;

// Cache to prevent redundant API calls
const API_CACHE = {
    status: { data: null, timestamp: 0 },
    users: { data: null, timestamp: 0 },
    media: { data: null, timestamp: 0 },
    groups: { data: null, timestamp: 0 },
    feedback: { data: null, timestamp: 0 }
};
const CACHE_TTL = 10000; // 10 seconds cache TTL

// Don't override API_BASE - always use the one from config.js
console.log('✅ Using API endpoint from config.js:', API_BASE);

let updateInterval;
let telegramUser = null;

// Initialize Telegram Web App
function initTelegramWebApp() {
    console.log('=== Initializing Telegram Web App ===');
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            console.log('Telegram WebApp object found:', tg);
            
            // Expand to full height
            tg.expand();
            
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
            if (tg.themeParams.bg_color) {
                document.body.style.background = tg.themeParams.bg_color;
            }
        } else {
            console.log('⚠️ Telegram WebApp not available - running in regular browser');
            // For testing: Create a mock user
            createMockUserForTesting();
        }
    } catch (error) {
        console.error('❌ Error in initTelegramWebApp:', error);
        // For testing: Create a mock user on error
        createMockUserForTesting();
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
    try {
        // Check cache first
        const now = Date.now();
        if (API_CACHE.status.data && (now - API_CACHE.status.timestamp) < CACHE_TTL) {
            const data = API_CACHE.status.data;
        } else {
            const response = await fetch(`${API_BASE}/api/status`);
            const data = await response.json();
            API_CACHE.status = { data, timestamp: now };
        }
        const data = API_CACHE.status.data;
        
        // Bot Status
        const statusElement = document.getElementById('statusIndicator');
        const statusText = document.getElementById('botStatus');
        
        if (data.bot_status === 'online') {
            statusElement.classList.remove('offline');
            statusElement.classList.add('online');
            statusText.textContent = 'Online';
        } else {
            statusElement.classList.remove('online');
            statusElement.classList.add('offline');
            statusText.textContent = 'Offline';
        }
        
        // Uptime
        document.getElementById('uptime').textContent = data.uptime || '--';
        
        // CPU & Memory
        document.getElementById('cpuUsage').textContent = `${data.cpu_percent || 0}%`;
        document.getElementById('memoryUsage').textContent = `${data.memory_percent || 0}%`;
        
        // Downloads & Uploads
        document.getElementById('totalDownloads').textContent = formatNumber(data.total_downloads || 0);
        document.getElementById('totalUploads').textContent = formatNumber(data.total_uploads || 0);
        
        // System Resources
        updateResourceBar('cpu', data.cpu_percent || 0);
        updateResourceBar('memory', data.memory_percent || 0);
        updateResourceBar('disk', data.disk_percent || 0);
        
        document.getElementById('cpuDetails').textContent = `${data.cpu_percent || 0}%`;
        document.getElementById('memoryDetails').textContent = 
            `${data.memory_used_gb || 0} GB / ${data.memory_total_gb || 0} GB`;
        document.getElementById('diskDetails').textContent = 
            `${data.disk_used_gb || 0} GB / ${data.disk_total_gb || 0} GB`;
        
    } catch (error) {
        console.error('Error fetching status:', error);
    }
}

// Update user statistics
async function updateUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        const data = await response.json();
        
        document.getElementById('totalUsers').textContent = formatNumber(data.total_users || 0);
        document.getElementById('activeUsers').textContent = formatNumber(data.active_users || 0);
        document.getElementById('inactiveUsers').textContent = formatNumber(data.inactive_users || 0);
        document.getElementById('premiumUsers').textContent = formatNumber(data.premium_users || 0);
        document.getElementById('recentUsers').textContent = formatNumber(data.recent_users_7d || 0);
        
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Update media statistics
async function updateMedia() {
    try {
        const response = await fetch(`${API_BASE}/api/media`);
        const data = await response.json();
        
        document.getElementById('totalMedia').textContent = formatNumber(data.total_media || 0);
        
    } catch (error) {
        console.error('Error fetching media:', error);
    }
}

// Update groups statistics
async function updateGroups() {
    try {
        const response = await fetch(`${API_BASE}/api/groups`);
        const data = await response.json();
        
        document.getElementById('totalGroups').textContent = formatNumber(data.total_groups || 0);
        
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
}

// Update feedback statistics
async function updateFeedback() {
    try {
        const response = await fetch(`${API_BASE}/api/feedback`);
        const data = await response.json();
        
        document.getElementById('totalFeedback').textContent = formatNumber(data.total_feedback || 0);
        
    } catch (error) {
        console.error('Error fetching feedback:', error);
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
    document.getElementById('lastUpdate').textContent = timeString;
}

// Update all data
async function updateAllData() {
    await Promise.all([
        updateStatus(),
        updateUsers(),  
        updateMedia(),
        updateGroups(),
        updateFeedback()
    ]);
    updateLastUpdateTime();
}

// Initialize dashboard
function initDashboard() {
    debugLog('Initializing dashboard...');
    
    // Initialize Telegram Web App first
    initTelegramWebApp();
    
    // Initial load
    updateAllData();
    
    // Auto-refresh using configured interval
    updateInterval = setInterval(updateAllData, REFRESH_INTERVAL);
    debugLog('Auto-refresh enabled', { interval: REFRESH_INTERVAL });
    
    // Add visibility change handler to pause/resume updates
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(updateInterval);
            debugLog('Page hidden - pausing updates');
        } else {
            debugLog('Page visible - resuming updates');
            updateAllData();
            updateInterval = setInterval(updateAllData, REFRESH_INTERVAL);
        }
    });
}

// Start the dashboard when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

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
