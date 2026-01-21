// Dashboard Configuration
// Update this file with your bot server details

const DASHBOARDCONFIG = {
    // API endpoint configuration
    // For GitHub Pages: Set this to your bot server's public URL
    // Example: 'http://your-server-ip:5000' or 'https://your-domain.com'
    APIURL: 'http://localhost:3027', // Change this to your bot server URL
    
    // Refresh interval in milliseconds (default: 5000ms = 5 seconds)
    REFRESH_INTERVAL: 5000,
    
    // Enable debug logging
    DEBUG: true  // Enable for troubleshooting
};

// Auto-detect if running on GitHub Pages
if (window.location.hostname.endsWith('.github.io')) {
    // Running on GitHub Pages - use your bot server URL with HTTPS
    DASHBOARDCONFIG.APIURL = 'https://us36.glacierhosting.org:3027';
    console.log('GitHub Pages detected - using remote API:', DASHBOARDCONFIG.APIURL);
} else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Running on remote server
    DASHBOARDCONFIG.APIURL = 'https://us36.glacierhosting.org:3027';
    console.log('Remote server detected - using HTTPS API:', DASHBOARDCONFIG.APIURL);
}

// Export config
window.DASHBOARDCONFIG = DASHBOARDCONFIG;
