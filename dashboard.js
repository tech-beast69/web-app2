// Dashboard JavaScript - Real-time updates
// API configuration is loaded from config.js
const API_BASE = window.DASHBOARD_CONFIG?.API_URL || '';
const REFRESH_INTERVAL = window.DASHBOARD_CONFIG?.REFRESH_INTERVAL || 5000;
const DEBUG = window.DASHBOARD_CONFIG?.DEBUG || false;

let updateInterval;

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

// Search Telegram Groups with pagination
async function searchTelegramGroups(loadMore = false) {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.trim();
    
    if (!searchQuery && !loadMore) {
        alert('Please enter a search query');
        return;
    }
    
    // If this is a new search, reset pagination
    if (!loadMore) {
        currentSearchQuery = searchQuery;
        currentPage = 1;
    } else {
        currentPage++;
    }
    
    const resultsDiv = document.getElementById('searchResults');
    const loaderDiv = document.getElementById('searchLoader');
    const searchBtn = document.getElementById('searchBtn');
    
    // Show loader and disable button
    loaderDiv.style.display = 'block';
    if (!loadMore) {
        resultsDiv.innerHTML = '';
    }
    searchBtn.disabled = true;
    
    try {
        debugLog('Searching for:', currentSearchQuery, 'Page:', currentPage);
        
        const response = await fetch(`${API_BASE}/api/search-telegram-groups?q=${encodeURIComponent(currentSearchQuery)}&page=${currentPage}&per_page=10`);
        const data = await response.json();
        
        loaderDiv.style.display = 'none';
        searchBtn.disabled = false;
        
        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }
        
        if (data.results && data.results.length > 0) {
            displaySearchResults(data.results, loadMore);
            hasMoreResults = data.has_more;
            updateLoadMoreButton(data);
        } else {
            if (!loadMore) {
                displayNoResults();
            }
        }
        
    } catch (error) {
        console.error('Error searching:', error);
        loaderDiv.style.display = 'none';
        searchBtn.disabled = false;
        displaySearchError(error.message);
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
    
    // Only show if there are more results
    if (data.has_more) {
        loadMoreContainer = document.createElement('div');
        loadMoreContainer.id = 'loadMoreContainer';
        loadMoreContainer.className = 'load-more-btn';
        loadMoreContainer.innerHTML = `
            <button onclick="searchTelegramGroups(true)">
                Load More Results
            </button>
            <div class="results-info">
                Showing ${data.count * data.page} of ${data.total} results
            </div>
        `;
        resultsDiv.appendChild(loadMoreContainer);
    }
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
    }
    
    results.forEach((result, index) => {
        const resultCard = document.createElement('div');
        resultCard.className = 'search-result-card';
        if (!append) {
            resultCard.style.animationDelay = `${index * 0.1}s`;
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
