const ENDPOINT = "https://script.google.com/macros/s/AKfycbyWMBCEKg_TO3nMkYL9RNP7iKm_KFX1uCSBmRhAzoTJ280KII1YeP-PgWMK89-Wnk8/exec";
const WINNER_COUNT = 5;

const els = {
  gate: document.getElementById("gate"),
  gateForm: document.getElementById("gateForm"),
  password: document.getElementById("password"),
  gateBtn: document.getElementById("gateBtn"),
  gateStatus: document.getElementById("gateStatus"),
  start: document.getElementById("start"),
  startBtn: document.getElementById("startBtn"),
  totalCount: document.getElementById("totalCount"),
  reveal: document.getElementById("reveal"),
  current: document.getElementById("current"),
  shuffleName: document.getElementById("shuffleName"),
  stage: document.getElementById("stage"),
  result: document.getElementById("result"),
  winnerName: document.getElementById("winnerName"),
  winnerMessage: document.getElementById("winnerMessage"),
  revealBtn: document.getElementById("revealBtn"),
  nextBtn: document.getElementById("nextBtn"),
  done: document.getElementById("done"),
  restartBtn: document.getElementById("restartBtn"),
};

let allMessages = [];
let winners = [];
let idx = 0;

function show(section) {
  ["gate", "start", "reveal", "done"].forEach((k) => {
    els[k].hidden = k !== section;
  });
}

function pickWinners(messages, n) {
  const pool = messages.slice();
  const picked = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const j = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(j, 1)[0]);
  }
  return picked;
}

els.gateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = els.password.value.trim();
  if (!key) return;
  els.gateBtn.disabled = true;
  els.gateStatus.textContent = "Loading...";
  els.gateStatus.className = "status";

  try {
    const url = ENDPOINT + "?action=list&key=" + encodeURIComponent(key);
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) {
      els.gateStatus.textContent = data.error === "unauthorized" ? "Wrong password." : "Error loading.";
      els.gateStatus.className = "status error";
      els.gateBtn.disabled = false;
      return;
    }
    allMessages = data.messages || [];
    if (allMessages.length < WINNER_COUNT) {
      els.gateStatus.textContent = `Need at least ${WINNER_COUNT} messages — only ${allMessages.length} so far.`;
      els.gateStatus.className = "status error";
      els.gateBtn.disabled = false;
      return;
    }
    els.totalCount.textContent = allMessages.length;
    show("start");
  } catch (err) {
    els.gateStatus.textContent = "Network error.";
    els.gateStatus.className = "status error";
    els.gateBtn.disabled = false;
  }
});

els.startBtn.addEventListener("click", () => {
  winners = pickWinners(allMessages, WINNER_COUNT);
  idx = 0;
  prepareReveal();
  show("reveal");
});

function prepareReveal() {
  els.current.textContent = String(idx + 1);
  els.result.hidden = true;
  els.shuffleName.textContent = "?";
  els.stage.classList.remove("revealed");
  els.revealBtn.hidden = false;
  els.revealBtn.disabled = false;
  els.nextBtn.hidden = true;
}

let shuffleTimer = null;
function startShuffle() {
  const names = allMessages.map((m) => m.name).filter(Boolean);
  if (names.length === 0) names.push("...");
  shuffleTimer = setInterval(() => {
    els.shuffleName.textContent = names[Math.floor(Math.random() * names.length)];
  }, 70);
}
function stopShuffle() {
  if (shuffleTimer) {
    clearInterval(shuffleTimer);
    shuffleTimer = null;
  }
}

els.revealBtn.addEventListener("click", () => {
  els.revealBtn.disabled = true;
  startShuffle();
  // 2.2s of suspense, then settle on the winner
  setTimeout(() => {
    stopShuffle();
    const w = winners[idx];
    els.shuffleName.textContent = w.name;
    els.stage.classList.add("revealed");
    els.winnerName.textContent = w.name;
    els.winnerMessage.textContent = w.message;
    els.result.hidden = false;
    els.revealBtn.hidden = true;
    els.nextBtn.hidden = false;
    els.nextBtn.textContent = idx === WINNER_COUNT - 1 ? "Finish" : "Next winner";
  }, 2200);
});

els.nextBtn.addEventListener("click", () => {
  idx += 1;
  if (idx >= WINNER_COUNT) {
    show("done");
    return;
  }
  prepareReveal();
});

els.restartBtn.addEventListener("click", () => {
  els.password.value = "";
  els.gateBtn.disabled = false;
  els.gateStatus.textContent = "";
  show("gate");
});
