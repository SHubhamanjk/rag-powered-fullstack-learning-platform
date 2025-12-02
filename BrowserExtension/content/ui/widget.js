(function setupWidgetUI() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  const { state } = ns;
  const { escapeHtml, showNotification } = ns;
  const { getCurrentTime, getVideoPlayer, formatTime } = ns.youtube;

  function updateCurrentTime() {
    setInterval(() => {
      const timeDisplay = document.getElementById('current-time');
      if (timeDisplay) { timeDisplay.textContent = getCurrentTime(); }
    }, 1000);
  }

  function switchTab(tabName) {
    document.querySelectorAll('.medha-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.medha-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
      content.classList.toggle('hidden', content.id !== `tab-${tabName}`);
    });
    if (tabName === 'quiz') {
      prefillQuizTimestamps(); ns.features && ns.features.loadQuizzes && ns.features.loadQuizzes();
    } else if (tabName === 'chat') {
      ns.features && ns.features.loadChatHistory && ns.features.loadChatHistory();
      requestAnimationFrame(() => {
        ns.features && ns.features.scrollChatToBottom && ns.features.scrollChatToBottom();
        setTimeout(() => ns.features && ns.features.scrollChatToBottom && ns.features.scrollChatToBottom(), 100);
        setTimeout(() => ns.features && ns.features.scrollChatToBottom && ns.features.scrollChatToBottom(), 300);
        setTimeout(() => ns.features && ns.features.scrollChatToBottom && ns.features.scrollChatToBottom(), 500);
        setTimeout(() => ns.features && ns.features.scrollChatToBottom && ns.features.scrollChatToBottom(), 800);
      });
    } else if (tabName === 'notes') {
      ns.features && ns.features.loadNotes && ns.features.loadNotes();
    } else if (tabName === 'mindmap') {
      ns.features && ns.features.loadMindmaps && ns.features.loadMindmaps();
    }
  }

  function prefillQuizTimestamps() {
    const fromInput = document.getElementById('quiz-from-time');
    const toInput = document.getElementById('quiz-to-time');
    if (!fromInput || !toInput) return;
    if (!fromInput.value) { fromInput.value = '0:00'; }
    if (!toInput.value) {
      const player = getVideoPlayer();
      if (player && player.duration) { toInput.value = formatTime(Math.floor(player.duration)); }
      else { toInput.value = '5:00'; }
    }
  }

  function attachEventListeners() {
    document.getElementById('medha-minimize').addEventListener('click', toggleMinimize);
    
    // Fuel the Mission button
    document.getElementById('medha-fuel-mission').addEventListener('click', () => {
      if (ns.features && ns.features.showFuelMissionModal) {
        ns.features.showFuelMissionModal();
      }
    });
    loadAndSetupGroupSelector();
    document.querySelectorAll('.medha-tab').forEach(tab => { tab.addEventListener('click', () => switchTab(tab.dataset.tab)); });
    document.getElementById('medha-add-note').addEventListener('click', () => ns.features && ns.features.addNote && ns.features.addNote());
    document.getElementById('medha-voice-btn').addEventListener('click', () => ns.features && ns.features.toggleVoiceRecording && ns.features.toggleVoiceRecording());
    document.getElementById('medha-rewrite-btn').addEventListener('click', () => ns.features && ns.features.rewriteNote && ns.features.rewriteNote());

    // Image upload handlers
    const imageUpload = document.getElementById('medha-image-upload');
    const imageBtn = document.getElementById('medha-image-btn');
    
    if (imageUpload) {
      imageUpload.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file && ns.features && ns.features.processImageFile) {
          ns.features.processImageFile(file);
        }
        e.target.value = '';
      });
    }
    
    // Handle button click to trigger file input
    if (imageBtn && imageUpload) {
      imageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        imageUpload.click();
      });
    }

    const removeImageBtn = document.getElementById('medha-remove-image');
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', () => {
        if (ns.features && ns.features.removeImage) {
          ns.features.removeImage();
        }
      });
    }

    // Drag and drop handlers
    const noteInputArea = document.querySelector('[data-note-input-area]');
    if (noteInputArea) {
      noteInputArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) {
          noteInputArea.classList.add('medha-dragging');
        }
      });
      noteInputArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      noteInputArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        noteInputArea.classList.remove('medha-dragging');
      });
      noteInputArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        noteInputArea.classList.remove('medha-dragging');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/') && ns.features && ns.features.processImageFile) {
          ns.features.processImageFile(files[0]);
        }
      });
    }

    // Paste handler
    const noteInput = document.getElementById('medha-note-input');
    noteInput.addEventListener('focus', () => { ns.youtube.pauseVideo(); state.isUserTyping = true; });
    noteInput.addEventListener('input', () => {
      if (!state.isUserTyping) { ns.youtube.pauseVideo(); state.isUserTyping = true; }
      if (state.typingTimer) { clearTimeout(state.typingTimer); }
      state.typingTimer = setTimeout(() => { state.isUserTyping = false; ns.youtube.resumeVideo(); }, 2000);
    });
    noteInput.addEventListener('blur', () => {
      if (state.typingTimer) { clearTimeout(state.typingTimer); }
      setTimeout(() => { if (!state.isUserTyping && !state.isRecording) { ns.youtube.resumeVideo(); } }, 500);
    });
    noteInput.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 'Enter') { ns.features && ns.features.addNote && ns.features.addNote(); } });
    noteInput.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file && ns.features && ns.features.processImageFile) {
            ns.features.processImageFile(file);
          }
          break;
        }
      }
    });

    document.getElementById('medha-send-chat').addEventListener('click', () => ns.features && ns.features.sendChatMessage && ns.features.sendChatMessage());
    const chatInput = document.getElementById('medha-chat-input');
    chatInput.addEventListener('focus', () => { ns.youtube.pauseVideo(); state.isUserTyping = true; });
    chatInput.addEventListener('input', () => {
      if (!state.isUserTyping) { ns.youtube.pauseVideo(); state.isUserTyping = true; }
      if (state.typingTimer) { clearTimeout(state.typingTimer); }
      state.typingTimer = setTimeout(() => { state.isUserTyping = false; ns.youtube.resumeVideo(); }, 2000);
    });
    chatInput.addEventListener('blur', () => {
      if (state.typingTimer) { clearTimeout(state.typingTimer); }
      setTimeout(() => { if (!state.isUserTyping && !state.isRecording) { ns.youtube.resumeVideo(); } }, 500);
    });
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { ns.features && ns.features.sendChatMessage && ns.features.sendChatMessage(); } });

    document.getElementById('medha-prettify-notes').addEventListener('click', () => ns.features && ns.features.prettifyNotes && ns.features.prettifyNotes());
    document.getElementById('medha-detailed-notes').addEventListener('click', () => ns.features && ns.features.generateDetailedNotes && ns.features.generateDetailedNotes());
    document.getElementById('medha-generate-quiz').addEventListener('click', () => ns.features && ns.features.generateQuiz && ns.features.generateQuiz());
    document.getElementById('medha-generate-mindmap').addEventListener('click', () => ns.features && ns.features.generateMindmap && ns.features.generateMindmap());
  }

  async function loadAndSetupGroupSelector() {
    const groupSelect = document.getElementById('medha-group-select'); if (!groupSelect) return;
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getMyTutorials' });
      const tutorials = response.tutorials || [];
      const uniqueGroups = [...new Set(tutorials.map(t => t.group).filter(g => g))]; uniqueGroups.sort();
      groupSelect.innerHTML = `
        ${uniqueGroups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('')}
        <option value="__custom__">+ Add New Group</option>
      `;
      const currentGroup = state.currentTutorialGroup || 'general';
      if (uniqueGroups.includes(currentGroup)) { groupSelect.value = currentGroup; }
      else { const opt = document.createElement('option'); opt.value = currentGroup; opt.textContent = currentGroup; groupSelect.insertBefore(opt, groupSelect.lastElementChild); groupSelect.value = currentGroup; }
      groupSelect.addEventListener('change', async (e) => {
        if (e.target.value === '__custom__') {
          const newGroup = prompt('Enter new group name:');
          if (newGroup && newGroup.trim()) { await updateTutorialGroup(newGroup.trim()); }
          else { groupSelect.value = state.currentTutorialGroup; }
        } else { await updateTutorialGroup(e.target.value); }
      });
    } catch (error) {
      groupSelect.innerHTML = `<option value="${escapeHtml(state.currentTutorialGroup)}">${escapeHtml(state.currentTutorialGroup)}</option>`;
      groupSelect.value = state.currentTutorialGroup;
    }
  }

  async function updateTutorialGroup(newGroup) {
    if (!state.currentTutorialId || !newGroup) return;
    const groupSelect = document.getElementById('medha-group-select');
    const oldGroup = state.currentTutorialGroup;
    try {
      await chrome.runtime.sendMessage({ action: 'updateTutorial', data: { tutorialId: state.currentTutorialId, group: newGroup } });
      state.currentTutorialGroup = newGroup;
      const videoUrl = window.Medha.youtube.getNormalizedYouTubeUrl();
      if (!videoUrl) return;
      const saved = await chrome.storage.local.get([`tutorial_${videoUrl}`]);
      if (saved[`tutorial_${videoUrl}`]) { saved[`tutorial_${videoUrl}`].group = newGroup; await chrome.storage.local.set(saved); }
      if (!Array.from(groupSelect.options).some(opt => opt.value === newGroup && opt.value !== '__custom__')) {
        await loadAndSetupGroupSelector();
      } else { groupSelect.value = newGroup; }
      showNotification && showNotification(' Group updated!', 'success');
    } catch (error) {
      showNotification && showNotification('❌ Failed to update: ' + error.message, 'error');
      state.currentTutorialGroup = oldGroup; groupSelect.value = oldGroup;
    }
  }

  function createFloatingWidget(tutorialTitle) {
    if (document.getElementById('medha-widget')) return;
    const widget = document.createElement('div'); widget.id = 'medha-widget'; widget.className = 'medha-widget';
    widget.innerHTML = `
      <div class="medha-header">
        <div class="medha-header-title">
          <span class="medha-logo"><img src="${chrome.runtime.getURL('assets/logo.png')}" alt="Medha.ai" style="width: 100%; height: 100%; object-fit: contain;" /></span>
          <div class="medha-title-text">
            <div class="medha-brand">Medha.ai</div>
            <div class="medha-session-info">
              <div class="medha-session-title" id="medha-session-title">${escapeHtml(tutorialTitle || 'Session Active')}</div>
              <div class="medha-session-group-container">
                <span class="medha-group-label">Group:</span>
                <select id="medha-group-select" class="medha-group-select"><option value="">Loading...</option></select>
              </div>
            </div>
          </div>
        </div>
        <div class="medha-header-actions">
          <button id="medha-fuel-mission" class="medha-header-btn" title="Fuel the Mission"><span class="icon">⚡</span></button>
          <button id="medha-minimize" class="medha-header-btn" title="Minimize"><span class="icon">−</span></button>
        </div>
      </div>
      <div class="medha-body">
        <div class="medha-tabs">
          <button class="medha-tab active" data-tab="notes"><span class="tab-icon"></span> Notes</button>
          <button class="medha-tab" data-tab="chat"><span class="tab-icon"></span> Chat</button>
          <button class="medha-tab" data-tab="quiz"><span class="tab-icon"></span> Quiz</button>
          <button class="medha-tab" data-tab="mindmap"><span class="tab-icon"></span> Mindmap</button>
        </div>
        <div id="tab-notes" class="medha-tab-content active">
          <div class="medha-note-input-card">
            <div class="medha-time-display"><span class="time-icon">⏱️</span><span>At <span id="current-time" class="time-value">0:00</span></span></div>
            <div class="medha-input-wrapper" data-note-input-area>
              <textarea id="medha-note-input" class="medha-textarea-modern" placeholder="What's important here? Jot it down...." rows="3"></textarea>
              <div class="medha-input-actions">
                <input type="file" id="medha-image-upload" accept="image/*" style="display: none;" />
                <button type="button" id="medha-image-btn" class="medha-icon-action-btn" title="Upload Image"><span class="icon">🖼️</span></button>
                <button id="medha-voice-btn" class="medha-icon-action-btn" title="Voice Input"><span class="icon">🎤</span></button>
                <button id="medha-rewrite-btn" class="medha-icon-action-btn" title="Enhance with AI"><span class="icon">✨</span></button>
              </div>
            </div>
            <div id="medha-image-preview" class="medha-image-preview" style="display: none;">
              <img id="medha-preview-img" src="" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 8px; margin-top: 8px;" />
              <button id="medha-remove-image" class="medha-remove-image-btn" title="Remove">×</button>
            </div>
            <button id="medha-add-note" class="medha-btn-modern medha-btn-primary">Add Note</button>
          </div>
          <div class="medha-actions-bar">
            <button id="medha-prettify-notes" class="medha-action-btn" title="Organize Notes"><span class="icon">✨</span> Organize</span></button>
            <button id="medha-detailed-notes" class="medha-action-btn" title="Detailed Notes"><span class="icon">📚</span> Expand</button>
          </div>
          <div id="medha-notes-list" class="medha-notes-list"><div class="medha-empty-state"><div class="medha-empty-icon"></div><div class="medha-empty-text">No notes yet. Start taking notes!</div></div></div>
        </div>
        <div id="tab-chat" class="medha-tab-content">
          <div class="medha-chat-container">
            <div id="medha-chat-messages" class="medha-chat-messages"><div class="medha-empty-state"><div class="medha-empty-icon"></div><div class="medha-empty-text">Ask me anything about this tutorial!</div></div></div>
            <div class="medha-chat-input-container"><input id="medha-chat-input" class="medha-chat-input" placeholder="Ask a question about the video..." type="text" /><button id="medha-send-chat" class="medha-send-btn"><span class="icon">→</span></button></div>
          </div>
        </div>
        <div id="tab-quiz" class="medha-tab-content">
          <div class="medha-quiz-controls">
            <h3>Generate Quiz</h3>
            <p class="medha-quiz-hint">Create a practice test from any section of the video. Timestamps define the content range for quiz generation.</p>
            <div class="medha-time-range">
              <div class="medha-time-input"><label>From</label><input type="text" id="quiz-from-time" placeholder="0:00" /></div>
              <div class="medha-time-input"><label>To</label><input type="text" id="quiz-to-time" placeholder="5:00" /></div>
            </div>
            <button id="medha-generate-quiz" class="medha-btn-modern medha-btn-primary">Generate Quiz</button>
          </div>
          <div class="medha-divider"></div>
          <div class="medha-quiz-list-section"><h3>Previous Quizzes</h3><div id="medha-quiz-list" class="medha-quiz-list"></div></div>
        </div>
        <div id="tab-mindmap" class="medha-tab-content">
          <div class="medha-mindmap-container">
            <button id="medha-generate-mindmap" class="medha-btn-modern medha-btn-primary"><span class="icon"></span> Generate Mindmap</button>
            <div class="medha-divider"></div>
            <div class="medha-mindmap-list-section"><h3>Your Mindmaps</h3><div id="medha-mindmap-list" class="medha-mindmap-list"></div></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(widget);
    attachEventListeners(); updateCurrentTime(); prefillQuizTimestamps();
  }

  function toggleMinimize() {
    const widget = document.getElementById('medha-widget'); if (!widget) return;
    if (state.isMinimized) {
      widget.style.display = 'flex'; const fab = document.getElementById('medha-fab'); if (fab) fab.remove(); state.isMinimized = false;
    } else {
      widget.style.display = 'none'; window.Medha.ui && window.Medha.ui.createFloatingIcon && window.Medha.ui.createFloatingIcon(); state.isMinimized = true;
    }
  }

  function closeWidget() {
    const widget = document.getElementById('medha-widget'); if (widget) widget.remove();
    const fab = document.getElementById('medha-fab'); if (fab) fab.remove();
    state.isMinimized = false;
  }

  ns.ui = ns.ui || {};
  ns.ui.createFloatingWidget = createFloatingWidget;
  ns.ui.toggleMinimize = toggleMinimize;
  ns.ui.switchTab = switchTab;
  ns.ui.prefillQuizTimestamps = prefillQuizTimestamps;
  ns.ui.updateCurrentTime = updateCurrentTime;
  ns.ui.closeWidget = closeWidget;
  ns.ui.loadAndSetupGroupSelector = loadAndSetupGroupSelector;
  ns.ui.updateTutorialGroup = updateTutorialGroup;
})();


