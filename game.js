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
  cave: loadSprite("assets/backgrounds/cave.png"),
  lostCity: loadSprite("assets/backgrounds/lost-city.png"),
};

const ui = {
  titleScreen: document.getElementById("titleScreen"),
  start: document.getElementById("startBtn"),
  leaves: document.getElementById("leafCount"),
  berries: document.getElementById("berryCount"),
  clues: document.getElementById("clueCount"),
  score: document.getElementById("scoreCount"),
  phase: document.getElementById("phaseCount"),
  title: document.getElementById("sceneTitle"),
  subtitle: document.getElementById("sceneSubtitle"),
  message: document.getElementById("message"),
  action: document.getElementById("actionBtn"),
  sound: document.getElementById("soundBtn"),
  restart: document.getElementById("restartBtn"),
  quizModal: document.getElementById("quizModal"),
  quizQuestion: document.getElementById("quizQuestion"),
  quizAnswers: document.getElementById("quizAnswers"),
  quizFeedback: document.getElementById("quizFeedback"),
};

const keys = new Set();
const playerSpeed = 3.1;
let audio = null;
let musicWanted = true;
let gameStarted = false;

function loadSprite(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function setupCanvas() {
  const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
  canvas.width = Math.round(W * ratio);
  canvas.height = Math.round(H * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

const phases = [
  {
    title: "Aventura na Floresta",
    subtitle: "O grupo procura a caverna escondida no fim da trilha.",
    background: "forest",
    start: [118, 462],
    portal: [762, 170, 68],
    portalMessage: "A caverna se abriu. A aventura continua no subterrâneo.",
    blockedMessage: "A entrada da caverna está perto, mas ainda falta usar as habilidades do grupo.",
  },
  {
    title: "Subterrâneo Cristalino",
    subtitle: "Mia, Eliza e Paçoca seguem pelos túneis iluminados por cristais.",
    background: "cave",
    start: [120, 492],
    portal: [806, 88, 70],
    portalMessage: "A luz no fim do túnel revelou uma cidade perdida no meio da selva.",
    blockedMessage: "A saída está iluminada, mas ainda falta resolver os mistérios do subterrâneo.",
  },
  {
    title: "Cidade Perdida",
    subtitle: "As ruínas antigas guardam o segredo final da floresta.",
    background: "lostCity",
    start: [116, 488],
    portal: [640, 266, 80],
    portalMessage: "Mia, Eliza e Paçoca descobriram o coração da cidade perdida!",
    blockedMessage: "A praça antiga ainda guarda segredos para decifrar.",
  },
  {
    title: "Riacho Secreto",
    subtitle: "Atravessando as pedras do riacho, o grupo chega ao segredo final.",
    mode: "platform",
    start: [90, 430],
    portal: [880, 420, 70],
    portalMessage: "Mia, Eliza e Paçoca atravessaram o riacho e protegeram o segredo da floresta!",
    blockedMessage: "",
  },
];

const phaseItems = [
  [
    ["leaf", 244, 440],
    ["leaf", 360, 336],
    ["berry", 176, 270],
    ["clue", 704, 186],
  ],
  [
    ["leaf", 230, 422],
    ["leaf", 488, 360],
    ["berry", 612, 206],
    ["berry", 810, 470],
    ["clue", 790, 122],
  ],
  [
    ["leaf", 300, 430],
    ["leaf", 650, 314],
    ["berry", 804, 456],
    ["clue", 538, 240],
  ],
  [],
];

const phaseHotspots = [
  [
    {
      x: 292,
      y: 250,
      role: "Mia",
      icon: "animal",
      label: "Passarinho atento",
      message: "Mia ouviu o passarinho com calma. Ele contou que a caverna verdadeira fica onde o vento cheira a pedra molhada.",
    },
    {
      x: 566,
      y: 388,
      role: "Eliza",
      icon: "map",
      label: "Mapa rasgado",
      message: "Eliza comparou o mapa com a posição do sol e corrigiu a rota do grupo.",
    },
    {
      x: 664,
      y: 252,
      role: "Paçoca",
      icon: "scent",
      label: "Cheiro escondido",
      message: "Paçoca farejou folhas mexidas recentemente e encontrou a chave de pedra da entrada.",
    },
  ],
  [
    {
      x: 246,
      y: 392,
      role: "Paçoca",
      icon: "scent",
      label: "Fenda estreita",
      message: "Paçoca entrou por uma fenda pequena e voltou empurrando uma pedrinha azul brilhante.",
    },
    {
      x: 498,
      y: 310,
      role: "Eliza",
      icon: "puzzle",
      label: "Cristais em sequência",
      message: "Eliza percebeu o padrão dos cristais: pequeno, médio, grande. A ponte de pedras se alinhou.",
    },
    {
      x: 680,
      y: 190,
      role: "Mia",
      icon: "animal",
      label: "Morcegos assustados",
      message: "Mia falou baixinho com os morcegos. Eles abriram espaço e mostraram a saída iluminada.",
    },
  ],
  [
    {
      x: 382,
      y: 286,
      role: "Eliza",
      icon: "puzzle",
      label: "Símbolos antigos",
      message: "Eliza decifrou os símbolos das ruínas e descobriu que a praça aponta para o centro da cidade.",
    },
    {
      x: 548,
      y: 376,
      role: "Mia",
      icon: "animal",
      label: "Guardião da selva",
      message: "Mia entendeu o chamado do animal guardião. Ele permitiu que o grupo continuasse.",
    },
    {
      x: 760,
      y: 430,
      role: "Paçoca",
      icon: "scent",
      label: "Pedra solta",
      message: "Paçoca farejou uma pedra diferente e revelou a peça final do antigo mecanismo.",
    },
  ],
  [],
];

const quizzes = [
  {
    question: "Mia viu 2 borboletas e depois mais 1. Quantas borboletas ela viu?",
    answers: ["3", "2", "4"],
    correct: 0,
  },
  {
    question: "Qual animal nasce de um ovo?",
    answers: ["Passarinho", "Cachorro", "Hamster"],
    correct: 0,
  },
  {
    question: "Eliza tem 4 pedrinhas e usa 1 no mapa. Quantas sobram?",
    answers: ["3", "5", "2"],
    correct: 0,
  },
  {
    question: "O que uma planta precisa para crescer?",
    answers: ["Água e luz", "Areia seca", "Escuridão sempre"],
    correct: 0,
  },
  {
    question: "Paçoca encontrou 5 sementes e comeu 2. Quantas ficaram?",
    answers: ["3", "7", "2"],
    correct: 0,
  },
  {
    question: "Qual destes fica no céu durante o dia?",
    answers: ["Sol", "Pedra", "Raiz"],
    correct: 0,
  },
];

const questionBank = [
  { question: "Quanto é 2 + 3?", answers: ["5", "4", "6"], correct: 0 },
  { question: "Quanto é 6 - 2?", answers: ["4", "3", "5"], correct: 0 },
  { question: "Quanto é 5 + 1?", answers: ["6", "7", "4"], correct: 0 },
  { question: "Quanto é 8 - 3?", answers: ["5", "4", "6"], correct: 0 },
  { question: "Quanto é 3 + 3?", answers: ["6", "5", "7"], correct: 0 },
  { question: "Quanto é 10 - 5?", answers: ["5", "6", "4"], correct: 0 },
  { question: "Qual número vem depois do 19?", answers: ["20", "18", "21"], correct: 0 },
  { question: "Qual número vem antes do 30?", answers: ["29", "31", "28"], correct: 0 },
  { question: "Se Mia tem 4 folhas e acha mais 2, quantas folhas ela tem?", answers: ["6", "5", "7"], correct: 0 },
  { question: "Paçoca encontrou 7 sementes e comeu 2. Quantas sobraram?", answers: ["5", "4", "6"], correct: 0 },
  { question: "Eliza viu 3 pedras grandes e 3 pequenas. Quantas pedras viu ao todo?", answers: ["6", "5", "7"], correct: 0 },
  { question: "Qual é o dobro de 4?", answers: ["8", "6", "10"], correct: 0 },
  { question: "Qual metade de 10?", answers: ["5", "4", "6"], correct: 0 },
  { question: "Quanto é 2 vezes 3?", answers: ["6", "5", "8"], correct: 0 },
  { question: "Quanto é 4 vezes 2?", answers: ["8", "6", "10"], correct: 0 },
  { question: "Qual forma tem 3 lados?", answers: ["Triângulo", "Quadrado", "Círculo"], correct: 0 },
  { question: "Qual forma tem 4 lados iguais?", answers: ["Quadrado", "Triângulo", "Círculo"], correct: 0 },
  { question: "Qual objeto usamos para medir o tempo?", answers: ["Relógio", "Colher", "Sapato"], correct: 0 },
  { question: "Quantas dezenas existem no número 20?", answers: ["2", "1", "3"], correct: 0 },
  { question: "Qual número é maior: 18 ou 12?", answers: ["18", "12", "São iguais"], correct: 0 },
  { question: "O que uma planta precisa para crescer?", answers: ["Água e luz", "Som alto", "Escuridão sempre"], correct: 0 },
  { question: "Qual destes animais tem penas?", answers: ["Passarinho", "Hamster", "Peixe"], correct: 0 },
  { question: "Qual animal vive na água?", answers: ["Peixe", "Gato", "Borboleta"], correct: 0 },
  { question: "Qual parte da planta fica embaixo da terra?", answers: ["Raiz", "Flor", "Folha"], correct: 0 },
  { question: "Qual destes é um inseto?", answers: ["Borboleta", "Sapo", "Pedra"], correct: 0 },
  { question: "De onde vem a luz do dia?", answers: ["Sol", "Lua", "Lanterna da caverna"], correct: 0 },
  { question: "O que usamos para respirar?", answers: ["Pulmões", "Joelhos", "Cotovelos"], correct: 0 },
  { question: "Qual sentido usamos para sentir cheiros?", answers: ["Olfato", "Visão", "Audição"], correct: 0 },
  { question: "Qual sentido usamos para ouvir sons?", answers: ["Audição", "Paladar", "Tato"], correct: 0 },
  { question: "O que acontece com a água no frio forte?", answers: ["Pode virar gelo", "Vira pedra", "Vira folha"], correct: 0 },
  { question: "Qual destes é um alimento saudável?", answers: ["Maçã", "Pedra", "Papel"], correct: 0 },
  { question: "Qual lugar tem muitas árvores?", answers: ["Floresta", "Deserto vazio", "Cozinha"], correct: 0 },
  { question: "O que ajuda a proteger a natureza?", answers: ["Não jogar lixo no chão", "Quebrar galhos", "Sujar rios"], correct: 0 },
  { question: "Qual destes é um ser vivo?", answers: ["Árvore", "Sapato", "Copo"], correct: 0 },
  { question: "Qual animal costuma voar?", answers: ["Pássaro", "Hamster", "Cachorro"], correct: 0 },
  { question: "Qual é uma fonte de água na natureza?", answers: ["Riacho", "Cadeira", "Lápis"], correct: 0 },
  { question: "Qual palavra combina com cuidado?", answers: ["Ajudar", "Empurrar", "Quebrar"], correct: 0 },
  { question: "Qual palavra indica direção?", answers: ["Esquerda", "Verde", "Doce"], correct: 0 },
  { question: "Qual palavra é o contrário de claro?", answers: ["Escuro", "Grande", "Rápido"], correct: 0 },
  { question: "Qual palavra é o contrário de quente?", answers: ["Frio", "Alto", "Feliz"], correct: 0 },
  { question: "Qual destes é usado para ler uma história?", answers: ["Livro", "Pedra", "Folha seca"], correct: 0 },
  { question: "Qual frase está correta?", answers: ["A menina corre.", "A menina correm.", "As menina corre."], correct: 0 },
  { question: "Qual palavra começa com a letra M?", answers: ["Mia", "Eliza", "Paçoca"], correct: 0 },
  { question: "Qual palavra começa com a letra P?", answers: ["Paçoca", "Mia", "Eliza"], correct: 0 },
  { question: "Qual palavra rima com mão?", answers: ["Chão", "Lua", "Casa"], correct: 0 },
  { question: "Qual material é comum em cavernas?", answers: ["Pedra", "Algodão", "Vidro de janela"], correct: 0 },
  { question: "Se hoje está chovendo, o chão pode ficar...", answers: ["Molhado", "Seco", "Invisível"], correct: 0 },
  { question: "Qual destes fica no céu à noite?", answers: ["Lua", "Raiz", "Cogumelo"], correct: 0 },
  { question: "Qual destes ajuda a encontrar caminhos?", answers: ["Mapa", "Prato", "Travesseiro"], correct: 0 },
  { question: "Qual atitude é boa em uma aventura em grupo?", answers: ["Cooperar", "Ignorar os amigos", "Esconder as pistas"], correct: 0 },
];

const startState = () => ({
  phase: 0,
  x: 118,
  y: 462,
  direction: 1,
  leaves: 0,
  berries: 0,
  clues: 0,
  score: 0,
  won: false,
  quiz: null,
  quizIndex: 0,
  vy: 0,
  onGround: false,
  effects: [],
  message: "A trilha começa aqui. Usem as habilidades de Mia, Eliza e Paçoca para encontrar a entrada da caverna.",
  items: createPhaseItems(0),
  hotspots: createPhaseHotspots(0),
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

function createPhaseItems(phaseIndex) {
  return phaseItems[phaseIndex].map(([type, x, y]) => item(type, x, y));
}

function createPhaseHotspots(phaseIndex) {
  return phaseHotspots[phaseIndex].map((hotspot, index) => ({
    ...hotspot,
    id: `${phaseIndex}-${index}`,
    solved: false,
    pulse: Math.random() * Math.PI * 2,
  }));
}

function reset() {
  state = startState();
  closeQuiz();
  syncUi();
  updateMusicPhase();
}

function syncUi() {
  ui.leaves.textContent = state.leaves;
  ui.berries.textContent = state.berries;
  ui.clues.textContent = state.clues;
  ui.score.textContent = state.score;
  ui.phase.textContent = state.phase + 1;
  ui.title.textContent = phases[state.phase].title;
  ui.subtitle.textContent = phases[state.phase].subtitle;
  ui.message.textContent = state.message;
  ui.sound.textContent = musicWanted ? "Desligar música" : "Ligar música";
}

function startGame() {
  gameStarted = true;
  ui.titleScreen.classList.add("hidden");
  ensureMusicStarted();
  syncUi();
}

function move(dx, dy) {
  if (!gameStarted || state.won || state.quiz) return;
  if (phases[state.phase].mode === "platform") return;
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
  checkPhasePortal();
}

function hitsObstacle(x, y) {
  return false;
}

function phaseItemsRemaining() {
  return state.items.some((collectible) => !collectible.taken);
}

function phaseChallengesRemaining() {
  return false;
}

function checkPhasePortal() {
  if (state.won) return;
  const phase = phases[state.phase];
  const [px, py, radius] = phase.portal;
  if (Math.hypot(state.x - px, state.y - py) > radius) return;

  if (phaseItemsRemaining() || phaseChallengesRemaining()) {
    state.message = phase.blockedMessage;
    syncUi();
    return;
  }

  if (state.phase < phases.length - 1) {
    state.phase += 1;
    const [sx, sy] = phases[state.phase].start;
    state.x = sx;
    state.y = sy;
    state.items = createPhaseItems(state.phase);
    state.hotspots = createPhaseHotspots(state.phase);
    state.message = phases[state.phase].mode === "platform"
      ? "O caminho levou o grupo ao riacho secreto, o desafio final da floresta."
      : phase.portalMessage;
    syncUi();
    updateMusicPhase();
    return;
  }

  state.won = true;
  state.message = phase.portalMessage;
  syncUi();
  updateMusicPhase();
}

function collectNearby() {
  if (state.quiz || phases[state.phase].mode === "platform") return;
  for (const collectible of state.items) {
    if (collectible.taken || Math.hypot(state.x - collectible.x, state.y - collectible.y) > 44) continue;
    startQuiz(() => takeCollectible(collectible));
    return;
    collectible.taken = true;

    if (collectible.type === "leaf") {
      state.leaves += 1;
      state.message = "Eliza encontrou uma folha marcada. Ela parece fazer parte de um mapa antigo.";
    }

    if (collectible.type === "berry") {
      state.berries += 1;
      state.message = "Paçoca farejou amoras fresquinhas. O grupo recuperou energia para continuar.";
    }

    if (collectible.type === "clue") {
      state.clues += 1;
      state.message = "Mia encontrou uma pista brilhante entre as raízes.";
    }

    if (!phaseItemsRemaining() && !phaseChallengesRemaining()) {
      state.message = state.phase === phases.length - 1
        ? "Todos os sinais foram compreendidos. Agora sigam até a praça antiga."
        : "Todos os sinais desta fase foram resolvidos. Sigam para a passagem iluminada.";
    }

    syncUi();
  }
}

function takeCollectible(collectible) {
  collectible.taken = true;

  if (collectible.type === "leaf") {
    state.leaves += 1;
    state.message = "Eliza encontrou uma folha marcada. Ela parece fazer parte de um mapa antigo.";
  }

  if (collectible.type === "berry") {
    state.berries += 1;
    state.message = "Paçoca farejou amoras fresquinhas. O grupo recuperou energia para continuar.";
  }

  if (collectible.type === "clue") {
    state.clues += 1;
    state.message = "Mia encontrou uma pista brilhante entre as raízes.";
  }

  if (!phaseItemsRemaining() && !phaseChallengesRemaining()) {
    state.message = state.phase === phases.length - 2
      ? "Todos os sinais foram compreendidos. Agora sigam até a praça antiga."
      : "Todos os sinais desta fase foram resolvidos. Sigam para a passagem iluminada.";
  }

  syncUi();
}

function nearestHotspot() {
  let best = null;
  for (const hotspot of state.hotspots) {
    if (hotspot.solved) continue;
    const distance = Math.hypot(state.x - hotspot.x, state.y - hotspot.y);
    if (distance <= 66 && (!best || distance < best.distance)) {
      best = { hotspot, distance };
    }
  }
  return best?.hotspot || null;
}

function interact() {
  if (!gameStarted || state.won || state.quiz) return;
  if (phases[state.phase].mode === "platform") {
    jumpPlatform();
    return;
  }
  state.message = "Nesta fase, aproxime-se dos itens brilhantes para responder e coletar.";
  syncUi();
}

function solveHotspot(hotspot) {
  hotspot.solved = true;
  state.clues += 1;
  state.message = `${hotspot.role}: ${hotspot.message}`;

  if (!phaseItemsRemaining() && !phaseChallengesRemaining()) {
    state.message += state.phase === phases.length - 2
      ? " O mecanismo central está pronto."
      : " A passagem desta fase está pronta.";
  }

  syncUi();
}

function startQuiz(onCorrect) {
  const quiz = getRandomQuiz();
  state.quizIndex += 1;
  state.quiz = { quiz, onCorrect, x: state.x, y: state.y - 34 };
  ui.quizQuestion.textContent = quiz.question;
  ui.quizFeedback.textContent = "";
  ui.quizAnswers.innerHTML = "";
  quiz.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => answerQuiz(index));
    ui.quizAnswers.appendChild(button);
  });
  ui.quizModal.hidden = false;
}

function getRandomQuiz() {
  const original = questionBank[Math.floor(Math.random() * questionBank.length)];
  const answers = original.answers.map((answer, index) => ({
    answer,
    isCorrect: index === original.correct,
  }));

  for (let i = answers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  return {
    question: original.question,
    answers: answers.map((option) => option.answer),
    correct: answers.findIndex((option) => option.isCorrect),
  };
}

function answerQuiz(index) {
  if (!state.quiz) return;
  const { quiz, onCorrect, x, y } = state.quiz;
  if (index !== quiz.correct) {
    ui.quizFeedback.textContent = "Quase! Tente outra resposta.";
    return;
  }

  ui.quizFeedback.textContent = "Certo!";
  closeQuiz();
  addScore(100, x, y);
  onCorrect();
}

function closeQuiz() {
  state.quiz = null;
  ui.quizModal.hidden = true;
  ui.quizAnswers.innerHTML = "";
  ui.quizFeedback.textContent = "";
}

function addScore(points, x, y) {
  state.score += points;
  state.effects.push({
    x,
    y,
    points,
    start: performance.now(),
    duration: 850,
  });
  syncUi();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (phases[state.phase].mode === "platform") {
    drawPlatformPhase();
    return;
  }
  drawForestFloor();
  const background = sceneSprites[phases[state.phase].background];
  if (!background.complete || background.naturalWidth === 0) {
    drawTrail();
    drawRiverGate();
    caves.forEach(drawCave);
    trees.forEach(drawTree);
    stones.forEach(drawStone);
  }
  drawPhasePortal();
  drawCollectibles();
  drawCharacters();
  drawEffects();
  if (state.won) drawWinGlow();
}

function drawForestFloor() {
  if (phases[state.phase].mode === "platform") return;
  const background = sceneSprites[phases[state.phase].background];
  if (background.complete && background.naturalWidth > 0) {
    drawCoverImage(background, 0, 0, W, H);
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

function drawPhasePortal() {
  if (state.won) return;
  const [x, y, radius] = phases[state.phase].portal;
  const time = performance.now() / 420;
  const ready = !phaseItemsRemaining() && !phaseChallengesRemaining();
  ctx.save();
  ctx.globalAlpha = ready ? 0.82 : 0.32;
  ctx.strokeStyle = ready ? "#fff0a6" : "#ffffff";
  ctx.fillStyle = ready ? "rgba(255, 230, 103, 0.2)" : "rgba(255,255,255,0.12)";
  ctx.lineWidth = ready ? 4 : 2;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * (0.68 + Math.sin(time) * 0.04), radius * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (ready) {
    ctx.fillStyle = "#fff5b8";
    for (let i = 0; i < 8; i += 1) {
      const a = time + (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius * 0.48, y + Math.sin(a) * radius * 0.18, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHotspots() {
  const time = performance.now() / 360;
  for (const hotspot of state.hotspots) {
    if (hotspot.solved) continue;
    const bob = Math.sin(time + hotspot.pulse) * 4;
    drawHotspotMarker(hotspot.x, hotspot.y + bob, hotspot);
  }
}

function drawHotspotMarker(x, y, hotspot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#fff3a3";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(255, 244, 166, 0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hotspot.icon === "animal" ? "#69b06b" : hotspot.icon === "scent" ? "#d49352" : "#6aa9d8";
  ctx.strokeStyle = "#fff8c9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#243126";
  ctx.font = "700 17px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const symbol = hotspot.icon === "animal" ? "M" : hotspot.icon === "scent" ? "P" : "E";
  ctx.fillText(symbol, 0, 1);

  ctx.font = "700 11px Segoe UI, Arial";
  ctx.fillStyle = "#fffdf0";
  ctx.strokeStyle = "rgba(36,49,38,0.65)";
  ctx.lineWidth = 4;
  ctx.strokeText("E", 0, -25);
  ctx.fillText("E", 0, -25);
  ctx.restore();
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

const platforms = [
  [0, 506, 220, 34],
  [268, 468, 96, 24],
  [430, 426, 106, 24],
  [600, 382, 112, 24],
  [780, 432, 180, 34],
];

function updatePlatform() {
  if (state.won) return;
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const jump = keys.has("ArrowUp") || keys.has("w") || keys.has(" ");

  if (left) {
    state.x -= 3.6;
    state.direction = -1;
  }
  if (right) {
    state.x += 3.6;
    state.direction = 1;
  }
  if (jump) jumpPlatform();

  state.vy += 0.42;
  state.y += state.vy;
  state.x = Math.max(40, Math.min(W - 40, state.x));
  state.onGround = false;

  for (const [px, py, pw, ph] of platforms) {
    const insideX = state.x > px - 18 && state.x < px + pw + 18;
    const fallingOnto = state.y + 56 >= py && state.y + 56 <= py + ph + Math.max(10, state.vy + 8);
    if (insideX && fallingOnto && state.vy >= 0) {
      state.y = py - 56;
      state.vy = 0;
      state.onGround = true;
    }
  }

  if (state.y > H + 80) {
    state.x = phases[state.phase].start[0];
    state.y = phases[state.phase].start[1];
    state.vy = 0;
    state.message = "O grupo caiu na água e voltou para a margem. Tentem de novo!";
    syncUi();
  }

  if (state.x > 850 && state.y < 455) {
    state.won = true;
    addScore(300, state.x, state.y - 40);
    state.message = phases[state.phase].portalMessage;
    syncUi();
    updateMusicPhase();
  }
}

function jumpPlatform() {
  if (state.onGround) {
    state.vy = -9.5;
    state.onGround = false;
  }
}

function drawPlatformPhase() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#bdebf0");
  sky.addColorStop(0.48, "#7ec6d9");
  sky.addColorStop(1, "#3b8db1");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#236b48";
  ctx.fillRect(0, 0, W, 90);
  ctx.fillStyle = "#54a457";
  for (let i = 0; i < 22; i += 1) {
    ctx.beginPath();
    ctx.ellipse(i * 48, 76 + (i % 3) * 12, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#2d8fb5";
  ctx.fillRect(0, 400, W, 200);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 130 - 40, 440 + Math.sin(performance.now() / 300 + i) * 8);
    ctx.bezierCurveTo(i * 130 + 20, 420, i * 130 + 80, 468, i * 130 + 150, 440);
    ctx.stroke();
  }

  platforms.forEach(([x, y, width, height]) => drawRiverStone(x, y, width, height));
  drawSpriteShadow(state.x - 18, state.y + 56, 24, 7);
  drawSpriteShadow(state.x + 22, state.y + 58, 23, 7);
  drawSpriteShadow(state.x - 4, state.y + 64, 9, 3);
  drawSprite(characterSprites.mia, state.x - 48, state.y - 60, 52, 108);
  drawSprite(characterSprites.eliza, state.x - 1, state.y - 56, 50, 106);
  drawSprite(characterSprites.pacoca, state.x - 11, state.y + 39, 18, 23);
  drawEffects();

  ctx.fillStyle = "#fff4a8";
  ctx.font = "700 20px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("Atravessem o riacho pulando pelas pedras!", W / 2, 42);
  if (state.won) drawWinGlow();
}

function drawRiverStone(x, y, width, height) {
  const stone = ctx.createLinearGradient(x, y, x, y + height);
  stone.addColorStop(0, "#d3d0bb");
  stone.addColorStop(1, "#817d6d");
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(54,58,54,0.36)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawEffects() {
  const now = performance.now();
  state.effects = state.effects.filter((effect) => {
    const progress = (now - effect.start) / effect.duration;
    if (progress >= 1) return false;

    const alpha = 1 - progress;
    const rise = progress * 44;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(effect.x, effect.y - rise);

    ctx.strokeStyle = `rgba(255, 245, 166, ${alpha})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const inner = 14 + progress * 8;
      const outer = 28 + progress * 22;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.fillStyle = "#fff2a6";
    ctx.font = "900 22px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 6;
    ctx.fillText(`+${effect.points}`, 0, -4);
    ctx.restore();
    return true;
  });
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
  ctx.shadowBlur = 26;

  ctx.fillStyle = "rgba(255, 248, 166, 0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff9c9";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();

  if (type === "leaf") {
    ctx.fillStyle = "#f7d64a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 9, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8c6f19";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-13, 5);
    ctx.lineTo(13, -5);
    ctx.stroke();
  }

  if (type === "berry") {
    ctx.fillStyle = "#7c244b";
    ctx.beginPath();
    ctx.arc(-6, 3, 8.5, 0, Math.PI * 2);
    ctx.arc(6, 3, 8.5, 0, Math.PI * 2);
    ctx.arc(0, -6, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(-8, -1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (type === "clue") {
    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = "#53a7d3";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-14, -13, 28, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#53a7d3";
    ctx.fillRect(-8, -5, 16, 4);
    ctx.fillRect(-8, 4, 12, 4);
  }

  ctx.restore();
}

function drawCharacters() {
  const x = state.x;
  const y = state.y;
  drawSpriteShadow(x - 18, y + 34, 28, 8);
  drawSpriteShadow(x + 28, y + 39, 26, 8);
  drawSpriteShadow(x - 2, y + 49, 11, 4);

  drawSprite(characterSprites.mia, x - 48, y - 64, 58, 120);
  drawSprite(characterSprites.eliza, x - 2, y - 61, 58, 119);
  drawSprite(characterSprites.pacoca, x - 12, y + 33, 20, 26);
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

const musicThemes = [
  {
    tempo: 0.5,
    lead: [392, 523.25, 587.33, 659.25, 587.33, 523.25],
    bass: [130.81, 196, 174.61, 196],
    wave: "triangle",
    pad: 98,
    filter: 2200,
  },
  {
    tempo: 0.52,
    lead: [392, 440, 523.25, 587.33, 523.25, 440],
    bass: [196, 246.94, 261.63, 246.94],
    wave: "triangle",
    pad: 130.81,
    filter: 1700,
  },
  {
    tempo: 0.72,
    lead: [261.63, 329.63, 392, 493.88, 392, 329.63],
    bass: [98, 130.81, 146.83, 130.81],
    wave: "sine",
    pad: 65.41,
    filter: 900,
  },
  {
    tempo: 0.48,
    lead: [329.63, 392, 493.88, 587.33, 659.25, 587.33],
    bass: [164.81, 196, 246.94, 220],
    wave: "triangle",
    pad: 110,
    filter: 2100,
  },
  {
    tempo: 0.42,
    lead: [392, 493.88, 587.33, 659.25, 587.33, 493.88],
    bass: [196, 220, 246.94, 196],
    wave: "square",
    pad: 146.83,
    filter: 1900,
  },
];

function createMusicEngine() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContextClass();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1500;
  master.gain.value = 0.055;
  filter.connect(master);
  master.connect(context.destination);

  return {
    context,
    enabled: false,
    filter,
    interval: null,
    step: 0,
  };
}

function toggleMusic() {
  musicWanted = !musicWanted;

  if (musicWanted) {
    ensureMusicStarted();
  } else {
    stopMusicLoop();
    if (audio) audio.enabled = false;
  }

  syncUi();
}

function ensureMusicStarted() {
  if (!musicWanted) return;
  if (!audio) audio = createMusicEngine();
  if (audio.enabled) return;
  audio.enabled = true;
  audio.context.resume();
  startMusicLoop();
  syncUi();
}

function startMusicLoop() {
  stopMusicLoop();
  if (!audio?.enabled || !musicWanted) return;
  audio.step = 0;
  playMusicStep();
  audio.interval = window.setInterval(playMusicStep, currentMusicTheme().tempo * 1000);
}

function stopMusicLoop() {
  if (audio?.interval) {
    window.clearInterval(audio.interval);
    audio.interval = null;
  }
}

function updateMusicPhase() {
  if (!musicWanted || !audio?.enabled) return;
  startMusicLoop();
}

function playMusicStep() {
  if (!audio?.enabled || !musicWanted) return;
  const theme = currentMusicTheme();
  const now = audio.context.currentTime;
  audio.filter.frequency.setTargetAtTime(theme.filter, now, 0.12);

  const leadNote = theme.lead[audio.step % theme.lead.length];
  const bassNote = theme.bass[audio.step % theme.bass.length];
  playTone(leadNote, now, theme.tempo * 0.62, theme.wave, 0.42);

  if (audio.step % 2 === 0) {
    playTone(bassNote, now, theme.tempo * 1.25, "sine", 0.3);
  }

  if (audio.step % 6 === 0) {
    playTone(theme.pad, now, theme.tempo * 3.2, "sine", 0.18);
  }

  audio.step += 1;
}

function currentMusicTheme() {
  return musicThemes[gameStarted ? state.phase + 1 : 0];
}

function playTone(frequency, start, duration, type, volume) {
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(audio.filter);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function drawWinGlow() {
  ctx.fillStyle = "rgba(255, 248, 157, 0.22)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#243126";
  ctx.font = "700 30px Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.fillText("Segredo da cidade perdida descoberto!", W / 2, 70);
}

function loop() {
  let dx = 0;
  let dy = 0;

  if (!gameStarted) {
    draw();
    requestAnimationFrame(loop);
    return;
  }

  if (phases[state.phase].mode === "platform") {
    updatePlatform();
    draw();
    requestAnimationFrame(loop);
    return;
  }

  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  if (dx || dy) move(dx, dy);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  ensureMusicStarted();
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === "Enter" && phases[state.phase].mode === "platform") {
    event.preventDefault();
    interact();
    return;
  }
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

window.addEventListener("pointerdown", () => {
  ensureMusicStarted();
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
ui.action.addEventListener("click", interact);
ui.start.addEventListener("click", startGame);
ui.sound.addEventListener("click", toggleMusic);
ui.restart.addEventListener("click", reset);
setupCanvas();
syncUi();
loop();
