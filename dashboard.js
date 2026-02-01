// Dashboard JavaScript - Real-time updates
// API configuration is loaded from config.js
const API_BASE = 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
const REFRESH_INTERVAL = window.DASHBOARDCONFIG?.REFRESH_INTERVAL || 5000;
const DEBUG = window.DASHBOARDCONFIG?.DEBUG || false;

let updateInterval;
let telegramUser = null;

// Initialize Telegram Web App
function initTelegramWebApp() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            
            // Expand to full height
            tg.expand();
            
            // Get user data
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                telegramUser = tg.initDataUnsafe.user;
                console.log('Telegram user detected:', telegramUser);
                
                // Display user info in header
                displayTelegramUserInfo(telegramUser);
                
                // Send user access data to backend
                trackMiniAppAccess(telegramUser, tg.initData);
            } else {
                console.log('No Telegram user data available - running in web browser');
            }
            
            // Set theme based on Telegram theme
            if (tg.themeParams.bg_color) {
                document.body.style.background = tg.themeParams.bg_color;
            }
        }
    } catch (error) {
        console.log('Not running in Telegram Mini App:', error);
    }
}

// Display Telegram user info
function displayTelegramUserInfo(user) {
    const header = document.querySelector('header');
    
    // Create user info container if it doesn't exist
    let userInfo = document.getElementById('telegramUserInfo');
    if (!userInfo) {
        userInfo = document.createElement('div');
        userInfo.id = 'telegramUserInfo';
        userInfo.className = 'user-info';
        header.appendChild(userInfo);
    }
    
    // Build user info HTML with loading state
    let infoHTML = `
        <div class="user-name">
            <i class="fab fa-telegram"></i>
            <span>${escapeHtml(user.first_name || 'User')}</span>
            ${user.username ? `<span class="telegram-badge">@${escapeHtml(user.username)}</span>` : ''}
        </div>
    `;
    
    // Show loading for premium status
    infoHTML += `<div class="premium-status-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    
    infoHTML += `<div class="user-id">ID: ${user.id}</div>`;
    
    userInfo.innerHTML = infoHTML;
    userInfo.classList.add('active');
    
    // Fetch detailed user info from backend
    fetchUserDetails(user.id);
}

// Fetch user details including token balance and premium status
async function fetchUserDetails(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/user/${userId}/info`);
        const data = await response.json();
        
        console.log('User details fetched:', data);
        
        // Update the display with actual data
        updateUserInfoDisplay(data);
        
    } catch (error) {
        console.error('Error fetching user details:', error);
        // Remove loading indicator on error
        const loadingEl = document.querySelector('.premium-status-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
}

// Update user info display with fetched data
function updateUserInfoDisplay(userData) {
    const userInfo = document.getElementById('telegramUserInfo');
    if (!userInfo) return;
    
    // Find the loading element and replace it with actual info
    const loadingEl = userInfo.querySelector('.premium-status-loading');
    
    // Create premium/token info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'user-details';
    
    // Add admin badge if user is admin
    if (userData.is_admin) {
        const adminBadge = document.createElement('div');
        adminBadge.className = 'admin-badge';
        adminBadge.innerHTML = `
            <i class="fas fa-user-shield"></i>
            <span>Admin</span>
        `;
        infoContainer.appendChild(adminBadge);
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
    
    // Replace loading with actual info
    if (loadingEl) {
        loadingEl.replaceWith(infoContainer);
    } else {
        // If no loading element, append to userInfo
        userInfo.appendChild(infoContainer);
    }
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

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Update bot status
async function updateStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const data = await response.json();
        
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
        if (!currentUserId) {
            showNotification('Please load your User ID first', 'warning');
            return;
        }
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
        if (!currentUserId) {
            showNotification('Please load your User ID first', 'warning');
            return;
        }
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
    
    // Auto-load user from Telegram Web App if available
    if (telegramUser && telegramUser.id) {
        setTimeout(() => {
            loadUserForLinks(telegramUser.id);
        }, 1500); // Wait for user details to be fetched first
    }
}

// Load user information for links browser
async function loadUserForLinks(userId) {
    try {
        currentUserId = userId;
        
        // Fetch token balance
        const response = await fetch(`${API_BASE}/api/user/${userId}/info`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading user tokens:', data.error);
            return;
        }
        
        currentUserBalance = data.token_balance || 0;
        
        // Show token info and hide notice
        document.getElementById('userTokenBalance').textContent = currentUserBalance;
        document.getElementById('userTokenInfo').style.display = 'block';
        
        const notice = document.getElementById('linksSearchNotice');
        if (notice) {
            notice.style.display = 'none';
        }
        
        console.log(`Links browser ready for user ${userId} with ${currentUserBalance} tokens`);
        
    } catch (error) {
        console.error('Error loading user for links:', error);
    }
}

// Perform search
async function performSearch() {
    const searchInput = document.getElementById('linkSearchInput');
    currentSearchQuery = searchInput.value.trim();
    currentPage = 0;
    await loadLinks();
}

// Load links from API
async function loadLinks() {
    try {
        showLoading('Loading links...');
        
        const offset = currentPage * linksPerPage;
        let url = `${API_BASE}/api/links/search?limit=${linksPerPage}&offset=${offset}`;
        
        if (currentSearchQuery) {
            url += `&q=${encodeURIComponent(currentSearchQuery)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Error loading links: ' + data.error, 'error');
            hideLoading();
            return;
        }
        
        allLinks = data.links || [];
        totalLinks = data.total || 0;
        
        displayLinks(allLinks);
        updatePagination();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading links:', error);
        showNotification('Failed to load links', 'error');
        hideLoading();
    }
}

// Display links in the container
function displayLinks(links) {
    const container = document.getElementById('linksContainer');
    
    if (!links || links.length === 0) {
        container.innerHTML = `
            <div class="links-placeholder">
                <i class="fas fa-search"></i>
                <p>No links found</p>
                <p class="hint">Try a different search query or click "Show All Links"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    links.forEach((link, index) => {
        const linkCard = createLinkCard(link, index);
        container.appendChild(linkCard);
    });
}

// Create a link card element
function createLinkCard(linkData, index) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.index = index;
    
    const title = linkData.title || 'Untitled';
    const description = linkData.description || 'No description available';
    const url = linkData.link || '#';
    
    card.innerHTML = `
        <div class="link-card-header">
            <div class="link-icon">
                <i class="fab fa-telegram"></i>
            </div>
            <div class="link-info">
                <h3 class="link-title">${escapeHtml(title)}</h3>
                <p class="link-description">${escapeHtml(description)}</p>
            </div>
        </div>
        <div class="link-preview-container" id="preview-${index}" style="display: none;">
            <div class="link-preview-loading">
                <i class="fas fa-spinner fa-spin"></i> Loading preview...
            </div>
        </div>
        <div class="link-card-footer">
            <div class="link-url">
                <i class="fas fa-link"></i>
                <span>${escapeHtml(url.substring(0, 50))}${url.length > 50 ? '...' : ''}</span>
            </div>
            <div class="link-actions">
                <button class="btn-preview" data-url="${escapeHtml(url)}" data-index="${index}">
                    <i class="fas fa-eye"></i> Preview
                </button>
                <button class="btn-access" data-url="${escapeHtml(url)}" data-title="${escapeHtml(title)}">
                    <i class="fas fa-external-link-alt"></i> Access (10 tokens)
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const previewBtn = card.querySelector('.btn-preview');
    const accessBtn = card.querySelector('.btn-access');
    
    previewBtn.addEventListener('click', () => togglePreview(url, index));
    accessBtn.addEventListener('click', () => accessLink(url, title));
    
    return card;
}

// Toggle link preview
async function togglePreview(url, index) {
    const previewContainer = document.getElementById(`preview-${index}`);
    
    if (previewContainer.style.display === 'none') {
        previewContainer.style.display = 'block';
        
        // Check if already loaded
        if (!previewContainer.dataset.loaded) {
            await loadPreview(url, index);
        }
    } else {
        previewContainer.style.display = 'none';
    }
}

// Load preview for a link
async function loadPreview(url, index) {
    const previewContainer = document.getElementById(`preview-${index}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/links/preview?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.success && data.preview) {
            const preview = data.preview;
            let previewHTML = '<div class="link-preview">';
            
            if (preview.image) {
                previewHTML += `
                    <div class="preview-image">
                        <img src="${escapeHtml(preview.image)}" alt="Preview" onerror="this.parentElement.style.display='none'">
                    </div>
                `;
            }
            
            previewHTML += `
                <div class="preview-content">
                    <h4>${escapeHtml(preview.title || 'No title')}</h4>
                    <p>${escapeHtml(preview.description || 'No description available')}</p>
                </div>
            </div>
            `;
            
            previewContainer.innerHTML = previewHTML;
            previewContainer.dataset.loaded = 'true';
        } else {
            previewContainer.innerHTML = `
                <div class="link-preview-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Preview not available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading preview:', error);
        previewContainer.innerHTML = `
            <div class="link-preview-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load preview</p>
            </div>
        `;
    }
}

// Access a link (deduct tokens and open)
async function accessLink(url, title) {
    if (!currentUserId) {
        showNotification('Please load your User ID first', 'warning');
        return;
    }
    
    if (currentUserBalance < 10) {
        showNotification('Insufficient tokens! You need 10 tokens to access a link.', 'error');
        return;
    }
    
    try {
        showLoading('Processing...');
        
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
        
        const data = await response.json();
        
        if (data.success) {
            currentUserBalance = data.remaining_balance;
            document.getElementById('userTokenBalance').textContent = currentUserBalance;
            
            showNotification(
                `Link accessed! ${data.tokens_deducted} tokens deducted. Remaining: ${data.remaining_balance}`,
                'success'
            );
            
            // Open the link
            window.open(url, '_blank');
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Error accessing link:', error);
        showNotification('Failed to access link', 'error');
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
        
        pageInfo.textContent = `Page ${currentPage + 1} of ${maxPage + 1} (${totalLinks} links)`;
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
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Initialize links browser when page loads
document.addEventListener('DOMContentLoaded', () => {
    initLinksBrowser();
});
