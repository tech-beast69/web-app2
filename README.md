# 🤖 Telegram Bot Dashboard

A modern, real-time web dashboard for monitoring and managing your Telegram bot with Telegram Mini App integration.

[![Live Demo](https://img.shields.io/badge/Demo-Live-success?style=for-the-badge)](https://your-demo-url.com)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue?style=for-the-badge&logo=telegram)](https://t.me/your_bot)

## ✨ Features

### 📊 Real-Time Monitoring
- **Bot Status** - Online/offline status with uptime tracking
- **User Statistics** - Total, active, inactive, and premium users
- **System Resources** - CPU, Memory, and Disk usage monitoring
- **Activity Stats** - Downloads, uploads, and media files tracking

### 🔍 Advanced Telegram Group Search
- **Multi-Engine Search** - Aggregates results from 10+ search sources
- **Smart Deduplication** - Eliminates duplicate results
- **Pagination** - Load more results with smooth navigation
- **Rate Limit Protection** - Intelligent caching and throttling
- **200+ Results** - Fetches maximum results from all sources

### 📱 Telegram Mini App Integration
- **Auto User Detection** - Automatically detects Telegram users
- **Premium Status** - Identifies and displays premium users with badges
- **Access Tracking** - Logs all mini app opens with user details
- **Theme Integration** - Adapts to Telegram's theme colors

### 🎨 Modern UI/UX
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Auto-refresh every 5 seconds
- **Smooth Animations** - Professional transitions and effects
- **Dark/Light Mode** - Adapts to user preferences

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)

1. **Fork this repository**

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `root`
   - Save

3. **Configure your bot API URL**
   - Edit `config.js`
   - Update `API_URL` with your bot server URL

4. **Set up Telegram Mini App**
   - Open [@BotFather](https://t.me/botfather)
   - Send `/mybots` → Select your bot → Bot Settings → Menu Button
   - Enter your GitHub Pages URL: `https://YOUR_USERNAME.github.io/REPO_NAME/`

5. **Done!** 🎉 Open your bot in Telegram and click the menu button

### Option 2: Custom Hosting

1. **Upload files** to your web server
2. **Update config.js** with your API URL
3. **Ensure HTTPS** is enabled (required for Telegram Mini Apps)
4. **Configure Bot Menu** in BotFather with your URL

## 📦 Files Structure

```
├── index.html          # Main dashboard page
├── dashboard.js        # Dashboard logic & API calls
├── dashboard.css       # Styling and animations
├── config.js          # Configuration (API URL, settings)
└── README.md          # This file
```

## ⚙️ Configuration

Edit `config.js` to customize:

```javascript
const DASHBOARD_CONFIG = {
    API_URL: 'https://your-bot-server.com',  // Your bot API endpoint
    REFRESH_INTERVAL: 5000,                   // Update interval (ms)
    DEBUG: false                              // Enable debug logging
};
```

## 🔧 Backend Requirements

Your bot server needs these API endpoints:

### Required Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Bot status and system stats |
| `/api/users` | GET | User statistics |
| `/api/media` | GET | Media statistics |
| `/api/groups` | GET | Groups statistics |
| `/api/feedback` | GET | Feedback statistics |
| `/api/search-telegram-groups` | GET | Search Telegram groups |
| `/api/track-miniapp-access` | POST | Track mini app access |
| `/api/miniapp-stats` | GET | Mini app statistics |

### Example Response Format

```json
{
  "bot_status": "online",
  "uptime": "5 days, 3 hours",
  "total_users": 1250,
  "active_users": 420,
  "cpu_percent": 15.3,
  "memory_percent": 42.1
}
```

## 🔐 CORS Configuration

Your backend must allow CORS requests:

```python
# Python Flask example
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-github-pages-url.github.io"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

## 📱 Telegram Mini App Setup

### Step 1: Get Your Dashboard URL
- GitHub Pages: `https://USERNAME.github.io/REPO/`
- Custom Domain: `https://your-domain.com/dashboard/`

### Step 2: Configure in BotFather
1. Open [@BotFather](https://t.me/botfather)
2. Send `/mybots`
3. Select your bot
4. Click **Bot Settings** → **Menu Button**
5. Click **Configure menu button**
6. Send your dashboard URL
7. Send button text (e.g., "📊 Dashboard")

### Step 3: Test
- Open your bot in Telegram
- Click the menu button (☰) at bottom of chat
- Dashboard opens inside Telegram!

## 🎯 Features Breakdown

### Search System
- **10 SearXNG instances** with pagination (3 pages each)
- **DuckDuckGo HTML** search with multi-page support
- **Bing** search with 50 results per page
- **Yahoo** search with 100 results per page
- **Smart duplicate detection** using link normalization
- **30-minute caching** to prevent rate limits

### User Tracking
- Automatic user detection when opening mini app
- Stores user ID, username, first/last name
- Premium status detection and badge display
- Access count tracking
- Last access timestamp
- Language preference

### Premium Features Detection
The dashboard automatically detects:
- ⭐ Premium Telegram users
- 🔰 Bot administrators
- 📊 User access statistics
- 🎖️ Active/inactive users

## 🛠️ Development

### Local Testing

1. **Start a local server:**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Test Telegram integration:**
   - Use Telegram Web or Desktop
   - Developer tools to simulate Telegram environment

### Debug Mode

Enable debug mode in `config.js`:
```javascript
DEBUG: true
```

Check browser console for detailed logs.

## 🔄 Auto-Refresh

Dashboard automatically refreshes data every 5 seconds. Features:
- **Pause on hidden tab** - Saves resources when tab is inactive
- **Resume on focus** - Continues when tab becomes visible
- **Configurable interval** - Change in `config.js`

## 🎨 Customization

### Change Colors

Edit `dashboard.css`:
```css
:root {
    --primary: #6366f1;    /* Main color */
    --success: #10b981;    /* Success/active */
    --warning: #f59e0b;    /* Warning */
    --danger: #ef4444;     /* Error/offline */
    --premium: #a855f7;    /* Premium badge */
}
```

### Add Custom Stats

1. Add HTML element in `index.html`
2. Update `dashboard.js` to populate data
3. Add corresponding API endpoint in backend

## 📊 Analytics

Track mini app usage:
```javascript
// Get mini app statistics
fetch('/api/miniapp-stats')
  .then(r => r.json())
  .then(data => {
    console.log('Total users:', data.total_users);
    console.log('Premium users:', data.premium_users);
    console.log('Recent (24h):', data.recent_users_24h);
  });
```

## 🐛 Troubleshooting

### Dashboard shows "Loading..." forever
- Check if backend API is running
- Verify `API_URL` in `config.js`
- Check CORS configuration
- Open browser console for errors

### Search returns no results
- Rate limiting from search engines (wait 30 minutes)
- Check backend logs for errors
- Verify network connectivity

### Telegram user not detected
- Must open as Telegram Mini App (not regular browser)
- Check if Telegram Web App SDK loaded
- Verify BotFather menu button configuration

### Premium badge not showing
- User must have Telegram Premium
- Ensure backend is tracking mini app access
- Check `/api/miniapp-stats` endpoint

## 📝 License

MIT License - feel free to use for your own projects!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)
- **Telegram:** [@your_support_bot](https://t.me/your_support_bot)
- **Email:** support@example.com

## 🌟 Credits

Built with:
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Font Awesome](https://fontawesome.com)
- [SearXNG](https://github.com/searxng/searxng)

## 📸 Screenshots

### Desktop View
![Dashboard Desktop](https://via.placeholder.com/800x500?text=Dashboard+Desktop+View)

### Mobile / Telegram Mini App
![Dashboard Mobile](https://via.placeholder.com/400x800?text=Dashboard+Mobile+View)

### Premium User Badge
![Premium Badge](https://via.placeholder.com/600x200?text=Premium+User+Badge)

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Custom themes
- [ ] Advanced analytics
- [ ] Export data to CSV/JSON
- [ ] Real-time notifications
- [ ] Admin control panel

---

**Made with ❤️ for the Telegram Bot community**

⭐ Star this repo if you find it useful!
