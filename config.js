// Dashboard Configuration
// Update this file with your bot server details

console.log('🔧 Config.js loading...');
console.log('Current hostname:', window.location.hostname);
console.log('Current origin:', window.location.origin);

const DASHBOARDCONFIG = {
    // API endpoint configuration
    // Default to empty and resolve below.
    APIURL: '',
    
    // Refresh interval in milliseconds (default: 5000ms = 5 seconds)
    REFRESH_INTERVAL: 5000,

    // Browser storage key used by discord-management.html for bearer token
    DISCORD_ADMIN_TOKEN_STORAGE_KEY: 'discord_admin_token',
    
    // Enable debug logging
    DEBUG: true  // Enable for troubleshooting
};

console.log('Default APIURL:', DASHBOARDCONFIG.APIURL);

// Priority order:
// 1) Explicit runtime override: window.__DASHBOARD_API_URL
// 2) GitHub Pages fallback to public API
// 3) Same-origin API (works for server-hosted dashboard and Mini App)
const runtimeApiOverride = (window.__DASHBOARD_API_URL || '').trim();
if (runtimeApiOverride) {
    DASHBOARDCONFIG.APIURL = runtimeApiOverride;
    console.log('✅ Runtime API override detected:', DASHBOARDCONFIG.APIURL);
} else if (window.location.hostname.endsWith('.github.io')) {
    DASHBOARDCONFIG.APIURL = 'https://1e4fecb5-5c9e-4fb3-8ace-01c2cc75312b.glacierhosting.org';
    console.log('✅ GitHub Pages detected - using remote API:', DASHBOARDCONFIG.APIURL);
} else {
    DASHBOARDCONFIG.APIURL = window.location.origin;
    console.log('✅ Using same-origin API:', DASHBOARDCONFIG.APIURL);
}

// Normalize trailing slash to prevent double-slash URLs.
DASHBOARDCONFIG.APIURL = DASHBOARDCONFIG.APIURL.replace(/\/$/, '');

// Export config
window.DASHBOARDCONFIG = DASHBOARDCONFIG;

console.log('✅ Config.js loaded successfully');
console.log('Final APIURL:', DASHBOARDCONFIG.APIURL);
console.log('Refresh interval:', DASHBOARDCONFIG.REFRESH_INTERVAL, 'ms');
console.log('Debug mode:', DASHBOARDCONFIG.DEBUG);
