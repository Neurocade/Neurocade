const scoreWindow = document.getElementById('scoreWindow');
const highScoreWindow = document.getElementById('highScoreWindow');
let highScore = Number(localStorage.getItem('nbackHighScore') || 0);
if (highScoreWindow) highScoreWindow.textContent = highScore;
const muteBtn = document.getElementById('muteBtn');
let isMuted = false;
// Preload audio elements for feedback
const correctAudio = new Audio('../../assets/sounds/correctchoice.mp3');
const errorAudio = new Audio('../../assets/sounds/error.mp3');

// Helper to flash feedback images
function flashFeedback(type) {
  const left = document.getElementById('feedbackLeft');
  const right = document.getElementById('feedbackRight');
  if (type === 'correct') {
    if (left) {
      left.innerHTML = '<img src="../../assets/images/correctcheck.png" alt="Correct" class="feedback-img" />';
      setTimeout(() => { left.innerHTML = ''; }, 600);
    }
    if (!isMuted) {
      correctAudio.currentTime = 0;
      correctAudio.play();
    }
  } else if (type === 'wrong') {
    if (right) {
      right.innerHTML = '<img src="../../assets/images/wrongx.png" alt="Wrong" class="feedback-img" />';
      setTimeout(() => { right.innerHTML = ''; }, 600);
    }
    if (!isMuted) {
      errorAudio.currentTime = 0;
      errorAudio.play();
    }
// Mute button logic
if (muteBtn) {
  muteBtn.onclick = () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
  };
}
  }
}
const introScreen = document.getElementById('introScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');

const startBtn = document.getElementById('startBtn');
const backHomeBtnIntro = document.getElementById('backHomeBtnIntro');
const playAgainBtn = document.getElementById('playAgainBtn');
const backHomeBtnResult = document.getElementById('backHomeBtnResult');

const digitDisplay = document.getElementById('digitDisplay');
const answerButtonsRow1 = document.getElementById('answerButtonsRow1');
const answerButtonsRow2 = document.getElementById('answerButtonsRow2');
const statusText = document.getElementById('statusText');
const finalScore = document.getElementById('finalScore');
const resetBtn = document.getElementById('resetBtn');
const backHomeBtnGame = document.getElementById('backHomeBtnGame');
const disablePromptsBtn = document.getElementById('disablePromptsBtn');
let promptsEnabled = true;

let level = 2, rate = 2, score = 0;
let sequence = [], currentTrial = 0, timer = null;
let answerLocked = false;

const levelRow = document.getElementById('levelRow');
for(let i=1;i<=9;i++){
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.className='level-btn';
  btn.onclick=()=>{
    level=i; updateLevelButtons();
  };
  levelRow.appendChild(btn);
}
function updateLevelButtons(){
  document.querySelectorAll('.level-btn').forEach((b, idx) => {
    if(idx === level-1) b.classList.add('selected');
    else b.classList.remove('selected');
  });
}
updateLevelButtons();

const rateRow = document.getElementById('rateRow');
for(let i=1;i<=5;i++){
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.className='rate-btn';
  btn.onclick=()=>{
    rate=i; updateRateButtons();
  };
  rateRow.appendChild(btn);
}
function updateRateButtons(){
  document.querySelectorAll('.rate-btn').forEach((b, idx) => {
    if(idx === rate-1) b.classList.add('selected');
    else b.classList.remove('selected');
  });
}
updateRateButtons();

function buildAnswerButtons(){
  answerButtonsRow1.innerHTML = '';
  answerButtonsRow2.innerHTML = '';
  for(let i=1;i<=9;i++){
    const btn=document.createElement('button');
    btn.textContent=i;
    btn.className='num-btn';
    btn.setAttribute('data-key', i);
    btn.onclick=()=>submitAnswer(i);
    answerButtonsRow1.appendChild(btn);
  }
  for(let i=10;i<=18;i++){
    const btn=document.createElement('button');
    btn.textContent=i;
    btn.className='num-btn';
    btn.setAttribute('data-key', i);
    btn.onclick=()=>submitAnswer(i);
    answerButtonsRow2.appendChild(btn);
  }
}

function setAnswerButtonsEnabled(enabled) {
  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.5";
    btn.style.pointerEvents = enabled ? "auto" : "none";
  });
}

function showScreen(screen){
  [introScreen,gameScreen,resultsScreen].forEach(s=>s.classList.remove('active'));
  screen.classList.add('active');
  if(screen === introScreen){
    answerButtonsRow1.innerHTML = '';
    answerButtonsRow2.innerHTML = '';
    statusText.textContent = '';
    if (timer) clearTimeout(timer);
  } else if(screen === gameScreen){
    buildAnswerButtons();
    statusText.textContent = '';
    promptsEnabled = true;
    if(disablePromptsBtn) disablePromptsBtn.textContent = 'Disable Prompts';
  } else if(screen === resultsScreen){
    answerButtonsRow1.innerHTML = '';
    answerButtonsRow2.innerHTML = '';
  }
}

function resetGameState() {
  score=0;
  currentTrial=0;
  sequence=[];
  answerLocked = false;
  if (scoreWindow) scoreWindow.textContent = score;
  if (timer) clearTimeout(timer);
}

function startGame(){
  resetGameState();
  showScreen(gameScreen);
  nextTrial();
}

function nextTrial() {
  if (timer) clearTimeout(timer);
  answerLocked = false;
  setAnswerButtonsEnabled(false);
  if(currentTrial>=20){
    endGame();
    return;
  }
  const number=Math.floor(Math.random()*9)+1;
  sequence.push(number);
  digitDisplay.textContent=number;
  digitDisplay.style.opacity='1';
  statusText.textContent='';
  // Show the number for a fixed time (1000ms), then fade out and enable input (if enough sequence)
  setTimeout(()=>{
    digitDisplay.style.opacity='0';
    if(sequence.length > level){ // Only enable answer if enough digits for n-back
      if(promptsEnabled) statusText.textContent = `What is the sum of this number and the one from ${level} step${level>1?'s':''} back?`;
      setAnswerButtonsEnabled(true);
      answerLocked = false;
      // Give the player 'rate' seconds to answer
      timer = setTimeout(()=>{
        if (!answerLocked) {
          if(promptsEnabled) statusText.textContent = 'No answer submitted! (Timed out)';
          setAnswerButtonsEnabled(false);
          answerLocked = true;
          setTimeout(nextTrial, 800);
        }
      }, rate*2000);
    } else {
      if(promptsEnabled) statusText.textContent = `Remember this number! (${level}-back starts after ${level} numbers)`;
      setAnswerButtonsEnabled(false);
      // Wait a fixed time before next number (1000ms)
  timer = setTimeout(nextTrial, 1000);
    }
    currentTrial++;
  }, 1000); // Number is visible for 1 second
}

function submitAnswer(n){
  if(answerLocked) return;
  if(sequence.length <= level) {
    if(promptsEnabled) statusText.textContent = `Not enough numbers yet!`;
    return;
  }
  // Compute correct answer for this trial:
  // For trial X, correct answer is sequence[X-1] + sequence[X-1-level]
  const idx = currentTrial-1; // because we incremented currentTrial in nextTrial
  const answer = sequence[idx] + sequence[idx - level];
  const correct = (n === answer);
  if(correct){
    score+=10;
    if (scoreWindow) scoreWindow.textContent = score;
    if (score > highScore) {
      highScore = score;
      if (highScoreWindow) highScoreWindow.textContent = highScore;
      localStorage.setItem('nbackHighScore', highScore);
    }
    digitDisplay.classList.add('good');
    flashFeedback('correct');
    if(promptsEnabled) statusText.textContent = "Correct!";
  } else {
    score-=5;
    if (scoreWindow) scoreWindow.textContent = score;
    digitDisplay.classList.add('bad');
    flashFeedback('wrong');
    if(promptsEnabled) statusText.textContent = `Incorrect! Correct answer: ${answer}`;
  }
  answerLocked = true;
  setAnswerButtonsEnabled(false);
  setTimeout(()=>{
    digitDisplay.classList.remove('good','bad');
    nextTrial();
  }, 650);
}

function endGame(){
  finalScore.textContent=`Score: ${score}`;
  showScreen(resultsScreen);
}


startBtn.onclick = startGame;

backHomeBtnIntro && (backHomeBtnIntro.onclick = () => window.location.href='../../index.html');
playAgainBtn && (playAgainBtn.onclick = startGame);
backHomeBtnResult && (backHomeBtnResult.onclick = () => window.location.href='../../index.html');
resetBtn && (resetBtn.onclick = startGame);
backHomeBtnGame && (backHomeBtnGame.onclick = () => window.location.href='../../index.html');
disablePromptsBtn && (disablePromptsBtn.onclick = () => {
  promptsEnabled = !promptsEnabled;
  disablePromptsBtn.textContent = promptsEnabled ? 'Disable Prompts' : 'Enable Prompts';
  if(!promptsEnabled) statusText.textContent = '';
});

document.addEventListener('keydown', e=>{
  if(gameScreen.classList.contains('active') && !answerLocked){
    let n = parseInt(e.key, 10);
    if(n>=1 && n<=9){
      submitAnswer(n);
    }
    // For '10' to '18', handle by combining last two keypresses, or use event.code if needed
    if(e.key.length === 2 && e.key >= '10' && e.key <= '18'){
      submitAnswer(Number(e.key));
    }
  }
});

showScreen(introScreen);
