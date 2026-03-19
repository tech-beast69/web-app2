# Contributing to Telegram Bot Dashboard

First off, thank you for considering contributing to Telegram Bot Dashboard! 🎉

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (browser, OS, Telegram client)
- **Console errors** from browser DevTools

**Example:**
```markdown
**Bug:** Search results show duplicates

**Steps to Reproduce:**
1. Search for "crypto"
2. Click "Load More"
3. Notice duplicate links

**Expected:** Unique results only
**Actual:** Same groups appear multiple times

**Browser:** Chrome 121.0
**Console Error:** [paste error here]
```

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Clear description** of the enhancement
- **Use case** - why would this be useful?
- **Mockups/examples** if applicable
- **Alternative solutions** you've considered

### 🔧 Pull Requests

1. **Fork the repository**
2. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add: feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

## 📝 Coding Standards

### JavaScript

- Use **ES6+ syntax**
- **Descriptive variable names** (no single letters except loops)
- **Comments** for complex logic
- **Async/await** over promises when possible
- **Error handling** with try-catch blocks

**Good:**
```javascript
async function fetchUserStatistics() {
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch user statistics:', error);
        return null;
    }
}
```

**Bad:**
```javascript
function getUsr() {
    fetch(api+'/api/users').then(r=>r.json()).then(d=>{return d})
}
```

### CSS

- Use **CSS variables** for colors
- **Mobile-first** responsive design
- **Consistent naming** (kebab-case)
- **Comments** for complex layouts
- **Avoid !important** unless absolutely necessary

**Good:**
```css
/* User info container */
.user-info {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--surface-color);
}
```

### HTML

- **Semantic HTML5** elements
- **Accessibility** attributes (aria-label, alt text)
- **Proper indentation** (2 spaces)
- **Close all tags** properly

## 🧪 Testing

Before submitting a PR, test:

1. **All features work** as expected
2. **Responsive design** on mobile/tablet/desktop
3. **Browser compatibility** (Chrome, Firefox, Safari, Edge)
4. **Telegram Mini App** integration
5. **No console errors**
6. **Search functionality** with various queries
7. **API endpoint** responses

### Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] All statistics update correctly
- [ ] Search returns valid results
- [ ] Pagination works (Load More button)
- [ ] Telegram user detection works
- [ ] Premium badge shows for premium users
- [ ] Responsive on mobile devices
- [ ] No duplicate results in search
- [ ] Caching works (second search is faster)
- [ ] Error handling shows user-friendly messages

## 📁 Project Structure

```
github_upload/
├── index.html          # Main page structure
├── dashboard.js        # All JavaScript logic
├── dashboard.css       # All styles
├── config.js          # Configuration
├── README.md          # Documentation
├── LICENSE            # MIT License
├── CONTRIBUTING.md    # This file
└── .gitignore         # Git ignore rules
```

## 🎨 Design Guidelines

### Colors

Use CSS variables from `:root`:
- `--primary`: Main brand color
- `--success`: Positive actions/status
- `--warning`: Warnings/alerts
- `--danger`: Errors/critical status
- `--premium`: Premium features

### Typography

- **Headings**: Clear hierarchy (h1 > h2 > h3)
- **Body text**: Readable size (16px minimum)
- **Code**: Monospace font

### Spacing

- Use consistent spacing variables
- Maintain visual rhythm
- Adequate padding/margins

## 🔄 Git Commit Messages

Follow this format:

```
Type: Short description

Detailed explanation if needed

Fixes #issue_number
```

**Types:**
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Improve existing feature
- `Remove:` Delete feature/code
- `Refactor:` Code restructuring
- `Docs:` Documentation only
- `Style:` CSS/UI changes
- `Test:` Adding tests

**Examples:**
```bash
Add: Premium user badge in header

Display animated gold badge for Telegram Premium users
when they open the mini app. Badge includes star icon
and shimmer animation.

Fixes #42
```

```bash
Fix: Duplicate results in search

Implement link normalization to detect and remove
duplicate Telegram group links across different
search engines.

Fixes #38
```

## 🚀 Feature Development Workflow

1. **Check existing issues** - Avoid duplicate work
2. **Open an issue** first (for large features)
3. **Discuss approach** in the issue
4. **Get approval** before starting work
5. **Create PR** when ready
6. **Address review comments**
7. **Merge** after approval

## 📋 Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on mobile
- [ ] Tested as Telegram Mini App
- [ ] No console errors

## Screenshots
[If applicable]

## Related Issues
Fixes #issue_number
```

## 🎯 Priority Areas

We especially welcome contributions in:

1. **🌍 Internationalization** - Multi-language support
2. **🎨 Themes** - Dark/light mode, custom themes
3. **📊 Analytics** - Advanced statistics and charts
4. **♿ Accessibility** - Screen reader support, keyboard navigation
5. **⚡ Performance** - Optimization, faster loading
6. **🔐 Security** - Input validation, XSS prevention
7. **📱 Mobile** - Better mobile experience
8. **🧪 Tests** - Unit and integration tests

## ❓ Questions?

- **Open an issue** with the `question` label
- **Start a discussion** in GitHub Discussions
- **Contact maintainers** (check README for contact info)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience, education
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments, personal or political attacks
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in commit history

Thank you for contributing! 🙌

---

**Happy Coding!** 🚀
