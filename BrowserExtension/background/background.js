// Background Service Worker
// Handles API communication and message passing

// Import API service
importScripts('../lib/api.js');

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Handle async messages
  handleMessage(request)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      sendResponse({ error: error.message });
    });
  
  // Keep channel open for async response
  return true;
});

// Main message handler
async function handleMessage(request) {
  const { action, data } = request;

  try {
    switch (action) {
      // ========================================================================
      // TUTORIAL SUPPORT
      // ========================================================================
      
      case 'createTutorial':
        return await api.createTutorial(data.tutorialLink, data.group);
      
      case 'updateTutorial':
        return await api.updateTutorial(data.tutorialId, data);
      
      case 'addNote':
        return await api.addNote(data.tutorialId, data.note, data.timestamp);
      
      case 'getNotes':
        return await api.getNotes(data.tutorialId);
      
      case 'updateNote':
        return await api.updateNote(data.noteId, data.updatedText);
      
      case 'deleteNote':
        return await api.deleteNote(data.noteId);
      
      case 'chatWithAI':
        return await api.chatWithAI(
          data.tutorialId,
          data.question,
          data.currentTimestamp
        );
      
      case 'getChatHistory':
        return await api.getChatHistory(data.tutorialId);
      
      case 'generateQuiz':
        return await api.generateQuiz(
          data.tutorialId,
          data.fromTimestamp,
          data.toTimestamp
        );
      
      case 'getTutorialQuizzes':
        return await api.getTutorialQuizzes(data.tutorialId);
      
      case 'getQuizDetails':
        return await api.getQuizDetails(data.quizId);
      
      case 'evaluateQuiz':
        return await api.evaluateQuiz(data.quizId, data.answers);
      
      case 'generateMindmap':
        return await api.generateMindmap(data.tutorialId);
      
      case 'getMindmaps':
        return await api.getMindmaps(data.tutorialId);
      
      case 'getMyTutorials':
        return await api.getMyTutorials();
      
      case 'findTutorialByLink':
        return await api.findTutorialByLink(data.tutorialLink);
      
      case 'prettifyNotes':
        return await api.prettifyNotes(data.tutorialId);
      
      case 'generateDetailedNotes':
        return await api.generateDetailedNotes(data.tutorialId);
      
      case 'transcribeAudio':
        return await transcribeAudioHandler(data);
      
      case 'rewriteText':
        return await api.request('/utility/rewrite-text', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      
      // ========================================================================
      // UNKNOWN ACTION
      // ========================================================================
      
      case 'openPopup':
        if (data && data.showFab && sender?.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, { action: 'showFab' });
          return { success: true };
        }

        // Open extension popup by opening extension's popup.html in new tab
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html') });
        return { success: true };
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    throw error;
  }
}

// Listen for extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  // Don't auto-open popup on install - user will click extension icon when ready
  if (details.reason === 'install') {
    // Extension installed - user can click icon to open popup
  } else if (details.reason === 'update') {
    // Extension updated
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'showFab' });
});

// Audio transcription handler with fallback
async function transcribeAudioHandler(data) {
  const { audioBlob } = data;
  
  // Convert array back to Blob
  const blob = new Blob([new Uint8Array(audioBlob)], { type: 'audio/webm' });
  const formData = new FormData();
  
  const token = await api.getAuthToken();
  
  // Try primary endpoint
  try {
    formData.append('audio', blob, 'recording.webm');
    
    const response = await fetch(`${api.baseURL}/stt/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Primary STT failed');
    return await response.json();
  } catch (primaryError) {
    
    // Try fallback endpoint
    const fallbackFormData = new FormData();
    fallbackFormData.append('file', blob, 'recording.webm');
    
    const fallbackResponse = await fetch(`${api.baseURL}/memory-vault/transcribe`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: fallbackFormData
    });
    
    if (!fallbackResponse.ok) {
      throw new Error('Both STT endpoints failed');
    }
    
    return await fallbackResponse.json();
  }
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
});

