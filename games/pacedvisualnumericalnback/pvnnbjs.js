const introScreen = document.getElementById('introScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');

const startBtn = document.getElementById('startBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const backHomeBtn2 = document.getElementById('backHomeBtn2');

const digitDisplay = document.getElementById('digitDisplay');
const answerButtons = document.getElementById('answerButtons');
const statusText = document.getElementById('statusText');
const finalScore = document.getElementById('finalScore');

let level = 2, rate = 2, score = 0;
let sequence = [], currentTrial = 0, timer = null;

// Build level & rate buttons
const levelRow = document.getElementById('levelRow');
for(let i=1;i<=9;i++){
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.className='level-btn';
  btn.onclick=()=>{level=i; updateLevelButtons();};
  levelRow.appendChild(btn);
}
function updateLevelButtons(){
  document.querySelectorAll('.level-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('.level-btn')[level-1].classList.add('selected');
}
updateLevelButtons();

const rateRow = document.getElementById('rateRow');
for(let i=1;i<=5;i++){
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.className='rate-btn';
  btn.onclick=()=>{rate=i; updateRateButtons();};
  rateRow.appendChild(btn);
}
function updateRateButtons(){
  document.querySelectorAll('.rate-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('.rate-btn')[rate-1].classList.add('selected');
}
updateRateButtons();

// Build 1-18 answer buttons
function buildAnswerButtons(){
  answerButtons.innerHTML='';
  for(let i=1;i<=18;i++){
    const btn=document.createElement('button');
    btn.textContent=i;
    btn.className='num-btn';
    btn.onclick=()=>submitAnswer(i);
    answerButtons.appendChild(btn);
  }
}
buildAnswerButtons();

// Switch screens
function showScreen(screen){
  [introScreen,gameScreen,resultsScreen].forEach(s=>s.classList.remove('active'));
  screen.classList.add('active');
}

// Countdown before game
function startGame(){
  showScreen(gameScreen);
  score=0;
  currentTrial=0;
  sequence=[];
  nextTrial();
}

function nextTrial(){
  if(currentTrial>=20){
    endGame();
    return;
  }
  const number=Math.floor(Math.random()*18)+1;
  sequence.push(number);
  digitDisplay.textContent=number;
  digitDisplay.style.opacity='1';
  statusText.textContent='';
  setTimeout(()=>{
    digitDisplay.style.opacity='0';
    currentTrial++;
    timer=setTimeout(nextTrial, rate*1000);
  }, rate*500);
}

function submitAnswer(n){
  const correct = (n===sequence[currentTrial-1]);
  if(correct){ score+=10; digitDisplay.classList.add('good'); }
  else { score-=5; digitDisplay.classList.add('bad'); }
  setTimeout(()=>digitDisplay.classList.remove('good','bad'),200);
}

// End Game
function endGame(){
  finalScore.textContent=`Score: ${score}`;
  showScreen(resultsScreen);
}

// Button events
startBtn.onclick=startGame;
backHomeBtn.onclick=()=>window.location.href='../../index.html';
playAgainBtn.onclick=startGame;
backHomeBtn2.onclick=()=>window.location.href='../../index.html';

// Keyboard input
document.addEventListener('keydown', e=>{
  if(gameScreen.classList.contains('active')){
    if(/\d/.test(e.key)){
      let current=answerButtons.querySelector(`.num-btn[data-key="${e.key}"]`);
      submitAnswer(Number(e.key));
    }
  }
});
