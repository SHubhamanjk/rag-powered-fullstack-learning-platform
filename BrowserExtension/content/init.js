(function initMedhaExtension() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  const { state } = ns;
  const { showNotification } = ns;
  const yt = ns.youtube;

  function checkPageAndStart() {
    const videoId = yt.getYouTubeVideoId();
    if (!videoId) return;
    state.lastVideoUrl = yt.getNormalizedYouTubeUrl() || window.location.href;
    checkExistingSession();
    setupURLChangeDetection();
  }

  function setupURLChangeDetection() {
    let lastUrl = window.location.href;
    const originalPushState = history.pushState; const originalReplaceState = history.replaceState;
    history.pushState = function() { originalPushState.apply(this, arguments); handleUrlChange(); };
    history.replaceState = function() { originalReplaceState.apply(this, arguments); handleUrlChange(); };
    window.addEventListener('popstate', handleUrlChange);
    setInterval(() => { if (window.location.href !== lastUrl) { lastUrl = window.location.href; handleUrlChange(); } }, 1000);
    function handleUrlChange() {
      const currentUrl = window.location.href;
      if (currentUrl.includes('/watch?v=')) {
        const currentVideoId = yt.getYouTubeVideoId();
        const lastVideoId = yt.extractVideoId(state.lastVideoUrl);
        if (currentVideoId && currentVideoId !== lastVideoId) {
          state.lastVideoUrl = yt.getNormalizedYouTubeUrl() || currentUrl;
          reinitializeForNewVideo();
        }
      } else {
        const widget = document.getElementById('medha-widget'); const fab = document.getElementById('medha-fab');
        if (widget || fab) { cleanupSession(); }
      }
    }
  }

  function cleanupSession() {
    const widget = document.getElementById('medha-widget'); const fab = document.getElementById('medha-fab');
    if (widget) widget.remove(); if (fab) fab.remove();
    state.currentTutorialId = null; state.currentTutorialGroup = 'general'; state.isMinimized = false; state.notes = []; state.chatMessages = [];
    state.isInitializing = false; state.isRecording = false; state.isTranscribing = false; state.mediaRecorder = null; state.audioChunks = [];
    state.wasPlayingBeforePause = false; state.typingTimer = null; state.isUserTyping = false;
  }

  async function reinitializeForNewVideo() {
    cleanupSession();
    setTimeout(() => { checkExistingSession(); }, 500);
  }

  async function checkExistingSession() {
    if (state.isInitializing || state.currentTutorialId) return;
    const videoUrl = yt.getNormalizedYouTubeUrl(); if (!videoUrl) return;
    const authResult = await chrome.storage.local.get(['authToken']);
    const isAuthenticated = !!authResult.authToken;
    if (isAuthenticated) {
      const savedSession = await chrome.storage.local.get([`tutorial_${videoUrl}`]);
      if (savedSession[`tutorial_${videoUrl}`]) { window.Medha.ui && window.Medha.ui.createFloatingIcon && window.Medha.ui.createFloatingIcon(); return true; }
      try {
        const tutorial = await chrome.runtime.sendMessage({ action: 'findTutorialByLink', data: { tutorialLink: videoUrl } });
        if (tutorial) {
          await chrome.storage.local.set({ [`tutorial_${videoUrl}`]: { tutorial_id: tutorial.tutorial_id, title: tutorial.title, group: tutorial.group || 'general', timestamp: Date.now() } });
        }
      } catch (e) {}
    }
    window.Medha.ui && window.Medha.ui.createFloatingIcon && window.Medha.ui.createFloatingIcon();
    return false;
  }

  async function createSessionFromFAB() {
    const authResult = await chrome.storage.local.get(['authToken']);
    if (!authResult.authToken) { showNotification && showNotification('⚠️ Please login to use Medha.ai features', 'error'); chrome.runtime.sendMessage({ action: 'openPopup' }); return; }
    if (state.isInitializing) return;
    if (state.currentTutorialId) { window.Medha.ui && window.Medha.ui.toggleMinimize && window.Medha.ui.toggleMinimize(); return; }
    state.isInitializing = true;
    const videoUrl = yt.getNormalizedYouTubeUrl(); if (!videoUrl) { state.isInitializing = false; return; }
    const savedSession = await chrome.storage.local.get([`tutorial_${videoUrl}`]);
    if (savedSession[`tutorial_${videoUrl}`]) {
      const sessionData = savedSession[`tutorial_${videoUrl}`]; state.currentTutorialId = sessionData.tutorial_id; state.currentTutorialGroup = sessionData.group || 'general';
      const fab = document.getElementById('medha-fab'); if (fab) fab.remove();
      window.Medha.ui && window.Medha.ui.createFloatingWidget && window.Medha.ui.createFloatingWidget(sessionData.title);
      await ns.features.loadNotes(); await ns.features.loadChatHistory();
      showNotification && showNotification(' Welcome back! Loaded your tutorial session.', 'success'); state.isInitializing = false; return;
    }
    try {
      const existingTutorial = await chrome.runtime.sendMessage({ action: 'findTutorialByLink', data: { tutorialLink: videoUrl } });
      if (existingTutorial) {
        state.currentTutorialId = existingTutorial.tutorial_id; state.currentTutorialGroup = existingTutorial.group || 'general';
        await chrome.storage.local.set({ [`tutorial_${videoUrl}`]: { tutorial_id: existingTutorial.tutorial_id, title: existingTutorial.title, group: existingTutorial.group || 'general', timestamp: Date.now() } });
        const fab = document.getElementById('medha-fab'); if (fab) fab.remove();
        window.Medha.ui && window.Medha.ui.createFloatingWidget && window.Medha.ui.createFloatingWidget(existingTutorial.title);
        await ns.features.loadNotes(); await ns.features.loadChatHistory();
        showNotification && showNotification(' Welcome back! Loaded your tutorial session.', 'success'); state.isInitializing = false; return;
      }
    } catch (error) {}
    showNotification && showNotification('Initializing tutorial session...', 'info');
    try {
      const response = await chrome.runtime.sendMessage({ action: 'createTutorial', data: { tutorialLink: videoUrl, group: 'general' } });
      state.currentTutorialId = response.tutorial_id; state.currentTutorialGroup = response.group || 'general';
      await chrome.storage.local.set({ [`tutorial_${videoUrl}`]: { tutorial_id: response.tutorial_id, title: response.title, group: response.group || 'general', timestamp: Date.now() } });
      const fab = document.getElementById('medha-fab'); if (fab) fab.remove();
      window.Medha.ui && window.Medha.ui.createFloatingWidget && window.Medha.ui.createFloatingWidget(response.title);
      showNotification && showNotification(' Tutorial session started!', 'success');
    } catch (error) { showNotification && showNotification('❌ Failed to start session. Click extension icon to login.', 'error'); }
    finally { state.isInitializing = false; }
  }

  ns.init = { checkExistingSession, createSessionFromFAB };
  checkPageAndStart();
})();


