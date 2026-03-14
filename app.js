// ── Helpers ───────────────────────────────────────────────────────────────────

function calcSum(g) {
    return g.rulebook + g.replayability + g.fun + g.strategy + g.interaction;
}

function badgeColor(score) {
    if (score >= 9) return "success";
    if (score >= 7) return "primary";
    if (score >= 5) return "warning";
    return "danger";
}

function ratingBadge(score) {
    return `<span class="badge bg-${badgeColor(score)} fs-6 px-2">${score}</span>`;
}

function sumBadge(sum) {
    if (sum >= 45) return `<span class="badge bg-success fs-5 px-3">${sum}</span>`;
    if (sum >= 35) return `<span class="badge bg-primary fs-5 px-3">${sum}</span>`;
    if (sum >= 25) return `<span class="badge bg-warning text-dark fs-5 px-3">${sum}</span>`;
    return `<span class="badge bg-danger fs-5 px-3">${sum}</span>`;
}

// ── Render ────────────────────────────────────────────────────────────────────

function ratingWithButtons(value, gameIndex, ratingField) {
    return `<div class="d-flex align-items-center justify-content-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="adjustRating(${gameIndex}, '${ratingField}', -1)" title="Decrease">
            <i class="bi bi-dash-lg"></i>
        </button>
        ${ratingBadge(value)}
        <button class="btn btn-sm btn-outline-secondary" onclick="adjustRating(${gameIndex}, '${ratingField}', 1)" title="Increase">
            <i class="bi bi-plus-lg"></i>
        </button>
    </div>`;
}

function adjustRating(gameIndex, ratingField, delta) {
    const newValue = Math.min(10, Math.max(1, games[gameIndex][ratingField] + delta));
    games[gameIndex][ratingField] = newValue;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById("gameTableBody");
    if (games.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-3 d-block mb-2"></i>No games yet. Click <strong>Add Game</strong> to get started.
                </td>
            </tr>`;
    } else {
        tbody.innerHTML = games.map((g, i) => `
            <tr>
                <td>${g.date}</td>
                <td class="fw-semibold">${g.name}</td>
                <td><i class="bi bi-people me-1 text-muted"></i>${g.players}</td>
                <td><i class="bi bi-clock me-1 text-muted"></i>${g.playtime}</td>
                <td>${g.age}</td>
                <td class="text-center">${ratingWithButtons(g.rulebook, i, 'rulebook')}</td>
                <td class="text-center">${ratingWithButtons(g.replayability, i, 'replayability')}</td>
                <td class="text-center">${ratingWithButtons(g.fun, i, 'fun')}</td>
                <td class="text-center">${ratingWithButtons(g.strategy, i, 'strategy')}</td>
                <td class="text-center">${ratingWithButtons(g.interaction, i, 'interaction')}</td>
                <td class="text-center fw-bold">${sumBadge(calcSum(g))}</td>
                <td>${g.notes ? `<small class="text-muted">${g.notes}</small>` : '<small class="text-muted text-opacity-50">—</small>'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteGame(${i})" title="Remove game">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    renderDataExport();
}

function deleteGame(index) {
    if (confirm(`Remove "${games[index].name}" from the list?`)) {
        games.splice(index, 1);
        renderTable();
    }
}

// ── Data export panel ─────────────────────────────────────────────────────────

function renderDataExport() {
    const section = document.getElementById("dataExportSection");
    const pre = document.getElementById("dataExportPre");

    if (games.length === 0) {
        section.classList.add("d-none");
        return;
    }

    const entries = games.map(g => {
        return [
            "    {",
            `        date: "${g.date}",`,
            `        name: "${g.name}",`,
            `        players: "${g.players}",`,
            `        playtime: "${g.playtime}",`,
            `        age: "${g.age}",`,
            `        rulebook: ${g.rulebook},`,
            `        replayability: ${g.replayability},`,
            `        fun: ${g.fun},`,
            `        strategy: ${g.strategy},`,
            `        interaction: ${g.interaction},`,
            `        notes: "${(g.notes || '').replace(/"/g, '\\"')}"`,
            "    }"
        ].join("\n");
    }).join(",\n");

    pre.textContent = `const games = [\n${entries}\n];`;
    section.classList.remove("d-none");
}

document.getElementById("copyDataBtn").addEventListener("click", () => {
    const text = document.getElementById("dataExportPre").textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("copyDataBtn");
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
        btn.classList.replace("btn-outline-secondary", "btn-success");
        setTimeout(() => {
            btn.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
            btn.classList.replace("btn-success", "btn-outline-secondary");
        }, 2000);
    }).catch(() => {
        const btn = document.getElementById("copyDataBtn");
        btn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Failed';
        btn.classList.replace("btn-outline-secondary", "btn-danger");
        setTimeout(() => {
            btn.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
            btn.classList.replace("btn-danger", "btn-outline-secondary");
        }, 2000);
    });
});

// ── Live sum preview in modal ─────────────────────────────────────────────────

function updateModalSum() {
    const ids = ["inputRulebook", "inputReplayability", "inputFun", "inputStrategy", "inputInteraction"];
    const values = ids.map(id => parseInt(document.getElementById(id).value, 10) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    document.getElementById("modalSum").textContent = sum > 0 ? sum : "—";
}

// ── Save game ─────────────────────────────────────────────────────────────────

document.getElementById("saveGameBtn").addEventListener("click", () => {
    const form = document.getElementById("addGameForm");
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const getRating = id => {
        const val = parseInt(document.getElementById(id).value, 10);
        return Math.min(10, Math.max(1, val));
    };

    games.push({
        date:          document.getElementById("inputDate").value,
        name:          document.getElementById("inputName").value.trim(),
        players:       document.getElementById("inputPlayers").value.trim(),
        playtime:      document.getElementById("inputPlaytime").value.trim(),
        age:           document.getElementById("inputAge").value.trim(),
        rulebook:      getRating("inputRulebook"),
        replayability: getRating("inputReplayability"),
        fun:           getRating("inputFun"),
        strategy:      getRating("inputStrategy"),
        interaction:   getRating("inputInteraction"),
        notes:         document.getElementById("inputNotes").value.trim()
    });

    renderTable();

    // Reset & close
    form.reset();
    form.classList.remove("was-validated");
    document.getElementById("modalSum").textContent = "—";
    bootstrap.Modal.getInstance(document.getElementById("addGameModal")).hide();
});

document.querySelectorAll(".rating-input").forEach(input => {
    input.addEventListener("input", updateModalSum);
});

// ── Boot ──────────────────────────────────────────────────────────────────────

renderTable();
