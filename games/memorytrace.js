// ====== Utility random helpers ======
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '123456789';
const POOL = (LETTERS + DIGITS).split(''); // no zero per brief example

function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function randomUniqueSequence(len){
  // Sample without replacement to avoid duplicate characters (makes partial-credit logic fair)
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
let phase = 1;              // 1, 2, 3
let correctStreak = 0;
let showing = false;        // lock for UI steps
let currentSequence = '';   // shown sequence (uprcase)
let needReverse = false;    // phase 3 rule
let awaitingInput = false;

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
  introAndRound(); // starts Phase 1 banner then round
});

btnHome.addEventListener('click', () => {
  // You can change this to a specific URL if desired:
  if (history.length > 1) history.back();
  else window.location.href = '/';
});

// ====== Core flow ======
function resetGame(){
  score = 0;
  correctStreak = 0;
  phase = 1;
  needReverse = false;
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
  await showPhaseIntro(); // fade-in/out Phase X
  await showReadyGo();    // Ready? Go!
  await presentSequence(); // show chars
  await distractionTask(); // color squares + click
  promptForAnswer();       // input modal
  showing = false;
}

// Phase intro: "Phase 1/2/3"
function showPhaseIntro(){
  return new Promise(resolve=>{
    phaseBanner.textContent = `Phase ${phase}`;
    phaseBanner.classList.add('fade-in-out');
    phaseBanner.style.opacity = '1';
    setTimeout(()=>{
      phaseBanner.classList.remove('fade-in-out');
      phaseBanner.style.opacity = '0';
      resolve();
    }, 1500); // ~1.5s
  });
}

// Ready → Go
function showReadyGo(){
  return new Promise(resolve=>{
    readyGo.textContent = 'Ready?';
    readyGo.classList.add('flash');
    setTimeout(()=>{
      readyGo.classList.remove('flash');
      readyGo.textContent = 'Go!';
      readyGo.classList.add('flash');
      setTimeout(()=>{
        readyGo.classList.remove('flash');
        readyGo.textContent = '';
        resolve();
      }, 600);
    }, 700);
  });
}

// Present characters
function presentSequence(){
  return new Promise(resolve=>{
    const len = (phase === 1) ? 3 : 4;
    currentSequence = randomUniqueSequence(len);
    sequenceEl.textContent = currentSequence;
    setTimeout(()=>{
      sequenceEl.textContent = '';
      resolve();
    }, 1000); // visible for ~1s
  });
}

// Distraction task: colored squares
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
    // If 5, layout as 4 corners + center: we’ll rely on grid; visual still fine.

    // Build squares
    colors.forEach((c, idx)=>{
      const div = document.createElement('div');
      div.className = 'square';
      div.setAttribute('data-color', c.name);
      div.style = c.css;
      div.addEventListener('click', onSquareClick);
      squaresWrap.appendChild(div);
    });

    // Random target color from the displayed set
    const target = randomChoice(colors).name;
    taskInstructions.innerHTML = `Select the ‘<span style="text-transform:uppercase">${target}</span>’ square`;

    // When any square is clicked, clean up and resolve (regardless of correctness)
    function onSquareClick(){
      // brief visual nudge
      this.style.boxShadow = '0 0 24px rgba(255,255,255,0.45) inset, 0 0 24px rgba(255,255,255,0.25)';
      // Hide after a short delay for feedback snappiness
      setTimeout(()=>{
        taskInstructions.textContent = '';
        squaresWrap.innerHTML = '';
        resolve();
      }, 180);
      // Remove listeners
      [...squaresWrap.children].forEach(sq=>sq.replaceWith(sq.cloneNode(true)));
    }
  });
}

// Answer prompt
function promptForAnswer(){
  awaitingInput = true;
  feedbackEl.textContent = '';
  answerInput.value = '';
  needReverse = (phase === 3);
  if(needReverse){
    answerPrompt.innerHTML = `Enter the characters you saw, <strong>in reverse order</strong>:`;
  }else{
    answerPrompt.textContent = `Enter the characters you saw:`;
  }
  showModal();
  answerInput.focus();
}

function showModal(){ answerModal.classList.remove('hidden'); }
function hideModal(){ answerModal.classList.add('hidden'); }

function showPhase3Card(){
  phase3Card.classList.remove('hidden');
}
function hidePhase3Card(){
  phase3Card.classList.add('hidden');
}

submitAnswer.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ checkAnswer(); }
});

// Checking logic:
// - Correct: exact match (phase 3 uses reversed target)
// - Partial: all and only the correct characters, but wrong order
// - Wrong: otherwise (missing char, extra char, or wrong set)
function normalize(str){
  return (str || '').toUpperCase().replace(/[^A-Z1-9]/g,''); // keep A-Z and 1-9
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
    // Partial: same characters multiset and same length, but order differs
    if(raw.length === target.length && equalMultiset(multiset(raw), multiset(target))){
      result = 'partial';
    }else{
      result = 'wrong';
    }
  }

  // Score + streak handling
  if(result === 'correct'){
    setScore(+100);
    setStreak(true);
    feedbackEl.style.color = 'var(--green)';
    feedbackEl.textContent = 'Correct! +100';
  }else if(result === 'partial'){
    setScore(+50);
    setStreak(false); // partial breaks the "correct in a row" requirement
    feedbackEl.style.color = 'var(--yellow)';
    feedbackEl.textContent = 'Partially correct (+50): right characters, wrong order.';
  }else{
    setScore(-50);
    setStreak(false);
    feedbackEl.style.color = 'var(--red)';
    feedbackEl.textContent = 'Incorrect (-50).';
  }

  awaitingInput = false;

  // After brief feedback, continue or advance
  setTimeout(()=>{
    hideModal();

    // Phase advancement: three CORRECT in a row
    if(correctStreak >= 3){
      correctStreak = 0; // reset for next phase
      streakEl.textContent = 'Streak: 0';
      if(phase === 1){
        phase = 2;
        setPhaseDisplay();
        introAndRound();
      }else if(phase === 2){
        phase = 3;
        setPhaseDisplay();
        // Show “Phase 3” intro then extra instruction card, then continue
        (async ()=>{
          await showPhaseIntro();
          showPhase3Card();
        })();
      }else{
        // Phase 3 loops indefinitely with reverse recall
        introAndRound();
      }
      return;
    }

    // Keep playing same phase
    introAndRound();
  }, 650);
}

phase3Continue?.addEventListener('click', ()=>{
  hidePhase3Card();
  introAndRound();
});

// ====== Accessibility niceties: limit input length appropriately by phase ======
answerInput.addEventListener('input', ()=>{
  const maxLen = (phase===1) ? 3 : 4;
  const cleaned = normalize(answerInput.value).slice(0, maxLen);
  if(answerInput.value !== cleaned){
    answerInput.value = cleaned;
  }
});