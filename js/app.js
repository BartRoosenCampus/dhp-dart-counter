// App State
let state = {
    players: ["Speler 1", "Speler 2"],
    matchStarter: 0,
    currentLeg: 1,
    legsWon: [0, 0],
    activePlayer: 0,
    scores: [501, 501],
    dartsThrownInLeg: [0, 0],
    lastThrowText: "-",
    inputBuffer: "",
    legsHistory: [],
    historyLog: []
};

// DOM Elementen
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const summaryScreen = document.getElementById("summary-screen");

const p1NameInput = document.getElementById("player1-name");
const p2NameInput = document.getElementById("player2-name");
const starterBtn0 = document.getElementById("starter-btn-0");
const starterBtn1 = document.getElementById("starter-btn-1");
const startBtn = document.getElementById("start-btn");

const currentLegNumEl = document.getElementById("current-leg-num");
const p1LegsEl = document.getElementById("p1-legs");
const p2LegsEl = document.getElementById("p2-legs");
const displayP1 = document.getElementById("display-p1");
const displayP2 = document.getElementById("display-p2");
const p1ScoreEl = document.getElementById("p1-score");
const p2ScoreEl = document.getElementById("p2-score");
const p1DartsEl = document.getElementById("p1-darts");
const p2DartsEl = document.getElementById("p2-darts");
const player0Box = document.getElementById("player0-box");
const player1Box = document.getElementById("player1-box");
const activePlayerNameEl = document.getElementById("active-player-name");
const lastThrowEl = document.getElementById("last-throw");
const inputBufferEl = document.getElementById("input-buffer");

const numBtns = document.querySelectorAll(".num-btn[data-val]");
const btnClear = document.getElementById("btn-clear");
const btnBackspace = document.getElementById("btn-backspace");
const undoBtn = document.getElementById("undo-btn");
const submitScoreBtn = document.getElementById("submit-score-btn");

const winnerTextEl = document.getElementById("winner-text");
const legsSummaryContainer = document.getElementById("legs-summary-container");
const newMatchBtn = document.getElementById("new-match-btn");
const historyListEl = document.getElementById("history-list");

// Modal Elementen
const dartsModal = document.getElementById("darts-modal");
const modalTitle = document.getElementById("modal-title");
const modalSubtitle = document.getElementById("modal-subtitle");
const modalButtons = document.getElementById("modal-buttons");
const modalCancel = document.getElementById("modal-cancel");

let pendingTurnData = null;

window.addEventListener("DOMContentLoaded", () => {
    loadHistoryFromStorage();
    setupStarterButtons();
});

p1NameInput.addEventListener("input", () => {
    const val = p1NameInput.value.trim() || "Speler 1";
    starterBtn0.textContent = val;
});

p2NameInput.addEventListener("input", () => {
    const val = p2NameInput.value.trim() || "Speler 2";
    starterBtn1.textContent = val;
});

function setupStarterButtons() {
    starterBtn0.addEventListener("click", () => {
        state.matchStarter = 0;
        starterBtn0.classList.add("active");
        starterBtn1.classList.remove("active");
    });

    starterBtn1.addEventListener("click", () => {
        state.matchStarter = 1;
        starterBtn1.classList.add("active");
        starterBtn0.classList.remove("active");
    });
}

startBtn.addEventListener("click", () => {
    const name1 = p1NameInput.value.trim() || "Speler 1";
    const name2 = p2NameInput.value.trim() || "Speler 2";

    state.players = [name1, name2];

    displayP1.textContent = name1;
    displayP2.textContent = name2;

    initMatch();
    switchScreen(gameScreen);
});

newMatchBtn.addEventListener("click", () => {
    switchScreen(setupScreen);
    loadHistoryFromStorage();
});

function switchScreen(targetScreen) {
    [setupScreen, gameScreen, summaryScreen].forEach(s => s.classList.remove("active"));
    targetScreen.classList.add("active");
}

function initMatch() {
    state.currentLeg = 1;
    state.legsWon = [0, 0];
    state.legsHistory = [];
    initLeg();
}

function initLeg() {
    state.scores = [501, 501];
    state.dartsThrownInLeg = [0, 0];
    state.inputBuffer = "";
    state.lastThrowText = "-";
    state.historyLog = [];

    if (state.currentLeg % 2 !== 0) {
        state.activePlayer = state.matchStarter;
    } else {
        state.activePlayer = 1 - state.matchStarter;
    }

    updateUI();
}

// Numeriek klavier
numBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-val");
        if (state.inputBuffer.length < 3) {
            state.inputBuffer += val;
            const num = parseInt(state.inputBuffer);
            if (num > 180) {
                state.inputBuffer = "180";
            }
        }
        updateInputBufferUI();
    });
});

btnClear.addEventListener("click", () => {
    state.inputBuffer = "";
    updateInputBufferUI();
});

btnBackspace.addEventListener("click", () => {
    state.inputBuffer = state.inputBuffer.slice(0, -1);
    updateInputBufferUI();
});

function updateInputBufferUI() {
    inputBufferEl.textContent = state.inputBuffer === "" ? "0" : state.inputBuffer;
}

// Beurt indienen
submitScoreBtn.addEventListener("click", () => {
    if (state.inputBuffer === "") return;
    const scored = parseInt(state.inputBuffer);
    const currentScore = state.scores[state.activePlayer];

    // Regels voor BUST of ongeldige score:
    // 1. Gescoorde score is groter dan de huidige score.
    // 2. Er blijft exact 1 over (je kunt niet op een dubbel uitkomen als er 1 over is).
    if (scored > currentScore || currentScore - scored === 1) {
        recordTurn(scored, 3, true);
        return;
    }

    const remaining = currentScore - scored;

    // Als de speler op 0 komt (uitgooi)
    if (remaining === 0) {
        // Valideer of deze score überhaupt uit te gooien is in het dartsspel
        if (!isValidCheckout(currentScore)) {
            alert(`Onmogelijke checkout! Score ${currentScore} kan niet worden uitgegooid (je moet eindigen op een dubbel en scores zoals 159, 162, 163, 165, 166, 168 en 169 zijn onmogelijk).`);
            return;
        }

        const possibleDarts = getCheckoutDartCounts(currentScore);
        if (possibleDarts.length === 1) {
            recordTurn(currentScore, possibleDarts[0], false, true);
        } else {
            pendingTurnData = { scored: currentScore, isBust: false, isCheckout: true };
            showDartsModal("🎯 UITGOOI!", `Hoeveel pijlen had ${state.players[state.activePlayer]} nodig om ${currentScore} uit te gooien?`, possibleDarts);
        }
    } else {
        // Standaard beurt: altijd exact 3 pijlen
        recordTurn(scored, 3, false, false);
    }
});

// Controleert of een score een geldige checkout is (rekening houdend met double-out en onmogelijke combinaties zoals 162, 169, etc.)
function isValidCheckout(score) {
    // Scores van 2 t/m 170 zijn geldig, BEHALVE 159, 162, 163, 165, 166, 168 en 169
    if (score < 2 || score > 170) return false;
    const impossibleCheckouts = [159, 162, 163, 165, 166, 168, 169];
    if (impossibleCheckouts.includes(score)) return false;
    return true;
}

function getCheckoutDartCounts(score) {
    let options = [];
    if (score <= 50) options.push(1);
    if (score <= 110) options.push(2);
    options.push(3);
    return options;
}

function showDartsModal(title, subtitle, options) {
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle;
    modalButtons.innerHTML = "";

    options.forEach(count => {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = `${count} ${count === 1 ? 'pijl' : 'pijlen'}`;
        btn.addEventListener("click", () => {
            closeDartsModal();
            recordTurn(pendingTurnData.scored, count, pendingTurnData.isBust, pendingTurnData.isCheckout);
        });
        modalButtons.appendChild(btn);
    });

    dartsModal.classList.add("active");
}

modalCancel.addEventListener("click", () => {
    closeDartsModal();
    pendingTurnData = null;
});

function closeDartsModal() {
    dartsModal.classList.remove("active");
}

function recordTurn(scored, dartsCount, isBust, isCheckout = false) {
    state.historyLog.push({
        activePlayer: state.activePlayer,
        scores: [...state.scores],
        dartsThrownInLeg: [...state.dartsThrownInLeg],
        lastThrowText: state.lastThrowText
    });

    if (!isBust) {
        state.scores[state.activePlayer] -= scored;
        if (isCheckout) {
            state.lastThrowText = `${state.players[state.activePlayer]} gooide uit met ${scored} (${dartsCount} pijlen)!`;
        } else {
            state.lastThrowText = `${state.players[state.activePlayer]} gooide ${scored}`;
        }
    } else {
        state.lastThrowText = `${state.players[state.activePlayer]} - BUST (${scored})`;
    }

    state.dartsThrownInLeg[state.activePlayer] += dartsCount;
    state.inputBuffer = "";
    updateInputBufferUI();

    if (state.scores[state.activePlayer] === 0) {
        finishLeg(state.activePlayer);
        return;
    }

    state.activePlayer = 1 - state.activePlayer;
    updateUI();
}

// Undo
undoBtn.addEventListener("click", () => {
    if (state.historyLog.length === 0) {
        return;
    }

    const previousState = state.historyLog.pop();
    state.activePlayer = previousState.activePlayer;
    state.scores = [...previousState.scores];
    state.dartsThrownInLeg = [...previousState.dartsThrownInLeg];
    state.lastThrowText = previousState.lastThrowText;
    state.inputBuffer = "";

    updateInputBufferUI();
    updateUI();
});

function finishLeg(winnerIndex) {
    state.legsWon[winnerIndex]++;

    state.legsHistory.push({
        legNumber: state.currentLeg,
        winner: state.players[winnerIndex],
        p1Darts: state.dartsThrownInLeg[0],
        p2Darts: state.dartsThrownInLeg[1],
        p1Rest: state.scores[0],
        p2Rest: state.scores[1]
    });

    if (state.legsWon[winnerIndex] === 3) {
        endMatch(winnerIndex);
    } else {
        state.currentLeg++;
        initLeg();
    }
}

function endMatch(winnerIndex) {
    const winnerName = state.players[winnerIndex];
    winnerTextEl.textContent = `${winnerName} heeft de wedstrijd gewonnen met ${state.legsWon[0]} - ${state.legsWon[1]}!`;

    renderLegsSummary();
    saveMatchToLocalStorage(winnerName);
    switchScreen(summaryScreen);
}

function renderLegsSummary() {
    legsSummaryContainer.innerHTML = "";
    state.legsHistory.forEach(leg => {
        const div = document.createElement("div");
        div.className = "leg-summary-box";
        div.innerHTML = `
            <strong>Leg ${leg.legNumber}</strong> - Gewonnen door: <strong>${leg.winner}</strong><br>
            <small class="text-muted">
                ${state.players[0]}: ${leg.p1Darts} pijlen (Restscore: ${leg.p1Rest})<br>
                ${state.players[1]}: ${leg.p2Darts} pijlen (Restscore: ${leg.p2Rest})
            </small>
        `;
        legsSummaryContainer.appendChild(div);
    });
}

function updateUI() {
    currentLegNumEl.textContent = state.currentLeg;
    p1LegsEl.textContent = state.legsWon[0];
    p2LegsEl.textContent = state.legsWon[1];

    p1ScoreEl.textContent = state.scores[0];
    p2ScoreEl.textContent = state.scores[1];

    p1DartsEl.textContent = state.dartsThrownInLeg[0];
    p2DartsEl.textContent = state.dartsThrownInLeg[1];

    activePlayerNameEl.textContent = state.players[state.activePlayer];
    lastThrowEl.textContent = state.lastThrowText;

    if (state.activePlayer === 0) {
        player0Box.classList.add("active");
        player1Box.classList.remove("active");
    } else {
        player1Box.classList.add("active");
        player0Box.classList.remove("active");
    }
}

function saveMatchToLocalStorage(winnerName) {
    const history = JSON.parse(localStorage.getItem("darts_history") || "[]");
    const matchData = {
        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        players: [...state.players],
        score: `${state.legsWon[0]} - ${state.legsWon[1]}`,
        winner: winnerName,
        legs: [...state.legsHistory]
    };
    history.unshift(matchData);
    localStorage.setItem("darts_history", JSON.stringify(history));
}

function loadHistoryFromStorage() {
    const history = JSON.parse(localStorage.getItem("darts_history") || "[]");
    if (history.length === 0) {
        historyListEl.innerHTML = `<p class="text-muted">Nog geen gespeelde wedstrijden.</p>`;
        return;
    }

    historyListEl.innerHTML = "";
    history.forEach((match) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <strong>${match.players[0]} vs ${match.players[1]}</strong><br>
            Stand: ${match.score} (Winnaar: ${match.winner})<br>
            <small class="text-muted">${match.date}</small>
        `;
        historyListEl.appendChild(div);
    });
}

// Forceer herladen als de controller wijzigt (handig bij PWA updates)
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
        refreshing = true;
        window.location.reload();
    }
});