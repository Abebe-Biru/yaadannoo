# Yaadannoo - Progressive Web App 📱✨

A beautiful, emoji-powered note-taking Progressive Web App that works offline. Organize your thoughts with tags, emojis, and rich text editing.

## 🚀 Features

### Core Note-Taking
- ✏️ Rich text editing with formatting tools
- 🏷️ Tag system (Idea, Task, Meeting, Personal)
- 😀 Emoji picker and automatic emoji extraction
- 🔍 Real-time search across all notes
- 💾 Automatic local storage with IndexedDB

### Progressive Web App Features
- 📱 **Installable**: Can be installed on desktop and mobile devices
- 🌐 **Offline Support**: Works without internet connection
- ⚡ **Fast Loading**: Service worker caching for instant startup
- 🎨 **Native Feel**: Looks and feels like a native app
- 🔄 **Auto-Updates**: Automatic updates when new versions are available
- 🌓 **Multi-Theme**: Light, Dark, and Forest themes

## 🛠️ Setup

### Quick Start
1. Clone or download this repository
2. Start a local HTTP server:
   ```bash
   python -m http.server 3000
   # or
   npx serve .
   # or
   php -S localhost:3000
   ```
3. Open `http://localhost:3000` in your browser
4. The app will automatically register the service worker

### Generate App Icons
To complete the PWA setup, you need to generate the app icons:

1. Open `generate-icons.html` in your browser
2. Download all the generated PNG icons
3. Place them in the `icons/` folder with the correct names:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

## 📱 Installation

### Desktop (Chrome, Edge, Opera)
1. Visit the app in your browser
2. Look for the install prompt banner at the top
3. Click "Install App" or use the browser's install button
4. The app will be added to your desktop and app menu

### Mobile (Chrome, Safari, Samsung Internet)
1. Open the app in your mobile browser
2. Use "Add to Home Screen" from the browser menu
3. The app will appear on your home screen like a native app

### Manual Installation
If the automatic prompt doesn't appear:
- **Chrome/Edge**: Click the install icon in the address bar
- **Safari**: Share → Add to Home Screen
- **Firefox**: Page Actions → Install

## 🎨 Themes

Yaadannoo includes three beautiful themes:
- **Light**: Clean, minimal design perfect for daily use
- **Dark**: Easy on the eyes for low-light environments
- **Forest**: Nature-inspired green palette for a calming experience

Click the theme toggle button (sun/moon/tree icon) to cycle through themes.

## 📱 PWA Features

### Offline Support
- All your notes are stored locally using IndexedDB
- The app works completely offline after the first visit
- Service worker caches all necessary files

### Installation Benefits
- **Faster startup**: Instant loading from your device
- **Native integration**: Appears in app lists and taskbar
- **Notifications**: (Future feature) Get notified about updates
- **Standalone mode**: Runs without browser UI

### Automatic Updates
- The app checks for updates automatically
- You'll be notified when new features are available
- Updates happen seamlessly in the background

## 🔧 Technical Details

### Files Structure
```
├── index.html          # Main app interface
├── script.js           # App logic and PWA functionality
├── style.css           # Responsive design and themes
├── sw.js               # Service worker for offline support
├── manifest.json       # PWA manifest with app metadata
├── browserconfig.xml   # Windows tile configuration
├── favicon.ico         # Browser favicon
├── generate-icons.html # Icon generator tool
└── icons/              # App icons (to be generated)
    ├── icon-72x72.png
    ├── icon-96x96.png
    └── ... (all sizes)
```

### Browser Support
- ✅ Chrome 67+
- ✅ Firefox 58+
- ✅ Safari 11.1+
- ✅ Edge 17+
- ✅ Samsung Internet 7.2+

### PWA Checklist
- ✅ HTTPS served (or localhost for development)
- ✅ Web app manifest with required fields
- ✅ Service worker for offline functionality
- ✅ Responsive design for all screen sizes
- ✅ Fast loading performance
- ✅ Cross-browser compatibility

## 🚀 Development

### Local Development
```bash
# Start development server
python -m http.server 3000

# Open in browser
open http://localhost:3000
```

### Testing PWA Features
1. Open Chrome DevTools
2. Go to "Application" tab
3. Check "Service Workers" and "Manifest" sections
4. Use "Lighthouse" for PWA audit

## 🎯 Usage Tips

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save current note
- `Escape`: Close note editor
- Click note cards to edit
- Use emoji picker for visual organization

### Best Practices
- Use descriptive titles for easier searching
- Add emojis to make notes visually distinct
- Use tags to organize notes by category
- Regular use will trigger install prompts

## 🔮 Future Enhancements

- 🔄 Cloud sync across devices
- 🔔 Push notifications for reminders
- 📤 Export notes to various formats
- 🗂️ Advanced tagging and folders
- 🔒 Note encryption for privacy
- 🎙️ Voice notes support

---

**Yaadannoo** - Your thoughts, beautifully organized ✨ 
