const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 960;
const H = 600;
const characterSprites = {
  mia: loadSprite("assets/characters/mia.png"),
  eliza: loadSprite("assets/characters/eliza.png"),
  pacoca: loadSprite("assets/characters/pacoca.png"),
};
const sceneSprites = {
  forest: loadSprite("assets/backgrounds/forest.png"),
};

const ui = {
  leaves: document.getElementById("leafCount"),
  berries: document.getElementById("berryCount"),
  clues: document.getElementById("clueCount"),
  message: document.getElementById("message"),
  restart: document.getElementById("restartBtn"),
};

const keys = new Set();
const playerSpeed = 3.1;

function loadSprite(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function setupCanvas() {
  const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

const startState = () => ({
  x: 118,
  y: 462,
  direction: 1,
  leaves: 0,
  berries: 0,
  clues: 0,
  won: false,
  message: "A trilha comeca aqui. Mia acha que os brilhos podem revelar o caminho do riacho secreto.",
  items: [
    item("leaf", 244, 440),
    item("leaf", 360, 336),
    item("leaf", 628, 426),
    item("leaf", 802, 322),
    item("leaf", 722, 154),
    item("leaf", 466, 138),
    item("berry", 176, 270),
    item("berry", 512, 506),
    item("berry", 820, 486),
    item("berry", 318, 112),
    item("clue", 566, 264),
    item("clue", 690, 78),
    item("clue", 866, 172),
  ],
});

let state = startState();

const trees = [
  [42, 78, 34, "#2d7b46"],
  [84, 134, 41, "#256f42"],
  [146, 156, 44, "#327d4b"],
  [252, 74, 34, "#2e7545"],
  [324, 206, 33, "#3a8f52"],
  [392, 214, 46, "#267043"],
  [518, 72, 38, "#347f46"],
  [606, 534, 34, "#2d7040"],
  [668, 548, 42, "#36844d"],
  [764, 404, 52, "#2a6d43"],
  [850, 270, 34, "#3a8951"],
  [886, 70, 40, "#2d7444"],
  [910, 386, 34, "#347f46"],
];

const stones = [
  [104, 364, 20, 0.2],
  [454, 416, 24, -0.18],
  [704, 250, 20, 0.08],
  [872, 544, 26, -0.24],
  [286, 522, 16, 0.3],
  [586, 176, 18, -0.1],
];

const caves = [
  [210, 196, 150, 112, "moss"],
  [792, 386, 190, 142, "crystal"],
];

const grassTufts = [
  [38, 326, 0.9], [74, 222, -0.7], [142, 302, 0.4], [218, 512, -0.3],
  [292, 388, 0.7], [416, 122, -0.2], [482, 462, 0.3], [552, 316, -0.6],
  [650, 92, 0.1], [746, 528, -0.7], [856, 456, 0.5], [918, 292, -0.4],
];

const flowers = [
  [212, 214, "#f7c65f"], [336, 484, "#f08fb4"], [536, 218, "#e9f077"],
  [742, 118, "#8fd0ff"], [888, 472, "#f7c65f"], [72, 436, "#e9f077"],
];

function item(type, x, y) {
  return { type, x, y, taken: false, pulse: Math.random() * Math.PI * 2 };
}

function reset() {
  state = startState();
  syncUi();
}

function syncUi() {
  ui.leaves.textContent = state.leaves;
  ui.berries.textContent = state.berries;
  ui.clues.textContent = state.clues;
  ui.message.textContent = state.message;
}

function move(dx, dy) {
  if (state.won) return;
  if (dx !== 0) state.direction = Math.sign(dx);

  const length = Math.hypot(dx, dy) || 1;
  let nx = state.x + (dx / length) * playerSpeed;
  let ny = state.y + (dy / length) * playerSpeed;

  nx = Math.max(42, Math.min(W - 42, nx));
  ny = Math.max(62, Math.min(H - 42, ny));

  if (!hitsObstacle(nx, ny)) {
    state.x = nx;
    state.y = ny;
  }

  collectNearby();
}

function hitsObstacle(x, y) {
  return caves.some(([cx, cy, width, height]) => {
    const rx = width * 0.48;
    const ry = height * 0.58;
    return ((x - cx) ** 2) / (rx ** 2) + ((y - (cy + height * 0.12)) ** 2) / (ry ** 2) < 1.2;
  });
}

function collectNearby() {
  for (const collectible of state.items) {
    if (collectible.taken || Math.hypot(state.x - collectible.x, state.y - collectible.y) > 44) continue;
    collectible.taken = true;

    if (collectible.type === "leaf") {
      state.leaves += 1;
      state.message = "Eliza encontrou uma folha marcada. Parece parte de um mapa antigo.";
    }

    if (collectible.type === "berry") {
      state.berries += 1;
      state.message = "Pacoca farejou amoras fresquinhas. Energia extra para continuar!";
    }

    if (collectible.type === "clue") {
      state.clues += 1;
      state.message = "Mia encontrou uma pista brilhante entre as raizes.";
    }

    if (state.leaves === 6 && state.berries === 4 && state.clues === 3) {
      state.won = true;
      state.message = "A floresta abriu uma passagem! Mia, Eliza e Pacoca chegaram ao riacho secreto.";
    }

    syncUi();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawForestFloor();
  if (!sceneSprites.forest.complete || sceneSprites.forest.naturalWidth === 0) {
    drawTrail();
    drawRiverGate();
    caves.forEach(drawCave);
    trees.forEach(drawTree);
    stones.forEach(drawStone);
  }
  drawCollectibles();
  drawCharacters();
  if (state.won) drawWinGlow();
}

function drawForestFloor() {
  if (sceneSprites.forest.complete && sceneSprites.forest.naturalWidth > 0) {
    drawCoverImage(sceneSprites.forest, 0, 0, W, H);
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#91c779");
  gradient.addColorStop(0.42, "#6fac61");
  gradient.addColorStop(1, "#4d874f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 135; i += 1) {
    const x = (i * 97) % W;
    const y = (i * 53) % H;
    ctx.fillStyle = i % 3 ? "#d5e8a1" : "#2e6e3d";
    ctx.beginPath();
    ctx.ellipse(x, y, 18 + (i % 5), 4 + (i % 3), (i * 0.7) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  grassTufts.forEach(drawGrassTuft);
  flowers.forEach(drawFlower);
}

function drawCoverImage(image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}

function drawTrail() {
  ctx.strokeStyle = "rgba(92, 80, 54, 0.2)";
  ctx.lineWidth = 64;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(70, 504);
  ctx.bezierCurveTo(202, 392, 276, 408, 382, 306);
  ctx.bezierCurveTo(492, 200, 624, 246, 718, 138);
  ctx.bezierCurveTo(778, 72, 860, 92, 914, 42);
  ctx.stroke();

  ctx.strokeStyle = "#b9854e";
  ctx.lineWidth = 50;
  ctx.stroke();

  ctx.strokeStyle = "#dfbd78";
  ctx.lineWidth = 38;
  ctx.stroke();

  ctx.strokeStyle = "#f0d69b";
  ctx.lineWidth = 24;
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#7a5634";
  for (let i = 0; i < 30; i += 1) {
    const t = i / 29;
    const x = 78 + t * 830 + Math.sin(t * 17) * 18;
    const y = 500 - t * 460 + Math.sin(t * 23) * 28;
    ctx.beginPath();
    ctx.ellipse(x, y, 4 + (i % 3), 2, t * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRiverGate() {
  const river = ctx.createLinearGradient(828, 0, 956, 118);
  river.addColorStop(0, "#a8e1e1");
  river.addColorStop(0.55, "#72bed3");
  river.addColorStop(1, "#4b9fc1");
  ctx.fillStyle = river;
  ctx.beginPath();
  ctx.moveTo(814, 0);
  ctx.bezierCurveTo(836, 84, 886, 106, 960, 118);
  ctx.lineTo(960, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(842, 28);
  ctx.bezierCurveTo(870, 58, 904, 72, 944, 86);
  ctx.stroke();

  ctx.fillStyle = "#f3d56f";
  ctx.beginPath();
  ctx.arc(876, 112, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawCave([x, y, width, height, type]) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, height * 0.55, width * 0.55, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const rock = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height);
  rock.addColorStop(0, "#9aa28d");
  rock.addColorStop(0.55, "#6f786b");
  rock.addColorStop(1, "#4d564e");
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.moveTo(-width * 0.55, height * 0.48);
  ctx.bezierCurveTo(-width * 0.5, -height * 0.3, -width * 0.2, -height * 0.54, 0, -height * 0.55);
  ctx.bezierCurveTo(width * 0.3, -height * 0.54, width * 0.55, -height * 0.2, width * 0.58, height * 0.48);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#17221d";
  ctx.beginPath();
  ctx.moveTo(-width * 0.31, height * 0.45);
  ctx.bezierCurveTo(-width * 0.28, -height * 0.1, -width * 0.08, -height * 0.25, 0, -height * 0.25);
  ctx.bezierCurveTo(width * 0.18, -height * 0.25, width * 0.31, -height * 0.04, width * 0.33, height * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-width * 0.38, height * 0.08);
  ctx.quadraticCurveTo(-width * 0.12, -height * 0.42, width * 0.28, -height * 0.2);
  ctx.stroke();

  if (type === "moss") {
    ctx.fillStyle = "#4f9b58";
    ctx.beginPath();
    ctx.ellipse(-width * 0.24, -height * 0.18, 16, 7, -0.4, 0, Math.PI * 2);
    ctx.ellipse(width * 0.18, -height * 0.24, 14, 6, 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#83e5ff";
    ctx.beginPath();
    ctx.moveTo(width * 0.18, height * 0.16);
    ctx.lineTo(width * 0.25, height * 0.31);
    ctx.lineTo(width * 0.1, height * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawTree([x, y, r, color]) {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.92, r * 0.62, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const trunk = ctx.createLinearGradient(x - 9, y, x + 9, y + r * 1.3);
  trunk.addColorStop(0, "#8a5f34");
  trunk.addColorStop(1, "#5d3b20");
  ctx.fillStyle = trunk;
  ctx.beginPath();
  ctx.roundRect(x - r * 0.18, y + r * 0.26, r * 0.36, r * 0.98, 6);
  ctx.fill();

  ctx.strokeStyle = "rgba(69,42,22,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.05, y + r * 0.36);
  ctx.quadraticCurveTo(x + r * 0.09, y + r * 0.7, x + r * 0.02, y + r * 1.13);
  ctx.stroke();

  ctx.fillStyle = shadeColor(color, -18);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.12, r * 0.55, 0, Math.PI * 2);
  ctx.arc(x + r * 0.28, y - r * 0.18, r * 0.56, 0, Math.PI * 2);
  ctx.arc(x, y - r * 0.38, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = lightenColor(color, 20);
  ctx.beginPath();
  ctx.arc(x - r * 0.32, y - r * 0.25, r * 0.24, 0, Math.PI * 2);
  ctx.arc(x + r * 0.18, y - r * 0.33, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawStone([x, y, r, angle]) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const stone = ctx.createLinearGradient(-r, -r, r, r);
  stone.addColorStop(0, "#b9c2b9");
  stone.addColorStop(0.56, "#839188");
  stone.addColorStop(1, "#596761");
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.2, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.22, r * 0.38, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(56,64,60,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, r * 0.1);
  ctx.lineTo(r * 0.22, r * 0.2);
  ctx.moveTo(r * 0.08, -r * 0.2);
  ctx.lineTo(r * 0.38, -r * 0.02);
  ctx.stroke();
  ctx.restore();
}

function drawGrassTuft([x, y, rotation]) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = "rgba(35, 108, 48, 0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -14, -4, -28);
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(8, -13, 6, -26);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0, -12, 0, -24);
  ctx.stroke();
  ctx.restore();
}

function drawFlower([x, y, color]) {
  ctx.fillStyle = "#315d35";
  ctx.fillRect(x - 1, y, 2, 10);
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i += 1) {
    const a = (Math.PI * 2 * i) / 5;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 2, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#7a5a2b";
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCollectibles() {
  const time = performance.now() / 360;
  for (const collectible of state.items) {
    if (collectible.taken) continue;
    const bob = Math.sin(time + collectible.pulse) * 4;
    drawSparkle(collectible.x, collectible.y + bob, collectible.type);
  }
}

function drawSparkle(x, y, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#fff7ae";
  ctx.shadowBlur = 18;

  if (type === "leaf") {
    ctx.fillStyle = "#f7d64a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 7, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8c6f19";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(10, -4);
    ctx.stroke();
  }

  if (type === "berry") {
    ctx.fillStyle = "#7c244b";
    ctx.beginPath();
    ctx.arc(-5, 2, 7, 0, Math.PI * 2);
    ctx.arc(5, 2, 7, 0, Math.PI * 2);
    ctx.arc(0, -5, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  if (type === "clue") {
    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = "#53a7d3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(-11, -10, 22, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#53a7d3";
    ctx.fillRect(-6, -4, 12, 3);
    ctx.fillRect(-6, 3, 9, 3);
  }

  ctx.restore();
}

function drawCharacters() {
  const x = state.x;
  const y = state.y;
  drawSpriteShadow(x - 18, y + 34, 28, 8);
  drawSpriteShadow(x + 24, y + 39, 23, 7);
  drawSpriteShadow(x - 2, y + 49, 18, 5);

  drawSprite(characterSprites.mia, x - 48, y - 64, 58, 120);
  drawSprite(characterSprites.eliza, x + 1, y - 41, 48, 99);
  drawSprite(characterSprites.pacoca, x - 18, y + 18, 34, 43);
}

function drawSprite(sprite, x, y, width, height) {
  if (!sprite.complete || sprite.naturalWidth === 0) {
    ctx.fillStyle = "#f2c997";
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 4, height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.drawImage(sprite, x, y, width, height);
}

function drawSpriteShadow(x, y, width, height) {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGirl(x, y, scale, palette) {
  const { hair, hairLight, shirt, pants, shoes, backpack, eyes, skin, isMia } = palette;
  const walk = Math.sin(performance.now() / 150) * 1.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * state.direction, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 48, 15, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();

  drawHairBack(hair, hairLight, isMia);

  ctx.fillStyle = shadeColor(backpack, -18);
  ctx.beginPath();
  ctx.roundRect(-12, -1, 24, 29, 7);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.fillRect(-4, -4, 8, 8);

  drawLeg(-5, 25, 40 + walk, pants, shoes);
  drawLeg(5, 25, 40 - walk, pants, shoes);

  const shirtShade = ctx.createLinearGradient(-14, 2, 14, 30);
  shirtShade.addColorStop(0, lightenColor(shirt, 18));
  shirtShade.addColorStop(0.64, shirt);
  shirtShade.addColorStop(1, shadeColor(shirt, -20));
  ctx.fillStyle = shirtShade;
  ctx.beginPath();
  ctx.moveTo(-11, 1);
  ctx.lineTo(11, 1);
  ctx.quadraticCurveTo(15, 13, 12, 29);
  ctx.lineTo(-12, 29);
  ctx.quadraticCurveTo(-15, 13, -11, 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(30,35,30,0.28)";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.strokeStyle = shadeColor(backpack, -8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isMia) {
    ctx.moveTo(-10, 2);
    ctx.lineTo(9, 29);
  } else {
    ctx.moveTo(-10, 4);
    ctx.quadraticCurveTo(-5, 13, -6, 26);
    ctx.moveTo(10, 4);
    ctx.quadraticCurveTo(5, 13, 6, 26);
  }
  ctx.stroke();

  ctx.strokeStyle = skin;
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.quadraticCurveTo(-18, 16, -17, 29);
  ctx.moveTo(11, 6);
  ctx.quadraticCurveTo(18, 16, 17, 29);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(-17, 29, 3.3, 0, Math.PI * 2);
  ctx.arc(17, 29, 3.3, 0, Math.PI * 2);
  ctx.fill();

  drawHead(hair, hairLight, eyes, skin, isMia);
  ctx.restore();
}

function drawHairBack(hair, hairLight, isMia) {
  if (isMia) {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.moveTo(-16, -22);
    ctx.bezierCurveTo(-24, -13, -21, 7, -14, 16);
    ctx.bezierCurveTo(-8, 20, 8, 20, 14, 16);
    ctx.bezierCurveTo(21, 7, 24, -13, 16, -22);
    ctx.bezierCurveTo(8, -30, -8, -30, -16, -22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hairLight;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, -13);
    ctx.quadraticCurveTo(-16, 1, -12, 14);
    ctx.moveTo(14, -13);
    ctx.quadraticCurveTo(16, 1, 12, 14);
    ctx.stroke();
  } else {
    const hairGradient = ctx.createLinearGradient(0, -30, 0, 45);
    hairGradient.addColorStop(0, hairLight);
    hairGradient.addColorStop(0.22, hair);
    hairGradient.addColorStop(1, shadeColor(hair, -25));
    ctx.fillStyle = hairGradient;
    ctx.beginPath();
    ctx.moveTo(-13, -25);
    ctx.bezierCurveTo(-23, -12, -20, 20, -13, 44);
    ctx.lineTo(13, 44);
    ctx.bezierCurveTo(20, 20, 23, -12, 13, -25);
    ctx.bezierCurveTo(7, -31, -7, -31, -13, -25);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hairLight;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.bezierCurveTo(-11, 4, -9, 28, -7, 41);
    ctx.moveTo(7, -18);
    ctx.bezierCurveTo(11, 4, 9, 28, 7, 41);
    ctx.stroke();
  }
}

function drawLeg(x, y, footY, pants, shoes) {
  const legGradient = ctx.createLinearGradient(x - 4, y, x + 4, footY);
  legGradient.addColorStop(0, lightenColor(pants, 10));
  legGradient.addColorStop(1, shadeColor(pants, -22));
  ctx.strokeStyle = legGradient;
  ctx.lineWidth = 5.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x * 1.1, y + 12, x + Math.sign(x) * 1.4, footY);
  ctx.stroke();

  ctx.fillStyle = shoes;
  ctx.beginPath();
  ctx.ellipse(x + Math.sign(x) * 2, footY + 3, 6, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(hair, hairLight, eyes, skin, isMia) {
  const skinGradient = ctx.createRadialGradient(-4, -17, 2, 0, -13, 15);
  skinGradient.addColorStop(0, lightenColor(skin, 15));
  skinGradient.addColorStop(0.72, skin);
  skinGradient.addColorStop(1, shadeColor(skin, -12));
  ctx.fillStyle = skinGradient;
  ctx.beginPath();
  ctx.ellipse(0, -14, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(205,109,88,0.2)";
  ctx.beginPath();
  ctx.ellipse(-6, -9, 3, 2, -0.18, 0, Math.PI * 2);
  ctx.ellipse(6, -9, 3, 2, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hair;
  if (isMia) {
    ctx.beginPath();
    ctx.moveTo(-13, -23);
    ctx.bezierCurveTo(-7, -29, 7, -29, 13, -23);
    ctx.lineTo(13, -15);
    ctx.quadraticCurveTo(8, -20, 2, -22);
    ctx.quadraticCurveTo(-2, -16, -8, -13);
    ctx.lineTo(-13, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hairLight;
    ctx.beginPath();
    ctx.ellipse(-13, -7, 3.4, 16, -0.08, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 3.4, 16, 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-12, -24);
    ctx.bezierCurveTo(-6, -30, 6, -30, 12, -24);
    ctx.bezierCurveTo(10, -16, 6, -12, 0, -10);
    ctx.bezierCurveTo(-6, -12, -10, -16, -12, -24);
    ctx.fill();
  }

  ctx.fillStyle = eyes;
  ctx.beginPath();
  ctx.ellipse(-4.2, -14.4, 1.6, 2.1, 0, 0, Math.PI * 2);
  ctx.ellipse(4.2, -14.4, 1.6, 2.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.76)";
  ctx.beginPath();
  ctx.arc(-4.7, -15.2, 0.55, 0, Math.PI * 2);
  ctx.arc(3.7, -15.2, 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d88c7b";
  ctx.beginPath();
  ctx.ellipse(0, -11.2, 1.1, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8b5a45";
  ctx.lineWidth = isMia ? 1.45 : 1.1;
  ctx.beginPath();
  if (isMia) {
    ctx.arc(0, -8.8, 3.3, Math.PI + 0.08, Math.PI * 1.92);
  } else {
    ctx.arc(0, -9, 3.5, 0.18, Math.PI - 0.18);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(100,65,46,0.36)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, -18);
  ctx.lineTo(-2.5, -18.6);
  ctx.moveTo(2.5, -18.6);
  ctx.lineTo(7, -18);
  ctx.stroke();
}

function drawHamster(x, y) {
  const sniff = Math.sin(performance.now() / 180) * 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.78, 0.78);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(0, 17, 23, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const fur = ctx.createRadialGradient(-6, -6, 3, 0, 2, 24);
  fur.addColorStop(0, "#f0c17a");
  fur.addColorStop(0.48, "#cf8d43");
  fur.addColorStop(1, "#9c612e");
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, 3, 23, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f1d09a";
  ctx.beginPath();
  ctx.arc(-13, -11, 8.5, 0, Math.PI * 2);
  ctx.arc(13, -11, 8.5, 0, Math.PI * 2);
  ctx.ellipse(0, 3 + sniff, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff0c8";
  ctx.beginPath();
  ctx.ellipse(0, 7, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b96f32";
  ctx.beginPath();
  ctx.ellipse(-14, 5, 5, 8, -0.4, 0, Math.PI * 2);
  ctx.ellipse(14, 5, 5, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8d5b31";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 3, 23, 15, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#2a1c17";
  ctx.beginPath();
  ctx.arc(-6, -3, 2.6, 0, Math.PI * 2);
  ctx.arc(6, -3, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6c3f32";
  ctx.beginPath();
  ctx.arc(0, 4 + sniff, 3.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6c3f32";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-2, 7 + sniff);
  ctx.lineTo(-9, 10);
  ctx.moveTo(2, 7 + sniff);
  ctx.lineTo(9, 10);
  ctx.moveTo(-5, 4 + sniff);
  ctx.lineTo(-18, 0);
  ctx.moveTo(5, 4 + sniff);
  ctx.lineTo(18, 0);
  ctx.moveTo(-5, 6 + sniff);
  ctx.lineTo(-18, 7);
  ctx.moveTo(5, 6 + sniff);
  ctx.lineTo(18, 7);
  ctx.stroke();

  ctx.fillStyle = "#f4d89d";
  ctx.beginPath();
  ctx.arc(-9, 5, 2.3, 0, Math.PI * 2);
  ctx.arc(9, 5, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-5, -10, 3, 1.8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function shadeColor(color, amount) {
  return adjustColor(color, amount);
}

function lightenColor(color, amount) {
  return adjustColor(color, amount);
}

function adjustColor(color, amount) {
  const clean = color.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawWinGlow() {
  ctx.fillStyle = "rgba(255, 248, 157, 0.22)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#243126";
  ctx.font = "700 30px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("Riacho secreto descoberto!", W / 2, 70);
}

function loop() {
  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  if (dx || dy) move(dx, dy);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

[
  ["upBtn", "ArrowUp"],
  ["downBtn", "ArrowDown"],
  ["leftBtn", "ArrowLeft"],
  ["rightBtn", "ArrowRight"],
].forEach(([id, key]) => {
  const button = document.getElementById(id);
  button.addEventListener("pointerdown", () => keys.add(key));
  button.addEventListener("pointerup", () => keys.delete(key));
  button.addEventListener("pointerleave", () => keys.delete(key));
});

window.addEventListener("resize", setupCanvas);
ui.restart.addEventListener("click", reset);
setupCanvas();
syncUi();
loop();
