// Dashboard Configuration
// Update this file with your bot server details

const DASHBOARD_CONFIG = {
    // API endpoint configuration
    // For GitHub Pages: Set this to your bot server's public URL
    // Example: 'http://your-server-ip:5000' or 'https://your-domain.com'
    API_URL: 'http://localhost:3027', // Change this to your bot server URL
    
    // Refresh interval in milliseconds (default: 5000ms = 5 seconds)
    REFRESH_INTERVAL: 5000,
    
    // Enable debug logging
    DEBUG: true  // Enable for troubleshooting
};

// Auto-detect if running on GitHub Pages
if (window.location.hostname.endsWith('.github.io')) {
    // Running on GitHub Pages - use your bot server URL
    DASHBOARD_CONFIG.API_URL = 'https://us36.glacierhosting.org:3027';
    console.log('GitHub Pages detected - using remote API:', DASHBOARD_CONFIG.API_URL);
}

// Export config
window.DASHBOARD_CONFIG = DASHBOARD_CONFIG;





