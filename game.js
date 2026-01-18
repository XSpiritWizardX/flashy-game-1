"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  charge: document.getElementById("charge"),
  health: document.getElementById("health"),
  time: document.getElementById("time"),
};

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");

const keys = {};
const stars = Array.from({ length: 80 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.6 + Math.random() * 1.8,
  phase: Math.random() * Math.PI * 2,
}));

const state = {
  running: false,
  over: false,
  score: 0,
  charge: 0,
  maxCharge: 3,
  health: 3,
  time: 0,
  clock: 0,
  flashAlpha: 0,
  flashTimer: 0,
  cooldown: 0,
  invuln: 0,
  flashWave: null,
};

const player = {
  x: 0,
  y: 0,
  r: 14,
  speed: 240,
  vx: 0,
  vy: 0,
};

const world = {
  sparks: [],
  shadows: [],
  spawnSpark: 0.8,
  spawnShadow: 1.2,
};

let width = 0;
let height = 0;
let dpr = window.devicePixelRatio || 1;

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = Math.max(320, Math.floor(rect.width));
  height = Math.max(240, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setOverlay(title, body) {
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetGame() {
  world.sparks.length = 0;
  world.shadows.length = 0;
  state.running = false;
  state.over = false;
  state.score = 0;
  state.charge = 0;
  state.health = 3;
  state.time = 0;
  state.flashAlpha = 0;
  state.flashTimer = 0;
  state.cooldown = 0;
  state.invuln = 0;
  state.flashWave = null;
  player.x = width * 0.5;
  player.y = height * 0.6;
  player.vx = 0;
  player.vy = 0;
  world.spawnSpark = 0.6;
  world.spawnShadow = 1.0;
  setOverlay(
    "FLASHBURST",
    "Move with WASD or arrow keys. Press Space to flash. Press Enter to start."
  );
  updateHud();
}

function startGame() {
  if (state.over) {
    return;
  }
  state.running = true;
  hideOverlay();
}

function restartGame() {
  resetGame();
  state.running = true;
  hideOverlay();
}

function gameOver() {
  state.over = true;
  state.running = false;
  setOverlay(
    "CORE SHATTERED",
    `Score ${state.score}. You lasted ${state.time.toFixed(1)}s. Press R to restart.`
  );
}

function triggerFlash() {
  if (state.charge <= 0 || state.cooldown > 0) {
    return;
  }
  const radius = 150 + state.charge * 20;
  state.charge -= 1;
  state.flashAlpha = 1;
  state.flashTimer = 0.05;
  state.cooldown = 0.5;
  state.flashWave = {
    x: player.x,
    y: player.y,
    r: radius,
    life: 0.25,
    age: 0,
  };

  for (let i = world.shadows.length - 1; i >= 0; i -= 1) {
    const sh = world.shadows[i];
    const dist = Math.hypot(player.x - sh.x, player.y - sh.y);
    if (dist < radius) {
      world.shadows.splice(i, 1);
      state.score += 4;
    }
  }
}

function spawnSpark() {
  const margin = 30;
  const x = margin + Math.random() * (width - margin * 2);
  const y = margin + Math.random() * (height - margin * 2);
  const r = 6 + Math.random() * 5;
  world.sparks.push({
    x,
    y,
    r,
    phase: Math.random() * Math.PI * 2,
  });
}

function spawnShadow() {
  const margin = 40;
  let x = 0;
  let y = 0;
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) {
    x = Math.random() * width;
    y = -margin;
  } else if (edge === 1) {
    x = width + margin;
    y = Math.random() * height;
  } else if (edge === 2) {
    x = Math.random() * width;
    y = height + margin;
  } else {
    x = -margin;
    y = Math.random() * height;
  }
  const base = 70 + Math.min(120, state.time * 3);
  const speed = base + Math.random() * 60;
  const angle = Math.atan2(player.y - y, player.x - x);
  world.shadows.push({
    x,
    y,
    r: 12 + Math.random() * 10,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    wobble: Math.random() * Math.PI * 2,
  });
}

function updateHud() {
  ui.score.textContent = String(state.score);
  ui.charge.textContent = `${state.charge}/${state.maxCharge}`;
  ui.health.textContent = String(state.health);
  ui.time.textContent = state.time.toFixed(1);
}

function update(dt) {
  state.clock += dt;
  if (!state.running || state.over) {
    if (state.flashAlpha > 0) {
      state.flashAlpha = Math.max(0, state.flashAlpha - dt * 2);
    }
    if (state.flashWave) {
      state.flashWave.age += dt;
      if (state.flashWave.age >= state.flashWave.life) {
        state.flashWave = null;
      }
    }
    return;
  }

  state.time += dt;
  if (state.cooldown > 0) {
    state.cooldown = Math.max(0, state.cooldown - dt);
  }
  if (state.invuln > 0) {
    state.invuln = Math.max(0, state.invuln - dt);
  }
  if (state.flashTimer > 0) {
    state.flashTimer -= dt;
    state.flashAlpha = Math.min(1, state.flashAlpha + dt * 3);
  }
  if (state.flashAlpha > 0) {
    state.flashAlpha = Math.max(0, state.flashAlpha - dt * 1.5);
  }

  world.spawnSpark -= dt;
  if (world.spawnSpark <= 0) {
    spawnSpark();
    world.spawnSpark = 0.5 + Math.random() * 0.9;
  }

  world.spawnShadow -= dt;
  if (world.spawnShadow <= 0) {
    spawnShadow();
    const pace = Math.max(0.5, 1.4 - state.time * 0.02);
    world.spawnShadow = pace + Math.random() * 0.4;
  }

  let ax = 0;
  let ay = 0;
  if (keys["a"] || keys["arrowleft"]) {
    ax -= 1;
  }
  if (keys["d"] || keys["arrowright"]) {
    ax += 1;
  }
  if (keys["w"] || keys["arrowup"]) {
    ay -= 1;
  }
  if (keys["s"] || keys["arrowdown"]) {
    ay += 1;
  }
  if (ax !== 0 || ay !== 0) {
    const len = Math.hypot(ax, ay);
    ax /= len;
    ay /= len;
  }

  player.vx = ax * player.speed;
  player.vy = ay * player.speed;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = Math.max(player.r + 6, Math.min(width - player.r - 6, player.x));
  player.y = Math.max(player.r + 6, Math.min(height - player.r - 6, player.y));

  for (const sh of world.shadows) {
    sh.wobble += dt * 2;
    sh.x += sh.vx * dt + Math.sin(sh.wobble) * 10 * dt;
    sh.y += sh.vy * dt + Math.cos(sh.wobble) * 10 * dt;
  }

  world.shadows = world.shadows.filter((sh) => {
    return (
      sh.x > -80 &&
      sh.x < width + 80 &&
      sh.y > -80 &&
      sh.y < height + 80
    );
  });

  for (let i = world.sparks.length - 1; i >= 0; i -= 1) {
    const spark = world.sparks[i];
    spark.phase += dt * 3;
    const dist = Math.hypot(player.x - spark.x, player.y - spark.y);
    if (dist < player.r + spark.r) {
      world.sparks.splice(i, 1);
      state.score += 10;
      state.charge = Math.min(state.maxCharge, state.charge + 1);
      state.flashAlpha = Math.max(state.flashAlpha, 0.35);
    }
  }

  for (let i = world.shadows.length - 1; i >= 0; i -= 1) {
    const shadow = world.shadows[i];
    const dist = Math.hypot(player.x - shadow.x, player.y - shadow.y);
    if (dist < player.r + shadow.r) {
      if (state.invuln <= 0) {
        state.health -= 1;
        state.invuln = 1.1;
        state.flashAlpha = Math.max(state.flashAlpha, 0.6);
        world.shadows.splice(i, 1);
        if (state.health <= 0) {
          gameOver();
        }
      }
    }
  }

  if (state.flashWave) {
    state.flashWave.age += dt;
    if (state.flashWave.age >= state.flashWave.life) {
      state.flashWave = null;
    }
  }

  updateHud();
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0b1020");
  bg.addColorStop(1, "#07101e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.2,
    height * 0.1,
    10,
    width * 0.2,
    height * 0.1,
    width * 0.8
  );
  glow.addColorStop(0, "rgba(72, 255, 232, 0.08)");
  glow.addColorStop(1, "rgba(5, 7, 12, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  for (const star of stars) {
    const tw = 0.4 + 0.6 * Math.sin(state.clock * 2 + star.phase);
    ctx.fillStyle = `rgba(140, 190, 255, ${0.15 + 0.35 * tw})`;
    ctx.beginPath();
    ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSparks() {
  for (const spark of world.sparks) {
    const pulse = 0.6 + 0.4 * Math.sin(state.clock * 3 + spark.phase);
    ctx.save();
    ctx.shadowColor = "rgba(114, 255, 234, 0.9)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(126, 255, 234, ${0.7 + 0.3 * pulse})`;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.r * (0.8 + 0.4 * pulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawShadows() {
  ctx.save();
  for (const shadow of world.shadows) {
    ctx.fillStyle = "rgba(8, 10, 18, 0.9)";
    ctx.strokeStyle = "rgba(255, 92, 138, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shadow.x, shadow.y, shadow.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  const pulse = 0.7 + 0.3 * Math.sin(state.clock * 6);
  const radius = player.r + pulse * 1.5;

  ctx.save();
  if (state.invuln > 0) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(state.clock * 20);
  }
  const core = ctx.createRadialGradient(
    player.x,
    player.y,
    2,
    player.x,
    player.y,
    radius * 2
  );
  core.addColorStop(0, "rgba(255, 255, 255, 1)");
  core.addColorStop(0.4, "rgba(120, 255, 234, 0.9)");
  core.addColorStop(1, "rgba(49, 120, 255, 0.2)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlash() {
  if (state.flashWave) {
    const t = state.flashWave.age / state.flashWave.life;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${1 - t})`;
    ctx.lineWidth = 4 + 12 * (1 - t);
    ctx.beginPath();
    ctx.arc(
      state.flashWave.x,
      state.flashWave.y,
      state.flashWave.r * (0.7 + t * 0.4),
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }

  if (state.flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flashAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawBackground();
  drawSparks();
  drawShadows();
  drawPlayer();
  drawFlash();
}

let last = 0;
function loop(timestamp) {
  if (!last) {
    last = timestamp;
  }
  const dt = Math.min(0.033, (timestamp - last) / 1000);
  last = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function handleKey(event, down) {
  const key = event.key === " " ? "space" : event.key.toLowerCase();
  if (key === "space") {
    keys.space = down;
    if (down && state.running && !state.over) {
      triggerFlash();
    }
    return;
  }

  keys[key] = down;
  if (!down) {
    return;
  }

  if (key === "enter") {
    if (!state.running && !state.over) {
      startGame();
    } else if (state.over) {
      restartGame();
    }
  }

  if (key === "r" && state.over) {
    restartGame();
  }
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }
  handleKey(event, true);
});

window.addEventListener("keyup", (event) => {
  handleKey(event, false);
});

window.addEventListener("resize", () => {
  dpr = window.devicePixelRatio || 1;
  resize();
  if (!state.running && !state.over) {
    player.x = width * 0.5;
    player.y = height * 0.6;
  }
});

resize();
resetGame();
requestAnimationFrame(loop);
