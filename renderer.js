const { ipcRenderer } = window.require ? require('electron') : {};
let isScreenRecording = false;
let sources = [];
let apiCallCount = 0;

// Membership Info (change as needed)
let totalMinutes = 120;
let minutesLeft = 117;

const video = document.getElementById('screenVideo');
const chatDiv = document.getElementById('chatHistory');
const loader = document.getElementById('loader');
const minRing = document.getElementById('minRing');
const minLeftText = document.getElementById('minLeftText');
const totalMinText = document.getElementById('totalMinText');
const apiCountText = document.getElementById('apiCount');

// --- Minutes Progress Ring ---
function updateMinutesUI() {
  function fmt(min) {
    const m = Math.floor(min);
    const s = Math.round((min - m) * 60);
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }
  minLeftText.innerText = fmt(minutesLeft);
  totalMinText.innerText = fmt(totalMinutes);

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(1, minutesLeft / totalMinutes));
  minRing.setAttribute('stroke-dasharray', circumference.toFixed(2));
  minRing.setAttribute('stroke-dashoffset', ((1 - percent) * circumference).toFixed(2));
  minRing.setAttribute('stroke', percent < 0.22 ? "#ef4444" : percent < 0.4 ? "#f59e42" : "#6366f1");
}
updateMinutesUI();

function animateMinutesChange(newMin) {
  const start = minutesLeft;
  const end = newMin;
  const steps = 22;
  let current = 0;
  function step() {
    current++;
    minutesLeft = start + (end - start) * (current/steps);
    updateMinutesUI();
    if (current < steps) setTimeout(step, 15);
    else minutesLeft = end, updateMinutesUI();
  }
  step();
}

function bumpAPICount() {
  apiCallCount++;
  apiCountText.innerText = apiCallCount;
  apiCountText.classList.add('bump');
  setTimeout(() => apiCountText.classList.remove('bump'), 350);
}

// === Screen Sharing (Show Your Screen) ===
window.toggleScreenRecording = async function () {
  const screenRecordButton = document.getElementById('screenRecordButton');
  if (!isScreenRecording) {
    screenRecordButton.textContent = '⏹ Stop Screen Record';
    screenRecordButton.classList.add('active');
    try {
      sources = await ipcRenderer.invoke('get-screen-sources');
      if (!sources || sources.length === 0) {
        alert("No screen sources found");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[0].id,
          }
        }
      });
      video.srcObject = stream;
      video.onloadedmetadata = () => video.play();
      video.style.background = "transparent";
      console.log('screen capturing');
      isScreenRecording = true;
    } catch (err) {
      alert("Error starting screen recording: " + err.message);
    }
  } else {
    screenRecordButton.textContent = 'Show Your Screen';
    screenRecordButton.classList.remove('active');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    video.style.background = "#000";
    isScreenRecording = false;
  }
};

// === Voice Recording (DEMO) ===
window.toggleVoiceRecording = function () {
  alert('Voice recording triggered (demo, add your own logic)');
};

// === Animated chat bubble on send + TTS + Minutes/API interaction ===
function speakResponse(text) {
  if (!window.speechSynthesis) return;
  try {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.cancel();
    synth.speak(utterance);
  } catch(e) {}
}

window.sendManualInput = function () {
  const userInput = document.getElementById('manualPrompt')?.value.trim();
  if (userInput) {
    chatDiv.innerHTML += `<div class="chat-message chat-bubble-user bubble text-right px-4 py-2 rounded-xl shadow font-semibold mb-1">${userInput}</div>`;
    loader.classList.remove('hidden');
    document.getElementById('manualPrompt').value = "";

    // Demo: decrease 1.2 min for each API call, animate
    const prevMinute = minutesLeft;
    animateMinutesChange(Math.max(0, minutesLeft - 1.2));
    bumpAPICount();

    setTimeout(() => {
      const aiText = "AI: " + userInput.split('').reverse().join('');
      chatDiv.innerHTML += `<div class="chat-message chat-bubble-ai bubble text-left px-4 py-2 rounded-xl shadow font-semibold mb-1">${aiText}</div>`;
      loader.classList.add('hidden');
      chatDiv.scrollTop = chatDiv.scrollHeight;
      speakResponse(aiText);
    }, 900);
  }
};