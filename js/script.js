/**
 * Productivity Dashboard - Main JavaScript
 * A client-side productivity application with timer, tasks, and quick links
 * 
 * Architecture:
 * This application follows a modular design pattern with separate manager modules
 * for each feature area. All modules are initialized on DOMContentLoaded.
 * 
 * Modules:
 * - StorageManager: Handles all localStorage operations with error handling
 * - GreetingManager: Time-based greetings, clock, and date display
 * - TaskManager: To-do list with CRUD operations and inline editing
 * - LinksManager: Quick access links with URL validation
 * - ThemeManager: Light/dark theme toggle with persistence
 * - TimerManager: Pomodoro-style focus timer with notifications
 * 
 * Data Persistence:
 * All user data is stored in localStorage with the following keys:
 * - pd_tasks: Array of task objects
 * - pd_links: Array of link objects
 * - pd_settings: Object containing theme, userName, and timerDuration
 * 
 * Cross-Tab Synchronization:
 * The application listens for storage events to sync data across multiple tabs.
 */

// ============================================================================
// Storage Manager Module
// ============================================================================

/**
 * StorageManager - Abstraction layer for Local Storage operations
 * 
 * Responsibilities:
 * - Provides a consistent interface for localStorage operations
 * - Handles JSON serialization/deserialization automatically
 * - Implements error handling and logging for storage failures
 * - Manages quota exceeded errors gracefully
 * - Supports bulk operations (getAll, clear)
 * 
 * All methods return appropriate values or booleans to indicate success/failure,
 * allowing calling code to handle errors appropriately.
 */
const StorageManager = {
  /**
   * Get a value from Local Storage
   * @param {string} key - The storage key
   * @returns {*} Parsed value or null if not found or error occurs
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`StorageManager.get error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set a value in Local Storage
   * @param {string} key - The storage key
   * @param {*} value - The value to store (will be JSON serialized)
   * @returns {boolean} True if successful, false otherwise
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`StorageManager.set error for key "${key}":`, error);
      // Handle quota exceeded error specifically with helpful message
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('Local Storage quota exceeded. Please clear old data or use less storage.');
      }
      return false;
    }
  },

  /**
   * Remove a value from Local Storage
   * @param {string} key - The storage key
   * @returns {boolean} True if successful, false otherwise
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`StorageManager.remove error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all items from Local Storage
   * @returns {boolean} True if successful, false otherwise
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('StorageManager.clear error:', error);
      return false;
    }
  },

  /**
   * Get all stored data as an object
   * @returns {Object} Object with all key-value pairs from Local Storage
   */
  getAll() {
    try {
      const allData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allData[key] = this.get(key);
        }
      }
      return allData;
    } catch (error) {
      console.error('StorageManager.getAll error:', error);
      return {};
    }
  }
};


// ============================================================================
// Greeting Manager Module
// ============================================================================

/**
 * GreetingManager - Manages time-based greeting, clock, and date display
 * 
 * Responsibilities:
 * - Displays time-appropriate greetings (morning, afternoon, evening, night)
 * - Maintains real-time clock display with 12-hour format
 * - Shows current date in long format (e.g., "Monday, January 1, 2024")
 * - Supports custom name personalization for greetings
 * - Persists user name preference in localStorage
 * - Updates all displays every second via interval
 * 
 * The greeting changes based on time of day:
 * - Morning: 5:00 AM - 11:59 AM
 * - Afternoon: 12:00 PM - 4:59 PM
 * - Evening: 5:00 PM - 8:59 PM
 * - Night: 9:00 PM - 4:59 AM
 */
const GreetingManager = {
  clockInterval: null,
  userName: null,

  /**
   * Initialize the greeting manager
   * Loads custom name from storage and starts clock updates
   */
  init() {
    // Load custom name from storage if previously set
    const settings = StorageManager.get('pd_settings') || {};
    this.userName = settings.userName || null;

    // Perform initial updates to display current time/date/greeting
    this.updateGreeting();
    this.updateClock();
    this.updateDate();

    // Start clock interval (update every second for real-time display)
    // Updates all three elements to keep them in sync
    this.clockInterval = setInterval(() => {
      this.updateClock();
      this.updateDate();
      this.updateGreeting(); // Update greeting in case time period changed (e.g., midnight)
    }, 1000);
  },

  /**
   * Update the greeting message based on current time
   * Time ranges:
   * - Morning: 5:00 AM - 11:59 AM
   * - Afternoon: 12:00 PM - 4:59 PM
   * - Evening: 5:00 PM - 8:59 PM
   * - Night: 9:00 PM - 4:59 AM
   */
  updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good evening';
    } else {
      greeting = 'Good night';
    }

    // Add custom name if set
    if (this.userName) {
      greeting += `, ${this.userName}`;
    }

    const greetingElement = document.getElementById('greeting-text');
    if (greetingElement) {
      greetingElement.textContent = greeting;
    }
  },

  /**
   * Update the clock display with current time
   * Formats time in 12-hour format with AM/PM
   */
  updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Determine AM/PM based on 24-hour time
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format (0-23 -> 1-12)
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0) as 12

    // Pad minutes and seconds with leading zeros for consistent display
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    const timeString = `${hours}:${minutesStr}:${secondsStr} ${ampm}`;

    const clockElement = document.getElementById('clock');
    if (clockElement) {
      clockElement.textContent = timeString;
    }
  },

  /**
   * Update the date display with current date
   * Formats date as "Day, Month Date, Year" (e.g., "Monday, January 1, 2024")
   */
  updateDate() {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const dateString = now.toLocaleDateString('en-US', options);

    const dateElement = document.getElementById('date');
    if (dateElement) {
      dateElement.textContent = dateString;
    }
  },

  /**
   * Set a custom name for personalized greeting
   * @param {string} name - The user's name
   * @returns {boolean} True if successful, false otherwise
   */
  setCustomName(name) {
    try {
      // Trim and validate name
      const trimmedName = name ? name.trim() : '';
      
      // Get existing settings or create new object
      const settings = StorageManager.get('pd_settings') || {};
      
      // Update name (empty string removes the name)
      if (trimmedName) {
        settings.userName = trimmedName;
        this.userName = trimmedName;
      } else {
        delete settings.userName;
        this.userName = null;
      }
      
      // Save to storage
      const success = StorageManager.set('pd_settings', settings);
      
      // Update greeting display
      if (success) {
        this.updateGreeting();
      }
      
      return success;
    } catch (error) {
      console.error('GreetingManager.setCustomName error:', error);
      return false;
    }
  },

  /**
   * Get the current custom name
   * @returns {string|null} The custom name or null if not set
   */
  getCustomName() {
    return this.userName;
  }
};


// ============================================================================
// Task Manager Module
// ============================================================================

/**
 * TaskManager - Manages to-do list with CRUD operations
 * 
 * Responsibilities:
 * - Provides full CRUD operations for tasks (Create, Read, Update, Delete)
 * - Persists tasks to localStorage for data retention
 * - Validates task input (length limits, empty checks)
 * - Detects and prevents duplicate tasks (case-insensitive)
 * - Supports inline editing of task text
 * - Manages task completion status with visual feedback
 * - Renders task list dynamically with proper event handlers
 * - Displays user-friendly error messages with auto-dismiss
 * 
 * Task Structure:
 * - id: Unique identifier (timestamp + random string)
 * - text: Task description (max 500 characters)
 * - completed: Boolean completion status
 * - createdAt: Timestamp of creation
 */
const TaskManager = {
  tasks: [],
  editingTaskId: null,

  /**
   * Initialize the task manager
   * Loads tasks from storage and renders the list
   */
  init() {
    // Load tasks from Local Storage
    const storedTasks = StorageManager.get('pd_tasks');
    
    // Validate and use stored tasks - filter out corrupted data
    if (Array.isArray(storedTasks)) {
      // Filter out any invalid tasks to prevent runtime errors
      // Valid task must have: id (string), text (string), completed (boolean)
      this.tasks = storedTasks.filter(task => 
        task && 
        typeof task.id === 'string' && 
        typeof task.text === 'string' &&
        typeof task.completed === 'boolean'
      );
    } else {
      this.tasks = [];
    }

    // Render initial task list
    this.render();

    // Set up event listeners for add button and input field
    this.setupEventListeners();
  },

  /**
   * Get all tasks
   * @returns {Array} Array of task objects
   */
  getTasks() {
    return this.tasks;
  },

  /**
   * Add a new task
   * @param {string} text - The task description
   * @returns {Object|null} The created task object or null if validation fails
   */
  addTask(text) {
    // Validate input - trim whitespace and check for empty string
    const trimmedText = text ? text.trim() : '';
    
    if (!trimmedText) {
      this.showError('Task cannot be empty');
      return null;
    }

    // Enforce maximum length to prevent storage issues
    if (trimmedText.length > 500) {
      this.showError('Task is too long (max 500 characters)');
      return null;
    }

    // Check for duplicates to maintain unique task list
    if (this.isDuplicate(trimmedText)) {
      this.showError('This task already exists');
      return null;
    }

    // Generate unique ID using timestamp + random string for collision avoidance
    const id = Date.now() + '-' + Math.random().toString(36).substring(2, 11);

    // Create task object with all required properties
    const task = {
      id: id,
      text: trimmedText,
      completed: false,
      createdAt: Date.now()
    };

    // Add to tasks array
    this.tasks.push(task);

    // Persist to localStorage
    this.saveTasks();

    // Update UI with new task
    this.render();

    // Clear input field and refocus for next task entry
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
      taskInput.value = '';
      taskInput.focus();
    }

    // Clear any error messages
    this.clearError();

    return task;
  },

  /**
   * Check if a task with the same text already exists (case-insensitive)
   * @param {string} text - The task text to check
   * @returns {boolean} True if duplicate exists, false otherwise
   */
  isDuplicate(text) {
    const normalized = text.trim().toLowerCase();
    return this.tasks.some(task => 
      task.text.trim().toLowerCase() === normalized
    );
  },

  /**
   * Toggle task completion status
   * @param {string} id - The task ID
   * @returns {boolean} True if successful, false otherwise
   */
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    
    if (!task) {
      console.error('Task not found:', id);
      return false;
    }

    // Toggle completed property
    task.completed = !task.completed;

    // Save to Local Storage
    this.saveTasks();

    // Re-render task list
    this.render();
    
    // Announce to screen readers
    this.announceToScreenReader(`Task "${task.text}" marked as ${task.completed ? 'complete' : 'incomplete'}`);

    return true;
  },

  /**
   * Edit a task's text
   * @param {string} id - The task ID
   * @param {string} newText - The new task text
   * @returns {boolean} True if successful, false otherwise
   */
  editTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    
    if (!task) {
      console.error('Task not found:', id);
      return false;
    }

    // Validate new text
    const trimmedText = newText ? newText.trim() : '';
    
    if (!trimmedText) {
      this.showError('Task cannot be empty');
      return false;
    }

    if (trimmedText.length > 500) {
      this.showError('Task is too long (max 500 characters)');
      return false;
    }

    // Check if text actually changed
    if (task.text === trimmedText) {
      return true; // No change needed
    }

    // Check for duplicates (excluding current task)
    const normalized = trimmedText.toLowerCase();
    const isDuplicate = this.tasks.some(t => 
      t.id !== id && t.text.trim().toLowerCase() === normalized
    );

    if (isDuplicate) {
      this.showError('This task already exists');
      return false;
    }

    // Update task text
    task.text = trimmedText;

    // Save to Local Storage
    this.saveTasks();

    // Re-render task list
    this.render();

    // Clear any error messages
    this.clearError();

    return true;
  },

  /**
   * Delete a task
   * @param {string} id - The task ID
   * @returns {boolean} True if successful, false otherwise
   */
  deleteTask(id) {
    const task = this.tasks.find(t => t.id === id);
    const index = this.tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.error('Task not found:', id);
      return false;
    }

    // Store task text for announcement
    const taskText = task.text;

    // Remove from tasks array
    this.tasks.splice(index, 1);

    // Save to Local Storage
    this.saveTasks();

    // Re-render task list
    this.render();
    
    // Announce to screen readers
    this.announceToScreenReader(`Task "${taskText}" deleted`);

    return true;
  },

  /**
   * Save tasks to Local Storage
   * @returns {boolean} True if successful, false otherwise
   */
  saveTasks() {
    return StorageManager.set('pd_tasks', this.tasks);
  },

  /**
   * Render the task list
   * Updates the DOM with current tasks
   */
  render() {
    const taskList = document.getElementById('task-list');
    
    if (!taskList) {
      console.error('Task list element not found');
      return;
    }

    // Clear existing tasks
    taskList.innerHTML = '';

    // If no tasks, show empty state
    if (this.tasks.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.className = 'task-empty';
      emptyMessage.textContent = 'No tasks yet. Add one above!';
      taskList.appendChild(emptyMessage);
      return;
    }

    // Use DocumentFragment for batch DOM insertion to minimize reflows
    const fragment = document.createDocumentFragment();
    this.tasks.forEach(task => {
      const taskItem = this.createTaskElement(task);
      fragment.appendChild(taskItem);
    });
    taskList.appendChild(fragment);
  },

  /**
   * Create a task DOM element
   * @param {Object} task - The task object
   * @returns {HTMLElement} The task list item element
   */
  createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.taskId = task.id;
    
    if (task.completed) {
      li.classList.add('completed');
    }

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.id = `task-checkbox-${task.id}`;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    
    // Checkbox event listener
    checkbox.addEventListener('change', () => {
      this.toggleTask(task.id);
    });

    // Create task text element
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    taskText.setAttribute('role', 'button');
    taskText.setAttribute('tabindex', '0');
    taskText.setAttribute('aria-label', `Edit task: ${task.text}`);
    
    // Make task text clickable for editing
    taskText.addEventListener('click', () => {
      this.enterEditMode(task.id, taskText);
    });
    
    // Make task text keyboard accessible
    taskText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.enterEditMode(task.id, taskText);
      }
    });

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    
    // Delete button event listener
    deleteBtn.addEventListener('click', () => {
      this.deleteTask(task.id);
    });

    // Assemble task item
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(deleteBtn);

    return li;
  },

  /**
   * Enter edit mode for a task
   * Replaces task text with an input field for inline editing
   * 
   * @param {string} taskId - The task ID
   * @param {HTMLElement} textElement - The text span element to replace
   */
  enterEditMode(taskId, textElement) {
    // Prevent multiple simultaneous edits to avoid state conflicts
    if (this.editingTaskId) {
      return;
    }

    this.editingTaskId = taskId;
    const task = this.tasks.find(t => t.id === taskId);
    
    if (!task) {
      return;
    }

    // Create input field for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    input.maxLength = 500;
    input.setAttribute('aria-label', `Edit task: ${task.text}`);

    // Replace text span with input field
    textElement.replaceWith(input);
    input.focus();
    input.select(); // Select all text for easy replacement

    // Track whether we've already handled the edit to prevent double-firing
    // (e.g., Enter key triggers blur after keydown handler runs)
    let editHandled = false;

    // Save edit handler - called on blur or Enter key
    const saveEdit = () => {
      if (editHandled) return;
      editHandled = true;

      const newText = input.value;
      const success = this.editTask(taskId, newText);

      if (success) {
        // Clear editing state; render() was already called by editTask
        this.editingTaskId = null;
      } else {
        // Validation failed — allow user to correct the input
        editHandled = false;
        input.focus();
      }
    };

    // Cancel edit handler - restores original text without saving
    const cancelEdit = () => {
      if (editHandled) return;
      editHandled = true;
      this.editingTaskId = null;
      this.render();
    };

    // Keyboard shortcuts for edit mode
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });

    // Save when input loses focus (blur fires after keydown, guard prevents double-save)
    input.addEventListener('blur', saveEdit);
  },

  /**
   * Set up event listeners for task input
   */
  setupEventListeners() {
    const taskInput = document.getElementById('task-input');
    const taskAddBtn = document.getElementById('task-add');

    if (taskAddBtn) {
      taskAddBtn.addEventListener('click', () => {
        const text = taskInput ? taskInput.value : '';
        this.addTask(text);
      });
    }

    if (taskInput) {
      // Add task on Enter key
      taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addTask(taskInput.value);
        }
      });

      // Clear error on input
      taskInput.addEventListener('input', () => {
        this.clearError();
      });
    }
  },

  /**
   * Show error message and highlight input with error color
   * @param {string} message - The error message to display
   */
  showError(message) {
    const errorElement = document.getElementById('task-error');
    const taskInput = document.getElementById('task-input');

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';

      // Auto-hide after 3 seconds
      if (this._errorTimeout) {
        clearTimeout(this._errorTimeout);
      }
      this._errorTimeout = setTimeout(() => {
        this.clearError();
      }, 3000);
    }

    // Highlight input with error color
    if (taskInput) {
      taskInput.classList.add('input-error');
    }
  },

  /**
   * Clear error message and remove input error highlight
   */
  clearError() {
    const errorElement = document.getElementById('task-error');
    const taskInput = document.getElementById('task-input');

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }

    // Remove error highlight from input
    if (taskInput) {
      taskInput.classList.remove('input-error');
    }

    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
      this._errorTimeout = null;
    }
  },

  /**
   * Announce message to screen readers using ARIA live region
   * @param {string} message - The message to announce
   */
  announceToScreenReader(message) {
    const errorElement = document.getElementById('task-error');
    
    if (errorElement) {
      // Temporarily use the error element as a live region for announcements
      const originalDisplay = errorElement.style.display;
      const originalText = errorElement.textContent;
      
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.style.color = 'var(--text-primary)'; // Use normal text color for non-error announcements
      
      // Clear after 2 seconds
      setTimeout(() => {
        errorElement.textContent = originalText;
        errorElement.style.display = originalDisplay;
        errorElement.style.color = 'var(--danger-color)'; // Reset to error color
      }, 2000);
    }
  }
};


// ============================================================================
// Links Manager Module
// ============================================================================

/**
 * LinksManager - Manages quick links with URL validation
 * 
 * Responsibilities:
 * - Manages a collection of quick access links
 * - Validates and normalizes URLs (auto-adds https:// protocol)
 * - Persists links to localStorage
 * - Opens links in new tabs with security attributes (noopener, noreferrer)
 * - Validates link names (max 50 characters)
 * - Renders link buttons dynamically with delete functionality
 * - Displays user-friendly error messages
 * 
 * Link Structure:
 * - id: Unique identifier (timestamp + random string)
 * - name: Display name for the link (max 50 characters)
 * - url: Validated URL with protocol
 */
const LinksManager = {
  links: [],

  /**
   * Initialize the links manager
   * Loads links from storage and renders the list
   */
  init() {
    // Load links from Local Storage
    const storedLinks = StorageManager.get('pd_links');
    
    // Validate and use stored links - filter out corrupted data
    if (Array.isArray(storedLinks)) {
      // Filter out any invalid links to prevent runtime errors
      // Valid link must have: id (string), name (string), url (string)
      this.links = storedLinks.filter(link => 
        link && 
        typeof link.id === 'string' && 
        typeof link.name === 'string' &&
        typeof link.url === 'string'
      );
    } else {
      this.links = [];
    }

    // Render initial link list
    this.render();

    // Set up event listeners for add button and input fields
    this.setupEventListeners();
  },

  /**
   * Get all links
   * @returns {Array} Array of link objects
   */
  getLinks() {
    return this.links;
  },

  /**
   * Validate and normalize URL
   * Ensures URL has proper protocol and basic structure
   * 
   * @param {string} url - The URL to validate
   * @returns {string|null} Validated URL with protocol or null if invalid
   */
  validateURL(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    let trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      return null;
    }

    // Auto-prepend https:// if no protocol specified for user convenience
    // This allows users to enter "google.com" instead of "https://google.com"
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = 'https://' + trimmedUrl;
    }

    // Basic URL validation regex
    // Requires: protocol (http/https) + domain + TLD (e.g., https://example.com)
    const urlPattern = /^https?:\/\/.+\..+/;
    
    if (urlPattern.test(trimmedUrl)) {
      return trimmedUrl;
    }

    return null;
  },

  /**
   * Add a new link
   * @param {string} name - The link display name
   * @param {string} url - The link URL
   * @returns {Object|null} The created link object or null if validation fails
   */
  addLink(name, url) {
    // Validate name
    const trimmedName = name ? name.trim() : '';
    
    if (!trimmedName) {
      this.showError('Link name cannot be empty');
      return null;
    }

    if (trimmedName.length > 50) {
      this.showError('Link name is too long (max 50 characters)');
      return null;
    }

    // Validate and normalize URL
    const validatedUrl = this.validateURL(url);
    
    if (!validatedUrl) {
      this.showError('Invalid URL format. Example: https://example.com');
      return null;
    }

    // Generate unique ID
    const id = Date.now() + '-' + Math.random().toString(36).substring(2, 11);

    // Create link object
    const link = {
      id: id,
      name: trimmedName,
      url: validatedUrl
    };

    // Add to links array
    this.links.push(link);

    // Save to Local Storage
    this.saveLinks();

    // Re-render link list
    this.render();

    // Clear input fields
    const nameInput = document.getElementById('link-name');
    const urlInput = document.getElementById('link-url');
    
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
    }
    
    if (urlInput) {
      urlInput.value = '';
    }

    // Clear any error messages
    this.clearError();

    return link;
  },

  /**
   * Delete a link
   * @param {string} id - The link ID
   * @returns {boolean} True if successful, false otherwise
   */
  deleteLink(id) {
    const index = this.links.findIndex(l => l.id === id);
    
    if (index === -1) {
      console.error('Link not found:', id);
      return false;
    }

    // Remove from links array
    this.links.splice(index, 1);

    // Save to Local Storage
    this.saveLinks();

    // Re-render link list
    this.render();

    return true;
  },

  /**
   * Save links to Local Storage
   * @returns {boolean} True if successful, false otherwise
   */
  saveLinks() {
    return StorageManager.set('pd_links', this.links);
  },

  /**
   * Render the link buttons
   * Updates the DOM with current links
   */
  render() {
    const linkContainer = document.getElementById('link-buttons');
    
    if (!linkContainer) {
      console.error('Link buttons container not found');
      return;
    }

    // Clear existing links
    linkContainer.innerHTML = '';

    // If no links, show empty state
    if (this.links.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'link-empty';
      emptyMessage.textContent = 'No quick links yet. Add one above!';
      linkContainer.appendChild(emptyMessage);
      return;
    }

    // Create link buttons
    this.links.forEach(link => {
      const linkWrapper = this.createLinkElement(link);
      linkContainer.appendChild(linkWrapper);
    });
  },

  /**
   * Create a link DOM element
   * @param {Object} link - The link object
   * @returns {HTMLElement} The link wrapper element
   */
  createLinkElement(link) {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-item';
    wrapper.dataset.linkId = link.id;
    wrapper.setAttribute('role', 'listitem');

    // Create link button that opens URL in new tab
    const linkBtn = document.createElement('button');
    linkBtn.className = 'link-button';
    linkBtn.textContent = link.name;
    linkBtn.setAttribute('aria-label', `Open ${link.name}`);
    
    // Link button event listener - open in new tab with security attributes
    // noopener: prevents new page from accessing window.opener
    // noreferrer: prevents referrer information from being passed
    linkBtn.addEventListener('click', () => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', `Delete ${link.name} link`);
    
    // Delete button event listener
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering link button click
      this.deleteLink(link.id);
    });

    // Assemble link item
    wrapper.appendChild(linkBtn);
    wrapper.appendChild(deleteBtn);

    return wrapper;
  },

  /**
   * Set up event listeners for link inputs
   */
  setupEventListeners() {
    const nameInput = document.getElementById('link-name');
    const urlInput = document.getElementById('link-url');
    const addBtn = document.getElementById('link-add');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = nameInput ? nameInput.value : '';
        const url = urlInput ? urlInput.value : '';
        this.addLink(name, url);
      });
    }

    if (nameInput) {
      // Add link on Enter key in name input
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const name = nameInput.value;
          const url = urlInput ? urlInput.value : '';
          this.addLink(name, url);
        }
      });

      // Clear error on input
      nameInput.addEventListener('input', () => {
        this.clearError();
      });
    }

    if (urlInput) {
      // Add link on Enter key in URL input
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const name = nameInput ? nameInput.value : '';
          const url = urlInput.value;
          this.addLink(name, url);
        }
      });

      // Clear error on input
      urlInput.addEventListener('input', () => {
        this.clearError();
      });
    }
  },

  /**
   * Show error message
   * @param {string} message - The error message to display
   */
  showError(message) {
    const errorElement = document.getElementById('link-error');
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        this.clearError();
      }, 3000);
    }
  },

  /**
   * Clear error message
   */
  clearError() {
    const errorElement = document.getElementById('link-error');
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }
};


// ============================================================================
// Theme Manager Module
// ============================================================================

/**
 * ThemeManager - Manages light/dark theme toggle with persistence
 * 
 * Responsibilities:
 * - Manages application theme (light/dark mode)
 * - Persists theme preference to localStorage
 * - Applies theme via data-theme attribute on document root
 * - Updates toggle button icon based on current theme
 * - Initializes with saved theme to prevent flash of wrong theme
 * 
 * Theme is applied using CSS custom properties that respond to the
 * data-theme attribute on the document root element.
 */
const ThemeManager = {
  currentTheme: 'light',

  /**
   * Initialize the theme manager
   * Loads saved theme from storage and applies it
   */
  init() {
    // Load saved theme from Local Storage
    const settings = StorageManager.get('pd_settings') || {};
    const savedTheme = settings.theme || 'light';
    
    // Apply the saved theme
    this.setTheme(savedTheme);
    
    // Set up theme toggle button event listener
    this.setupEventListeners();
  },

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  /**
   * Set a specific theme
   * @param {string} theme - The theme to set ('light' or 'dark')
   */
  setTheme(theme) {
    // Validate theme
    if (theme !== 'light' && theme !== 'dark') {
      console.error('Invalid theme:', theme);
      return;
    }

    // Update current theme
    this.currentTheme = theme;

    // Set data-theme attribute on document root
    document.documentElement.setAttribute('data-theme', theme);

    // Save theme preference to Local Storage
    const settings = StorageManager.get('pd_settings') || {};
    settings.theme = theme;
    StorageManager.set('pd_settings', settings);

    // Update toggle button icon
    this.updateToggleButton();
  },

  /**
   * Get the current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    return this.currentTheme;
  },

  /**
   * Update the theme toggle button icon based on current theme
   */
  updateToggleButton() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (toggleBtn) {
      // Update icon: moon for light mode (click to go dark), sun for dark mode (click to go light)
      toggleBtn.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
      toggleBtn.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} theme`);
    }
  },

  /**
   * Set up event listeners for theme toggle button
   */
  setupEventListeners() {
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }
  }
};


// ============================================================================
// Application Initialization
// ============================================================================

/**
 * Initialize the application when DOM is ready
 * Sets up all managers in the correct order
 * 
 * Initialization order is important:
 * 1. ThemeManager first to prevent flash of wrong theme
 * 2. Other managers can initialize in any order
 * 3. Global event listeners last
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize theme first to prevent flash of unstyled content (FOUC)
    ThemeManager.init();
    
    // Initialize all feature managers
    GreetingManager.init();
    TimerManager.init();
    TaskManager.init();
    LinksManager.init();
    
    // Set up global event listeners (cross-tab sync, custom name)
    setupGlobalEventListeners();
  } catch (error) {
    console.error('Failed to initialize Productivity Dashboard:', error);
    
    // Show user-friendly error message
    showCriticalError('Failed to initialize the application. Please refresh the page.');
  }
});

/**
 * Set up global event listeners
 * Handles window-level events and cross-cutting concerns
 */
function setupGlobalEventListeners() {
  // Set up custom name event listeners
  setupNameEventListeners();
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Handle storage events for cross-tab synchronization
  // This allows changes in one tab to be reflected in other open tabs
  window.addEventListener('storage', (e) => {
    // Reload data if storage changed in another tab
    if (e.key === 'pd_tasks') {
      // Tasks were modified in another tab, reload task list
      TaskManager.init();
    } else if (e.key === 'pd_links') {
      // Links were modified in another tab, reload link list
      LinksManager.init();
    } else if (e.key === 'pd_settings') {
      // Settings (theme, name) were modified in another tab
      ThemeManager.init();
      GreetingManager.init();
    }
  });
}

/**
 * Set up event listeners for custom name feature
 * Allows users to personalize their greeting
 */
function setupNameEventListeners() {
  const nameInput = document.getElementById('name-input');
  const nameSaveBtn = document.getElementById('name-save');

  if (nameInput && nameSaveBtn) {
    // Load existing name into input field for editing
    const currentName = GreetingManager.getCustomName();
    if (currentName) {
      nameInput.value = currentName;
    }

    // Save name on button click
    nameSaveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      GreetingManager.setCustomName(name);
    });

    // Save name on Enter key for convenience
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const name = nameInput.value.trim();
        GreetingManager.setCustomName(name);
      }
    });
  }
  
  // Set up keyboard help button
  const keyboardHelpBtn = document.getElementById('keyboard-help');
  if (keyboardHelpBtn) {
    keyboardHelpBtn.addEventListener('click', () => {
      showKeyboardShortcutsHelp();
    });
  }
}

/**
 * Set up keyboard shortcuts for improved accessibility
 * Provides quick access to common actions via keyboard
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Allow Escape key to work in input fields
      if (e.key === 'Escape') {
        e.target.blur(); // Remove focus from input
      }
      return;
    }

    // Keyboard shortcuts (using Ctrl/Cmd + key combinations)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + T: Focus task input
    if (modifierKey && e.key === 't') {
      e.preventDefault();
      const taskInput = document.getElementById('task-input');
      if (taskInput) {
        taskInput.focus();
      }
    }

    // Ctrl/Cmd + L: Focus link name input
    if (modifierKey && e.key === 'l') {
      e.preventDefault();
      const linkNameInput = document.getElementById('link-name');
      if (linkNameInput) {
        linkNameInput.focus();
      }
    }

    // Ctrl/Cmd + D: Toggle theme
    if (modifierKey && e.key === 'd') {
      e.preventDefault();
      ThemeManager.toggle();
    }

    // Space: Start/Stop timer (when not in input)
    if (e.key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      if (TimerManager.isRunning) {
        TimerManager.stop();
      } else {
        TimerManager.start();
      }
    }

    // R key: Reset timer (when not in input)
    if (e.key === 'r' && !modifierKey) {
      e.preventDefault();
      TimerManager.reset();
    }

    // Escape: Clear focus from current element
    if (e.key === 'Escape') {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }

    // ? key: Show keyboard shortcuts help
    if (e.key === '?' && !modifierKey) {
      e.preventDefault();
      showKeyboardShortcutsHelp();
    }
  });
}

/**
 * Show keyboard shortcuts help dialog
 * Displays available keyboard shortcuts to the user
 */
function showKeyboardShortcutsHelp() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';
  
  const shortcuts = `
Keyboard Shortcuts:

${modKey} + T: Focus task input
${modKey} + L: Focus link input
${modKey} + D: Toggle dark/light theme
Space: Start/Stop timer
R: Reset timer
Tab: Navigate between elements
Enter: Activate buttons and submit forms
Escape: Cancel editing or clear focus
?: Show this help

All interactive elements are keyboard accessible using Tab and Enter keys.
  `.trim();

  alert(shortcuts);
}

/**
 * Show critical error message to user
 * Used when application fails to initialize
 * 
 * @param {string} message - The error message to display
 */
function showCriticalError(message) {
  // Try to show error in the UI if container exists
  const container = document.querySelector('.container');
  
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'critical-error';
    errorDiv.style.cssText = 'background-color: #f44336; color: white; padding: 1rem; margin: 1rem; border-radius: 4px; text-align: center;';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
  } else {
    // Fallback to alert if container not found (DOM not ready)
    alert(message);
  }
}

// ============================================================================
// Timer Manager Module
// ============================================================================

/**
 * TimerManager - Manages Pomodoro-style focus timer with accurate countdown
 * 
 * Responsibilities:
 * - Manages countdown timer for focus sessions (default 25 minutes)
 * - Uses timestamp-based calculation to prevent time drift
 * - Supports start, stop (pause), and reset operations
 * - Shows browser notifications on completion (with permission)
 * - Maintains accurate time even if tab is backgrounded
 * - Updates display every 100ms for smooth countdown
 * - Manages button states based on timer status
 * - Supports custom duration settings (5-60 minutes)
 * 
 * Timer uses timestamps rather than simple intervals to ensure accuracy
 * even when the browser tab is inactive or system is under load.
 */
const TimerManager = {
  duration: 1500, // Default 25 minutes in seconds
  timeRemaining: 1500,
  isRunning: false,
  intervalId: null,
  startTime: null,
  pausedTime: 0,

  /**
   * Initialize the timer manager
   * Sets up initial display
   */
  init() {
    this.timeRemaining = this.duration;
    this.updateDisplay();
    this.setupEventListeners();
  },

  /**
   * Format seconds to MM:SS display format
   * @param {number} seconds - Total seconds
   * @returns {string} Formatted time string (MM:SS)
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Update the timer display element
   */
  updateDisplay() {
    const displayElement = document.getElementById('timer-display');
    if (displayElement) {
      displayElement.textContent = this.formatTime(this.timeRemaining);
      
      // Update aria-live region when timer is running for screen reader announcements
      // Only announce at specific intervals to avoid overwhelming screen readers
      if (this.isRunning && (this.timeRemaining === 300 || this.timeRemaining === 60 || this.timeRemaining === 30 || this.timeRemaining === 10)) {
        displayElement.setAttribute('aria-live', 'polite');
      } else if (!this.isRunning) {
        displayElement.setAttribute('aria-live', 'off');
      }
    }
  },

  /**
   * Start the timer countdown
   * Uses timestamp-based calculation for accuracy
   * Requests browser notification permission proactively
   */
  start() {
    if (this.isRunning) {
      return; // Already running, prevent duplicate intervals
    }

    // Request notification permission proactively when timer starts
    // so the user can grant it before the timer completes
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Store start timestamp for accurate elapsed time calculation
    this.startTime = Date.now();
    this.isRunning = true;

    // Update button states (disable start, enable stop/reset)
    this.updateButtonStates();

    // Start interval to update every 100ms for smooth countdown
    // Using 100ms instead of 1000ms provides smoother visual updates
    this.intervalId = setInterval(() => {
      // Calculate elapsed time from timestamp difference (prevents drift)
      // Add pausedTime to account for any previous pause periods
      const elapsed = Math.floor((Date.now() - this.startTime + this.pausedTime) / 1000);
      this.timeRemaining = this.duration - elapsed;

      // Check for completion
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.updateDisplay();
        this.handleCompletion();
      } else {
        this.updateDisplay();
      }
    }, 100);
  },

  /**
   * Stop (pause) the timer
   * Preserves elapsed time for accurate resume
   */
  stop() {
    if (!this.isRunning) {
      return; // Not running, nothing to stop
    }

    // Clear the update interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Store elapsed time since start to maintain accuracy on resume
    // This allows the timer to resume from the exact point it was paused
    const elapsed = Date.now() - this.startTime;
    this.pausedTime += elapsed;

    this.isRunning = false;
    this.updateButtonStates();
  },

  /**
   * Reset the timer to default duration
   */
  reset() {
    // Stop timer if running
    if (this.isRunning) {
      this.stop();
    }

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Reset all state
    this.timeRemaining = this.duration;
    this.startTime = null;
    this.pausedTime = 0;
    this.isRunning = false;

    // Update display and buttons
    this.updateDisplay();
    this.updateButtonStates();
  },

  /**
   * Handle timer completion
   * Shows custom modal notification and browser notification if permitted
   */
  handleCompletion() {
    // Stop the timer
    this.stop();

    // Flash the timer display to draw attention
    const displayElement = document.getElementById('timer-display');
    if (displayElement) {
      displayElement.classList.add('completed');
      setTimeout(() => displayElement.classList.remove('completed'), 1900);
    }

    // Show browser notification if permission granted
    this.showNotification();

    // Show custom modal (primary visual notification)
    this.showCompletionModal();
  },

  /**
   * Show the custom timer completion modal
   * Traps focus inside the modal for accessibility
   */
  showCompletionModal() {
    const modal = document.getElementById('timer-modal');
    const closeBtn = document.getElementById('timer-modal-close');

    if (!modal) return;

    modal.hidden = false;

    // Focus the close button for keyboard accessibility
    if (closeBtn) {
      closeBtn.focus();
    }

    // Close modal and reset timer when button clicked
    const handleClose = () => {
      modal.hidden = true;
      closeBtn.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleEscape);
      this.reset();
    };

    // Allow Escape key to dismiss the modal
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose);
    }
    document.addEventListener('keydown', handleEscape);
  },

  /**
   * Show browser notification
   * Requests permission if not already granted
   * Falls back gracefully if notifications not supported
   */
  showNotification() {
    // Check if browser supports notifications API
    if (!('Notification' in window)) {
      return;
    }

    // Handle different permission states
    if (Notification.permission === 'default') {
      // Permission not yet requested, ask user
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.displayNotification();
        }
      });
    } else if (Notification.permission === 'granted') {
      // Permission already granted, show notification
      this.displayNotification();
    }
    // If permission is 'denied', silently fail (user has blocked notifications)
  },

  /**
   * Display the notification
   */
  displayNotification() {
    try {
      new Notification('Focus Timer Complete!', {
        body: 'Great work! Time for a break.',
        icon: '⏰',
        requireInteraction: false
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  },

  /**
   * Update button states based on timer state
   */
  updateButtonStates() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn && stopBtn && resetBtn) {
      if (this.isRunning) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resetBtn.disabled = false;
      } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        resetBtn.disabled = false;
      }
    }
  },

  /**
   * Set up event listeners for timer buttons
   */
  setupEventListeners() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }

    // Initialize button states
    this.updateButtonStates();
  },

  /**
   * Get remaining time in seconds
   * @returns {number} Seconds remaining
   */
  getTimeRemaining() {
    return this.timeRemaining;
  },

  /**
   * Set custom timer duration (optional feature)
   * @param {number} minutes - Duration in minutes (5-60)
   * @returns {boolean} True if successful, false otherwise
   */
  setDuration(minutes) {
    // Validate duration (5-60 minutes)
    if (minutes < 5 || minutes > 60) {
      console.error('Timer duration must be between 5 and 60 minutes');
      return false;
    }

    // Stop timer if running
    if (this.isRunning) {
      this.stop();
    }

    // Update duration
    this.duration = minutes * 60;
    this.timeRemaining = this.duration;
    this.pausedTime = 0;

    // Save to storage
    const settings = StorageManager.get('pd_settings') || {};
    settings.timerDuration = this.duration;
    StorageManager.set('pd_settings', settings);

    // Update display
    this.updateDisplay();

    return true;
  }
};

