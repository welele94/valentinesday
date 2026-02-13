// desbloquear jogo
const instructions = document.getElementById("instructions");
let gameStarted = false;

window.addEventListener("keydown", (e) => 
{
  if (!gameStarted && e.key === "Enter"){
    gameStarted = true;
    instructions.classList.add("hidden");
  }
})

// JS — clean + stable resize + love sides + glow near points
// Carta abre APENAS com clique ou tecla "E" quando estiver perto.
// Shift+Clique serve para mapear pontos e imprimir coords (ix/iy) no console.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const seen = new Set(); // guarda ids já lidos


// --- Overlay / carta ---
const letter   = document.getElementById("letter");
const titleEl  = document.getElementById("title");
const textEl   = document.getElementById("text");
const closeBtn = document.getElementById("close");
const hintEl   = document.getElementById("hint");

closeBtn.onclick = closeLetter;

function openLetter(p) {
  seen.add(p.id);

  titleEl.textContent = p.title ?? p.label ?? p.id ?? "💌";
  textEl.textContent  = p.text ?? "";
  letter.classList.remove("hidden");
  letter.classList.remove("hidden");

}

function closeLetter() {
  letter.classList.add("hidden");
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !letter.classList.contains("hidden")) {
    closeLetter();
  }
});

function updateHintVisibility() {
  if (!hintEl) return;

  // carta aberta -> hint off
  if (!letter.classList.contains("hidden")) {
    hintEl.classList.remove("visible");
    return;
  }

  // só mostra quando estás perto de um ponto
  if (nearPoint) {
    hintEl.classList.add("visible");
    // opcional: texto dinâmico
    // hintEl.textContent = `Pressiona E para abrir ${nearPoint.label} 💌`;
  } else {
    hintEl.classList.remove("visible");
  }
}

 let zoom = 1.1;        // 1 = normal, 2 = mapa 2x
 const CAM_SMOOTH = 0.12; // 0.08-0.2 (suavidade follow)
 let camX = 0;          // topo-esquerdo da câmara em coords de imagem
 let camY = 0;
// --- helpers ---
function computeContain(iw, ih, cw, ch) {
  const s  = Math.min(cw / iw, ch / ih);
  const dw = iw * s, dh = ih * s;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  return { s, dw, dh, ox, oy };
}

// mudamos a vista para uma camara 
function updateCamera(w, h) {
  // tamanho do “mundo visível” em coords de imagem
  const viewW = w / zoom;
  const viewH = h / zoom;

  // alvo: centrar no player
  const targetX = player.ix - viewW / 2;
  const targetY = player.iy - viewH / 2;

  // clamp aos limites do mapa
  const maxX = Math.max(0, bg.width  - viewW);
  const maxY = Math.max(0, bg.height - viewH);

  const clampedX = Math.max(0, Math.min(maxX, targetX));
  const clampedY = Math.max(0, Math.min(maxY, targetY));

  // smooth follow
  camX += (clampedX - camX) * CAM_SMOOTH;
  camY += (clampedY - camY) * CAM_SMOOTH;

  // offsets para desenhar no canvas
  bgScale = zoom;
  bgOffsetX = -camX * zoom;
  bgOffsetY = -camY * zoom;
}


function CW() { return canvas.getBoundingClientRect().width; }
function CH() { return canvas.getBoundingClientRect().height; }

// --- resize (sem flashes) ---
let resizeRAF = 0;

function resizeCanvas() {
  cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // desenhar em unidades CSS
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
}

window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();

// --- imagem do mapa ---
const bg = new Image();
bg.crossOrigin = "anonymous";
bg.src = "https://raw.githubusercontent.com/welele94/valentinesday/main/Design%20sem%20nome%20(1).jpg";

// transform do mapa (contain)
let bgScale = 1;
let bgOffsetX = 0;
let bgOffsetY = 0;

// --- feedback do último SHIFT+click (mapear) ---
let lastMarked = null; // { ix, iy, ts }

// --- proximidade ---
let nearPoint = null;           // ponto "pronto" (dentro do raio)
let nearestPoint = null;        // ponto mais próximo (para glow)
let nearestDist = Infinity;     // distância ao mais próximo

const NEAR_DISTANCE = 90;       // raio para permitir abrir carta (px na imagem)
const GLOW_DISTANCE = 160;      // até onde o glow aparece (px na imagem)

// --- pontos (coords na imagem: ix/iy) ---
const points = [
  {
    id: "sushi",
    label: "Taste House Sushi",
    ix: 141,
    iy: 191,
    title: "🍣 Taste House Sushi",
    text: "Aqui começou tudo.\nA nossa conversa que se tornou fácil ainda que sejamos tímidos. Só tenho pena daquela massa mas a verdade é que tornou tudo mais especial. Estavas linda!"
  },
  {
    id: "hardrock",
    label: "Hard Rock Café",
    ix: 987,
    iy: 684,
    title: "🎸 Hard Rock",
    text: "Aqui já não era só curiosidade.\nJá era vontade de repetir. Fomos ao Hard Rock ver um espetaculo de comédia que podia ser bom mas também poderia ser muito mau. De vez em quando lá parava para olhar para ti e ver se estavas a gostar."
  },
  {
    id: "cordoaria",
    label: "Cordoaria",
    ix: 559,
    iy: 774,
    title: "🏛 Cordoaria",
    text: "E depois de virmos animados do Hard Rock viemos para a cordoaria aproveitar a companhia um do outro. Começamos por ir beber copo que já não me lembro bem aonde, mas lembro-me de entrar na Adega Leonor e pedir-mos shots de Jagermeister e depois de tequila."
  },
  {
    id: "virtudes",
    label: "Virtudes",
    ix: 243,
    iy: 978,
    title: "Jardim das Virtudes",
    text: "Aque tivemos mais um momento só nosso e único. Ainda tivemos a companhia daquele jovem que apareceu lá. A imagem que escolhi para esta zona também não foi ao acaso porque sim eu lembro-me que querias sentar no meu colinho eheheh"
  },
  {
    id: "Vigo",
    label: "Vigo",
    ix: 750,
    iy: 150,
    title: "Vigo",
    text:"A nossa primeira viagem ao estrangeiro ehehe e que viagem! Soube muito bem relaxar neste hotel, quarto espetecular, máquina de café, boa varanda com vista para o mar e para a piscina, sei que viviamos ali fácil! Bom polvo e boa comida eheheh e especialmente voceeee! A primeira vez que voce sentiu uma pilinha eheheh"

  },
  {
    id: "Salamanca",
    label: "Salamanca",
    ix: 1788,
    iy: 88,
    title: "Salamanca",
    text: "Aqui foi a nossa primeira viagem \'grande'. E quem foi a menina mais bela que conduziu durante kms e kms e ainda chegou a Salamanca e andava lá como se nada fosse com uma confiança incrivel? Fiquei super proud!"
  },
  {
    id:"Savona",
    label: "Savona",
    ix: 1153,
    iy: 926,
    title: "Savona",
    text: "Aqui começou a nossa viagem por Itália verdadeiramente! Foi muito top aquela primeira noite em Savona, aquela foccacia foi memorável. Não podia haver um melhor começo!"
  },
  {
    id: "Portofino",
    label: "Portofino",
    ix: 1246,
    iy: 899,
    title: "Portofino",
    text: "Bem, que mais poderia dizer que gostamos disto que tivemos de ir duas vezes? Apesar de lá ter estado antes, nunca tinha estado na melhor companhia, e como diz o Christopher McCandless: Happiness is only real when shared. \nÓtimos gelados também!"
  },
  {
    id: "Deiva Marina",
    label: "Deiva Marina",
    "ix": 1329,
    "iy": 937,
    title: "Deiva Marina",
    text: "E aqui nos dirigiamos para das zonas mais belas desta Europa! Não sei antes experimentar-mos o que é acampar e viver com pouco ahaha Que podemos dizer? Foi uma experiencia! Ainda assim conseguiste provar um belissimo capuccino e barato!"
  },
  {
    id: "Cinque Terre",
    label: "Cinque Terre",
    ix: 1406,
    iy: 1004,
    title: "Cinque Terre",
    text: "São ou não são dos locais mais bonitos que já estiveste? Se soubessemos o que sabemos agora tinha sido uma experiencia ainda melhor ir de barco ehehe Mas a nossa viagem não deixou de ser icónica ao entrarmos à criminosos no comboio ahahah Ainda assim soube muito bem conhecer estas pequenas vilas não soube?"
  },
  {
    id: "Florença",
    label: "Florença",
    ix: 1669,
    iy: 1012,
    title: "Florença",
    text: "Seguimos para Florença! Dos locais que mais ansiavas conhecer sobretudo com a sua icónica Santa Maria del Fiore. Confesso que me sentia apreensivo e achava que ia me sentir inseguro mas isso nunca aconteceu, depois acabei por ficar mais relaxado. Sinto que podiamos ter conhecido mais coisas ou ir a museus mas o tempo que passamos nesta cidade foi de qualquer das maneiras único."
  },
  {
    id: "Bolonha",
    label: "Bolonha",
    ix: 1652,
    iy: 860, 
    title: "Bolonha",
    text: "Apanhamos muito chuva nesta viagem e fomos por uma estrada panoramica. Foi também aqui que nos começamos a fartar das constantes obras em Itália ahahah Eu achava que ias gostar mas duvidavas, até compreendo porque acho que as fotos não passam a boa energia e a cuteness que a cidade tem. Pode parecer nada de especial mas adorei levar-te aos sitios que comprei algumas das tuas prendas de anos ahaha. Já podemos começar a falar da comida aqui? My fucking god, que massas boaaas!"
  },
  {
    id: "Verona",
    label: "Verona",
    ix: 1586,
    iy: 645,
    title: "Verona",
    text: "Verona, seguimos para aqui doentes por causa do vento de Florença ahaha Não era uma cidade que quisesse voltar mas quereres ir foi bom porque deu para perceber com outra perspetiva e maturidade a cidade. Além de tudo lembrava-me muito pouco de Verona da altura que tinha lá estado. Acabei por gostar mas estava muito excitado para ir para Trento, aquela zona de Itália é a minha favorita!"
  }, 
  {
    id: "Trento",
    label: "Trento",
    ix: 1609,
    iy: 491,
    title: "Trento",
    text: "Aqui começaram as duvidas se chegariamos ao Lago di Braies por causa do mau tempo! Fizemos o check-in e seguimos para Bolzano! No dia seguinte fomos para o centro lavar a roupa e compramos uma cena da maquina que achavamos que era toalhitas anti nodoas afinal era detergente ahahaha Seguimos para o centro para reviver. Eu adoro, é uma cidade pacata e bonita envolvida por montanhas de cortar a respiração. Ficaste doentinha também e fomos à farmácia comprar um medicamento overpriced mas fez-te bem!"
  },
  {
    id: "Bolzano",
    label: "Bolzano",
    ix: 1640,
    iy: 387,
    title: "Bolzano",
    text: "Chegamos a Bolzano um pouco depois de termos chegado a Trento e sabiamos que iamos conhecer mas só por algumas horas! Estava excitado por te mostrar algo em Itália que ninguem associa muito e uma cultura já mais germánica. Sente-se logo na vibe da cidade algo diferente e mais organizado que no resto de Itália. As ruas antigas e cheias de história são muito giras."
  },
  {
    id: "Lago di Braies",
    label: "Lago di Braies",
    ix: 1776,
    iy: 334,
    title: "Lago di Braies",
    text: "A única localização que eu queria muito conhecer e nunca tinha tido a oportunidade de ir e quem mais me poderia fazer companhia se não tu? Apanhamos chuva o caminho todo e já estavamos a contar que iamos apanhar no lago apesar de estarmos a rezar que não! Chegamos lá e foi deslumbrados com a beleza natural daquele lugar. A água turquesa apesar do mau tempo e do ceu cinzento. Tiramos muitas fotos que davam capa de revista! Foi tudo incrivel! Ainda provamos um cannoli de supermercado que estava delicioso e do qual tenho pena que não o tenhas conseguido saborear!"
  },  
  {
    id: "Santa Margherita Ligure",
    label: "Santa Margherita Ligure",
    ix: 1301,
    iy: 887,
    title: "Santa Margherita Ligure",
    text: "Tinhamos de voltar não era? Não só voltar como comprar casa ehehhe Grande vibe, não podia haver melhor localização para acabar a viagem por Itália ehehe Aquela praiinha antes de irmos para Nice soube mesmo bem! E a copada também depois de Portofino!"
  },
];

// --- player ---
const player = { ix: 200, iy: 200, speed: 4 };
const keys = new Set();
window.addEventListener("keydown", e => keys.add(e.key));
window.addEventListener("keyup", e => keys.delete(e.key));

// --- conversões ---
function screenToImage(sx, sy) {
  return {
    x: (sx - bgOffsetX) / bgScale,
    y: (sy - bgOffsetY) / bgScale
  };
}
function imageToScreen(ix, iy) {
  return {
    x: ix * bgScale + bgOffsetX,
    y: iy * bgScale + bgOffsetY
  };
}

// --- clique: abrir carta se nearPoint; Shift+clique para mapear ---
canvas.addEventListener("click", (e) => {
  if (!letter.classList.contains("hidden")) return;

  // clique abre carta se estiver perto
  if (nearPoint) {
    openLetter(nearPoint);
    return;
  }


});

// --- tecla E: abre carta se nearPoint ---
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() !== "e") return;
  if (!letter.classList.contains("hidden")) return;
  if (nearPoint) openLetter(nearPoint);
});

// --- visual: fundo love ---
function drawLoveSidesBackground(w, h) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0.00, "#b0003a");
  g.addColorStop(0.22, "#ff2d55");
  g.addColorStop(0.50, "#ff5aa5");
  g.addColorStop(0.78, "#ff2d55");
  g.addColorStop(1.00, "#b0003a");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, 0, w, h);
}

// --- visual: mapa “glass” só no cartão ---
function drawGlassifiedMap(w, h) {
  if (!bg.width || !bg.height) return;

  // já definidos pela câmara (updateCamera)
  bgScale = zoom;

  const x  = bgOffsetX;
  const y  = bgOffsetY;
  const dw = bg.width  * zoom;
  const dh = bg.height * zoom;

  const pad = 8;

  // "cartão" escuro por trás (opcional mas dá contraste)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 140;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - pad, y - pad, dw + pad * 2, dh + pad * 2);

  // IMPORTANTe: não metas shadow no drawImage
  ctx.shadowColor = "transparent";
  ctx.drawImage(bg, x, y, dw, dh);
  ctx.restore();

  // borda do mapa
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, dw, dh);
  ctx.restore();
}

// --- proximidade: calcula nearest + nearPoint ---
function updateNearPoint() {
  nearestPoint = null;
  nearestDist = Infinity;
  nearPoint = null;

  if (!bg.width || !bg.height) return;
  if (!points.length) return;

  for (const p of points) {
    const d = Math.hypot(player.ix - p.ix, player.iy - p.iy);
    if (d < nearestDist) {
      nearestDist = d;
      nearestPoint = p;
    }
  }

  if (nearestPoint && nearestDist <= NEAR_DISTANCE) {
    nearPoint = nearestPoint;
  }
}

// --- glow visual (NUNCA abre carta) ---
function drawProximityGlow() {
  if (!bg.width || !bg.height) return;
  if (!nearestPoint) return;
  if (!isFinite(nearestDist)) return;
  if (nearestDist > GLOW_DISTANCE) return;

  const sp = imageToScreen(nearestPoint.ix, nearestPoint.iy);
  const t = 1 - (nearestDist / GLOW_DISTANCE); // 0..1

  ctx.save();

  // halo rosa
  ctx.globalAlpha = 0.12 + 0.35 * t;
  ctx.beginPath();
  ctx.arc(sp.x, sp.y, 24 + 34 * t, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,45,85,1)";
  ctx.fill();

  // anel "ready" quando já pode abrir
  if (nearestDist <= NEAR_DISTANCE) {
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 20 + 6 * t, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// --- desenhar pontos + flash do SHIFT+click ---
function drawPoints() {
  const now = performance.now();

  ctx.save();
  ctx.font = "32px Poppins";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#aaa";
  ctx.strokeStyle = "#fff";

  for (const p of points) {
    const sp = imageToScreen(p.ix, p.iy);
    const size = 22;

    const isSeen = seen.has(p.id);

    // fundo (só se lido)
    if (isSeen) {
      ctx.fillStyle = "rgba(255,45,85,0.18)";
      ctx.fillRect(sp.x - size/2, sp.y - size/2, size, size);
      ctx.strokeStyle = "rgba(255,45,85,0.95)";
    } else {
      ctx.strokeStyle = "#111";
    }

    // contorno
    ctx.strokeRect(sp.x - size/2, sp.y - size/2, size, size);

    // label (só perto para evitar ruído)
    const LABEL_DISTANCE = 100; // ajusta (em px da imagem)

    if (p.label) {
      const d = Math.hypot(player.ix - p.ix, player.iy - p.iy);
      if (d <= LABEL_DISTANCE) {
        ctx.fillStyle = "#000";
        ctx.fillText(p.label, sp.x + 18, sp.y + 6);
      }
    }
  }

  // flash do último SHIFT+click
  if (lastMarked && (now - lastMarked.ts) < 700) {
    const sp = imageToScreen(lastMarked.ix, lastMarked.iy);
    const size = 28;

    ctx.save();
    ctx.globalAlpha = 1 - ((now - lastMarked.ts) / 700);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 5;
    ctx.strokeRect(sp.x - size/2, sp.y - size/2, size, size);
    ctx.restore();
  }

  ctx.restore();
}

// --- player ---
const pawnImg = new Image();
pawnImg.crossOrigin = "anonymous";
pawnImg.src = "https://raw.githubusercontent.com/welele94/valentinesday/main/8966a508-10de-4f81-b752-ef4ebb565208.png";

let pawnReady = false;

pawnImg.onload = () => {
  pawnReady = true;
  console.log("✅ Pawn loaded");
};
pawnImg.onerror = () => console.error("❌ Não consegui carregar o peão (confirma o RAW e se o repo é público).");



function drawPlayer() {
  const sp = imageToScreen(player.ix, player.iy);

  // animação suave baseada no tempo
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 3.2) * 4;          // sobe/desce (px)
  const tilt = Math.sin(t * 2.1) * 0.08;      // rotação (rad)
  const scale = 1 + Math.sin(t * 3.2) * 0.04; // micro “pop”

  // sombra no chão (fica cute)
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(sp.x, sp.y + 14, 14, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // se a imagem ainda não carregou, fallback para bolinha
  if (!pawnReady) {
    ctx.save();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // desenhar a imagem centrada no player
  const baseSize = 80; // tamanho em px no ecrã (ajusta)
  const w = baseSize;
  const h = baseSize;

  ctx.save();
  ctx.translate(sp.x, sp.y + bob);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);

  // desenha centrado
  ctx.drawImage(pawnImg, -w / 2, -h / 2, w, h);

  ctx.restore();
}


function updatePlayer() {
  if (!letter.classList.contains("hidden")) return;
  if (!bg.width || !bg.height) return;

  const step = player.speed / bgScale;

  if (keys.has("ArrowUp")) player.iy -= step;
  if (keys.has("ArrowDown")) player.iy += step;
  if (keys.has("ArrowLeft")) player.ix -= step;
  if (keys.has("ArrowRight")) player.ix += step;

  player.ix = Math.max(0, Math.min(bg.width, player.ix));
  player.iy = Math.max(0, Math.min(bg.height, player.iy));
}

// --- loop ---
let started = false;

function loop() {
  const w = CW();
  const h = CH();

  ctx.clearRect(0, 0, w, h);

  drawLoveSidesBackground(w, h);
  drawGlassifiedMap(w, h);

  // move -> calcula proximidade -> desenha glow
  updatePlayer();
  updateCamera(w, h);
  updateNearPoint();
  updateHintVisibility();
  drawProximityGlow();

  // desenha UI
  drawPlayer();
  drawPoints();

  requestAnimationFrame(loop);
}

// Start
bg.onload = () => {
  if (started) return;
  started = true;

  resizeCanvas();

  player.ix = Math.round(bg.width * 0.2);
  player.iy = Math.round(bg.height * 0.2);

  requestAnimationFrame(loop);
};

bg.onerror = () => {
  console.error("Não consegui carregar o mapa. Confirma o link RAW e se o repo é público.");
};

/*
############################################################################
############################################################################
############################################################################
########################################################################################################################################################
############################################################################
*/
