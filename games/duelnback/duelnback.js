// Duel N-Back Game Logic
const gridSize = 3;
const audioLetters = ['A','B','C','D','E','F','G','H'];
const speedMap = { slow: 3000, moderate: 2000, fast: 1300 };

let nBack = 2;
let speed = 'moderate';
let sequence = [];
let audioSequence = [];
let currentIndex = 0;
let running = false;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gridContainer = document.querySelector('.grid');
const audioLetterDiv = document.getElementById('audioLetter');
const statusText = document.getElementById('statusText');
let auditoryEnabled = true;
const auditoryToggle = document.getElementById('auditoryToggle');

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function createGrid() {
  gridContainer.innerHTML = '';
  for (let i = 0; i < gridSize * gridSize; i++) {
    const div = document.createElement('div');
    div.className = 'grid-square';
    div.dataset.index = i;
    gridContainer.appendChild(div);
  }
}

function randomGridIndex() {
  return Math.floor(Math.random() * gridSize * gridSize);
}
function randomAudioLetter() {
  return audioLetters[Math.floor(Math.random() * audioLetters.length)];
}

function generateSequences(length) {
  sequence = [];
  audioSequence = [];
  const maxConsecutive = 2;
  for (let i = 0; i < length; i++) {
    let gridIdx, letter;
    if (i < nBack) {
      // First nBack trials are always random, but avoid >2 repeats
      do {
        gridIdx = randomGridIndex();
      } while (
        (i >= maxConsecutive && sequence[i-1] === gridIdx && sequence[i-2] === gridIdx)
      );
      do {
        letter = randomAudioLetter();
      } while (
        (i >= maxConsecutive && audioSequence[i-1] === letter && audioSequence[i-2] === letter)
      );
      sequence.push(gridIdx);
      audioSequence.push(letter);
    } else {
      // Decide randomly which type of match (or none) to create
      const matchType = Math.floor(Math.random() * 4); // 0: none, 1: visual, 2: auditory, 3: both
      let valid = false;
      let attempts = 0;
      while (!valid && attempts < 10) {
        attempts++;
        switch (matchType) {
          case 1: // visual only
            gridIdx = sequence[i - nBack];
            do {
              letter = randomAudioLetter();
            } while (
              letter === audioSequence[i - nBack] ||
              (i >= maxConsecutive && audioSequence[i-1] === letter && audioSequence[i-2] === letter)
            );
            valid = !(i >= maxConsecutive && sequence[i-1] === gridIdx && sequence[i-2] === gridIdx);
            break;
          case 2: // auditory only
            do {
              gridIdx = randomGridIndex();
            } while (
              gridIdx === sequence[i - nBack] ||
              (i >= maxConsecutive && sequence[i-1] === gridIdx && sequence[i-2] === gridIdx)
            );
            letter = audioSequence[i - nBack];
            valid = !(i >= maxConsecutive && audioSequence[i-1] === letter && audioSequence[i-2] === letter);
            break;
          case 3: // both
            gridIdx = sequence[i - nBack];
            letter = audioSequence[i - nBack];
            valid = !(
              (i >= maxConsecutive && sequence[i-1] === gridIdx && sequence[i-2] === gridIdx) ||
              (i >= maxConsecutive && audioSequence[i-1] === letter && audioSequence[i-2] === letter)
            );
            break;
          default: // no match
            do {
              gridIdx = randomGridIndex();
            } while (
              sequence.slice(i-nBack, i).includes(gridIdx) ||
              (i >= maxConsecutive && sequence[i-1] === gridIdx && sequence[i-2] === gridIdx)
            );
            do {
              letter = randomAudioLetter();
            } while (
              audioSequence.slice(i-nBack, i).includes(letter) ||
              (i >= maxConsecutive && audioSequence[i-1] === letter && audioSequence[i-2] === letter)
            );
            valid = true;
        }
        // If after 10 attempts, still not valid, fallback to no match
        if (!valid && attempts === 10) {
          do {
            gridIdx = randomGridIndex();
          } while (
            sequence.slice(i-nBack, i).includes(gridIdx) ||
            (i >= maxConsecutive && sequence[i-1] === gridIdx && sequence[i-2] === gridIdx)
          );
          do {
            letter = randomAudioLetter();
          } while (
            audioSequence.slice(i-nBack, i).includes(letter) ||
            (i >= maxConsecutive && audioSequence[i-1] === letter && audioSequence[i-2] === letter)
          );
          valid = true;
        }
      }
      sequence.push(gridIdx);
      audioSequence.push(letter);
    }
  }
}

function highlightGrid(index) {
  document.querySelectorAll('.grid-square').forEach((sq, i) => {
    sq.classList.toggle('active', i === index);
  });
}

function playAudio(letter) {
  // Use Web Speech API for simple letter playback
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(letter);
    utter.rate = 0.8;
    window.speechSynthesis.speak(utter);
  }
}

function showTrial(idx) {
  highlightGrid(sequence[idx]);
  if (auditoryEnabled) {
    audioLetterDiv.textContent = audioSequence[idx];
    playAudio(audioSequence[idx]);
  } else {
    audioLetterDiv.textContent = '';
  }
}

function clearGrid() {
  document.querySelectorAll('.grid-square').forEach(sq => sq.classList.remove('active'));
  audioLetterDiv.textContent = '';
}

function startGame() {
  running = true;
  showScreen(gameScreen);
  createGrid();
  generateSequences(30);
  currentIndex = 0;
  statusText.textContent = '';
  nextTrial();
}

function endGame() {
  running = false;
  showScreen(startScreen);
  clearGrid();
}

function nextTrial() {
  if (!running || currentIndex >= sequence.length) {
    endGame();
    return;
  }
  showTrial(currentIndex);
  setTimeout(() => {
    clearGrid();
    setTimeout(() => {
      currentIndex++;
      nextTrial();
    }, 400);
  }, speedMap[speed]);
}

function checkMatch(type) {
  if (currentIndex < nBack) return;
  let visualMatch = sequence[currentIndex] === sequence[currentIndex - nBack];
  let auditoryMatch = audioSequence[currentIndex] === audioSequence[currentIndex - nBack];
  let isMatch = false;
  if (type === 'visual') {
    isMatch = visualMatch && !auditoryMatch;
  } else if (type === 'auditory') {
    isMatch = auditoryMatch && !visualMatch;
  } else if (type === 'both') {
    isMatch = visualMatch && auditoryMatch;
  }
  statusText.textContent = isMatch ? 'Correct!' : 'Incorrect!';
  statusText.classList.add('magenta');
  setTimeout(() => {
    statusText.textContent = '';
    statusText.classList.remove('magenta');
  }, 700);
}

document.addEventListener('DOMContentLoaded', () => {
  // Game screen navigation buttons
  const backHomeBtnGame = document.getElementById('backHomeBtnGame');
  const backStartBtnGame = document.getElementById('backStartBtnGame');
  if (backHomeBtnGame) {
    backHomeBtnGame.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }
  if (backStartBtnGame) {
    backStartBtnGame.addEventListener('click', () => {
      showScreen(startScreen);
      clearGrid();
      running = false;
    });
  }
  createGrid();
  // Level select
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      nBack = parseInt(btn.dataset.level);
    });
  });
  // Speed select
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      speed = btn.dataset.speed;
    });
  });
  // Auditory toggle
  const bothMatchBtn = document.getElementById('bothMatchBtn');
  const auditoryMatchBtn = document.getElementById('auditoryMatchBtn');
  function updateAuditoryButtons() {
    if (auditoryEnabled) {
      bothMatchBtn.style.display = '';
      auditoryMatchBtn.style.display = '';
    } else {
      bothMatchBtn.style.display = 'none';
      auditoryMatchBtn.style.display = 'none';
    }
  }
  if (auditoryToggle) {
    auditoryToggle.addEventListener('change', (e) => {
      auditoryEnabled = auditoryToggle.checked;
      updateAuditoryButtons();
    });
    auditoryEnabled = auditoryToggle.checked;
    updateAuditoryButtons();
  }
  // Start game
  document.getElementById('startBtn').addEventListener('click', startGame);
  // Back to home
  document.getElementById('backHomeBtn').addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
  // Visual match
  document.getElementById('visualMatchBtn').addEventListener('click', () => checkMatch('visual'));
  // Both match
  bothMatchBtn.addEventListener('click', () => checkMatch('both'));
  // Auditory match
  auditoryMatchBtn.addEventListener('click', () => checkMatch('auditory'));
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key.toLowerCase() === 'v') checkMatch('visual');
    if (e.key.toLowerCase() === 'a' && auditoryEnabled) checkMatch('auditory');
    if (e.key.toLowerCase() === 'b' && auditoryEnabled) checkMatch('both');
  });
});