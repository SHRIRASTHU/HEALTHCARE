let socket = null;
let activeContact = null;
let currentConversationId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  initSocketConnection();
  loadConversations();

  document.getElementById('chatInputForm').addEventListener('submit', handleSendMessage);
  
  const msgInput = document.getElementById('chatMessageInput');
  let typingTimer;
  msgInput.addEventListener('keydown', () => {
    if (socket && currentConversationId) {
      socket.emit('typing', { conversationId: currentConversationId, userName: Auth.getUser().name });
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        socket.emit('stop-typing', { conversationId: currentConversationId });
      }, 1500);
    }
  });
});

function initSocketConnection() {
  socket = io(CONFIG.SOCKET_URL);
  const user = Auth.getUser();

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (user) {
      socket.emit('user-connected', user._id || user.id);
    }
  });

  socket.on('receive-message', (msg) => {
    if (msg.conversationId === currentConversationId) {
      appendMessageBubble(msg);
    }
    loadConversations();
  });

  socket.on('user-typing', ({ conversationId, userName }) => {
    if (conversationId === currentConversationId) {
      const indicator = document.getElementById('typingIndicator');
      indicator.innerText = `${userName} is typing...`;
      indicator.style.display = 'block';
    }
  });

  socket.on('user-stop-typing', ({ conversationId }) => {
    if (conversationId === currentConversationId) {
      document.getElementById('typingIndicator').style.display = 'none';
    }
  });
}

async function loadConversations() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/chat/conversations`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      renderContactsList(data.conversations);
    }
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
}

function renderContactsList(contacts) {
  const ul = document.getElementById('contactsList');
  if (!ul) return;

  if (contacts.length === 0) {
    ul.innerHTML = `<li style="text-align: center; padding: 2rem; color: var(--text-muted);">No active doctor chats found.</li>`;
    return;
  }

  ul.innerHTML = contacts.map(c => `
    <li class="contact-item ${activeContact && activeContact.id === c.id ? 'active' : ''}" onclick="selectContact(${JSON.stringify(c).replace(/"/g, '&quot;')})">
      <div class="contact-avatar-box">
        <img src="${c.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}" class="contact-avatar">
        ${c.isOnline ? '<div class="online-status-dot"></div>' : ''}
      </div>
      <div class="contact-info">
        <div class="contact-name-row">
          <span class="contact-name">${c.name}</span>
          <span class="contact-time">${c.lastTimestamp ? new Date(c.lastTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
        </div>
        <p class="contact-last-msg">${c.lastMessage || 'Tap to chat'}</p>
      </div>
    </li>
  `).join('');
}

async function selectContact(contact) {
  activeContact = contact;
  currentConversationId = contact.conversationId;

  if (socket) {
    socket.emit('join-conversation', currentConversationId);
  }

  document.getElementById('chatHeaderBar').style.display = 'flex';
  document.getElementById('chatInputForm').style.display = 'flex';
  document.getElementById('activeChatAvatar').src = contact.photo;
  document.getElementById('activeChatName').innerText = contact.name;
  document.getElementById('activeChatSubtext').innerText = contact.specialization ? `${contact.specialization} • Online` : 'Patient Consultation';

  document.getElementById('launchVideoBtn').href = `/video-call.html?room=${contact.conversationId}`;
  document.getElementById('launchAudioBtn').href = `/video-call.html?room=${contact.conversationId}&audioOnly=true`;

  loadMessages(currentConversationId);
}

async function loadMessages(convId) {
  const container = document.getElementById('chatMessagesArea');
  container.innerHTML = `<div style="text-align: center; margin: auto;"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>`;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/chat/messages/${convId}`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      container.innerHTML = '';
      if (data.messages.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; margin: auto; color: var(--text-muted);">
            <p>No messages yet. Send a message to start consultation with ${activeContact.name}.</p>
          </div>
        `;
      } else {
        data.messages.forEach(msg => appendMessageBubble(msg));
      }
      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger);">Error loading messages.</div>`;
  }
}

function appendMessageBubble(msg) {
  const container = document.getElementById('chatMessagesArea');
  const user = Auth.getUser();
  const isMe = msg.senderId === (user._id || user.id).toString();

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${isMe ? 'sent' : 'received'}`;
  bubble.innerHTML = `
    <div>${msg.message}</div>
    <div class="msg-meta">
      <span>${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      ${isMe ? '<i class="fas fa-check-double" style="color: #38BDF8;"></i>' : ''}
    </div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

async function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chatMessageInput');
  const message = input.value.trim();
  if (!message || !activeContact) return;

  const user = Auth.getUser();
  const payload = {
    conversationId: currentConversationId,
    senderId: (user._id || user.id).toString(),
    senderName: user.name,
    senderRole: user.role,
    receiverId: activeContact.id,
    message,
    messageType: 'text'
  };

  input.value = '';

  if (socket) {
    socket.emit('send-message', payload);
  } else {
    try {
      await fetch(`${CONFIG.API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      loadMessages(currentConversationId);
    } catch (err) {
      Toast.show('Error sending message', 'error');
    }
  }
}
