let rondaVisualizada = null;
let rondaActual = 1;
let cargando = false;
let modoEdicion = false;

async function cargarDashboard() {

    if (cargando)
        return;

    cargando = true;

    document.getElementById("guardarRonda").disabled = true;
    document.getElementById("anteriorRonda").disabled = true;
    document.getElementById("siguienteRonda").disabled = true;

    const url = rondaVisualizada
        ? `/api/dashboard/${TORNEO_ID}?ronda=${rondaVisualizada}`
        : `/api/dashboard/${TORNEO_ID}`;

    const response = await fetch(url);
    const data = await response.json();

    // -------------------------
    // TORNEO FINALIZADO
    // -------------------------

    if (data.finalizado) {

        cargando = false;

        window.location.href = `/resultado/${TORNEO_ID}`;
        return;

    }

    rondaVisualizada = data.ronda;
    rondaActual = data.ronda;

    document.getElementById("tituloRonda").innerText =
        `🟢 RONDA ${data.ronda}`;

    document.getElementById("nombreTorneo").innerText =
        data.torneo;

    // -------------------------
    // PARTIDOS
    // -------------------------

    const partidosDiv = document.getElementById("partidos");
    partidosDiv.innerHTML = "";

    data.partidos.forEach((partido) => {

        const bloqueado = partido.finalizado ? "disabled" : "";

        const botonModificar = partido.finalizado
            ? `<button
                    class="editarResultado"
                    data-id="${partido.id}">
                    ✏️ Modificar resultado
            </button>`
            : "";

        partidosDiv.innerHTML += `

    <div class="match-card">

        <h3>🎾 Cancha ${partido.cancha}</h3>

        <div class="team">
            ${partido.equipo1[0]} - ${partido.equipo1[1]}
        </div>

        <div class="vs">VS</div>

        <div class="team">
            ${partido.equipo2[0]} - ${partido.equipo2[1]}
        </div>

        <div class="resultado">

            <input
                type="number"
                min="0"
                max="7"
                class="score local"
                value="${partido.games1}"
                ${bloqueado}
            >

            <span>-</span>

            <input
                type="number"
                min="0"
                max="7"
                class="score visita"
                value="${partido.games2}"
                ${bloqueado}
            >

        </div>

        ${botonModificar}

    </div>

`;

    });

    // -------------------------
    // TABLA
    // -------------------------

    const tablaDiv = document.getElementById("tabla");
    tablaDiv.innerHTML = "";

    data.tabla.forEach((jugador, index) => {

        tablaDiv.innerHTML += `

            <div class="fila-tabla">

                <span>${index + 1}. ${jugador.nombre}</span>

                <strong>${jugador.games}</strong>

            </div>

        `;

    });

    document.getElementById("guardarRonda").disabled = false;
    document.getElementById("anteriorRonda").disabled = false;
    document.getElementById("siguienteRonda").disabled = false;

    cargando = false;

}

cargarDashboard();


// -----------------------------------
// GUARDAR RONDA
// -----------------------------------

document.getElementById("guardarRonda").addEventListener("click", async () => {

    const scores = document.querySelectorAll(".score");

    for (const score of scores) {

        if (score.value === "") {

            alert("Debés completar todos los resultados.");

            return;

        }

    }

    const resultados = [];

    document.querySelectorAll(".match-card").forEach((card, index) => {

        const inputs = card.querySelectorAll(".score");

        resultados.push({

            partido: index + 1,

            games1: Number(inputs[0].value),

            games2: Number(inputs[1].value)

        });

    });

    document.getElementById("guardarRonda").disabled = true;

    await fetch(`/api/ronda/${TORNEO_ID}`, {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            ronda: rondaActual,

            resultados

        })

    });

    // volver automáticamente a la siguiente ronda

    rondaVisualizada = null;

    await cargarDashboard();

});


// -----------------------------------
// REINICIAR
// -----------------------------------

document.getElementById("reiniciarTorneo").addEventListener("click", async () => {

    const confirmar = confirm(
        "⚠️ Se eliminará todo el torneo.\n\n¿Deseás continuar?"
    );

    if (!confirmar)
        return;

    const confirmar2 = confirm(
        "Esta acción NO se puede deshacer.\n\n¿Estás completamente seguro?"
    );

    if (!confirmar2)
        return;

    await fetch("/reiniciar", {

        method: "POST"

    });

    window.location.href = "/";

});


// -----------------------------------
// RONDA ANTERIOR
// -----------------------------------

document.getElementById("anteriorRonda").addEventListener("click", async () => {

    if (cargando)
        return;

    if (rondaVisualizada > 1) {

        rondaVisualizada--;

        await cargarDashboard();

    }

});


// -----------------------------------
// SIGUIENTE RONDA
// -----------------------------------

document.getElementById("siguienteRonda").addEventListener("click", async () => {

    if (cargando)
        return;

    if (rondaVisualizada < 7) {

        rondaVisualizada++;

        await cargarDashboard();

    }

});

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("editarResultado"))
        return;

    modoEdicion = true;

    const card = e.target.closest(".match-card");

    card.querySelectorAll(".score").forEach(input => {

        input.disabled = false;

    });

    e.target.remove();

});

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("guardarCambios"))
        return;

    const card = e.target.closest(".match-card");

    const inputs = card.querySelectorAll(".score");

    const partidoId = e.target.dataset.id;

    await fetch(`/api/partido/${partidoId}`, {

        method: "PUT",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            games1: Number(inputs[0].value),

            games2: Number(inputs[1].value)

        })

    });

    await cargarDashboard();

});