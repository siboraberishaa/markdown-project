class NotesApp {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem("notes")) || [];
    this.currentNote = null;
    this.isDarkTheme = localStorage.getItem("darkTheme") === "true";
    this.isEditorView = true;
    this.isSidebarOpen = false;
    this.createNoteAlert = "Please create a new note first!";
    this.initializeElements();
    this.applyTheme();
    this.attachEventListeners();
    this.render();
  }

  initializeElements() {
    this.notesList = document.getElementById("notesList");
    this.editor = document.querySelector(".editor");
    this.preview = document.querySelector(".preview");
    this.markdownEditor = document.getElementById("markdownEditor");
    this.markdownPreview = document.getElementById("markdownPreview");
    this.newNoteBtn = document.getElementById("newNote");
    this.searchInput = document.getElementById("searchInput");
    this.themeToggle = document.getElementById("themeToggle");
    this.alertOverlay = document.getElementById("alertOverlay");
    this.alertConfirm = document.getElementById("alertConfirm");
    this.alertCancel = document.getElementById("alertCancel");
    this.viewToggle = document.getElementById("viewToggle");
    this.sidebarToggle = document.getElementById("sidebarToggle");
    this.sidebarClose = document.getElementById("sidebarClose");
  }

  attachEventListeners() {
    this.newNoteBtn.addEventListener("click", () => this.createNewNote());
    this.markdownEditor.addEventListener("input", () =>
      this.updateCurrentNote()
    );
    this.searchInput.addEventListener("input", () => this.handleSearch());
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
    this.alertConfirm.addEventListener("click", () => this.confirmDelete());
    this.alertCancel.addEventListener("click", () => this.hideAlert());
    this.viewToggle.addEventListener("click", () => this.toggleView());
    this.sidebarToggle.addEventListener("click", () => this.toggleSidebar());
    this.sidebarClose.addEventListener("click", () => this.toggleSidebar());

    window.addEventListener("resize", () => this.handleResize());

    this.markdownEditor.addEventListener("focus", (e) => {
      if (!this.currentNote) {
        e.target.blur();
        this.showCreateNoteAlert();
      }
    });
  }

  createNewNote() {
    const note = {
      id: Date.now(),
      title: "New Note",
      content: "",
      createdAt: new Date().toISOString(),
    };
    this.notes.unshift(note);
    this.currentNote = note;

    // Clear editor and preview when creating a new note
    this.markdownEditor.value = "";
    this.markdownPreview.innerHTML = "";

    this.saveNotes();
    this.render();
  }

  updateCurrentNote() {
    if (!this.currentNote) return;

    this.currentNote.content = this.markdownEditor.value;
    this.currentNote.title =
      this.markdownEditor.value.split("\n")[0] || "New Note";

    // Convert markdown to HTML and update preview
    this.markdownPreview.innerHTML = marked.parse(this.markdownEditor.value);

    this.saveNotes();
    this.renderNotesList();
  }

  selectNote(note) {
    this.currentNote = note;
    this.markdownEditor.value = note.content;
    this.markdownPreview.innerHTML = marked.parse(note.content);
    this.highlightSelectedNote();
  }

  highlightSelectedNote() {
    const noteElements = this.notesList.getElementsByClassName("note-item");
    Array.from(noteElements).forEach((noteElement) => {
      if (noteElement.dataset.id === String(this.currentNote.id)) {
        noteElement.classList.add("active");
      } else {
        noteElement.classList.remove("active");
      }
    });
  }

  saveNotes() {
    localStorage.setItem("notes", JSON.stringify(this.notes));
  }

  renderNotesList() {
    this.notesList.innerHTML = this.notes
      .map((note) => {
        // Get the title and limit it to 3 words
        const fullTitle = note.title || "New Note";
        const limitedTitle = fullTitle.split(" ").slice(0, 3).join(" ");
        const titleWithEllipsis =
          fullTitle.split(" ").length > 3 ? limitedTitle + "..." : limitedTitle;

        return `
            <div class="note-item ${
              note.id === this.currentNote?.id ? "active" : ""
            }" 
                 data-id="${note.id}">
                <span class="note-title">${titleWithEllipsis}</span>
                <span class="delete-note" data-id="${note.id}">
                    <i class="fas fa-trash"></i>
                </span>
            </div>
          `;
      })
      .join("");

    // Remove old event listeners
    const noteItems = this.notesList.getElementsByClassName("note-item");
    Array.from(noteItems).forEach((noteItem) => {
      const newNoteItem = noteItem.cloneNode(true);
      noteItem.parentNode.replaceChild(newNoteItem, noteItem);

      const deleteBtn = newNoteItem.querySelector(".delete-note");

      // Note selection click handler
      newNoteItem.addEventListener("click", (e) => {
        if (!e.target.closest(".delete-note")) {
          const note = this.notes.find(
            (n) => n.id === parseInt(newNoteItem.dataset.id)
          );
          if (note) this.selectNote(note);
        }
      });

      // Delete button click handler
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showDeleteAlert(parseInt(deleteBtn.dataset.id));
      });
    });
  }

  render() {
    this.renderNotesList();
    if (this.notes.length > 0 && !this.currentNote) {
      this.selectNote(this.notes[0]);
    }
    this.handleResize();
  }

  handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const noteItems = this.notesList.getElementsByClassName("note-item");

    Array.from(noteItems).forEach((noteItem) => {
      const noteId = parseInt(noteItem.dataset.id);
      const note = this.notes.find((n) => n.id === noteId);
      const isVisible =
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm);
      noteItem.style.display = isVisible ? "flex" : "none";
    });
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem("darkTheme", this.isDarkTheme);
    this.applyTheme();
  }

  applyTheme() {
    document.body.classList.toggle("dark-theme", this.isDarkTheme);
    if (this.isDarkTheme) {
      this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  showDeleteAlert(noteId) {
    this.noteToDelete = noteId;
    this.alertOverlay.style.display = "flex";
    document.getElementById("alertTitle").textContent = "Delete Note";
    document.getElementById("alertMessage").textContent =
      "Are you sure you want to delete this note?";
    document.getElementById("alertConfirm").textContent = "Delete";
    document.getElementById("alertCancel").textContent = "Cancel";
    this.alertType = "delete";
  }

  hideAlert() {
    this.alertOverlay.style.display = "none";
    this.noteToDelete = null;
    this.alertType = null;
  }

  confirmDelete() {
    if (this.alertType === "create") {
      this.createNewNote();
    } else {
      if (this.noteToDelete) {
        const index = this.notes.findIndex(
          (note) => note.id === this.noteToDelete
        );
        if (index !== -1) {
          this.notes.splice(index, 1);
          this.saveNotes();

          if (this.currentNote && this.currentNote.id === this.noteToDelete) {
            // If there are remaining notes, select the next one or the previous one
            if (this.notes.length > 0) {
              // If we deleted the first note, select the new first note
              // Otherwise, select the previous note
              const nextNoteIndex = index === 0 ? 0 : index - 1;
              this.currentNote = this.notes[nextNoteIndex];
              this.markdownEditor.value = this.currentNote.content;
              this.markdownPreview.innerHTML = marked.parse(
                this.currentNote.content
              );
            } else {
              // If no notes left, clear everything
              this.currentNote = null;
              this.markdownEditor.value = "";
              this.markdownPreview.innerHTML = "";
            }
          }

          this.render();
        }
      }
    }
    this.hideAlert();
  }

  toggleView() {
    this.isEditorView = !this.isEditorView;
    this.editor.classList.toggle("active", this.isEditorView);
    this.preview.classList.toggle("active", !this.isEditorView);

    const icon = this.viewToggle.querySelector("i");
    if (this.isEditorView) {
      icon.classList.remove("fa-edit");
      icon.classList.add("fa-eye");
    } else {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-edit");
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    document
      .querySelector(".sidebar")
      .classList.toggle("active", this.isSidebarOpen);
  }

  handleResize() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && this.isSidebarOpen) {
      this.isSidebarOpen = false;
      document.querySelector(".sidebar").classList.remove("active");
    }

    if (
      window.innerWidth <= 1024 &&
      !this.editor.classList.contains("active") &&
      !this.preview.classList.contains("active")
    ) {
      this.isEditorView = true;
      this.editor.classList.add("active");
    }
  }

  showCreateNoteAlert() {
    this.alertOverlay.style.display = "flex";
    document.getElementById("alertTitle").textContent = "Create Note";
    document.getElementById("alertMessage").textContent = this.createNoteAlert;
    document.getElementById("alertConfirm").textContent = "Create Note";
    document.getElementById("alertCancel").textContent = "Cancel";

    // Store the current alert type
    this.alertType = "create";
  }
}

// Initialize the app
const app = new NotesApp();
