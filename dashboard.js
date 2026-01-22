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

// Search state management
let currentSearchQuery = '';
let currentPage = 1;
let hasMoreResults = false;
let currentSessionId = null; // Track search session for progressive loading
let isSearching = false; // Track if endless search is active
let stopSearchRequested = false; // Track if user wants to stop

// Search Telegram Groups with pagination and endless auto-loading
async function searchTelegramGroups(loadMore = false, autoLoad = false) {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.trim();
    
    if (!searchQuery && !loadMore) {
        showTokenMessage('⚠️ Please enter a search query', 'warning');
        return;
    }
    
    // Check if Telegram user is available
    if (!telegramUser) {
        showTokenMessage('⚠️ Please access this dashboard through Telegram Mini App to use search functionality', 'error');
        return;
    }
    
    // If this is a new search, reset pagination and session
    if (!loadMore) {
        currentSearchQuery = searchQuery;
        currentPage = 1;
        currentSessionId = null; // Reset session for new search
        isSearching = true;
        stopSearchRequested = false;
    } else {
        currentPage++;
    }
    
    const resultsDiv = document.getElementById('searchResults');
    const loaderDiv = document.getElementById('searchLoader');
    const searchBtn = document.getElementById('searchBtn');
    
    // Update loader text for endless search
    if (autoLoad) {
        loaderDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Auto-loading more results...';
    } else {
        loaderDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    }
    
    // Show loader and disable button
    loaderDiv.style.display = 'block';
    if (!loadMore) {
        resultsDiv.innerHTML = '';
        updateStopButton(true); // Show stop button for new searches
    }
    searchBtn.disabled = true;
    
    try {
        debugLog('Searching for:', currentSearchQuery, 'Page:', currentPage, 'Session:', currentSessionId);
        
        // Build request URL with session support
        const userId = telegramUser.id;
        let url = `${API_BASE}/api/search-telegram-groups?q=${encodeURIComponent(currentSearchQuery)}&page=${currentPage}&per_page=20&user_id=${userId}`;
        
        // Add session ID if continuing a search
        if (currentSessionId) {
            url += `&session_id=${encodeURIComponent(currentSessionId)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        loaderDiv.style.display = 'none';
        searchBtn.disabled = false;
        
        // Store session ID for subsequent requests
        if (data.session_id) {
            currentSessionId = data.session_id;
            debugLog('Session ID:', currentSessionId);
        }
        
        // Handle session expired
        if (response.status === 410 || data.session_expired) {
            showTokenMessage('⏱️ Search session expired. Please start a new search.', 'warning');
            // Reset and allow new search
            currentSessionId = null;
            currentPage = 1;
            displayNoResults();
            return;
        }
        
        // Handle insufficient tokens
        if (response.status === 402 || data.insufficient_tokens) {
            showInsufficientTokensMessage(data);
            return;
        }
        
        // Handle authentication required
        if (response.status === 401 || data.requires_auth) {
            showTokenMessage('🔐 Authentication required. Please access via Telegram Mini App.', 'error');
            return;
        }
        
        // Handle no results found (404)
        if (response.status === 404 || (data.results && data.results.length === 0)) {
            if (!loadMore) {
                displayNoResults();
                if (data.tokens_refunded) {
                    showTokenMessage('🔍 No Telegram groups found. Tokens refunded. Try different keywords.', 'warning');
                } else {
                    showTokenMessage('🔍 No more results found.', 'warning');
                }
            } else {
                showTokenMessage('✅ No more results available.', 'info');
            }
            return;
        }
        
        // Handle other errors
        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }
        
        // Show success message for new searches
        if (!loadMore && currentPage === 1) {
            if (data.is_admin) {
                showTokenMessage(`✅ Endless search started! Found ${data.total_unique_found || data.count} groups. Will auto-load more... (Admin - Free)`, 'success');
            } else if (data.tokens_deducted) {
                showTokenMessage(`✅ Endless search started! 10 tokens deducted. Found ${data.total_unique_found || data.count} groups. Auto-loading more...`, 'success');
                // Refresh user token balance
                if (telegramUser) {
                    fetchUserDetails(telegramUser.id);
                }
            } else {
                showTokenMessage(`✅ Endless search started! Found ${data.total_unique_found || data.count} groups. Auto-loading more...`, 'success');
            }
        } else if (loadMore && data.count > 0) {
            showTokenMessage(`✅ Loaded ${data.count} more results! Total found: ${data.total_unique_found}`, 'info');
        }
        
        if (data.results && data.results.length > 0) {
            console.log('Search response:', data);
            console.log('Has more results:', data.has_more);
            displaySearchResults(data.results, loadMore);
            hasMoreResults = data.has_more;
            updateLoadMoreButton(data);
            
            // Auto-load more results if endless search is active and not stopped
            if (data.endless_search && isSearching && !stopSearchRequested && data.has_more) {
                // Wait 2 seconds before auto-loading next batch
                setTimeout(() => {
                    if (isSearching && !stopSearchRequested) {
                        searchTelegramGroups(true, true);
                    }
                }, 2000);
            } else if (stopSearchRequested) {
                isSearching = false;
                showTokenMessage(`🛑 Search stopped by user. Found ${data.total_unique_found} unique groups total.`, 'info');
                updateStopButton(false);
            }
        } else {
            if (!loadMore) {
                displayNoResults();
            }
            isSearching = false;
            updateStopButton(false);
        }
        
    } catch (error) {
        console.error('Error searching:', error);
        loaderDiv.style.display = 'none';
        searchBtn.disabled = false;
        isSearching = false;
        stopSearchRequested = false;
        updateStopButton(false);
        displaySearchError(error.message);
    }
}

// Stop the endless search
function stopSearch() {
    stopSearchRequested = true;
    isSearching = false;
    showTokenMessage('🛑 Stopping search...', 'info');
    updateStopButton(false);
}

// Update the stop button visibility
function updateStopButton(show) {
    let stopBtn = document.getElementById('stopSearchBtn');
    if (show) {
        if (!stopBtn) {
            stopBtn = document.createElement('button');
            stopBtn.id = 'stopSearchBtn';
            stopBtn.className = 'stop-search-btn';
            stopBtn.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Search';
            stopBtn.onclick = stopSearch;
            
            const searchBtn = document.getElementById('searchBtn');
            searchBtn.parentNode.insertBefore(stopBtn, searchBtn.nextSibling);
        }
        stopBtn.style.display = 'inline-block';
    } else {
        if (stopBtn) {
            stopBtn.style.display = 'none';
        }
    }
}

// Update or create "Load More" button
function updateLoadMoreButton(data) {
    const resultsDiv = document.getElementById('searchResults');
    let loadMoreContainer = document.getElementById('loadMoreContainer');
    
    // Remove existing container if present
    if (loadMoreContainer) {
        loadMoreContainer.remove();
    }
    
    // Show endless search status
    console.log('updateLoadMoreButton called with has_more:', data.has_more);
    loadMoreContainer = document.createElement('div');
    loadMoreContainer.id = 'loadMoreContainer';
    loadMoreContainer.className = 'load-more-btn endless-search-status';
    const totalFound = data.total_unique_found || data.count;
    
    if (isSearching && !stopSearchRequested) {
        loadMoreContainer.innerHTML = `
            <div class="endless-search-indicator">
                <i class="fas fa-infinity"></i> <strong>Endless Search Active</strong>
            </div>
            <div class="results-info">
                <i class="fas fa-check-circle"></i> ${totalFound} unique groups found so far
                <br><small>Automatically searching more sources...</small>
            </div>
            <button onclick="stopSearch()" class="stop-button">
                <i class="fas fa-stop-circle"></i> Stop Search
            </button>
        `;
    } else {
        loadMoreContainer.innerHTML = `
            <button onclick="searchTelegramGroups(true)" class="load-more-button">
                <i class="fas fa-sync-alt"></i> Load More Groups
            </button>
            <div class="results-info">
                <i class="fas fa-check-circle"></i> ${totalFound} unique groups found
                <br><small>Click to continue searching</small>
            </div>
        `;
    }
    
    resultsDiv.appendChild(loadMoreContainer);
    console.log('Load More / Status indicator added');
}

// Display search results
function displaySearchResults(results, append = false) {
    const resultsDiv = document.getElementById('searchResults');
    
    // If not appending, clear existing results
    if (!append) {
        resultsDiv.innerHTML = '';
    } else {
        // Remove old load more button if it exists
        const oldLoadMore = document.getElementById('loadMoreContainer');
        if (oldLoadMore) {
            oldLoadMore.remove();
        }
        // Remove old counter if it exists
        const oldCounter = document.getElementById('resultsCounter');
        if (oldCounter) {
            oldCounter.remove();
        }
    }
    
    // Add results counter at the top (for new searches or update for appended)
    let counter = document.getElementById('resultsCounter');
    const currentDisplayCount = resultsDiv.querySelectorAll('.search-result-card').length + results.length;
    
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'resultsCounter';
        counter.className = 'results-counter';
        resultsDiv.insertBefore(counter, resultsDiv.firstChild);
    }
    
    counter.innerHTML = `
        <i class="fas fa-list"></i> 
        <strong>${currentDisplayCount}</strong> results displayed
    `;
    
    results.forEach((result, index) => {
        const resultCard = document.createElement('div');
        resultCard.className = 'search-result-card';
        if (!append) {
            resultCard.style.animationDelay = `${index * 0.05}s`; // Reduced delay for faster display
        }
        
        resultCard.innerHTML = `
            <div class="search-result-title">
                <i class="fab fa-telegram"></i>
                ${escapeHtml(result.title)}
            </div>
            <a href="${escapeHtml(result.link)}" target="_blank" class="search-result-link">
                <i class="fas fa-external-link-alt"></i> ${escapeHtml(result.link)}
            </a>
            <div class="search-result-snippet">
                ${escapeHtml(result.snippet || 'No description available')}
            </div>
        `;
        
        resultsDiv.appendChild(resultCard);
    });
}

// Display no results message
function displayNoResults() {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `
        <div class="search-no-results">
            <i class="fas fa-search"></i>
            <p>No results found. Try a different search term.</p>
        </div>
    `;
}

// Display search error
function displaySearchError(errorMessage) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `
        <div class="search-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p><strong>Error:</strong> ${escapeHtml(errorMessage)}</p>
            <p>Please try again later.</p>
        </div>
    `;
}

// Show token-related messages
function showTokenMessage(message, type = 'info') {
    // Remove existing message if any
    const existing = document.querySelector('.token-message');
    if (existing) existing.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `token-message token-message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-btn">&times;</button>
    `;
    
    const searchSection = document.querySelector('.search-section');
    const searchContainer = document.querySelector('.search-container');
    searchContainer.insertBefore(messageDiv, searchContainer.firstChild);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 8000);
}

// Show insufficient tokens message
function showInsufficientTokensMessage(data) {
    const message = `
        <div style="text-align: left;">
            <strong>❌ Insufficient Tokens</strong><br><br>
            💰 Current Balance: <strong>${data.current_balance || 0} tokens</strong><br>
            🔍 Required for Search: <strong>${data.required_tokens || 10} tokens</strong><br>
            📉 You need <strong>${(data.required_tokens || 10) - (data.current_balance || 0)} more tokens</strong><br><br>
            <strong>💡 How to get more tokens:</strong><br>
            • Contact admin to purchase tokens<br>
            • Earn weekly free tokens<br>
            • Upgrade to premium membership<br><br>
            📞 <strong>Contact admin for token purchases</strong>
        </div>
    `;
    
    showTokenMessage(message, 'error');
}

// Scroll to top button functionality
function initScrollToTop() {
    // Create scroll-to-top button
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.body.appendChild(scrollBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
}

// Initialize scroll to top on page load
document.addEventListener('DOMContentLoaded', initScrollToTop);

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Allow Enter key to trigger search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchTelegramGroups();
            }
        });
    }
});
