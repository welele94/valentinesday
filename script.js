const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const letter = document.getElementById("letter");
const titleEl = document.getElementById("title");
const textEl  = document.getElementById("text");
document.getElementById("close").onclick = () => letter.classList.add("hidden");

// resize canvas
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  // desenhar em "pixels CSS"
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Player
const player = { x: 140, y: 120, r: 10, speed: 3 };

// Locais (quadrados clicáveis)
const locations = [
  {
    id: "sushi",
    label: "sushi",
    x: 90, y: 60, w: 34, h: 34,
    title: "🍣 Sushi",
    text: "Aqui começou tudo.\nEu estava nervoso mas a fingir que não 😅"
  },
  {
    id: "hardrock",
    label: "hard rock",
    x: 90, y: 260, w: 34, h: 34,
    title: "🎸 Hard Rock",
    text: "Aqui já não era só curiosidade.\nJá era vontade de repetir."
  },
  {
    id: "cordoaria",
    label: "cordoaria",
    x: 340, y: 270, w: 34, h: 34,
    title: "🏛 Cordoaria",
    text: "Aquele passeio...\nFoi aqui que percebi que isto era mesmo bom."
  }
];

// Input (setas)
const keys = new Set();
window.addEventListener("keydown", e => keys.add(e.key));
window.addEventListener("keyup", e => keys.delete(e.key));

// Click no canvas → abrir carta se clicou num local
canvas.addEventListener("click", (e) => {
  if (!letter.classList.contains("hidden")) return; // se já está aberta, ignora

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  const hit = locations.find(loc =>
    mx >= loc.x && mx <= loc.x + loc.w &&
    my >= loc.y && my <= loc.y + loc.h
  );

  if (hit) openLetter(hit);
});

function openLetter(loc){
  titleEl.textContent = loc.title;
  textEl.textContent  = loc.text;
  letter.classList.remove("hidden");
}

// Desenho do “caminho rabiscado” (placeholder)
function drawPath(){
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(110, 80);
  ctx.bezierCurveTo(240, 40, 210, 160, 150, 210);
  ctx.bezierCurveTo(80, 280, 220, 320, 320, 300);
  ctx.stroke();
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawPath();

  // locais
  ctx.font = "20px Arial";
  locations.forEach(loc => {
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.strokeRect(loc.x, loc.y, loc.w, loc.h);
    ctx.fillStyle = "#111";
    ctx.fillText(loc.label, loc.x + 55, loc.y + 26);
  });

  // player
  ctx.beginPath();
  ctx.fillStyle = "#111";
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // hint se estiver “perto” de um local
  const near = locations.find(loc => {
    const cx = loc.x + loc.w/2, cy = loc.y + loc.h/2;
    return Math.hypot(player.x - cx, player.y - cy) < 60;
  });
  if (near && letter.classList.contains("hidden")) {
    ctx.fillStyle = "#111";
    ctx.font = "16px Arial";
    ctx.fillText("Clica no quadrado para abrir a carta 💌", 24, canvas.height - 24);
  }
}

function update(){
  if (letter.classList.contains("hidden")) { // trava movimento quando carta está aberta
    if (keys.has("ArrowUp")) player.y -= player.speed;
    if (keys.has("ArrowDown")) player.y += player.speed;
    if (keys.has("ArrowLeft")) player.x -= player.speed;
    if (keys.has("ArrowRight")) player.x += player.speed;

    // limites
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
  }

  draw();
  requestAnimationFrame(update);
}

update();
