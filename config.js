// Dashboard Configuration
// Configuration values are injected dynamically via GitHub Secrets during deployment

console.log('🔧 Config.js initializing...');

const DASHBOARDCONFIG = {
    // API endpoint injected via GitHub Actions Secret BACKEND_API_URL
    APIURL: window.__ENV_BACKEND_API_URL__ || '__BACKEND_API_URL__',
    
    // Secret access key injected via GitHub Actions Secret WEBAPP_SECRET_KEY
    WEBAPP_SECRET_KEY: window.__ENV_WEBAPP_KEY__ || '__WEBAPP_SECRET_KEY__',

    // Refresh interval in milliseconds (default: 5000ms = 5 seconds)
    REFRESH_INTERVAL: 5000,

    // Browser storage key used by discord-management.html for bearer token
    DISCORD_ADMIN_TOKEN_STORAGE_KEY: 'discord_admin_token',
    
    // Debug logging disabled in production
    DEBUG: false
};

// Priority order:
// 1) Explicit runtime override: window.__DASHBOARD_API_URL
// 2) Query-string override: ?api=https://...
// 3) Local development environment: http://localhost:3027
// 4) Deployed backend API (injected secret)
const isLocalEnv = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) || window.location.protocol === 'file:';

let runtimeApiOverride = '';
let queryApiOverride = '';
let useSameOriginApi = false;
try {
    const params = new URLSearchParams(window.location.search || '');
    queryApiOverride = (params.get('api') || '').trim();
    useSameOriginApi = params.get('use_same_origin_api') === '1';
} catch (_) {}
try {
    runtimeApiOverride = (window.__DASHBOARD_API_URL || '').trim();
} catch (_) {}

if (runtimeApiOverride) {
    DASHBOARDCONFIG.APIURL = runtimeApiOverride;
} else if (queryApiOverride) {
    DASHBOARDCONFIG.APIURL = queryApiOverride;
} else if (useSameOriginApi || isLocalEnv) {
    if (window.location.protocol === 'file:') {
        DASHBOARDCONFIG.APIURL = 'http://localhost:3027';
    } else if (window.location.origin && window.location.origin !== 'null' && !window.location.hostname.includes('telegram.org')) {
        DASHBOARDCONFIG.APIURL = window.location.origin;
    } else {
        DASHBOARDCONFIG.APIURL = 'http://localhost:3027';
    }
}

// Clean placeholder if not injected (e.g. running uncompiled raw git files)
if (DASHBOARDCONFIG.APIURL === '__BACKEND_API_URL__' && !isLocalEnv) {
    DASHBOARDCONFIG.APIURL = '';
}

// Normalize trailing slash
if (DASHBOARDCONFIG.APIURL) {
    DASHBOARDCONFIG.APIURL = DASHBOARDCONFIG.APIURL.replace(/\/$/, '');
}

// Export config to window
window.DASHBOARDCONFIG = DASHBOARDCONFIG;

// Auto-attach X-Webapp-Key header to all outgoing requests towards backend API
(function() {
    const originalFetch = window.fetch;
    if (typeof originalFetch !== 'function') return;
    window.fetch = function(url, options) {
        options = options || {};
        try {
            const urlStr = (typeof url === 'string') ? url : (url && url.url ? url.url : '');
            const cfg = window.DASHBOARDCONFIG;
            const apiBase = (cfg && cfg.APIURL) || window.API_BASE || '';
            const secretKey = (cfg && cfg.WEBAPP_SECRET_KEY) || '';
            
            if (secretKey && secretKey !== '__WEBAPP_SECRET_KEY__' && apiBase && urlStr.startsWith(apiBase)) {
                if (options.headers instanceof Headers) {
                    if (!options.headers.has('X-Webapp-Key')) {
                        options.headers.set('X-Webapp-Key', secretKey);
                    }
                } else if (Array.isArray(options.headers)) {
                    const hasKey = options.headers.some(h => h[0] && h[0].toLowerCase() === 'x-webapp-key');
                    if (!hasKey) options.headers.push(['X-Webapp-Key', secretKey]);
                } else {
                    options.headers = options.headers || {};
                    if (!options.headers['X-Webapp-Key']) {
                        options.headers['X-Webapp-Key'] = secretKey;
                    }
                }
            }
        } catch (err) {
            // Silently continue without blocking fetch
        }
        return originalFetch.call(this, url, options);
    };
})();
