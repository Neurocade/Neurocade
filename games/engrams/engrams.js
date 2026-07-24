/* =========================================================
   ENGRAMS — Level 1: Verbal Memory (RAVLT-style)
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Word pool by category (spellings normalized;
       accepted misspellings handled by fuzzy match) ---------- */
  const WORD_POOL = {
    "Outdoor Structures": ["fence","gate","lamp post","guard rail","sidewalk","stop sign","street light","mailbox","hydrant"],
    "Buildings": ["house","school","post office","hospital","restaurant","museum","police headquarters","fire station","town hall"],
    "Fruit": ["apple","orange","grapes","peach","plum","kiwi","strawberry","cherry","tangerine","nectarine","watermelon"],
    "Vegetable": ["corn","potato","onion","spinach","kale","lettuce","radish","beet","celery","cabbage","chard","broccoli","green beans"],
    "Animal": ["cow","horse","tiger","gorilla","monkey","hawk","eagle","rhino","hippopotamus","squirrel","dog","cat","giraffe","zebra","bison","crocodile","alligator","salmon","frog","gecko","elephant"],
    "Insect": ["spider","lady bug","cockroach","ant","termite","butterfly","caterpillar","worm","beetle","mosquito","grasshopper","cricket","moth"],
    "Furniture": ["table","chair","desk","couch","recliner","dresser","bookshelf","ottoman","stool","coat rack","nightstand"],
    "Vehicle": ["car","truck","motorcycle","airplane","jet","boat","bicycle","bus","train","scooter","snowmobile","fire truck","ambulance"],
    "Flower": ["rose","lily","lilac","carnation","daisy","sunflower","marigold","begonia","tulip","orchid"],
    "Tools": ["saw","hammer","screwdriver","wrench","socket","drill","nail","screw","clamp","pliers","chisel","axe"],
    "Natural Structures": ["moon","sun","stars","clouds","cliff","prairie","mountain","valley","volcano","lake","waterfall","river","stream","boulder","sand","mud","dirt","canyon"],
    "Things That Make Noise": ["alarm","siren","bell","thunder","horn","megaphone","stereo","firecracker","gong"],
    "Musical Instrument": ["piano","drum","guitar","saxophone","tuba","french horn","trumpet","trombone","clarinet","oboe","flute","triangle","violin","viola","cello","bass"]
  };

  /* ---------- State ---------- */
  const NUM_WORDS = 12;      // words per list
  const NUM_SLOTS = 15;      // recall slots
  const WORD_GAP_MS = 1000;  // 1 second between words
  const DISTRACTOR_MS = 4 * 60 * 1000; // 4 minutes

  let listA = [];
  let listB = [];
  let currentPhase = 0;      // index into PHASES
  let speechVoice = null;

  /* Distractor stimulus lists (image filenames live in assets/images).
     Swap these for however you name your files. */
  const MANMADE_IMAGES = ["obj_car.png","obj_chair.png","obj_hammer.png","obj_house.png","obj_guitar.png","obj_bell.png"];
  const NATURAL_IMAGES = ["nat_mountain.png","nat_tree.png","nat_river.png","nat_flower.png","nat_cloud.png","nat_frog.png"];
  const IMG_PATH = "../../assets/images/";

  /* ---------- DOM ---------- */
  const el = {};
  function cacheDom() {
    el.start        = document.getElementById("engStart");
    el.beginBtn     = document.getElementById("engBeginBtn");
    el.listen       = document.getElementById("engListen");
    el.listenMsg    = document.getElementById("engListenMsg");
    el.currentWord  = document.getElementById("engCurrentWord");
    el.recall       = document.getElementById("engRecall");
    el.recallPrompt = document.getElementById("engRecallPrompt");
    el.slots        = document.getElementById("engSlots");
    el.submitBtn    = document.getElementById("engSubmitBtn");
    el.feedback     = document.getElementById("engFeedback");
    el.feedbackText = document.getElementById("engFeedbackText");
    el.continueBtn  = document.getElementById("engContinueBtn");
    el.message      = document.getElementById("engMessage");
    el.messageText  = document.getElementById("engMessageText");
    el.messageBtn   = document.getElementById("engMessageBtn");
    el.distractor   = document.getElementById("engDistractor");
    el.distractInstr= document.getElementById("engDistractorInstr");
    el.timer        = document.getElementById("engTimer");
    el.stimA        = document.getElementById("engStimA");
    el.stimB        = document.getElementById("engStimB");
    el.panels = [el.start, el.listen, el.recall, el.feedback, el.message, el.distractor];
  }

  /* ---------- Utilities ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showPanel(panel) {
    el.panels.forEach(p => p.classList.add("eng-hidden"));
    panel.classList.remove("eng-hidden");
  }

  /* Build List A: pick 12 of 13 categories, one word each */
  function buildListA() {
    const cats = shuffle(Object.keys(WORD_POOL)).slice(0, NUM_WORDS);
    return cats.map(c => ({
      cat: c,
      word: WORD_POOL[c][Math.floor(Math.random() * WORD_POOL[c].length)]
    }));
  }

  /* Build List B: 12 words, none equal to any List A word */
  function buildListB(aWords) {
    const usedWords = new Set(aWords.map(x => x.word));
    const cats = shuffle(Object.keys(WORD_POOL)).slice(0, NUM_WORDS);
    return cats.map(c => {
      const options = WORD_POOL[c].filter(w => !usedWords.has(w));
      const pick = options[Math.floor(Math.random() * options.length)];
      usedWords.add(pick);
      return { cat: c, word: pick };
    });
  }

  /* ---------- Speech ---------- */
  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    // Prefer natural-sounding voices
    const prefer = [
      /natural/i, /premium/i, /enhanced/i,
      /samantha/i, /google us english/i, /aria/i, /jenny/i, /siri/i
    ];
    for (const rx of prefer) {
      const v = voices.find(v => rx.test(v.name) && /en/i.test(v.lang));
      if (v) return v;
    }
    return voices.find(v => /^en/i.test(v.lang)) || voices[0];
  }

  function speak(text) {
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      if (speechVoice) u.voice = speechVoice;
      u.rate = 0.95;
      u.pitch = 1.0;
      u.onend = resolve;
      u.onerror = resolve;
      window.speechSynthesis.speak(u);
    });
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* Read a list aloud, 1s gap between words */
  async function readList(list) {
    showPanel(el.listen);
    el.listenMsg.textContent = "Listen carefully…";
    for (const item of list) {
      el.currentWord.textContent = "";     // words not shown per your spec (verbal only)
      await speak(item.word);
      await wait(WORD_GAP_MS);
    }
    el.currentWord.textContent = "";
  }

  /* ---------- Recall slots ---------- */
  function buildSlots() {
    el.slots.innerHTML = "";
    for (let i = 0; i < NUM_SLOTS; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.autocapitalize = "off";
      input.spellcheck = false;
      input.setAttribute("aria-label", "recall word " + (i + 1));
      el.slots.appendChild(input);
    }
  }

  function getEnteredWords() {
    return Array.from(el.slots.querySelectorAll("input"))
      .map(i => i.value.trim())
      .filter(v => v.length > 0);
  }

  /* ---------- Fuzzy matching (typos / misspellings) ---------- */
  function normalize(s) {
    return s.toLowerCase().trim().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ");
  }

  // Accept common misspelled input forms → canonical
  const SPELLING_ALIASES = {
    "plumb": "plum", "daisey": "daisy", "lilly": "lily",
    "pliar": "pliers", "pliars": "pliers", "screwdriver": "screwdriver",
    "screw driver": "screwdriver", "watermelon": "watermelon",
    "water melon": "watermelon", "lady bug": "ladybug", "ladybug": "ladybug"
  };
  function canonical(s) {
    const n = normalize(s);
    return SPELLING_ALIASES[n] || n;
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,
          dp[i][j-1] + 1,
          dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
        );
      }
    }
    return dp[m][n];
  }

  function fuzzyMatch(input, target) {
    const a = canonical(input);
    const b = canonical(target);
    if (!a) return false;
    if (a === b) return true;
    const tol = b.replace(/\s/g,"").length <= 4 ? 1 : 2; // stricter for short words
    return levenshtein(a.replace(/\s/g,""), b.replace(/\s/g,"")) <= tol;
  }

  /* Count how many target words the user recalled (each target once). */
  function scoreRecall(entered, targetList) {
    const remaining = targetList.map(t => t.word);
    let correct = 0;
    for (const inp of entered) {
      const idx = remaining.findIndex(t => fuzzyMatch(inp, t));
      if (idx !== -1) { correct++; remaining.splice(idx, 1); }
    }
    return correct;
  }

  function feedbackForScore(n) {
    if (n <= 4) return "Ok, you got a few. Let's see if you can get more with another chance.";
    if (n <= 8) return "Good, you got several. Let's see if you can get even more.";
    return "Great, you got a bunch! Try to get them all.";
  }

  /* =========================================================
     PHASE MACHINE
     ========================================================= */
  // Each phase is an async function. runPhase() advances the sequence.
  const PHASES = [
    // Trials 1-3: read List A, recall, feedback
    () => learningTrial(1, true),
    () => learningTrial(2, true),
    () => learningTrial(3, true),
    // Trial 4: read List A, recall, NO feedback
    () => learningTrial(4, false),
    // Introduce List B
    () => messageStep("Ok, now I will tell you a new list of words. Again, try to remember as many of these as you can.", () => readAndRecallB()),
    // Recall List A (short-delay) — handled inside readAndRecallB chain
    // Transition to distractor
    () => messageStep("Ok, let's try something a bit different.", () => startDistractor()),
    // Final delayed recall of List A only
    () => finalRecallA()
  ];

  function nextPhase() {
    if (currentPhase < PHASES.length) {
      const fn = PHASES[currentPhase++];
      fn();
    }
  }

  /* ---- Learning trial (List A) ---- */
  async function learningTrial(trialNum, giveFeedback) {
    await readList(listA);
    showRecall("Type in every word you can recall.", listA, (entered) => {
      if (giveFeedback) {
        const n = scoreRecall(entered, listA);
        showFeedback(feedbackForScore(n), nextPhase);
      } else {
        nextPhase();
      }
    });
  }

  /* ---- List B read + recall B + recall A ---- */
  async function readAndRecallB() {
    await readList(listB);
    // Recall List B
    showRecall(
      "Now type every word you can recall from the NEW list. Be careful not to include words from the first list.",
      listB,
      () => {
        // Then recall List A
        showRecall(
          "Now type every word you can recall from the FIRST list. Be careful not to include words from the new list.",
          listA,
          () => nextPhase() // -> transition message -> distractor
        );
      }
    );
  }

  /* ---- Generic recall screen ---- */
  function showRecall(promptText, targetList, onSubmit) {
    el.recallPrompt.textContent = promptText;
    buildSlots();
    showPanel(el.recall);
    el.submitBtn.onclick = () => {
      const entered = getEnteredWords();
      onSubmit(entered);
    };
    const first = el.slots.querySelector("input");
    if (first) first.focus();
  }

  function showFeedback(text, onContinue) {
    el.feedbackText.textContent = text;
    showPanel(el.feedback);
    el.continueBtn.onclick = onContinue;
  }

  function messageStep(text, onContinue) {
    el.messageText.textContent = text;
    showPanel(el.message);
    el.messageBtn.onclick = () => onContinue();
  }

  /* ---- Distractor task (4 min, natural vs man-made) ---- */
  function startDistractor() {
    const targetNatural = Math.random() < 0.5; // true => click natural
    el.distractInstr.textContent = targetNatural
      ? "Click the NATURAL object (not man-made) as fast as you can."
      : "Click the MAN-MADE object as fast as you can.";
    showPanel(el.distractor);

    const endTime = Date.now() + DISTRACTOR_MS;

    function updateTimer() {
      const remain = Math.max(0, endTime - Date.now());
      const s = Math.ceil(remain / 1000);
      el.timer.textContent = "Time: " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }

    function loadTrial() {
      if (Date.now() >= endTime) {
        clearInterval(timerInt);
        nextPhase(); // -> final recall A
        return;
      }
      const manmade = MANMADE_IMAGES[Math.floor(Math.random() * MANMADE_IMAGES.length)];
      const natural = NATURAL_IMAGES[Math.floor(Math.random() * NATURAL_IMAGES.length)];
      const naturalOnLeft = Math.random() < 0.5;

      const leftIsNatural = naturalOnLeft;
      setStim(el.stimA, leftIsNatural ? natural : manmade, leftIsNatural);
      setStim(el.stimB, leftIsNatural ? manmade : natural, !leftIsNatural);

      el.stimA.onclick = () => handleClick(el.stimA);
      el.stimB.onclick = () => handleClick(el.stimB);

      function handleClick(clicked) {
        const clickedNatural = clicked.dataset.natural === "true";
        const correct = (clickedNatural === targetNatural);
        clicked.classList.add(correct ? "correct-flash" : "wrong-flash");
        setTimeout(() => {
          clicked.classList.remove("correct-flash", "wrong-flash");
          loadTrial();
        }, 180);
      }
    }

    function setStim(node, filename, isNatural) {
      node.dataset.natural = isNatural ? "true" : "false";
      node.innerHTML = "";
      const img = new Image();
      img.src = IMG_PATH + filename;
      img.alt = "";
      img.onerror = () => { node.textContent = filename.replace(/\.\w+$/, ""); };
      node.appendChild(img);
    }

    const timerInt = setInterval(updateTimer, 250);
    updateTimer();
    loadTrial();
  }

  /* ---- Final delayed recall of List A only ---- */
  function finalRecallA() {
    messageStep(
      "Now try to recall every word you can from the FIRST list only. Do not include any words from the new list.",
      () => {
        showRecall(
          "Type every word you can recall from the FIRST list only.",
          listA,
          () => {
            messageStep("All done. Great work! You can Reset to play again, or return Home.", () => {
              showPanel(el.start);
            });
          }
        );
      }
    );
  }

  /* =========================================================
     INIT / RESET
     ========================================================= */
  function initGame() {
    listA = buildListA();
    listB = buildListB(listA);
    currentPhase = 0;
    showPanel(el.start);
  }

  // Exposed globally so shared.js Reset button works
  window.resetGame = function () {
    window.speechSynthesis && window.speechSynthesis.cancel();
    initGame();
  };

  document.addEventListener("DOMContentLoaded", function () {
    cacheDom();

    // Load voices (async on some browsers)
    if (window.speechSynthesis) {
      speechVoice = pickVoice();
      window.speechSynthesis.onvoiceschanged = () => { speechVoice = pickVoice(); };
    }

    el.beginBtn.addEventListener("click", () => {
      // A user gesture is required to unlock speech on iOS/Chrome
      if (window.speechSynthesis) {
        speechVoice = pickVoice();
        window.speechSynthesis.cancel();
      }
      nextPhase(); // begins Trial 1
    });

    initGame();
  });
})();
