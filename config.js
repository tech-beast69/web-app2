// Dashboard Configuration
// Update this file with your bot server details

console.log('🔧 Config.js loading...');
console.log('Current hostname:', window.location.hostname);
console.log('Current origin:', window.location.origin);

const DASHBOARDCONFIG = {
    // API endpoint configuration
    // Default to your public dashboard API domain; override for local dev below.
    APIURL: 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org',
    
    // Refresh interval in milliseconds (default: 5000ms = 5 seconds)
    REFRESH_INTERVAL: 5000,
    
    // Enable debug logging
    DEBUG: true  // Enable for troubleshooting
};

console.log('Default APIURL:', DASHBOARDCONFIG.APIURL);

// Auto-detect if running on GitHub Pages
if (window.location.hostname.endsWith('.github.io')) {
    // Running on GitHub Pages - use your public dashboard API URL
    DASHBOARDCONFIG.APIURL = 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
    console.log('✅ GitHub Pages detected - using remote API:', DASHBOARDCONFIG.APIURL);
} else if (window.location.hostname === 'us36.glacierhosting.org' || window.location.hostname.includes('glacierhosting.org')) {
    // Running on the actual server - use same origin
    const protocol = window.location.protocol; // Will be http: or https:
    DASHBOARDCONFIG.APIURL = `${protocol}//${window.location.hostname}`;
    console.log('✅ Server domain detected - using:', DASHBOARDCONFIG.APIURL);
} else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Running on some other remote server - default to public HTTPS API
    DASHBOARDCONFIG.APIURL = 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
    console.log('✅ Remote server detected - using API:', DASHBOARDCONFIG.APIURL);
}

// Export config
window.DASHBOARDCONFIG = DASHBOARDCONFIG;

console.log('✅ Config.js loaded successfully');
console.log('Final APIURL:', DASHBOARDCONFIG.APIURL);
console.log('Refresh interval:', DASHBOARDCONFIG.REFRESH_INTERVAL, 'ms');
console.log('Debug mode:', DASHBOARDCONFIG.DEBUG);
