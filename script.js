// App state variables
let db;
let currentNoteId = null;
let activeTag = null;

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

const themes = [ { name: 'light', icon: 'fa-sun' }, { name: 'dark', icon: 'fa-moon' }, { name: 'forest', icon: 'fa-tree' }];

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
        const notes = await loadNotesFromDB(null, searchTerm);
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
        noteCard.innerHTML = `<div class="note-card-emoji">${cardEmoji}</div><div class="note-card-content"><h3>${note.title || 'Untitled Note'}</h3></div>`;
        noteCard.addEventListener('click', () => {
            const fullNote = notes.find(n => n.id === note.id);
            if (fullNote) openNoteModal(fullNote);
        });
        notesContainer.appendChild(noteCard);
    });
}

function getFirstEmoji(title, content) { const fullText = `${title} ${content}`; const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u; const match = fullText.match(emojiRegex); return match ? match[0] : '📝'; }

function cycleTheme() {
    const currentThemeName = document.documentElement.getAttribute('data-theme') || 'light';
    const currentThemeIndex = themes.findIndex(t => t.name === currentThemeName);
    const nextTheme = themes[(currentThemeIndex + 1) % themes.length];
    document.documentElement.setAttribute('data-theme', nextTheme.name);
    localStorage.setItem('theme', nextTheme.name);
    themeToggle.querySelector('i').className = `fas ${nextTheme.icon}`;
    // REMOVED: Unimportant "theme changed" notification
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
    } catch (error) {
        swal("Initialization Error", `The app could not start correctly: ${error}`, "error");
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', initApp);