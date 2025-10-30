(function setupChatFeature() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  ns.features = ns.features || {};
  const { state } = ns;
  const { showNotification } = ns;
  const { getCurrentTime, resumeVideo } = ns.youtube;

  function scrollChatToBottom() {
    const chatContainer = document.getElementById('medha-chat-messages');
    if (chatContainer) { requestAnimationFrame(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }); }
  }

  function addChatMessage(role, content) {
    const container = document.getElementById('medha-chat-messages');
    const messageId = 'msg-' + Date.now();
    const welcome = container.querySelector('.medha-empty-state'); if (welcome) welcome.remove();
    const wrapper = document.createElement('div'); wrapper.id = messageId; wrapper.className = `medha-chat-message ${role === 'user' ? 'medha-user-message' : 'medha-ai-message'}`;
    const label = document.createElement('div'); label.className = 'medha-message-label';
    const icon = document.createElement('span'); icon.className = 'medha-message-icon'; icon.textContent = role === 'user' ? '👤' : '🤖';
    const labelText = document.createElement('span'); labelText.textContent = role === 'user' ? 'You' : 'AI Assistant';
    label.appendChild(icon); label.appendChild(labelText);
    const bubble = document.createElement('div'); bubble.className = role === 'user' ? 'medha-message-user' : 'medha-message-ai'; bubble.textContent = content;
    wrapper.appendChild(label); wrapper.appendChild(bubble); container.appendChild(wrapper);
    requestAnimationFrame(() => { scrollChatToBottom(); setTimeout(scrollChatToBottom, 50); setTimeout(scrollChatToBottom, 150); setTimeout(scrollChatToBottom, 300); });
    return messageId;
  }

  async function sendChatMessage() {
    if (!state.currentTutorialId) return;
    const input = document.getElementById('medha-chat-input'); const question = input.value.trim(); if (!question) return;
    addChatMessage('user', question); input.value = '';
    state.isUserTyping = false; if (state.typingTimer) clearTimeout(state.typingTimer);
    setTimeout(() => { if (!state.isRecording) resumeVideo(); }, 500);
    try {
      const response = await chrome.runtime.sendMessage({ action: 'chatWithAI', data: { tutorialId: state.currentTutorialId, question, currentTimestamp: getCurrentTime() } });
      addChatMessage('assistant', response.answer); setTimeout(scrollChatToBottom, 100);
    } catch (error) {
      addChatMessage('assistant', '❌ Error: ' + error.message); setTimeout(scrollChatToBottom, 100);
    }
  }

  async function loadChatHistory() {
    if (!state.currentTutorialId) return;
    const container = document.getElementById('medha-chat-messages'); if (!container) return;
    container.innerHTML = '<div class="medha-skeleton-loader"><div class="medha-skeleton-message"></div><div class="medha-skeleton-message"></div><div class="medha-skeleton-message"></div></div>';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getChatHistory', data: { tutorialId: state.currentTutorialId } });
      const history = response.chat_history || []; container.innerHTML = '';
      if (history.length > 0) {
        history.forEach(msg => { addChatMessage(msg.role, msg.content); });
        requestAnimationFrame(() => { scrollChatToBottom(); setTimeout(scrollChatToBottom, 100); setTimeout(scrollChatToBottom, 300); setTimeout(scrollChatToBottom, 500); setTimeout(scrollChatToBottom, 800); setTimeout(scrollChatToBottom, 1000); });
      } else {
        container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">💬</div><div class="medha-empty-text">Ask me anything about this tutorial!</div></div>';
      }
    } catch (error) {
      container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">💬</div><div class="medha-empty-text">Ask me anything about this tutorial!</div></div>';
    }
  }

  ns.features.scrollChatToBottom = scrollChatToBottom;
  ns.features.addChatMessage = addChatMessage;
  ns.features.sendChatMessage = sendChatMessage;
  ns.features.loadChatHistory = loadChatHistory;
})();


