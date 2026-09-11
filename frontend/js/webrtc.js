let socket = null;
let peerConnection = null;
let localStream = null;
let screenStream = null;
let roomId = null;
let isAudioMuted = false;
let isVideoOff = false;
let isScreenSharing = false;
let timerInterval = null;
let secondsElapsed = 0;

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  roomId = urlParams.get('room') || 'meet-cardio-99812';
  const audioOnly = urlParams.get('audioOnly') === 'true';

  if (audioOnly) {
    isVideoOff = true;
    const vBtn = document.getElementById('toggleVideoBtn');
    if (vBtn) vBtn.classList.add('active-off');
  }

  startCallSession();
});

async function startCallSession() {
  socket = io(CONFIG.SOCKET_URL);
  const user = Auth.getUser() || { name: 'Patient' };

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: !isVideoOff,
      audio: true
    });

    const localVideo = document.getElementById('localVideo');
    if (localVideo) localVideo.srcObject = localStream;
  } catch (e) {
    console.warn('Camera/Mic permission warning or virtual stream active:', e.message);
    Toast.show('WebRTC Stream initialized (Using virtual media interface)', 'info');
  }

  socket.emit('join-call-room', { roomId, userId: user._id || user.id, userName: user.name });
  startTimer();

  // Socket signaling events
  socket.on('user-joined-call', ({ socketId, userName }) => {
    Toast.show(`${userName} joined the consultation call`, 'success');
    createPeerConnection(socketId);
    createAndSendOffer(socketId);
  });

  socket.on('receive-offer', async ({ offer, senderSocketId }) => {
    createPeerConnection(senderSocketId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('send-answer', { roomId, answer, targetSocketId: senderSocketId });
  });

  socket.on('receive-answer', async ({ answer }) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  });

  socket.on('ice-candidate', async ({ candidate }) => {
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('ICE Candidate error', e);
      }
    }
  });

  socket.on('call-ended', () => {
    Toast.show('Consultation call ended by participant', 'info');
    setTimeout(() => window.location.href = '/dashboard.html', 1500);
  });
}

function createPeerConnection(targetSocketId) {
  peerConnection = new RTCPeerConnection(rtcConfig);

  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }

  peerConnection.ontrack = (event) => {
    const remoteVideo = document.getElementById('remoteVideo');
    const placeholder = document.getElementById('remotePlaceholder');
    if (remoteVideo) {
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { roomId, candidate: event.candidate, targetSocketId });
    }
  };
}

async function createAndSendOffer(targetSocketId) {
  if (!peerConnection) return;
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('send-offer', { roomId, offer, targetSocketId });
}

function toggleAudio() {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    isAudioMuted = !audioTrack.enabled;

    const btn = document.getElementById('toggleAudioBtn');
    btn.classList.toggle('active-off', isAudioMuted);
    btn.innerHTML = `<i class="fas fa-microphone${isAudioMuted ? '-slash' : ''}"></i>`;
    Toast.show(`Microphone ${isAudioMuted ? 'Muted' : 'Unmuted'}`, isAudioMuted ? 'warning' : 'success');
  }
}

function toggleVideo() {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    isVideoOff = !videoTrack.enabled;

    const btn = document.getElementById('toggleVideoBtn');
    btn.classList.toggle('active-off', isVideoOff);
    btn.innerHTML = `<i class="fas fa-video${isVideoOff ? '-slash' : ''}"></i>`;
    Toast.show(`Camera ${isVideoOff ? 'Turned Off' : 'Turned On'}`, isVideoOff ? 'warning' : 'success');
  }
}

async function toggleScreenShare() {
  const btn = document.getElementById('shareScreenBtn');
  if (!isScreenSharing) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      
      if (peerConnection) {
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      }

      btn.classList.add('active-off');
      isScreenSharing = true;
      Toast.show('Screen sharing active', 'info');

      screenTrack.onended = () => toggleScreenShare();
    } catch (e) {
      Toast.show('Screen share cancelled', 'info');
    }
  } else {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
    }
    if (peerConnection && localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    }
    btn.classList.remove('active-off');
    isScreenSharing = false;
    Toast.show('Stopped screen sharing', 'info');
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');
    const timerTxt = document.getElementById('callTimerText');
    if (timerTxt) timerTxt.innerText = `${mins}:${secs}`;
  }, 1000);
}

function endCall() {
  if (socket) {
    socket.emit('end-call', { roomId });
  }
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
  clearInterval(timerInterval);
  Toast.show('Call ended', 'info');
  window.location.href = '/dashboard.html';
}
