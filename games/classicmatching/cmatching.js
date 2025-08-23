// === Matching Game Logic ===
const items = ['🍎','🍌','🥕','🥦','🚗','🚲','⚽','🏀','👕','👟'];
let firstCard = null;
let lockBoard = false;
let matchesFound = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setupGrid() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  playSound('shuffleSound');

  grid.innerHTML = '';
  matchesFound = 0;
  firstCard = null;
  lockBoard = false;

  const winnerOverlay = document.getElementById('winnerOverlay');
  const feedback = document.getElementById('feedback');
  if (winnerOverlay) winnerOverlay.classList.remove('show');
  if (feedback) feedback.innerText = '';

  const pairList = shuffle([...items, ...items]);
  pairList.forEach(value => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.value = value;

    const inner = document.createElement('div');
    inner.className = 'card-inner';
    const front = document.createElement('div');
    front.className = 'card-front';
    front.textContent = '❔';
    const back = document.createElement('div');
    back.className = 'card-back';
    back.textContent = value;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    card.addEventListener('click', () => flipCard(card));
    grid.appendChild(card);
  });
}

function flipCard(card) {
  if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  card.classList.add('flipped');
  if (!firstCard) {
    firstCard = card;
    return;
  }
  const secondCard = card;
  checkMatch(firstCard, secondCard);
  firstCard = null;
}

function checkMatch(c1, c2) {
  if (c1.dataset.value === c2.dataset.value) {
    c1.classList.add('matched');
    c2.classList.add('matched');
    feedbackMsg(['MATCH!', 'Good job!']);
    playSound('ding');
    matchesFound++;
    if (matchesFound === items.length) {
      endGame();
    }
  } else {
    feedbackMsg(['Not quite right', 'Oops, try again!']);
    playSound('buzzer');
    lockBoard = true;
    c1.classList.add('shake');
    c2.classList.add('shake');
    setTimeout(() => {
      c1.classList.remove('flipped', 'shake');
      c2.classList.remove('flipped', 'shake');
      lockBoard = false;
    }, 800);
  }
}

function feedbackMsg(list) {
  const feedback = document.getElementById('feedback');
  if (feedback) feedback.innerText = list[Math.floor(Math.random() * list.length)];
}

function playSound(id) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    el.currentTime = 0;
    el.play();
  } catch (e) {}
}

function endGame() {
  const winnerOverlay = document.getElementById('winnerOverlay');
  if (winnerOverlay) winnerOverlay.classList.add('show');

  // Dismiss overlay when clicking anywhere
  winnerOverlay.addEventListener('click', () => {
    winnerOverlay.classList.remove('show');
  }, { once: true });
}

// Auto-initialize grid
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('grid')) setupGrid();

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', setupGrid);
  }

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '../../index.html';
    });
  }
});
