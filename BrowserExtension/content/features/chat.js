(function setupChatFeature() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  ns.features = ns.features || {};
  const { state } = ns;
  const { showNotification, escapeHtml } = ns;
  const { getCurrentTime, resumeVideo } = ns.youtube;

  // Enhanced markdown renderer for chat messages
  function renderChatMarkdown(markdown) {
    if (!markdown) return '';
    
    // Split into lines for block-level processing
    let originalLines = markdown.split('\n');
    let lines = markdown.split('\n');
    let html = [];
    let listStack = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLang = '';
    
    function closeAllLists() {
      while (listStack.length > 0) {
        html.push('</ul>');
        listStack.pop();
      }
    }
    
    function formatInline(text) {
      // Process markdown patterns: extract content, escape it, then build HTML
      // This approach processes patterns in order and escapes content safely
      
      // Inline code (`code`) - process first
      text = text.replace(/`([^`]+)`/g, (match, code) => {
        return '<code class="medha-code-inline">' + escapeHtml(code) + '</code>';
      });
      
      // Bold (**text** or __text__) - must be before italic to avoid conflicts
      text = text.replace(/\*\*([^*]+)\*\*/g, (match, bold) => {
        return '<strong>' + escapeHtml(bold) + '</strong>';
      });
      text = text.replace(/__([^_]+)__/g, (match, bold) => {
        return '<strong>' + escapeHtml(bold) + '</strong>';
      });
      
      // Italic (*text* or _text_) - after bold
      text = text.replace(/\*([^*]+)\*/g, (match, italic) => {
        return '<em>' + escapeHtml(italic) + '</em>';
      });
      text = text.replace(/_([^_]+)_/g, (match, italic) => {
        return '<em>' + escapeHtml(italic) + '</em>';
      });
      
      // Links [text](url)
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="medha-link">' + escapeHtml(linkText) + '</a>';
      });
      
      // Now we need to escape any remaining raw HTML that wasn't part of markdown
      // Our markdown processing already created safe HTML tags with escaped content
      // We just need to escape any remaining raw HTML tags that might exist
      // Split text by our markdown-generated tags and escape everything else
      const parts = [];
      let lastIndex = 0;
      // Match our markdown-generated tags: <code>, <strong>, <em>, <a>
      const tagRegex = /<(code|strong|em|a)(\s[^>]*)?>.*?<\/\1>|<\/(code|strong|em|a)>/gi;
      let match;
      
      while ((match = tagRegex.exec(text)) !== null) {
        // Add text before tag (escaped)
        if (match.index > lastIndex) {
          const beforeText = text.substring(lastIndex, match.index);
          if (beforeText) {
            parts.push(escapeHtml(beforeText));
          }
        }
        // Add the markdown-generated tag (already safe)
        parts.push(match[0]);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text after last tag
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        if (remainingText) {
          parts.push(escapeHtml(remainingText));
        }
      }
      
      // If no markdown tags found, escape everything
      if (parts.length === 0) {
        return escapeHtml(text);
      }
      
      return parts.join('');
    }
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmed = line.trim();
      
      // Handle code blocks (```)
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          // Close code block
          inCodeBlock = false;
          const codeContent = escapeHtml(codeBlockContent.join('\n'));
          html.push(`<pre><code class="medha-code-block">${codeContent}</code></pre>`);
          codeBlockContent = [];
          codeBlockLang = '';
          continue;
        } else {
          // Open code block
          inCodeBlock = true;
          codeBlockLang = (trimmed && trimmed.length > 3) ? trimmed.substring(3).trim() : '';
          codeBlockContent = [];
          continue;
        }
      }
      
      if (inCodeBlock) {
        // Store raw original line for code blocks (will escape when closing)
        codeBlockContent.push(originalLines[i]);
        continue;
      }
      
      // Headers
      if (trimmed && trimmed.startsWith('### ')) {
        closeAllLists();
        html.push(`<h3 class="medha-chat-h3">${formatInline(trimmed.substring(4) || '')}</h3>`);
        continue;
      } else if (trimmed && trimmed.startsWith('## ')) {
        closeAllLists();
        html.push(`<h2 class="medha-chat-h2">${formatInline(trimmed.substring(3) || '')}</h2>`);
        continue;
      } else if (trimmed && trimmed.startsWith('# ')) {
        closeAllLists();
        html.push(`<h1 class="medha-chat-h1">${formatInline(trimmed.substring(2) || '')}</h1>`);
        continue;
      }
      
      // Lists (- or *)
      let listMatch = line.match(/^(\s*)([\*\-]|\d+\.)\s+(.+)/);
      if (listMatch) {
        let indent = listMatch[1].length;
        let marker = listMatch[2];
        let content = listMatch[3];
        let level = Math.floor(indent / 2);
        
        while (listStack.length > level + 1) {
          html.push('</ul>');
          listStack.pop();
        }
        
        if (listStack.length <= level) {
          html.push('<ul class="medha-chat-list">');
          listStack.push(level);
        }
        
        content = formatInline(content);
        html.push(`<li class="medha-chat-list-item">${content}</li>`);
        continue;
      }
      
      // Close lists if we hit a non-list line
      if (trimmed && !listMatch) {
        closeAllLists();
      }
      
      // Empty lines become breaks
      if (!trimmed) {
        html.push('<br>');
        continue;
      }
      
      // Regular paragraphs
      if (!listMatch && trimmed) {
        let content = formatInline(trimmed);
        html.push(`<p class="medha-chat-paragraph">${content}</p>`);
      }
    }
    
    // Close any remaining lists
    closeAllLists();
    
    // Close any open code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      const codeContent = escapeHtml(codeBlockContent.join('\n'));
      html.push(`<pre><code class="medha-code-block">${codeContent}</code></pre>`);
    }
    
    return html.join('');
  }

  function scrollChatToBottom() {
    const chatContainer = document.getElementById('medha-chat-messages');
    if (chatContainer) { requestAnimationFrame(() => { chatContainer.scrollTop = chatContainer.scrollHeight; }); }
  }

  function addChatMessage(role, content) {
    const container = document.getElementById('medha-chat-messages');
    const messageId = 'msg-' + Date.now();
    const welcome = container.querySelector('.medha-empty-state'); 
    if (welcome) welcome.remove();
    
    const wrapper = document.createElement('div'); 
    wrapper.id = messageId; 
    wrapper.className = `medha-chat-message ${role === 'user' ? 'medha-user-message' : 'medha-ai-message'}`;
    
    const label = document.createElement('div'); 
    label.className = 'medha-message-label';
    const icon = document.createElement('span'); 
    icon.className = 'medha-message-icon'; 
    icon.textContent = role === 'user' ? '👤' : '🤖';
    const labelText = document.createElement('span'); 
    labelText.textContent = role === 'user' ? 'You' : 'AI Assistant';
    label.appendChild(icon); 
    label.appendChild(labelText);
    
    const bubble = document.createElement('div'); 
    bubble.className = role === 'user' ? 'medha-message-user' : 'medha-message-ai';
    
    // For AI messages, render markdown; for user messages, use plain text
    if (role === 'assistant' || role === 'ai') {
      bubble.className += ' medha-markdown-content';
      bubble.innerHTML = renderChatMarkdown(content);
    } else {
      bubble.textContent = content;
    }
    
    wrapper.appendChild(label); 
    wrapper.appendChild(bubble); 
    container.appendChild(wrapper);
    
    requestAnimationFrame(() => { 
      scrollChatToBottom(); 
      setTimeout(scrollChatToBottom, 50); 
      setTimeout(scrollChatToBottom, 150); 
      setTimeout(scrollChatToBottom, 300); 
    });
    
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


