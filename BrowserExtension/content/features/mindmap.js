(function setupMindmapFeature() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  ns.features = ns.features || {};
  const { state } = ns;
  const { escapeHtml, showNotification } = ns;

  async function generateMindmap() {
    if (!state.currentTutorialId) return;
    const btn = document.getElementById('medha-generate-mindmap'); btn.disabled = true; btn.innerHTML = '<span class="medha-spinner"></span> Creating...';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'generateMindmap', data: { tutorialId: state.currentTutorialId } });
      const count = (response.mindmaps || []).length; showNotification && showNotification(` ${response.message || `${count} mindmap(s) created successfully!`}`, 'success');
      await loadMindmaps();
    } catch (error) { showNotification && showNotification('❌ Mindmap generation failed: ' + error.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<span class="icon">🧠</span> Generate Mindmap'; }
  }

  async function loadMindmaps() {
    if (!state.currentTutorialId) return;
    const container = document.getElementById('medha-mindmap-list'); if (!container) return;
    container.innerHTML = '<div class="medha-skeleton-loader"><div class="medha-skeleton-card"></div><div class="medha-skeleton-card"></div></div>';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getMindmaps', data: { tutorialId: state.currentTutorialId } });
      const mindmaps = response.mindmaps || [];
      if (mindmaps.length === 0) {
        container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">🧠</div><div class="medha-empty-text">No mindmaps yet. Generate your first mindmap!</div></div>';
      } else {
        container.innerHTML = mindmaps.map((mindmap, index) => `
          <div class="medha-mindmap-card">
            <div class="medha-mindmap-header"><h4>${escapeHtml(mindmap.title || `Mindmap ${index + 1}`)}</h4><p class="medha-mindmap-description">${escapeHtml(mindmap.description || 'No description available')}</p></div>
            <div class="medha-mindmap-actions">
              <button class="medha-btn-primary medha-btn-sm mindmap-view-btn" data-index="${index}"><span class="icon">👁️</span> View</button>
              <button class="medha-btn-secondary medha-btn-sm mindmap-download-btn" data-image="${mindmap.image_b64}" data-index="${index}" data-title="${escapeHtml(mindmap.title || `Mindmap ${index + 1}`)}"><span class="icon">⬇️</span> Download</button>
            </div>
          </div>
        `).join('');
        container.querySelectorAll('.mindmap-view-btn').forEach(btn => { btn.addEventListener('click', () => { const index = parseInt(btn.dataset.index); showMindmapModal(mindmaps[index], index + 1); }); });
        container.querySelectorAll('.mindmap-download-btn').forEach(btn => { btn.addEventListener('click', () => { const title = btn.dataset.title || `Mindmap ${parseInt(btn.dataset.index) + 1}`; const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`; downloadMindmap(btn.dataset.image, filename); }); });
      }
    } catch (error) {
      container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">❌</div><div class="medha-empty-text">Failed to load mindmaps</div></div>';
    }
  }

  function showMindmapModal(mindmap, number) {
    const modal = document.createElement('div'); modal.className = 'medha-mindmap-modal';
    const title = mindmap.title || `Mindmap ${number}`; const description = mindmap.description || '';
    modal.innerHTML = `
      <div class="medha-mindmap-modal-content">
        <div class="medha-mindmap-modal-header">
          <div><h2>🧠 ${escapeHtml(title)}</h2>${description ? `<p class="medha-mindmap-modal-description">${escapeHtml(description)}</p>` : ''}</div>
          <button class="medha-modal-close" id="mindmap-close">×</button>
        </div>
        <div class="medha-mindmap-modal-body"><img src="${mindmap.image_b64}" alt="${escapeHtml(title)}" /></div>
        <div class="medha-mindmap-modal-footer"><button class="medha-btn-modern medha-btn-primary" id="mindmap-download"><span class="icon">⬇️</span> Download</button></div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('mindmap-close').addEventListener('click', () => { modal.remove(); });
    document.getElementById('mindmap-download').addEventListener('click', () => { const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`; downloadMindmap(mindmap.image_b64, filename); });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  function downloadMindmap(base64Image, filename) {
    try { const link = document.createElement('a'); link.href = base64Image; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); showNotification && showNotification(' Mindmap downloaded!', 'success'); }
    catch (error) { showNotification && showNotification('❌ Download failed: ' + error.message, 'error'); }
  }

  ns.features.generateMindmap = generateMindmap;
  ns.features.loadMindmaps = loadMindmaps;
  ns.features.showMindmapModal = showMindmapModal;
  ns.features.downloadMindmap = downloadMindmap;
})();


