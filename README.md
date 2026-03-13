# Productivity Dashboard

A clean, minimal client-side productivity web application that helps you manage your time and tasks. Built with vanilla HTML, CSS, and JavaScript—no frameworks, no backend, no build process required.

## Features

### Core Features

- **Time-Based Greeting** - Dynamic greeting that changes based on the time of day (morning, afternoon, evening, night) with live clock and date display
- **Pomodoro Timer** - 25-minute focus timer with start, stop, and reset controls. Includes visual and browser notifications when complete
- **To-Do List** - Full task management with add, edit, toggle completion, and delete operations. Tasks persist across sessions
- **Quick Links** - Save and access your favorite websites with one click. Includes URL validation and opens links in new tabs

### Optional Features

- **Light/Dark Theme** - Toggle between light and dark modes with smooth transitions. Theme preference persists across sessions
- **Custom Name** - Personalize your greeting by adding your name (e.g., "Good morning, Alex")
- **Duplicate Prevention** - Prevents adding duplicate tasks with case-insensitive matching and helpful warnings

### Technical Highlights

- **Zero Dependencies** - Pure vanilla JavaScript, no frameworks or libraries
- **No Build Process** - Open `index.html` and start using immediately
- **Local Storage** - All data persists in your browser using Local Storage API
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Accessible** - Keyboard navigation support and WCAG AA color contrast compliance
- **Cross-Tab Sync** - Changes sync automatically across multiple browser tabs

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- No installation or setup required!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/productivity-dashboard.git
   cd productivity-dashboard
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local development server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     ```

3. **Start being productive!**
   - No configuration needed—the app works immediately

## Usage Guide

### Setting Up Your Dashboard

1. **Personalize Your Greeting**
   - Enter your name in the input field at the top
   - Click "Save" to see your personalized greeting

2. **Add Tasks**
   - Type your task in the "Add a new task..." input field
   - Press Enter or click "Add Task"
   - Click the checkbox to mark tasks as complete
   - Click the task text to edit it inline
   - Click the delete button (×) to remove tasks

3. **Add Quick Links**
   - Enter a name for your link (e.g., "GitHub")
   - Enter the URL (https:// is added automatically if missing)
   - Click "Add Link"
   - Click any link button to open it in a new tab
   - Hover over a link and click the × to delete it

4. **Use the Focus Timer**
   - Click "Start" to begin a 25-minute focus session
   - Click "Stop" to pause the timer
   - Click "Reset" to return to 25:00
   - You'll receive a notification when the timer completes

5. **Toggle Theme**
   - Click the moon/sun icon (🌙/☀️) in the top-right corner
   - Your theme preference is saved automatically

## Project Structure

```
productivity-dashboard/
├── index.html          # Main HTML structure
├── css/
│   └── style.css      # All styles (base + themes)
├── js/
│   └── script.js      # All JavaScript logic
└── README.md          # This file
```

### Architecture

The application follows a modular design pattern with separate manager modules:

- **StorageManager** - Handles all localStorage operations with error handling
- **GreetingManager** - Time-based greetings, clock, and date display
- **TaskManager** - To-do list with CRUD operations and inline editing
- **LinksManager** - Quick access links with URL validation
- **ThemeManager** - Light/dark theme toggle with persistence
- **TimerManager** - Pomodoro-style focus timer with notifications

All data is stored in localStorage with these keys:
- `pd_tasks` - Array of task objects
- `pd_links` - Array of link objects
- `pd_settings` - Object containing theme, userName, and timerDuration

## Browser Compatibility

Tested and working in:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## Data Privacy

All your data stays in your browser. This application:
- Does not send any data to external servers
- Does not use cookies or tracking
- Does not require an account or login
- Stores everything locally using the browser's Local Storage API

## Development

### Code Quality

- Clean, readable, well-commented code
- Modular architecture with separation of concerns
- Comprehensive error handling
- No memory leaks (intervals and listeners properly cleaned up)

### Testing

The project includes comprehensive test files for all features:
- Greeting and clock functionality
- Timer accuracy and controls
- Task CRUD operations
- Links management
- Theme toggle
- Storage operations
- Accessibility compliance

## Deployment

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select the main branch and root folder
4. Save and wait for deployment
5. Access your dashboard at `https://yourusername.github.io/productivity-dashboard/`

## Keyboard Shortcuts

- **Tab** - Navigate between interactive elements
- **Enter** - Submit forms (add task, add link, save name)
- **Escape** - Cancel task editing

## Accessibility

This application is built with accessibility in mind:
- Semantic HTML structure
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus indicators on all interactive elements
- WCAG AA compliant color contrast ratios
- Screen reader friendly

## License

This project is open source and available under the MIT License.

## Acknowledgments

Built as a demonstration of clean, vanilla JavaScript development without frameworks or build tools. Perfect for learning web development fundamentals or as a starting point for your own productivity tools.

---

**Made with ❤️ using vanilla HTML, CSS, and JavaScript**
