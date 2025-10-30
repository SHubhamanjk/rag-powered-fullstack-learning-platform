(function setupQuizFeature() {
  'use strict';

  const ns = window.Medha || (window.Medha = {});
  ns.features = ns.features || {};
  const { state } = ns;
  const { escapeHtml, showNotification } = ns;
  const { getVideoPlayer } = ns.youtube;

  async function generateQuiz() {
    if (!state.currentTutorialId) return;
    const fromInput = document.getElementById('quiz-from-time');
    const toInput = document.getElementById('quiz-to-time');
    const fromTime = fromInput.value || '0:00';
    let toTime = toInput.value;
    if (!toTime) { const player = getVideoPlayer(); const duration = player ? player.duration : 300; toTime = ns.youtube.formatTime(Math.floor(duration)); toInput.value = toTime; }
    const btn = document.getElementById('medha-generate-quiz'); btn.disabled = true; btn.innerHTML = '<span class="medha-spinner"></span> Generating...';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'generateQuiz', data: { tutorialId: state.currentTutorialId, fromTimestamp: fromTime, toTimestamp: toTime } });
      showNotification && showNotification(' Quiz generated successfully!', 'success');
      await loadQuizzes(); showQuizAttempt(response.quiz_id, response);
    } catch (error) { showNotification && showNotification('❌ Quiz generation failed: ' + error.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Generate Quiz'; }
  }

  async function loadQuizzes() {
    if (!state.currentTutorialId) return;
    const container = document.getElementById('medha-quiz-list'); if (!container) return;
    container.innerHTML = '<div class="medha-skeleton-loader"><div class="medha-skeleton-card"></div><div class="medha-skeleton-card"></div></div>';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTutorialQuizzes', data: { tutorialId: state.currentTutorialId } });
      const quizzes = response.quizzes || [];
      if (quizzes.length === 0) {
        container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">📝</div><div class="medha-empty-text">No quizzes yet. Generate your first quiz!</div></div>';
      } else {
        container.innerHTML = quizzes.map(quiz => `
          <div class="medha-quiz-card">
            <div class="medha-quiz-card-header">
              <span class="medha-quiz-time-range">${escapeHtml(quiz.from_timestamp)} - ${escapeHtml(quiz.to_timestamp)}</span>
              <span class="medha-quiz-questions">${quiz.total_questions} questions</span>
            </div>
            ${quiz.is_evaluated ? `
              <div class="medha-quiz-score"><span class="score-percentage">${Math.round(quiz.percentage)}%</span><span class="score-text">${quiz.score}/${quiz.total_questions * 2} points</span></div>
            ` : ''}
            <div class="medha-quiz-actions">
              ${quiz.is_evaluated ? `
                <button class="medha-btn-secondary medha-btn-sm quiz-retry-btn" data-quiz-id="${quiz.quiz_id}"><span class="icon">🔄</span> Retry</button>
                <button class="medha-btn-secondary medha-btn-sm quiz-results-btn" data-quiz-id="${quiz.quiz_id}"><span class="icon">📊</span> View Results</button>
              ` : `
                <button class="medha-btn-primary medha-btn-sm quiz-attempt-btn" data-quiz-id="${quiz.quiz_id}"><span class="icon">▶️</span> Attempt Quiz</button>
              `}
            </div>
          </div>
        `).join('');
        container.querySelectorAll('.quiz-attempt-btn, .quiz-retry-btn').forEach(btn => { btn.addEventListener('click', () => showQuizAttempt(btn.dataset.quizId)); });
        container.querySelectorAll('.quiz-results-btn').forEach(btn => { btn.addEventListener('click', () => showQuizResults(btn.dataset.quizId)); });
      }
    } catch (error) {
      container.innerHTML = '<div class="medha-empty-state"><div class="medha-empty-icon">❌</div><div class="medha-empty-text">Failed to load quizzes</div></div>';
    }
  }

  async function showQuizAttempt(quizId, quizData) {
    const player = getVideoPlayer(); const wasPlaying = player && !player.paused; if (wasPlaying) { player.pause(); }
    if (!quizData) {
      try { quizData = await chrome.runtime.sendMessage({ action: 'getQuizDetails', data: { quizId } }); }
      catch (error) { showNotification && showNotification('❌ Failed to load quiz: ' + error.message, 'error'); if (wasPlaying && player) { player.play().catch(() => {}); } return; }
    }
    const allQuestions = [...quizData.mcq_questions.map(q => ({ ...q, type: 'mcq' })), ...quizData.descriptive_questions.map(q => ({ ...q, type: 'descriptive' }))];
    let currentQuestionIndex = 0; let answers = {};
    const modal = document.createElement('div'); modal.className = 'medha-quiz-modal';
    modal.innerHTML = `
      <div class="medha-quiz-modal-content">
        <div class="medha-quiz-modal-header"><h2>📝 Quiz Attempt</h2><button class="medha-minimize-btn" id="quiz-minimize">−</button></div>
        <div class="medha-quiz-modal-body">
          <div class="medha-quiz-progress">
            <div class="medha-quiz-progress-text">Question <span id="quiz-current">1</span> of <span id="quiz-total">${allQuestions.length}</span></div>
            <div class="medha-quiz-progress-bar"><div class="medha-quiz-progress-fill" id="quiz-progress"></div></div>
          </div>
          <div class="medha-quiz-question-container" id="quiz-question-container"></div>
          <div class="medha-quiz-navigation"><button class="medha-btn-secondary" id="quiz-prev-btn">← Previous</button><div class="medha-quiz-dots" id="quiz-dots"></div><button class="medha-btn-secondary" id="quiz-next-btn">Next →</button></div>
        </div>
        <div class="medha-quiz-modal-footer"><button class="medha-btn-secondary" id="quiz-cancel">Cancel</button><button class="medha-btn-primary" id="quiz-submit">Submit Quiz</button></div>
      </div>`;
    document.body.appendChild(modal);

    function renderDots() {
      const container = document.getElementById('quiz-dots');
      container.innerHTML = allQuestions.map((q, i) => {
        const isAnswered = answers[q.question_id] !== undefined && answers[q.question_id] !== '';
        const isCurrent = i === currentQuestionIndex;
        return `<span class="medha-quiz-dot ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}" data-index="${i}"></span>`;
      }).join('');
      container.querySelectorAll('.medha-quiz-dot').forEach(dot => { dot.addEventListener('click', () => { currentQuestionIndex = parseInt(dot.dataset.index); renderQuestion(currentQuestionIndex); }); });
    }

    function renderQuestion(index) {
      const question = allQuestions[index]; const container = document.getElementById('quiz-question-container');
      if (question.type === 'mcq') {
        container.innerHTML = `
          <div class="medha-quiz-question"><h3>${escapeHtml(question.question)}</h3><div class="medha-quiz-options">${question.options.map((opt, i) => `
            <label class="medha-quiz-option ${answers[question.question_id] === i ? 'selected' : ''}"><input type="radio" name="question-${question.question_id}" value="${i}" ${answers[question.question_id] === i ? 'checked' : ''}><span>${escapeHtml(opt)}</span></label>
          `).join('')}</div></div>`;
        container.querySelectorAll('input[type="radio"]').forEach(radio => { radio.addEventListener('change', (e) => { answers[question.question_id] = parseInt(e.target.value); renderQuestion(index); renderDots(); }); });
      } else {
        container.innerHTML = `<div class="medha-quiz-question"><h3>${escapeHtml(question.question)}</h3><textarea class="medha-quiz-textarea" id="descriptive-answer" placeholder="Type your answer here..." rows="8">${answers[question.question_id] || ''}</textarea></div>`;
        const textarea = document.getElementById('descriptive-answer'); textarea.addEventListener('input', (e) => { answers[question.question_id] = e.target.value; renderDots(); });
      }
      document.getElementById('quiz-current').textContent = index + 1;
      document.getElementById('quiz-progress').style.width = `${((index + 1) / allQuestions.length) * 100}%`;
      document.getElementById('quiz-prev-btn').disabled = index === 0;
      document.getElementById('quiz-next-btn').disabled = index === allQuestions.length - 1;
      renderDots();
    }

    document.getElementById('quiz-prev-btn').addEventListener('click', () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(currentQuestionIndex); } });
    document.getElementById('quiz-next-btn').addEventListener('click', () => { if (currentQuestionIndex < allQuestions.length - 1) { currentQuestionIndex++; renderQuestion(currentQuestionIndex); } });
    document.getElementById('quiz-cancel').addEventListener('click', () => { modal.remove(); if (wasPlaying && player) { player.play().catch(() => {}); } });
    document.getElementById('quiz-minimize').addEventListener('click', () => { modal.remove(); window.Medha.ui && window.Medha.ui.toggleMinimize && window.Medha.ui.toggleMinimize(); if (wasPlaying && player) { player.play().catch(() => {}); } });
    document.getElementById('quiz-submit').addEventListener('click', async () => {
      const unanswered = allQuestions.filter(q => answers[q.question_id] === undefined || answers[q.question_id] === '');
      if (unanswered.length > 0) { if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return; }
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({ question_id: questionId, answer }));
      const submitBtn = document.getElementById('quiz-submit'); submitBtn.disabled = true; submitBtn.textContent = 'Submitting...';
      try {
        const result = await chrome.runtime.sendMessage({ action: 'evaluateQuiz', data: { quizId, answers: answersArray } });
        modal.remove(); showNotification && showNotification(' Quiz submitted successfully!', 'success'); await loadQuizzes(); showQuizResultsModal(result);
        if (wasPlaying && player) { player.play().catch(() => {}); }
      } catch (error) {
        showNotification && showNotification('❌ Failed to submit quiz: ' + error.message, 'error'); submitBtn.disabled = false; submitBtn.textContent = 'Submit Quiz';
      }
    });
    renderQuestion(currentQuestionIndex);
  }

  async function showQuizResults(quizId) {
    try {
      const quizData = await chrome.runtime.sendMessage({ action: 'getQuizDetails', data: { quizId } });
      if (!quizData.evaluation_report) { showNotification && showNotification('⚠️ No evaluation report found', 'warning'); return; }
      showQuizResultsModal(quizData.evaluation_report);
    } catch (error) { showNotification && showNotification('❌ Failed to load results: ' + error.message, 'error'); }
  }

  function showQuizResultsModal(evaluation) {
    const modal = document.createElement('div'); modal.className = 'medha-quiz-modal';
    const totalQuestions = (evaluation.results || []).length; const maxScore = evaluation.max_score || 0;
    modal.innerHTML = `
      <div class="medha-quiz-modal-content">
        <div class="medha-quiz-modal-header"><h2>📊 Quiz Results</h2><button class="medha-minimize-btn" id="results-minimize">−</button></div>
        <div class="medha-quiz-modal-body">
          <div class="medha-quiz-results-summary">
            <div class="medha-score-circle"><div class="medha-score-number">${Math.round(evaluation.percentage)}%</div><div class="medha-score-label">Score</div></div>
            <div class="medha-score-details">
              <p><strong>Total Score:</strong> ${evaluation.total_score} / ${maxScore} points</p>
              <p><strong>MCQ Score:</strong> ${evaluation.mcq_score} points</p>
              <p><strong>Descriptive Score:</strong> ${evaluation.descriptive_score} points</p>
              <p><strong>Total Questions:</strong> ${totalQuestions}</p>
            </div>
          </div>
          <div class="medha-divider"></div>
          <div class="medha-quiz-results-details">
            <h3>📝 Overall Feedback</h3>
            <p class="medha-overall-feedback">${escapeHtml(evaluation.overall_feedback || 'Great job!')}</p>
            ${evaluation.strengths && evaluation.strengths.length > 0 ? `<div class="medha-feedback-section"><h4>💪 Strengths</h4><ul>${evaluation.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
            ${evaluation.areas_for_improvement && evaluation.areas_for_improvement.length > 0 ? `<div class="medha-feedback-section"><h4>📈 Areas for Improvement</h4><ul>${evaluation.areas_for_improvement.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul></div>` : ''}
            ${evaluation.study_suggestions && evaluation.study_suggestions.length > 0 ? `<div class="medha-feedback-section"><h4>📚 Study Suggestions</h4><ul>${evaluation.study_suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
            ${evaluation.results && evaluation.results.length > 0 ? `<div class="medha-feedback-section"><h4>📝 Question-wise Results</h4><div class="medha-feedback-list">${evaluation.results.map((result, idx) => `<div class="medha-feedback-item ${result.is_correct ? 'correct' : 'incorrect'}"><div class="medha-feedback-header"><span class="medha-feedback-icon">${result.is_correct ? '✓' : '✗'}</span><span class="medha-feedback-text">Question ${idx + 1}</span></div></div>`).join('')}</div></div>` : ''}
          </div>
        </div>
        <div class="medha-quiz-modal-footer"><button class="medha-btn-primary" id="results-close">Close</button></div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('results-close').addEventListener('click', () => { modal.remove(); });
    document.getElementById('results-minimize').addEventListener('click', () => { modal.remove(); window.Medha.ui && window.Medha.ui.toggleMinimize && window.Medha.ui.toggleMinimize(); });
  }

  ns.features.generateQuiz = generateQuiz;
  ns.features.loadQuizzes = loadQuizzes;
  ns.features.showQuizAttempt = showQuizAttempt;
  ns.features.showQuizResults = showQuizResults;
  ns.features.showQuizResultsModal = showQuizResultsModal;
})();


