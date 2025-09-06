// ====== Utility random helpers ======
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '123456789';
const POOL = (LETTERS + DIGITS).split('');

function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function randomUniqueSequence(len){
  const pool = [...POOL];
  const seq = [];
  for(let i=0;i<len;i++){
    const idx = Math.floor(Math.random()*pool.length);
    seq.push(pool[idx]);
    pool.splice(idx,1);
  }
  return seq.join('');
}

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// ====== DOM refs ======
const startScreen = document.getElementById('start-screen');
const gameScreen  = document.getElementById('game-screen');
const btnStart    = document.getElementById('btn-start');
const btnHome     = document.getElementById('btn-home');
const btnBackToStart = document.getElementById('btn-back-to-start');
const btnBackToHome = document.getElementById('btn-back-to-home');

const taskInstructions = document.getElementById('task-instructions');
const phaseBanner      = document.getElementById('phase-banner');
const readyGo          = document.getElementById('ready-go');
const sequenceEl       = document.getElementById('sequence');
const squaresWrap      = document.getElementById('squares');

const answerModal      = document.getElementById('answer-modal');
const answerPrompt     = document.getElementById('answer-prompt');
const answerInput      = document.getElementById('answer-input');
const submitAnswer     = document.getElementById('submit-answer');
const feedbackEl       = document.getElementById('feedback');

const scoreEl          = document.getElementById('score');
const highScoreEl      = document.getElementById('high-score');
const streakEl         = document.getElementById('streak');
const phaseIndicator   = document.getElementById('phase-indicator');

const phase3Card       = document.getElementById('phase3-card');
const phase3Continue   = document.getElementById('phase3-continue');

// ====== Game state ======
let score = 0;
let highScore = parseInt(localStorage.getItem('memory-trace-highscore') || '0', 10);
let phase = 1;
let correctStreak = 0;
let showing = false;
let currentSequence = '';
let needReverse = false;
let awaitingInput = false;
let isFirstRoundOfPhase = true;

// ====== Accessibility: Modal focus trap ======
function trapModalFocus() {
  if (answerModal.classList.contains('hidden')) return;
  const focusable = answerModal.querySelectorAll('input,button');
  const first = focusable[0], last = focusable[focusable.length-1];
  answerModal.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
}

// ====== Score & UI helpers ======
function setScore(delta){
  score += delta;
  scoreEl.textContent = score;
  if(score > highScore){
    highScore = score;
    localStorage.setItem('memory-trace-highscore', String(highScore));
    highScoreEl.textContent = highScore;
  }
}
function setStreak(ok){
  if(ok) correctStreak++; else correctStreak = 0;
  streakEl.textContent = `Streak: ${correctStreak}`;
}
function setPhaseDisplay(){
  phaseIndicator.textContent = `Phase ${phase}`;
}

// ====== Navigation ======
btnStart.addEventListener('click', () => {
  startScreen.classList.remove('active');
  gameScreen.classList.add('active');
  resetGame();
  introAndRound();
});

btnHome.addEventListener('click', () => {
  window.location.href = "../../index.html";
});

// Back to Start button: show start screen, hide game screen
btnBackToStart?.addEventListener('click', () => {
  gameScreen.classList.remove('active');
  startScreen.classList.add('active');
});

// Back to Home button: go to home page
btnBackToHome?.addEventListener('click', () => {
  window.location.href = "../../index.html";
});

// ====== Core flow ======
function resetGame(){
  score = 0;
  correctStreak = 0;
  needReverse = false;
  isFirstRoundOfPhase = true;
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  setPhaseDisplay();
  streakEl.textContent = 'Streak: 0';
  taskInstructions.textContent = '';
  sequenceEl.textContent = '';
  readyGo.textContent = '';
  squaresWrap.innerHTML = '';
  squaresWrap.className = 'squares';
  hideModal();
  hidePhase3Card();
}

async function introAndRound(){
  showing = true;
  if (isFirstRoundOfPhase) {
    await showPhaseIntro();
    await showReadyGo();
    isFirstRoundOfPhase = false;
  }
  await presentSequence();
  await distractionTask();
  promptForAnswer();
  showing = false;
}

function showPhaseIntro(){
  return new Promise(resolve=>{
    phaseBanner.textContent = `Phase ${phase}`;
    phaseBanner.classList.add('fade-in-out');
    phaseBanner.style.opacity = '1';
    setTimeout(()=>{
      phaseBanner.classList.remove('fade-in-out');
      phaseBanner.style.opacity = '0';
      resolve();
    }, 1500);
  });
}

function showReadyGo(){ // "Ready?" duration
  return new Promise(resolve=>{
    readyGo.textContent = 'Ready?';
    setTimeout(()=>{ // "Go!" duration
      readyGo.classList.remove('flash');
      readyGo.textContent = 'Go!';
      readyGo.classList.add('flash');
      setTimeout(()=>{
        readyGo.classList.remove('flash');
        readyGo.textContent = '';
        resolve();
      }, 1500); // <-- "Go!" duration in milliseconds
    }, 1200); // <-- "Ready?" duration in milliseconds
  });
}

function presentSequence(){
  return new Promise(resolve=>{
    let len;
    if (phase === 1) {
      len = 3;
    } else if (phase === 2) {
      len = 4;
    } else if (phase === 3) {
      len = 5;
    } else if (phase === 4) {
      len = 3;
    } else if (phase === 5) {
      len = 4;
    } else {
      len = 3;
    }
    currentSequence = randomUniqueSequence(len);
    sequenceEl.textContent = currentSequence;
    setTimeout(()=>{
      sequenceEl.textContent = '';
      resolve();
    }, 2000);
  });
}

function distractionTask(){
  return new Promise(resolve=>{
    const isPhase1 = (phase===1);
    const count = isPhase1 ? 4 : 5;
    const colorDefs = [
      {name:'red',    css:'background: var(--red)'},
      {name:'green',  css:'background: var(--green)'},
      {name:'yellow', css:'background: var(--yellow)'},
      {name:'pink',   css:'background: var(--pink)'},
      {name:'purple', css:'background: var(--purple)'},
      {name:'blue',   css:'background: var(--accent)'}
    ];
    const colors = shuffle(colorDefs).slice(0, count);
    squaresWrap.innerHTML = '';
    squaresWrap.classList.add(isPhase1 ? 'grid4' : 'grid5');
    colors.forEach((c, idx)=>{
      const div = document.createElement('div');
      div.className = 'square';
      div.setAttribute('data-color', c.name);
      div.style = c.css;
      div.tabIndex = 0;
      div.addEventListener('click', onSquareClick);
      squaresWrap.appendChild(div);
    });
    const target = randomChoice(colors).name;
    taskInstructions.innerHTML = `Select the ‘<span style="text-transform:uppercase">${target}</span>’ square`;
    function onSquareClick(){
      const chosen = this.getAttribute('data-color');
      this.style.boxShadow = '0 0 24px rgba(255,255,255,0.45) inset, 0 0 24px rgba(255,255,255,0.25)';
      let isCorrect = (chosen === target);
      if (!isCorrect) {
        setScore(-25);
        // Flash -25 feedback at top
        distractorFeedback.textContent = '-25';
        distractorFeedback.style.color = 'var(--red)';
        distractorFeedback.style.opacity = '1';
        this.style.border = '4px solid var(--red)';
        setTimeout(() => {
          distractorFeedback.style.opacity = '0';
        }, 700);
      } else {
        // Flash green border for correct
        this.style.border = '4px solid var(--green)';
        distractorFeedback.textContent = '';
        distractorFeedback.style.opacity = '0';
      }
      setTimeout(()=>{
        this.style.border = '';
        taskInstructions.textContent = '';
        squaresWrap.innerHTML = '';
        resolve();
      }, 350);
      [...squaresWrap.children].forEach(sq=>sq.replaceWith(sq.cloneNode(true)));
    }
  });
}

function promptForAnswer(){
  awaitingInput = true;
  feedbackEl.textContent = '';
  answerInput.value = '';
  needReverse = (phase === 4 || phase === 5);
  if(needReverse){
    answerPrompt.innerHTML = `Enter the characters you saw, <strong>in reverse order</strong>:`;
  }else{
    answerPrompt.textContent = `Enter the characters you saw:`;
  }
  showModal();
  answerInput.focus();
  trapModalFocus();
}

function showModal(){
  answerModal.classList.remove('hidden');
  answerModal.setAttribute('aria-hidden', 'false');
}
function hideModal(){
  answerModal.classList.add('hidden');
  answerModal.setAttribute('aria-hidden', 'true');
}

function showPhase3Card(){
  phase3Card.classList.remove('hidden');
}
function hidePhase3Card(){
  phase3Card.classList.add('hidden');
}

submitAnswer.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ checkAnswer(); }
  if(e.key === 'Escape'){ hideModal(); }
});

answerModal.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){ hideModal(); }
});

function normalize(str){
  return (str || '').toUpperCase().replace(/[^A-Z1-9]/g,'');
}

function multiset(str){
  const m = new Map();
  for(const ch of str){ m.set(ch, (m.get(ch)||0)+1); }
  return m;
}

function equalMultiset(a,b){
  if(a.size !== b.size) return false;
  for(const [k,v] of a){
    if(b.get(k)!==v) return false;
  }
  return true;
}

function checkAnswer(){
  if(!awaitingInput) return;
  const raw = normalize(answerInput.value);
  const target = needReverse ? currentSequence.split('').reverse().join('') : currentSequence;
  let result = 'wrong';
  if(raw === target){
    result = 'correct';
  }else{
    if(raw.length === target.length && equalMultiset(multiset(raw), multiset(target))){
      result = 'partial';
    }else{
      result = 'wrong';
    }
  }
  if(result === 'correct'){
    setScore(+100);
    setStreak(true);
    feedbackEl.style.color = 'var(--green)';
    feedbackEl.textContent = 'Correct! +100';
  }else if(result === 'partial'){
    setScore(+50);
    setStreak(false);
    feedbackEl.style.color = 'var(--yellow)';
    feedbackEl.textContent = 'Partially correct (+50): right characters, wrong order.';
  }else{
    setScore(-50);
    setStreak(false);
    feedbackEl.style.color = 'var(--red)';
    feedbackEl.textContent = 'Incorrect (-50).';
  }
  awaitingInput = false;
  setTimeout(()=>{
    hideModal();
    if(correctStreak >= 3){
      correctStreak = 0;
      streakEl.textContent = 'Streak: 0';
      if(phase === 1){
        phase = 2;
        setPhaseDisplay();
        isFirstRoundOfPhase = true;
        introAndRound();
      }else if(phase === 2){
        phase = 3;
        setPhaseDisplay();
        isFirstRoundOfPhase = true;
        introAndRound();
      }else if(phase === 3){
        phase = 4;
        setPhaseDisplay();
        isFirstRoundOfPhase = true;
        introAndRound();
      }else if(phase === 4){
        phase = 5;
        setPhaseDisplay();
        isFirstRoundOfPhase = true;
        introAndRound();
      }else{
        isFirstRoundOfPhase = true;
        introAndRound();
      }
      return;
    }
    introAndRound();
  }, 650);
}

phase3Continue?.addEventListener('click', ()=>{
  hidePhase3Card();
  introAndRound();
});

answerInput.addEventListener('input', ()=>{
  let maxLen;
  if (phase === 1) {
    maxLen = 3;
  } else if (phase === 2) {
    maxLen = 4;
  } else if (phase === 3) {
    maxLen = 5;
  } else if (phase === 4) {
    maxLen = 3;
  } else if (phase === 5) {
    maxLen = 4;
  } else {
    maxLen = 3;
  }
  const cleaned = normalize(answerInput.value).slice(0, maxLen);
  if(answerInput.value !== cleaned){
    answerInput.value = cleaned;
  }
});

// ====== Debug Phase Selector ======
const debugPhaseSelector = document.createElement('select');
debugPhaseSelector.id = 'debug-phase-selector';
debugPhaseSelector.style.position = 'absolute';
debugPhaseSelector.style.top = '10px';
debugPhaseSelector.style.right = '10px';
debugPhaseSelector.style.zIndex = '1000';
debugPhaseSelector.innerHTML = `
  <option value="1">Phase 1</option>
  <option value="2">Phase 2</option>
  <option value="3">Phase 3</option>
  <option value="4">Phase 4</option>
  <option value="5">Phase 5</option>
`;
document.body.appendChild(debugPhaseSelector);

debugPhaseSelector.addEventListener('change', (e) => {
  phase = parseInt(e.target.value, 10);
  setPhaseDisplay();
  isFirstRoundOfPhase = true;
  resetGame();
  introAndRound();
});

// ====== Distractor Feedback Element ======
let distractorFeedback = document.getElementById('distractor-feedback');
if (!distractorFeedback) {
  distractorFeedback = document.createElement('div');
  distractorFeedback.id = 'distractor-feedback';
  distractorFeedback.style.position = 'absolute';
  distractorFeedback.style.top = '155px'; // Lower the feedback below the top
  distractorFeedback.style.left = '0';
  distractorFeedback.style.right = '170px';
  distractorFeedback.style.margin = '0 auto';
  distractorFeedback.style.textAlign = 'center';
  distractorFeedback.style.fontSize = '2rem';
  distractorFeedback.style.fontWeight = 'bold';
  distractorFeedback.style.zIndex = '1001';
  distractorFeedback.style.pointerEvents = 'none';
  distractorFeedback.style.height = '2.5rem';
  distractorFeedback.style.lineHeight = '2.5rem';
  distractorFeedback.style.transition = 'opacity 0.2s';
  distractorFeedback.style.opacity = '0';
  document.body.appendChild(distractorFeedback);
}
