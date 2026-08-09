// Dashboard Configuration
// Update this file with your bot server details

console.log('🔧 Config.js loading...');
console.log('Current hostname:', window.location.hostname);
console.log('Current origin:', window.location.origin);

const DASHBOARDCONFIG = {
    // API endpoint configuration
    // Default to the deployed backend API.
    APIURL: 'https://1e4fecb5.glacierhosting.org',
    
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
// 2) Query-string override: ?api=https://...
// 3) Safe same-origin mode only when explicitly requested via ?use_same_origin_api=1
// 4) Otherwise keep fixed deployed backend APIURL
const isLocalEnv = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) || window.location.protocol === 'file:';

if (runtimeApiOverride) {
    DASHBOARDCONFIG.APIURL = runtimeApiOverride;
    console.log('✅ Runtime API override detected:', DASHBOARDCONFIG.APIURL);
} else if (queryApiOverride) {
    DASHBOARDCONFIG.APIURL = queryApiOverride;
    console.log('✅ Query API override detected:', DASHBOARDCONFIG.APIURL);
} else if (useSameOriginApi || isLocalEnv) {
    if (window.location.protocol === 'file:') {
        DASHBOARDCONFIG.APIURL = 'http://localhost:3027';
    } else if (window.location.origin && window.location.origin !== 'null' && !window.location.hostname.includes('telegram.org')) {
        DASHBOARDCONFIG.APIURL = window.location.origin;
    } else {
        DASHBOARDCONFIG.APIURL = 'http://localhost:3027';
    }
    console.log('✅ Local/Same-origin environment detected - using API:', DASHBOARDCONFIG.APIURL);
} else {
    console.log('✅ Using default backend API:', DASHBOARDCONFIG.APIURL);
}

// Normalize trailing slash to prevent double-slash URLs.
DASHBOARDCONFIG.APIURL = DASHBOARDCONFIG.APIURL.replace(/\/$/, '');

// Export config
window.DASHBOARDCONFIG = DASHBOARDCONFIG;

console.log('✅ Config.js loaded successfully');
console.log('Final APIURL:', DASHBOARDCONFIG.APIURL);
console.log('Refresh interval:', DASHBOARDCONFIG.REFRESH_INTERVAL, 'ms');
console.log('Debug mode:', DASHBOARDCONFIG.DEBUG);
