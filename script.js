// App state variables
let db;
let currentNoteId = null;
let activeTag = null;

// PWA Install Prompt variables
let deferredPrompt = null;
let installPromptShown = false;

// DOM element references
const notesContainer = document.getElementById('notes-container');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveBtn = document.getElementById('save-note');
const deleteBtn = document.getElementById('delete-note');
const newNoteBtn = document.getElementById('new-note-btn');
const floatingNewNote = document.getElementById('floating-new-note');
const searchInput = document.getElementById('search-notes');
const themeToggle = document.getElementById('theme-toggle');
const noteModal = document.getElementById('note-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const emojiPicker = document.getElementById('emoji-picker');
const emojiPickerBtn = document.getElementById('emoji-picker-btn');

// PWA Install Prompt DOM references
const installPrompt = document.getElementById('install-prompt');
const installButton = document.getElementById('install-button');
const installDismiss = document.getElementById('install-dismiss');

// Mobile Menu DOM references
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileSidebar = document.getElementById('mobile-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const emojiSearchInput = document.getElementById('emoji-search-input');
const emojiContent = document.getElementById('emoji-content');

const themes = [ { name: 'light', icon: 'fa-sun' }, { name: 'dark', icon: 'fa-moon' }, { name: 'forest', icon: 'fa-tree' }];

// Enhanced Emoji Data for truly emoji-powered experience
const emojiData = {
    recent: JSON.parse(localStorage.getItem('recentEmojis') || '["✨", "💡", "😊", "📝", "🎉", "❤️"]'),
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸'],
    people: ['👋', '🤚', '👏', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👏', '👐', '🤲', '🤳', '🙏', '✍️', '💅', '🤵'],
    nature: ['🌿', '🌱', '🌲', '🌳', '🌴', '🌵', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🍀', '🍁', '🍂', '🍃', '🍄', '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '⭐', '🌟', '✨', '⚡', '🔥', '💥'],
    food: ['🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥕', '🍆', '🥒', '🥑', '🌽', '🌶️', '🥔', '🍠', '🌰', '🥜', '🍞', '🥖', '🥨', '🥯', '🧀', '🍳', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '☕', '🍵', '🥤'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🏓', '🏸', '🏒', '🏑', '🤏', '🎣', '🥊', '🥋', '🎨', '🎭', '🎤', '🎧', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰'],
    objects: ['📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '⏰', '⏱️', '⏲️', '⏳', '⏸️', '⏯️'],
    symbols: ['✨', '💡', '🔥', '🎯', '💯', '⭐', '🌟', '⚡', '🔋', '✨', '💫', '💥', '💢', '💨', '💬', '🗏️', '💤', '💕', '💖', '💗', '💘', '💙', '💚', '💛', '🧡', '💜', '💝', '💞', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙']
};

// Current emoji filter state
let currentEmojiCategory = 'recent';
let currentNoteFilter = 'all';

// --- CORE DATABASE FUNCTIONS (Unchanged) ---
function openDatabase() { return new Promise((resolve, reject) => { const request = indexedDB.open('notesDB', 2); request.onupgradeneeded = (event) => { const db = event.target.result; if (!db.objectStoreNames.contains('notes')) { const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true }); notesStore.createIndex('by_date', 'updatedAt', { unique: false }); notesStore.createIndex('by_tag', 'tag', { unique: false }); } }; request.onsuccess = (event) => { db = event.target.result; resolve(db); }; request.onerror = (event) => reject(`Database error: ${event.target.error?.message}`); }); }
function saveNoteToDB(note) { return new Promise((resolve, reject) => { if (!db) return reject("Database not initialized."); const transaction = db.transaction(['notes'], 'readwrite'); const notesStore = transaction.objectStore('notes'); const request = note.id ? notesStore.put(note) : notesStore.add(note); request.onsuccess = (event) => resolve(event.target.result); request.onerror = (event) => reject(`Error saving note: ${event.target.error?.message}`); }); }
function loadNotesFromDB(tag = null, search = null) { return new Promise((resolve, reject) => { if (!db) return reject("Database not initialized."); const notes = []; const transaction = db.transaction(['notes'], 'readonly'); const notesStore = transaction.objectStore('notes'); const index = tag ? notesStore.index('by_tag') : notesStore.index('by_date'); const request = tag ? index.openCursor(IDBKeyRange.only(tag), 'prev') : index.openCursor(null, 'prev'); request.onsuccess = (event) => { const cursor = event.target.result; if (cursor) { const note = cursor.value; const searchLower = search?.toLowerCase(); if (!search || note.title?.toLowerCase().includes(searchLower) || note.content?.toLowerCase().includes(searchLower)) { notes.push(note); } cursor.continue(); } else { resolve(notes); } }; request.onerror = (event) => reject(`Error loading notes: ${event.target.error?.message}`); }); }
function deleteNoteFromDB(id) { return new Promise((resolve, reject) => { if (!db) return reject("Database not initialized."); const transaction = db.transaction(['notes'], 'readwrite'); const request = transaction.objectStore('notes').delete(id); request.onsuccess = () => resolve(); request.onerror = (event) => reject(`Error deleting note: ${event.target.error?.message}`); }); }


// --- SWEETALERT NOTIFICATION WRAPPER ---
/**
 * Shows a small, auto-closing toast notification for non-critical feedback.
 * @param {string} title The message to display.
 * @param {string} icon 'success', 'error', 'warning', 'info'.
 */
function showToast(title, icon = 'success') {
    if (typeof swal === 'undefined') { return; } // Don't crash if swal not loaded
    swal({
        title: title,
        icon: icon,
        timer: 2000, // Auto-close after 2 seconds
        buttons: false,
    });
}

// --- MODAL AND UI LOGIC ---
function openNoteModal(note = null) {
    if (note) {
        currentNoteId = note.id;
        noteTitle.value = note.title || '';
        noteContent.innerHTML = note.content || '';
        activeTag = note.tag;
    } else {
        currentNoteId = null;
        noteTitle.value = '';
        noteContent.innerHTML = '';
        activeTag = null;
        // REMOVED: Unimportant "new note" notification
    }
    document.querySelectorAll('.modal-content .tag').forEach(tagEl => {
        tagEl.classList.toggle('active', tagEl.dataset.tag === activeTag);
    });
    noteModal.classList.add('visible');
    noteTitle.focus();
}

function closeNoteModal() {
    noteModal.classList.remove('visible');
    setTimeout(() => { currentNoteId = null; activeTag = null; }, 200);
}

async function saveAndClose() {
    const title = noteTitle.value.trim();
    const content = noteContent.innerHTML.trim();
    if (!content && !title) {
        showToast('Your note needs a title or some content.', 'error');
        return;
    }
    await saveNote();
    closeNoteModal();
}

/**
 * Uses SweetAlert for a confirmation dialog, handling the promise.
 */
async function deleteAndClose() {
    if (!currentNoteId) {
        closeNoteModal();
        return;
    }
    const noteTitleText = noteTitle.value || 'this note';
    
    // SweetAlert returns a promise that resolves on user action
    swal({
        title: "Are you sure?",
        text: `Once deleted, you will not be able to recover "${noteTitleText}"!`,
        icon: "warning",
        buttons: ["Cancel", "Delete It"],
        dangerMode: true,
    })
    .then(async (willDelete) => {
        // This is the AJAX-like behavior: code runs *after* user clicks.
        if (willDelete) {
            await deleteNote();
            closeNoteModal();
        }
    });
}

// --- APPLICATION LOGIC ---
async function saveNote() {
    try {
        const now = new Date().toISOString();
        const note = { title: noteTitle.value.trim(), content: noteContent.innerHTML.trim(), tag: activeTag, updatedAt: now };
        if (currentNoteId) { note.id = currentNoteId; } else { note.createdAt = now; }
        const noteId = await saveNoteToDB(note);
        if (!currentNoteId) currentNoteId = noteId;
        showToast('Note Saved!', 'success');
        await loadNotes();
    } catch (error) {
        showToast('Error Saving Note', 'error');
        console.error('Save note error:', error);
    }
}

async function deleteNote() {
    try {
        await deleteNoteFromDB(currentNoteId);
        showToast('Note Deleted!', 'success');
        await loadNotes();
    } catch (error) {
        showToast('Error Deleting Note', 'error');
        console.error('Delete note error:', error);
    }
}

async function loadNotes() {
    try {
        const searchTerm = searchInput.value.trim();
        let notes = await loadNotesFromDB(null, searchTerm);
        
        // Apply category filter
        if (currentNoteFilter !== 'all') {
            notes = notes.filter(note => note.tag === currentNoteFilter);
        }
        
        renderNotes(notes);
        document.getElementById('notes-count').textContent = `(${notes.length})`;
    } catch (error) {
        showToast('Could not load notes.', 'error');
        console.error('Load notes error:', error);
    }
}

function renderNotes(notes) {
    notesContainer.innerHTML = '';
    if (notes.length === 0) {
        notesContainer.innerHTML = `<div class="empty-state"><i class="far fa-lightbulb"></i><h3>${searchInput.value ? 'No notes match your search.' : 'Your note space is empty!'}</h3><p>${searchInput.value ? 'Try a different keyword.' : 'Click the "+" button to create your first note.'}</p></div>`;
        return;
    }
    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.id = note.id;
        
        const cardEmoji = getFirstEmoji(note.title, note.content);
        const previewText = getPreviewText(note.content);
        const tagEmoji = getTagEmoji(note.tag);
        const timeAgo = getTimeAgo(note.updatedAt);
        
        noteCard.innerHTML = `
            <div class="note-card-header">
                <div class="note-card-emoji">${cardEmoji}</div>
                <div class="note-card-meta">
                    <span class="note-tag">${tagEmoji}</span>
                    <span class="note-time">${timeAgo}</span>
                </div>
            </div>
            <div class="note-card-content">
                <h3>${note.title || 'Untitled Note'}</h3>
                <p class="note-preview">${previewText}</p>
            </div>
            <div class="note-card-actions">
                <button class="quick-edit-btn" title="Quick Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="quick-view-btn" title="Preview">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        // Main click event to open note
        noteCard.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.note-card-actions')) return;
            
            const fullNote = notes.find(n => n.id === note.id);
            if (fullNote) openNoteModal(fullNote);
        });
        
        // Quick view button
        const quickViewBtn = noteCard.querySelector('.quick-view-btn');
        quickViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openNotePreview(note);
        });
        
        // Quick edit button
        const quickEditBtn = noteCard.querySelector('.quick-edit-btn');
        quickEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fullNote = notes.find(n => n.id === note.id);
            if (fullNote) openNoteModal(fullNote);
        });
        
        notesContainer.appendChild(noteCard);
        
        // Add animation
        setTimeout(() => {
            noteCard.classList.add('visible');
        }, notes.indexOf(note) * 50);
    });
}

function getFirstEmoji(title, content) { const fullText = `${title} ${content}`; const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u; const match = fullText.match(emojiRegex); return match ? match[0] : '📝'; }

function getPreviewText(content) {
    if (!content) return 'No content';
    // Strip HTML and get first 120 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
}

function getTagEmoji(tag) {
    const tagEmojis = {
        idea: '💡',
        task: '✅',
        meeting: '📹',
        personal: '❤️'
    };
    return tagEmojis[tag] || '📝';
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function openNotePreview(note) {
    // Create preview modal
    const previewModal = document.createElement('div');
    previewModal.className = 'note-preview-modal';
    previewModal.innerHTML = `
        <div class="preview-overlay"></div>
        <div class="preview-content">
            <div class="preview-header">
                <div class="preview-title">
                    <span class="preview-emoji">${getFirstEmoji(note.title, note.content)}</span>
                    <h2>${note.title || 'Untitled Note'}</h2>
                </div>
                <div class="preview-actions">
                    <button class="preview-edit-btn" title="Edit Note">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="preview-close-btn" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="preview-meta">
                <span class="preview-tag">${getTagEmoji(note.tag)} ${note.tag || 'No category'}</span>
                <span class="preview-time">${getTimeAgo(note.updatedAt)}</span>
            </div>
            <div class="preview-body">
                ${note.content || '<em>No content</em>'}
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(previewModal);
    
    // Add event listeners
    const closeBtn = previewModal.querySelector('.preview-close-btn');
    const editBtn = previewModal.querySelector('.preview-edit-btn');
    const overlay = previewModal.querySelector('.preview-overlay');
    
    const closePreview = () => {
        previewModal.classList.add('closing');
        setTimeout(() => {
            document.body.removeChild(previewModal);
        }, 300);
    };
    
    closeBtn.addEventListener('click', closePreview);
    overlay.addEventListener('click', closePreview);
    editBtn.addEventListener('click', () => {
        closePreview();
        openNoteModal(note);
    });
    
    // Show modal with animation
    setTimeout(() => {
        previewModal.classList.add('visible');
    }, 10);
    
    // ESC key to close
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closePreview();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function cycleTheme() {
    const currentThemeName = document.documentElement.getAttribute('data-theme') || 'light';
    const currentThemeIndex = themes.findIndex(t => t.name === currentThemeName);
    const nextTheme = themes[(currentThemeIndex + 1) % themes.length];
    document.documentElement.setAttribute('data-theme', nextTheme.name);
    localStorage.setItem('theme', nextTheme.name);
    themeToggle.querySelector('i').className = `fas ${nextTheme.icon}`;
    // REMOVED: Unimportant "theme changed" notification
}

// --- PWA INSTALL PROMPT FUNCTIONS ---

// --- MOBILE MENU FUNCTIONS ---

function openMobileMenu() {
    if (mobileSidebar) {
        mobileSidebar.classList.add('open');
        sidebarOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
}

function closeMobileMenu() {
    if (mobileSidebar) {
        mobileSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
        document.body.style.overflow = 'auto';
    }
}

// --- ENHANCED EMOJI FUNCTIONS ---

function renderEmojiCategory(category) {
    if (!emojiContent) return;
    
    const emojis = emojiData[category] || [];
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';
    
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.className = 'emoji-item';
        span.addEventListener('click', () => insertEmoji(emoji));
        grid.appendChild(span);
    });
    
    emojiContent.innerHTML = '';
    emojiContent.appendChild(grid);
}

function insertEmoji(emoji) {
    if (noteContent) {
        noteContent.focus();
        // Add to recent emojis
        addToRecentEmojis(emoji);
        
        // Insert at cursor position
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const emojiNode = document.createTextNode(emoji);
            range.insertNode(emojiNode);
            range.setStartAfter(emojiNode);
            range.setEndAfter(emojiNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            noteContent.innerHTML += emoji;
        }
        
        // Close emoji picker
        emojiPicker.classList.remove('visible');
    }
}

function addToRecentEmojis(emoji) {
    let recent = emojiData.recent;
    // Remove if already exists
    recent = recent.filter(e => e !== emoji);
    // Add to front
    recent.unshift(emoji);
    // Keep only 20 most recent
    recent = recent.slice(0, 20);
    
    emojiData.recent = recent;
    localStorage.setItem('recentEmojis', JSON.stringify(recent));
}

function searchEmojis(query) {
    if (!query.trim()) {
        renderEmojiCategory(currentEmojiCategory);
        return;
    }
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search through all categories
    Object.values(emojiData).flat().forEach(emoji => {
        // Simple matching - you could enhance this with emoji names/keywords
        if (emoji.includes(query) || results.length < 50) {
            if (!results.includes(emoji)) {
                results.push(emoji);
            }
        }
    });
    
    // Render search results
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';
    
    results.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.className = 'emoji-item';
        span.addEventListener('click', () => insertEmoji(emoji));
        grid.appendChild(span);
    });
    
    emojiContent.innerHTML = '';
    if (results.length > 0) {
        emojiContent.appendChild(grid);
    } else {
        emojiContent.innerHTML = '<div class="no-results">No emojis found 😢</div>';
    }
}

function filterNotesByCategory(filter) {
    currentNoteFilter = filter;
    loadNotes(); // Reload notes with filter
}

/**
 * Shows the install prompt banner if conditions are met
 */
function showInstallPrompt() {
    console.log('PWA: Checking if install prompt should be shown...');
    console.log('PWA: installPrompt element:', !!installPrompt);
    console.log('PWA: installPromptShown:', installPromptShown);
    console.log('PWA: deferredPrompt available:', !!deferredPrompt);
    
    if (!installPrompt) {
        console.log('PWA: Install prompt element not found');
        return;
    }
    
    if (installPromptShown) {
        console.log('PWA: Install prompt already shown this session');
        return;
    }
    
    if (!deferredPrompt) {
        console.log('PWA: No deferred prompt available. This could mean:');
        console.log('- App is already installed');
        console.log('- PWA criteria not met (missing icons, manifest issues)');
        console.log('- Browser doesn\'t support PWA install prompts');
        return;
    }
    
    // Check if user previously dismissed the prompt
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        console.log('PWA: Days since dismissed:', daysSinceDismissed);
        if (daysSinceDismissed < 7) { // Don't show again for 7 days
            console.log('PWA: Install prompt dismissed recently, waiting 7 days');
            return;
        }
    }
    
    console.log('PWA: Showing install prompt!');
    installPrompt.classList.remove('hidden');
    installPromptShown = true;
    
    // Auto-hide after 10 seconds if not interacted with
    setTimeout(() => {
        if (installPrompt && !installPrompt.classList.contains('hidden')) {
            console.log('PWA: Auto-hiding install prompt after 10 seconds');
            hideInstallPrompt();
        }
    }, 10000);
}

/**
 * Hides the install prompt banner
 */
function hideInstallPrompt() {
    if (installPrompt) {
        installPrompt.classList.add('hidden');
    }
}

/**
 * Handles the install button click
 */
async function handleInstallClick() {
    if (!deferredPrompt) {
        showToast('Install not available', 'error');
        return;
    }
    
    hideInstallPrompt();
    
    try {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('Thanks for installing Yaadannoo! 🎉', 'success');
            localStorage.setItem('appInstalled', 'true');
        } else {
            showToast('Maybe next time! 😊', 'info');
        }
        
        // Reset the deferred prompt
        deferredPrompt = null;
    } catch (error) {
        console.error('Install prompt failed:', error);
        showToast('Install failed. Please try again.', 'error');
    }
}

/**
 * Handles dismissing the install prompt
 */
function handleInstallDismiss() {
    hideInstallPrompt();
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    showToast('You can install later from your browser menu', 'info');
}

/**
 * Checks if the app should show install prompt based on usage
 */
function checkInstallEligibility() {
    console.log('PWA: Checking install eligibility...');
    
    // Don't show if already installed
    if (localStorage.getItem('appInstalled') === 'true') {
        console.log('PWA: App already marked as installed');
        return;
    }
    
    // Don't show if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA: App running in standalone mode, marking as installed');
        localStorage.setItem('appInstalled', 'true');
        return;
    }
    
    // Track app usage
    let usageCount = parseInt(localStorage.getItem('appUsageCount') || '0');
    usageCount++;
    localStorage.setItem('appUsageCount', usageCount.toString());
    console.log('PWA: Usage count:', usageCount);
    
    // Show install prompt after 2 uses (reduced for testing)
    if (usageCount >= 2) {
        console.log('PWA: Usage threshold met, checking for deferred prompt...');
        if (deferredPrompt) {
            console.log('PWA: Scheduling install prompt to show in 2 seconds');
            setTimeout(showInstallPrompt, 2000); // Show after 2 seconds
        } else {
            console.log('PWA: No deferred prompt available yet');
            // Try again in 3 seconds in case the event hasn\'t fired yet
            setTimeout(() => {
                if (deferredPrompt) {
                    console.log('PWA: Deferred prompt now available, showing install prompt');
                    showInstallPrompt();
                } else {
                    console.log('PWA: Still no deferred prompt. Check PWA requirements.');
                }
            }, 3000);
        }
    } else {
        console.log(`PWA: Need ${2 - usageCount} more visits before showing install prompt`);
    }
}

// --- INITIALIZATION AND EVENT LISTENERS ---
function setupEventListeners() {
    if (!newNoteBtn || !floatingNewNote || !modalOverlay || !closeModalBtn || !saveBtn || !deleteBtn || !themeToggle || !searchInput) { console.error("A critical element is missing. Aborting event listener setup."); return; }
    newNoteBtn.addEventListener('click', () => openNoteModal());
    floatingNewNote.addEventListener('click', () => openNoteModal());
    modalOverlay.addEventListener('click', closeNoteModal);
    closeModalBtn.addEventListener('click', closeNoteModal);
    saveBtn.addEventListener('click', saveAndClose);
    deleteBtn.addEventListener('click', deleteAndClose);
    themeToggle.addEventListener('click', cycleTheme);
    searchInput.addEventListener('input', loadNotes);
    document.querySelectorAll('.modal-content .tag').forEach(tagEl => { tagEl.addEventListener('click', () => { activeTag = (activeTag === tagEl.dataset.tag) ? null : tagEl.dataset.tag; document.querySelectorAll('.modal-content .tag').forEach(el => { el.classList.toggle('active', el.dataset.tag === activeTag); }); }); });
    emojiPickerBtn.addEventListener('click', (e) => { e.stopPropagation(); emojiPicker.classList.toggle('visible'); });
    document.querySelectorAll('.emoji-grid span').forEach(emoji => { emoji.addEventListener('click', () => { noteContent.focus(); document.execCommand('insertText', false, emoji.textContent); emojiPicker.classList.remove('visible'); }); });
    document.addEventListener('click', (e) => { if (emojiPicker && !emojiPicker.parentElement.contains(e.target)) emojiPicker.classList.remove('visible'); });
    document.querySelectorAll('.tool-btn').forEach(btn => { btn.addEventListener('click', () => { noteContent.focus(); document.execCommand(btn.dataset.action, false, null); }); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && noteModal.classList.contains('visible')) closeNoteModal(); if ((e.ctrlKey || e.metaKey) && e.key === 's' && noteModal.classList.contains('visible')) { e.preventDefault(); saveAndClose(); } });
    
    // PWA Install Prompt Event Listeners
    if (installButton) {
        installButton.addEventListener('click', handleInstallClick);
    }
    if (installDismiss) {
        installDismiss.addEventListener('click', handleInstallDismiss);
    }
    
    // PWA Install Events
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt event triggered! 🎉');
        console.log('PWA: This means the browser recognizes this as a valid PWA');
        e.preventDefault(); // Prevent the mini-infobar from appearing
        deferredPrompt = e; // Store the event for later use
        
        console.log('PWA: Deferred prompt stored, checking eligibility...');
        // Check if we should show the install prompt
        checkInstallEligibility();
    });
    
    // Handle successful app installation
    window.addEventListener('appinstalled', (e) => {
        console.log('PWA was installed successfully');
        hideInstallPrompt();
        localStorage.setItem('appInstalled', 'true');
        showToast('Yaadannoo installed successfully! 🎉', 'success');
        deferredPrompt = null;
    });
    
    // Mobile Menu Event Listeners
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeMobileMenu);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Sidebar Actions
    const sidebarNewNote = document.getElementById('sidebar-new-note');
    const sidebarSearch = document.getElementById('sidebar-search');
    const sidebarTheme = document.getElementById('sidebar-theme');
    
    if (sidebarNewNote) {
        sidebarNewNote.addEventListener('click', () => {
            closeMobileMenu();
            openNoteModal();
        });
    }
    
    if (sidebarSearch) {
        sidebarSearch.addEventListener('click', () => {
            closeMobileMenu();
            searchInput.focus();
        });
    }
    
    if (sidebarTheme) {
        sidebarTheme.addEventListener('click', () => {
            closeMobileMenu();
            cycleTheme();
        });
    }
    
    // Emoji Filter Buttons
    document.querySelectorAll('.emoji-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            currentNoteFilter = filter;
            
            // Update active state
            document.querySelectorAll('.emoji-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            closeMobileMenu();
            loadNotes();
        });
    });
    
    // Enhanced Emoji Picker Event Listeners
    if (emojiSearchInput) {
        emojiSearchInput.addEventListener('input', (e) => {
            searchEmojis(e.target.value);
        });
    }
    
    // Emoji Category Tabs
    document.querySelectorAll('.emoji-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            currentEmojiCategory = category;
            
            // Update active tab
            document.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Render category
            renderEmojiCategory(category);
            
            // Clear search
            if (emojiSearchInput) {
                emojiSearchInput.value = '';
            }
        });
    });
    
    // Initialize emoji picker
    renderEmojiCategory('recent');
    
    // Touch gestures for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe right to open menu (from left edge)
        if (deltaX > 100 && Math.abs(deltaY) < 100 && touchStartX < 50) {
            openMobileMenu();
        }
        
        // Swipe left to close menu
        if (deltaX < -100 && Math.abs(deltaY) < 100 && mobileSidebar && mobileSidebar.classList.contains('open')) {
            closeMobileMenu();
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });
}

async function initApp() {
    try {
        const savedThemeName = localStorage.getItem('theme') || 'light';
        const savedTheme = themes.find(t => t.name === savedThemeName) || themes[0];
        document.documentElement.setAttribute('data-theme', savedTheme.name);
        themeToggle.querySelector('i').className = `fas ${savedTheme.icon}`;
        await openDatabase();
        await loadNotes();
        setupEventListeners();
        const allNotes = await loadNotesFromDB();
        if (allNotes.length === 0) {
            await saveNoteToDB({ title: "Welcome to Yaadannoo! 🌈", content: `<p>This is your new favorite note-taking app. Here are a few tips:</p><ul><li>Click the <b>plus icon</b> to create new notes.</li><li>Click <i>this note</i> to open the editor.</li><li>Your notes are saved automatically in your browser.</li></ul><p>Go ahead and delete this welcome note to get started!</p>`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            await loadNotes();
        }
        // REMOVED: Unimportant "ready" notification
        
        // Check PWA install eligibility
        checkInstallEligibility();
    } catch (error) {
        swal("Initialization Error", `The app could not start correctly: ${error}`, "error");
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', initApp);