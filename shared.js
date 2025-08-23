// === shared.js ===

// Run after DOM loads
document.addEventListener('DOMContentLoaded', function () {
  // --- Back to Home buttons ---
  const backBtns = document.querySelectorAll(
    '.back-btn, #backBtn, a.back-btn, button.back-btn'
  );
  backBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault(); // in case it's an <a>
      // Since game.html is inside games/<gamefolder>/, use relative path
      window.location.href = '../../index.html';
    });
  });

  // --- Reset buttons ---
  const resetBtns = document.querySelectorAll(
    '.reset-btn, #resetBtn, a.reset-btn, button.reset-btn'
  );
  resetBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      // If a game-specific reset function exists, call it
      if (typeof resetGame === 'function') {
        resetGame();
      } else if (typeof setupGrid === 'function') {
        // For other games that use setupGrid()
        setupGrid();
      }

      // Play shuffle sound if available
      const shuffle = document.getElementById('shuffleSound');
      if (shuffle) {
        shuffle.currentTime = 0;
        shuffle.play();
      }
    });
  });
});
