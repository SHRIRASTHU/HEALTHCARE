document.addEventListener('DOMContentLoaded', () => {
  initAIWidget();
});

let aiHistory = [];

function initAIWidget() {
  // Mount floating widget UI
  const widgetContainer = document.createElement('div');
  widgetContainer.className = 'ai-floating-widget';
  widgetContainer.innerHTML = `
    <button class="ai-trigger-btn" id="aiTriggerBtn" title="HEALTHCARE AI Assistant">
      <i class="fas fa-robot"></i>
      <div class="ai-pulse-ring"></div>
    </button>

    <div class="ai-chat-panel" id="aiChatPanel">
      <div class="ai-header">
        <div class="ai-title">
          <i class="fas fa-heartbeat" style="color: #38BDF8;"></i> HEALTHCARE AI
        </div>
        <i class="fas fa-times" id="aiCloseBtn" style="cursor: pointer; opacity: 0.8; font-size: 1.1rem;"></i>
      </div>

      <div class="ai-disclaimer-banner">
        <i class="fas fa-shield-alt"></i>
        <span>AI guidance only. Not a medical diagnosis. In emergency, call 108/911.</span>
      </div>

      <div class="ai-body" id="aiChatBody">
        <div class="ai-msg bot">
          <strong>Hello! I am HEALTHCARE AI 👋</strong><br>
          How can I assist you with your health questions, symptom guidance, or wellness tips today?
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;" id="aiQuickPills">
          <button onclick="sendQuickQuestion('I twisted my ankle. What should I do?')" style="background: white; border: 1px solid #CBD5E1; padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.75rem; color: #334155; cursor: pointer;">
            🦶 Twisted Ankle
          </button>
          <button onclick="sendQuickQuestion('Mild headache causes & care')" style="background: white; border: 1px solid #CBD5E1; padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.75rem; color: #334155; cursor: pointer;">
            🤕 Mild Headache
          </button>
          <button onclick="sendQuickQuestion('First aid for a small cut')" style="background: white; border: 1px solid #CBD5E1; padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.75rem; color: #334155; cursor: pointer;">
            🩹 Minor Cut
          </button>
        </div>
      </div>

      <form class="ai-input-box" id="aiChatForm">
        <input type="text" id="aiInput" placeholder="Ask a health question..." required autocomplete="off">
        <button type="submit" class="btn btn-primary" style="padding: 0.5rem 0.9rem; border-radius: var(--radius-md);">
          <i class="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(widgetContainer);

  const triggerBtn = document.getElementById('aiTriggerBtn');
  const chatPanel = document.getElementById('aiChatPanel');
  const closeBtn = document.getElementById('aiCloseBtn');
  const chatForm = document.getElementById('aiChatForm');

  triggerBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('open');
  });

  closeBtn.addEventListener('click', () => {
    chatPanel.classList.remove('open');
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('aiInput');
    const question = input.value.trim();
    if (question) {
      handleUserQuestion(question);
      input.value = '';
    }
  });
}

function sendQuickQuestion(q) {
  handleUserQuestion(q);
}

async function handleUserQuestion(question) {
  const body = document.getElementById('aiChatBody');
  const pills = document.getElementById('aiQuickPills');
  if (pills) pills.remove();

  // Append user bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'ai-msg user';
  userDiv.innerText = question;
  body.appendChild(userDiv);
  body.scrollTop = body.scrollHeight;

  // Append loading typing bubble
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-msg bot';
  loadingDiv.id = 'aiLoadingBubble';
  loadingDiv.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Analyzing medical guidance...`;
  body.appendChild(loadingDiv);
  body.scrollTop = body.scrollHeight;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ question, history: aiHistory })
    });

    const data = await res.json();
    loadingDiv.remove();

    if (data.success) {
      const responseText = data.aiResponse || data.message || data.response || 'No response content returned.';
      const botDiv = document.createElement('div');
      botDiv.className = `ai-msg ${data.isEmergency ? 'emergency' : 'bot'}`;
      botDiv.innerHTML = formatMarkdownText(responseText);
      body.appendChild(botDiv);

      aiHistory.push({ role: 'user', content: question });
      aiHistory.push({ role: 'assistant', content: responseText });
    } else {
      const botDiv = document.createElement('div');
      botDiv.className = 'ai-msg bot';
      botDiv.innerText = data.message || 'Apologies, I encountered an issue processing your query. Please try again.';
      body.appendChild(botDiv);
    }
  } catch (err) {
    if (loadingDiv) loadingDiv.remove();
    const botDiv = document.createElement('div');
    botDiv.className = 'ai-msg bot';
    botDiv.innerText = 'HEALTHCARE AI service is currently unavailable. If this is an emergency, please dial 108 or 911 immediately.';
    body.appendChild(botDiv);
  }

  body.scrollTop = body.scrollHeight;
}

function formatMarkdownText(txt) {
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.*?)\n/g, '<h4 style="margin: 0.4rem 0; font-size: 0.95rem;">$1</h4>')
    .replace(/\* (.*?)\n/g, '• $1<br>')
    .replace(/\n/g, '<br>');
}
