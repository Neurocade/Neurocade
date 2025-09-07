// Simple animated starfield for home screen background
console.log("starfield.js loaded!");
const STAR_COUNT = 300;
const STAR_SPEED = 0.12;
const STAR_SIZE = 1.8;

function randomStar(width, height) {
  return {
    x: (Math.random() - 0.5) * width,   // Centered at 0
    y: (Math.random() - 0.5) * height,  // Centered at 0
    z: Math.random() * width,
    o: 0.85 + Math.random() * 0.15
  };
}

function animateStarfield() {
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-canvas';
  document.querySelector('.starfield-bg').appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  let stars = Array.from({length: STAR_COUNT}, () => randomStar(width, height));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let s of stars) {
      let k = 128.0 / s.z;
      let px = s.x * k + width / 2;
      let py = s.y * k + height / 2;
      if (px < 0 || px >= width || py < 0 || py >= height) {
        Object.assign(s, randomStar(width, height));
        s.z = width;
      }
      ctx.globalAlpha = s.o;
      ctx.beginPath();
      ctx.arc(px, py, STAR_SIZE, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff'; // white stars
      ctx.fill();
      s.z -= STAR_SPEED;
      if (s.z < 1) s.z = width;
    }
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    stars = Array.from({length: STAR_COUNT}, () => randomStar(width, height));
  });
}

if (
  window.location.pathname.endsWith('index.html') ||
  window.location.pathname === '/' ||
  window.location.pathname === '/index.html'
) {
  window.addEventListener('DOMContentLoaded', animateStarfield);
}
