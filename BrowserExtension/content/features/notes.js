(function setupNotesFeature() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  ns.features = ns.features || {};
  const { state } = ns;
  const { escapeHtml, showNotification } = ns;
  const { getCurrentTime, pauseVideo, resumeVideo, timestampToSeconds } = ns.youtube;

  async function addNote() {
    if (!state.currentTutorialId) { showNotification && showNotification('⚠️ No tutorial session active', 'warning'); return; }
    const input = document.getElementById('medha-note-input'); const note = input.value.trim();
    if (!note) { showNotification && showNotification('⚠️ Please enter a note', 'warning'); return; }
    const timestamp = getCurrentTime();
    const btn = document.getElementById('medha-add-note'); btn.disabled = true; btn.innerHTML = '<span class="medha-spinner"></span> Saving...';
    try {
      await chrome.runtime.sendMessage({ action: 'addNote', data: { tutorialId: state.currentTutorialId, note, timestamp } });
      input.value = ''; showNotification && showNotification(' Note added at ' + timestamp, 'success');
      await loadNotes(); state.isUserTyping = false; if (state.typingTimer) clearTimeout(state.typingTimer);
      setTimeout(() => { if (!state.isRecording) resumeVideo(); }, 500);
    } catch (error) {
      showNotification && showNotification('❌ Failed to add note: ' + error.message, 'error');
    } finally { btn.disabled = false; btn.innerHTML = 'Add Note'; }
  }

  function renderNotes() {
    const container = document.getElementById('medha-notes-list'); if (!container) return;
    if ((state.notes || []).length === 0) {
      container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">📝</div><div class="medha-empty-text">No notes yet. Start taking notes!</div></div>';
      return;
    }
    container.innerHTML = state.notes.map(note => `
      <div class="medha-note-item" data-note-id="${note.note_id}">
        <div class="medha-note-header">
          <span class="medha-note-time" data-timestamp="${note.timestamp}">${note.timestamp}</span>
          <div class="medha-note-actions">
            <button class="medha-note-edit-btn" data-note-id="${note.note_id}" title="Edit"><span class="icon">✏️</span></button>
            <button class="medha-note-delete-btn" data-note-id="${note.note_id}" title="Delete"><span class="icon">🗑️</span></button>
          </div>
        </div>
        <div class="medha-note-text">${escapeHtml(note.note)}</div>
      </div>
    `).reverse().join('');
    container.querySelectorAll('.medha-note-time').forEach(timeEl => {
      timeEl.addEventListener('click', () => { const seconds = timestampToSeconds(timeEl.dataset.timestamp); const video = document.querySelector('video'); if (video) video.currentTime = seconds; });
    });
    container.querySelectorAll('.medha-note-edit-btn').forEach(btn => { btn.addEventListener('click', () => editNoteHandler(btn.dataset.noteId)); });
    container.querySelectorAll('.medha-note-delete-btn').forEach(btn => { btn.addEventListener('click', () => deleteNoteHandler(btn.dataset.noteId)); });
  }

  async function loadNotes() {
    if (!state.currentTutorialId) return;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getNotes', data: { tutorialId: state.currentTutorialId } });
      state.notes = response && response.notes ? response.notes : []; renderNotes();
    } catch (error) { state.notes = []; renderNotes(); }
  }

  async function editNoteHandler(noteId) {
    const note = (state.notes || []).find(n => n.note_id === noteId); if (!note) { showNotification && showNotification('❌ Note not found', 'error'); return; }
    const newText = prompt('Edit your note:', note.note); if (newText === null || newText.trim() === note.note) return; if (newText.trim() === '') { showNotification && showNotification('⚠️ Note cannot be empty', 'warning'); return; }
    try { await chrome.runtime.sendMessage({ action: 'updateNote', data: { noteId, updatedText: newText.trim() } }); showNotification && showNotification(' Note updated successfully!', 'success'); await loadNotes(); }
    catch (error) { showNotification && showNotification('❌ Failed to update note: ' + error.message, 'error'); }
  }

  async function deleteNoteHandler(noteId) {
    const note = (state.notes || []).find(n => n.note_id === noteId); if (!note) { showNotification && showNotification('❌ Note not found', 'error'); return; }
    if (!confirm('Are you sure you want to delete this note?\n\n"' + note.note.substring(0, 50) + '..."')) return;
    try { await chrome.runtime.sendMessage({ action: 'deleteNote', data: { noteId } }); showNotification && showNotification(' Note deleted successfully!', 'success'); await loadNotes(); }
    catch (error) { showNotification && showNotification('❌ Failed to delete note: ' + error.message, 'error'); }
  }

  async function toggleVoiceRecording() {
    const btn = document.getElementById('medha-voice-btn');
    if (state.isRecording) { stopVoiceRecording(); }
    else { await startVoiceRecording(btn); }
  }

  async function startVoiceRecording(btn) {
    try {
      pauseVideo();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream); state.audioChunks = [];
      state.mediaRecorder.ondataavailable = (event) => { state.audioChunks.push(event.data); };
      state.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        await transcribeAudio(audioBlob); stream.getTracks().forEach(track => track.stop());
        setTimeout(() => { if (!state.isUserTyping) resumeVideo(); }, 1000);
      };
      state.mediaRecorder.start(); state.isRecording = true;
      btn.classList.add('recording'); btn.innerHTML = '<span class="icon pulse">🔴</span>'; btn.title = 'Stop Recording';
      showNotification && showNotification('🎤 Recording...', 'info');
    } catch (error) {
      showNotification && showNotification('❌ Failed to access microphone', 'error'); resumeVideo();
    }
  }

  function stopVoiceRecording() {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop(); state.isRecording = false;
      const btn = document.getElementById('medha-voice-btn');
      btn.classList.remove('recording'); btn.innerHTML = '<span class="icon">🎤</span>'; btn.title = 'Voice Input';
    }
  }

  async function transcribeAudio(audioBlob) {
    state.isTranscribing = true; showNotification && showNotification('⏳ Transcribing...', 'info');
    try {
      const response = await chrome.runtime.sendMessage({ action: 'transcribeAudio', data: { audioBlob: Array.from(new Uint8Array(await audioBlob.arrayBuffer())) } });
      if (!response || response.error) throw new Error(response?.error || 'Transcription failed');
      const input = document.getElementById('medha-note-input'); input.value = response.text;
      showNotification && showNotification(' Transcription complete!', 'success');
    } catch (error) { showNotification && showNotification('❌ Transcription failed. Please try again.', 'error'); }
    finally { state.isTranscribing = false; }
  }

  async function rewriteNote() {
    const input = document.getElementById('medha-note-input');
    const text = input.value.trim(); if (!text) { showNotification && showNotification('⚠️ Please enter some text first', 'warning'); return; }
    const btn = document.getElementById('medha-rewrite-btn'); btn.disabled = true; btn.innerHTML = '<span class="medha-spinner"></span>';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'rewriteText', data: { text, context: 'note' } });
      if (response.improvement_applied) { input.value = response.rewritten_text; showNotification && showNotification('✨ Text enhanced!', 'success'); }
      else { showNotification && showNotification('👍 Text looks good already!', 'info'); }
    } catch (error) { showNotification && showNotification('❌ Failed to enhance text', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<span class="icon">✨</span>'; }
  }

  // Notes Preview & PDF
  function renderMarkdown(markdown) {
    if (!markdown) return '';
    let lines = markdown.split('\n'); let html = []; let listStack = [];
    function closeAllLists() { while (listStack.length > 0) { html.push('</ul>'); listStack.pop(); } }
    function formatInline(text) { text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); text = text.replace(/\*(.+?)\*/g, '<em>$1</em>'); text = text.replace(/`(.+?)`/g, '<code>$1</code>'); return text; }
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]; let trimmed = line.trim();
      if (trimmed.startsWith('### ')) { closeAllLists(); html.push(`<h3>${escapeHtml(trimmed.substring(4))}</h3>`); continue; }
      else if (trimmed.startsWith('## ')) { closeAllLists(); html.push(`<h2>${escapeHtml(trimmed.substring(3))}</h2>`); continue; }
      else if (trimmed.startsWith('# ')) { closeAllLists(); html.push(`<h1>${escapeHtml(trimmed.substring(2))}</h1>`); continue; }
      let listMatch = line.match(/^(\s*)([\*\-])\s+(.+)/); if (listMatch) {
        let indent = listMatch[1].length; let content = listMatch[3]; let level = Math.floor(indent / 2);
        while (listStack.length > level + 1) { html.push('</ul>'); listStack.pop(); }
        if (listStack.length <= level) { html.push('<ul>'); listStack.push(level); }
        content = formatInline(escapeHtml(content)); html.push(`<li>${content}</li>`); continue;
      }
      if (trimmed && !listMatch) closeAllLists();
      if (!trimmed) continue;
      if (!listMatch && trimmed) { let content = formatInline(escapeHtml(trimmed)); html.push(`<p>${content}</p>`); }
    }
    closeAllLists(); return html.join('\n');
  }

  function downloadNotesAsPDF(content, title) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document; if (!doc) return;
    const htmlContent = convertMarkdownToHTMLForPDF(content);
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:2cm;size:A4;}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.8;color:#1f2937;max-width:100%;margin:0 auto;padding:20px;word-wrap:break-word;overflow-wrap:break-word;}h1{color:#6366f1;font-size:28px;border-bottom:3px solid #6366f1;padding-bottom:10px;margin-top:0;margin-bottom:0.8em;word-wrap:break-word;}h2{color:#6366f1;font-size:22px;margin-top:1.2em;margin-bottom:0.5em;word-wrap:break-word;}h3{color:#4f46e5;font-size:18px;margin-top:1em;margin-bottom:0.4em;word-wrap:break-word;}p{margin:0.5em 0;font-size:15px;word-wrap:break-word;white-space:pre-wrap;}ul{margin:0.5em 0;padding-left:30px;list-style-type:disc;}ul ul{margin:0.3em 0;padding-left:25px;list-style-type:circle;}ul ul ul{list-style-type:square;}li{margin:0.4em 0;font-size:15px;word-wrap:break-word;line-height:1.6;}code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:'Courier New',monospace;font-size:14px;word-break:break-all;}strong{color:#374151;font-weight:600;}em{font-style:italic;color:#6b7280;}</style></head><body><h1>${ns.escapeHtml(title)}</h1>${htmlContent}</body></html>`);
    doc.close();
    setTimeout(() => { iframe.contentWindow?.print(); setTimeout(() => { document.body.removeChild(iframe); }, 100); }, 250);
  }

  function convertMarkdownToHTMLForPDF(markdown) {
    if (!markdown) return '';
    let lines = markdown.split('\n'); let html = []; let listStack = [];
    function closeAllLists() { while (listStack.length > 0) { html.push('</ul>'); listStack.pop(); } }
    function formatInline(text) { text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); text = text.replace(/\*(.+?)\*/g, '<em>$1</em>'); text = text.replace(/`(.+?)`/g, '<code>$1</code>'); return text; }
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]; let trimmed = line.trim();
      if (trimmed.startsWith('### ')) { closeAllLists(); html.push(`<h3>${escapeHtml(trimmed.substring(4))}</h3>`); continue; }
      else if (trimmed.startsWith('## ')) { closeAllLists(); html.push(`<h2>${escapeHtml(trimmed.substring(3))}</h2>`); continue; }
      else if (trimmed.startsWith('# ')) { closeAllLists(); html.push(`<h2>${escapeHtml(trimmed.substring(2))}</h2>`); continue; }
      let listMatch = line.match(/^(\s*)([\*\-])\s+(.+)/);
      if (listMatch) {
        let indent = listMatch[1].length; let content = listMatch[3]; let level = Math.floor(indent / 2);
        while (listStack.length > level + 1) { html.push('</ul>'); listStack.pop(); }
        if (listStack.length <= level) { html.push('<ul>'); listStack.push(level); }
        content = formatInline(escapeHtml(content)); html.push(`<li>${content}</li>`); continue;
      }
      if (trimmed && !listMatch) closeAllLists(); if (!trimmed) continue;
      if (!listMatch && trimmed) { let content = formatInline(escapeHtml(trimmed)); html.push(`<p>${content}</p>`); }
    }
    closeAllLists(); return html.join('\n');
  }

  function showNotesPreview(content, title) {
    const existing = document.getElementById('medha-notes-preview'); if (existing) existing.remove();
    let isEditing = false; let editableContent = content;
    const modal = document.createElement('div'); modal.id = 'medha-notes-preview'; modal.className = 'medha-notes-modal';
    modal.innerHTML = `
      <div class="medha-notes-modal-content">
        <div class="medha-notes-modal-header">
          <div><h2>${title}</h2><p>Review, edit and download your notes</p></div>
          <div class="medha-header-actions">
            <button id="medha-edit-toggle" class="medha-header-btn" title="Edit"><span class="icon">✏️</span></button>
            <button id="medha-minimize-preview" class="medha-header-btn" title="Minimize"><span class="icon">−</span></button>
          </div>
        </div>
        <div class="medha-notes-modal-body">
          <div class="medha-notes-content" id="medha-notes-rendered">${renderMarkdown(content)}</div>
          <textarea id="medha-notes-editor" class="medha-notes-edit-textarea" style="display:none;">${escapeHtml(content)}</textarea>
        </div>
        <div class="medha-notes-modal-footer">
          <button id="medha-download-notes" class="medha-btn-modern medha-btn-primary"><span class="icon">⬇</span> Download as PDF</button>
          <button id="medha-minimize-preview-btn" class="medha-btn-modern">Minimize</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const renderedDiv = document.getElementById('medha-notes-rendered'); const editorTextarea = document.getElementById('medha-notes-editor'); const editToggleBtn = document.getElementById('medha-edit-toggle');
    const minimizePreview = () => { modal.remove(); window.Medha.ui && window.Medha.ui.createFloatingIcon && window.Medha.ui.createFloatingIcon(); showNotification && showNotification('Preview minimized', 'info'); };
    editToggleBtn.addEventListener('click', () => { isEditing = !isEditing; if (isEditing) { renderedDiv.style.display = 'none'; editorTextarea.style.display = 'block'; editToggleBtn.innerHTML = '<span class="icon">👁️</span>'; editToggleBtn.title = 'Preview'; } else { editableContent = editorTextarea.value; renderedDiv.innerHTML = renderMarkdown(editableContent); renderedDiv.style.display = 'block'; editorTextarea.style.display = 'none'; editToggleBtn.innerHTML = '<span class="icon">✏️</span>'; editToggleBtn.title = 'Edit'; } });
    document.getElementById('medha-minimize-preview').addEventListener('click', minimizePreview);
    document.getElementById('medha-minimize-preview-btn').addEventListener('click', minimizePreview);
    document.getElementById('medha-download-notes').addEventListener('click', () => { const contentToDownload = isEditing ? editorTextarea.value : editableContent; downloadNotesAsPDF(contentToDownload, title); showNotification && showNotification(' Notes downloaded as PDF!', 'success'); });
    modal.addEventListener('click', (e) => { if (e.target === modal) minimizePreview(); });
  }

  async function prettifyNotes() {
    if (!state.currentTutorialId) return;
    const btn = document.getElementById('medha-prettify-notes'); btn.disabled = true; btn.innerHTML = '<span class="medha-spinner"></span> Organizing...';
    try { const response = await chrome.runtime.sendMessage({ action: 'prettifyNotes', data: { tutorialId: state.currentTutorialId } }); showNotification && showNotification(' Notes organized successfully!', 'success'); showNotesPreview(response.prettified_notes, 'Organized Notes'); }
    catch (error) { showNotification && showNotification('❌ Failed: ' + error.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<span class="icon">✨</span> Organize'; }
  }

  async function generateDetailedNotes() {
    if (!state.currentTutorialId) return;
    const btn = document.getElementById('medha-detailed-notes'); btn.disabled = true; btn.innerHTML = '<span class="medha-spinner"></span> Generating...';
    try { const response = await chrome.runtime.sendMessage({ action: 'generateDetailedNotes', data: { tutorialId: state.currentTutorialId } }); showNotification && showNotification(' Detailed notes generated!', 'success'); showNotesPreview(response.detailed_notes, 'Detailed Study Notes'); }
    catch (error) { showNotification && showNotification('❌ Failed: ' + error.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<span class="icon">📚</span> Expand'; }
  }

  ns.features.addNote = addNote;
  ns.features.toggleVoiceRecording = toggleVoiceRecording;
  ns.features.rewriteNote = rewriteNote;
  ns.features.loadNotes = loadNotes;
  ns.features.prettifyNotes = prettifyNotes;
  ns.features.generateDetailedNotes = generateDetailedNotes;
})();


