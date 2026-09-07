// Dashboard Configuration
// Configuration values are injected dynamically via GitHub Secrets during deployment

console.log('🔧 Config.js initializing...');

const INJECTED_API_URL = '__BACKEND_API_URL__';
const INJECTED_SECRET_KEY = '__WEBAPP_SECRET_KEY__';

const isLocalEnv = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) || window.location.protocol === 'file:';

let defaultApiUrl = '';
if (INJECTED_API_URL && INJECTED_API_URL.startsWith('http')) {
    defaultApiUrl = INJECTED_API_URL;
} else if (isLocalEnv) {
    defaultApiUrl = 'http://localhost:3027';
}

const DASHBOARDCONFIG = {
    // API endpoint injected via GitHub Actions Secret BACKEND_API_URL
    APIURL: window.__ENV_BACKEND_API_URL__ || defaultApiUrl,
    
    // Secret access key injected via GitHub Actions Secret WEBAPP_SECRET_KEY
    WEBAPP_SECRET_KEY: window.__ENV_WEBAPP_KEY__ || (INJECTED_SECRET_KEY.startsWith('__') ? '' : INJECTED_SECRET_KEY),

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
    } else if (window.location.origin && window.location.origin !== 'null' && !window.location.hostname.includes('telegram.org') && !window.location.hostname.includes('github.io')) {
        DASHBOARDCONFIG.APIURL = window.location.origin;
    } else {
        DASHBOARDCONFIG.APIURL = 'http://localhost:3027';
    }
}

// Normalize trailing slash
if (DASHBOARDCONFIG.APIURL) {
    DASHBOARDCONFIG.APIURL = DASHBOARDCONFIG.APIURL.replace(/\/$/, '');
}

// Export config to window
window.DASHBOARDCONFIG = DASHBOARDCONFIG;
window.API_BASE = DASHBOARDCONFIG.APIURL;

// Auto-attach X-Webapp-Key header and resolve API URLs for all outgoing backend requests
(function() {
    const originalFetch = window.fetch;
    if (typeof originalFetch !== 'function') return;
    window.fetch = function(url, options) {
        options = options || {};
        try {
            let urlStr = (typeof url === 'string') ? url : (url && url.url ? url.url : '');
            const cfg = window.DASHBOARDCONFIG;
            const apiBase = (cfg && cfg.APIURL) || window.API_BASE || '';
            const secretKey = (cfg && cfg.WEBAPP_SECRET_KEY) || '';
            
            // If relative /api/* path is fetched, rewrite it to full backend API base URL
            if (apiBase && urlStr.startsWith('/api/')) {
                urlStr = `${apiBase}${urlStr}`;
                url = urlStr;
            }

            // Attach X-Webapp-Key if configured and request targets our backend API
            const isBackendCall = (apiBase && urlStr.startsWith(apiBase)) || urlStr.includes('/api/');
            if (secretKey && !secretKey.startsWith('__') && isBackendCall) {
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
