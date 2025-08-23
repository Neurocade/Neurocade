document.addEventListener("DOMContentLoaded", () => {
  const titleScreen = document.getElementById("title-screen");
  const gameScreen = document.getElementById("game-screen");
  const startBtn = document.getElementById("start-game");
  const statusText = document.getElementById("status-text");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const horn = document.getElementById("horn");

  const winOverlay = document.getElementById("win-overlay");
  const playAgainBtn = document.getElementById("play-again");
  const backHomeBtn = document.getElementById("back-home");

  let level = 1;
  let playerCar = { x: 0, y: 0, width: 40, height: 60, speed: 3, image: new Image() };
  playerCar.image.src = "../../assets/images/player_car.png";
  let aiCars = [];
  let keys = {};
  let destinationLandmark = null;

  // Hide overlay at start
  winOverlay.style.display = "none";

  startBtn.addEventListener("click", () => {
    titleScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    startGameFlow();
  });

  playAgainBtn.addEventListener("click", () => {
    winOverlay.style.display = "none";
    gameScreen.classList.add("hidden");
    titleScreen.classList.remove("hidden");
    level = 1;
  });

  backHomeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  function startGameFlow() {
    // Initialize player
    playerCar.x = Math.floor(Math.random() * (canvas.width - playerCar.width));
    playerCar.y = Math.floor(Math.random() * (canvas.height - playerCar.height));
    
    // Initialize AI cars
    aiCars = [];
    for (let i = 0; i < 2; i++) {
      let ai = { 
        x: Math.floor(Math.random() * (canvas.width - 40)), 
        y: Math.floor(Math.random() * (canvas.height - 60)),
        width: 40, height: 60, speed: 2, dirX: 0, dirY: 0, image: new Image()
      };
      ai.image.src = "../../assets/images/ai_car.png";
      ai.dirX = Math.random() < 0.5 ? -1 : 1;
      ai.dirY = Math.random() < 0.5 ? -1 : 1;
      aiCars.push(ai);
    }

    statusText.textContent = "Get Ready...";
    setTimeout(() => {
      const directions = generateDirections(level);
      statusText.textContent = directions;

      setTimeout(() => {
        countdown(3, () => {
          statusText.textContent = "Go!";
          setTimeout(() => {
            statusText.textContent = "";
            startDriving();
          }, 500);
        });
      }, Math.max(5000, level*2000)); // longer display for higher levels
    }, 1500);
  }

  function countdown(num, callback) {
    if (num === 0) {
      callback();
      return;
    }
    statusText.textContent = num;
    setTimeout(() => countdown(num - 1, callback), 500);
  }

  function startDriving() {
    window.addEventListener("keydown", (e) => {
      keys[e.key] = true;
      if (e.key === " ") horn.play(); // horn
    });
    window.addEventListener("keyup", (e) => keys[e.key] = false);

    function update() {
      movePlayer();
      moveAI();
      drawScene();
      checkWin();

      requestAnimationFrame(update);
    }
    update();
  }

  function movePlayer() {
    let newX = playerCar.x;
    let newY = playerCar.y;
    if (keys["ArrowUp"]) newY -= playerCar.speed;
    if (keys["ArrowDown"]) newY += playerCar.speed;
    if (keys["ArrowLeft"]) newX -= playerCar.speed;
    if (keys["ArrowRight"]) newX += playerCar.speed;

    if (isOnRoad(newX, newY) && !checkCollision(newX, newY)) {
      playerCar.x = newX;
      playerCar.y = newY;
    }
  }

  function moveAI() {
    aiCars.forEach(ai => {
      ai.x += ai.dirX * ai.speed;
      ai.y += ai.dirY * ai.speed;
      // bounce off edges
      if (ai.x < 0 || ai.x + ai.width > canvas.width) ai.dirX *= -1;
      if (ai.y < 0 || ai.y + ai.height > canvas.height) ai.dirY *= -1;
    });
  }

  function checkCollision(x, y) {
    for (const ai of aiCars) {
      if (x < ai.x + ai.width && x + playerCar.width > ai.x &&
          y < ai.y + ai.height && y + playerCar.height > ai.y) return true;
    }
    return false;
  }

  function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    // Player
    ctx.drawImage(playerCar.image, playerCar.x, playerCar.y, playerCar.width, playerCar.height);
    // AI
    aiCars.forEach(ai => ctx.drawImage(ai.image, ai.x, ai.y, ai.width, ai.height));
  }

  function checkWin() {
    if (!destinationLandmark) return;
    const dx = Math.abs(playerCar.x - destinationLandmark.x);
    const dy = Math.abs(playerCar.y - destinationLandmark.y);
    if (dx < 20 && dy < 20) {
      if (level >= 9) {
        showWin(destinationLandmark);
      } else {
        level++;
        startGameFlow();
      }
    }
  }

  function showWin(lm) {
    winOverlay.style.display = "flex";
    document.getElementById("win-message").textContent = `You reached the ${lm.name}! Congratulations!`;
  }

  // === Placeholder: roads, landmarks, isOnRoad ===
  const landmarks = [
    {x:100, y:100, icon:"⛪", name:"Church"},
    {x:250, y:100, icon:"🛒", name:"Market"},
    {x:400, y:250, icon:"🍔", name:"Diner"},
    {x:550, y:100, icon:"🏥", name:"Hospital"},
    {x:550, y:400, icon:"🎓", name:"School"},
    {x:250, y:400, icon:"📬", name:"Post Office"}
  ];

  function drawGrid() {
    ctx.fillStyle = "#2d2d2d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw roads, landmarks
    landmarks.forEach(lm => {
      ctx.font = "28px Arial";
      ctx.fillText(lm.icon, lm.x, lm.y);
      ctx.font = "14px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(lm.name, lm.x, lm.y + 25);
    });
  }

  function isOnRoad(x, y) {
    // Simplified: allow anywhere for now, you can improve with actual road logic
    return x >= 0 && x <= canvas.width-playerCar.width &&
           y >= 0 && y <= canvas.height-playerCar.height;
  }

  function generateDirections(currentLevel) {
    destinationLandmark = landmarks[Math.floor(Math.random() * landmarks.length)];
    return `Drive until you reach the ${destinationLandmark.icon} ${destinationLandmark.name}.`;
  }
});
