let rondaVisualizada = null;
let rondaActual = 1;
let cargando = false;

async function cargarDashboard() {

    if (cargando)
        return;

    cargando = true;

    document.getElementById("anteriorRonda").disabled = true;
    document.getElementById("siguienteRonda").disabled = true;

    const url = rondaVisualizada
        ? `/api/dashboard/${TORNEO_ID}?ronda=${rondaVisualizada}`
        : `/api/dashboard/${TORNEO_ID}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.finalizado) {

        window.location.href = `/resultado/${TORNEO_ID}`;
        return;

    }

    rondaActual = data.ronda

    if (rondaVisualizada === null)
        rondaVisualizada = data.ronda;

    document.getElementById("tituloRonda").innerText =
        `🟢 RONDA ${rondaVisualizada}`;

    document.getElementById("nombreTorneo").innerText =
        data.torneo;

    const partidosDiv = document.getElementById("partidos");
    partidosDiv.innerHTML = "";

    data.partidos.forEach(partido => {

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
                    class="score"
                    type="number"
                    value="${partido.games1}"
                    disabled
                >

                <span>-</span>

                <input
                    class="score"
                    type="number"
                    value="${partido.games2}"
                    disabled
                >

            </div>

        </div>

        `;

    });

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

    document.getElementById("anteriorRonda").disabled = false;
    document.getElementById("siguienteRonda").disabled = false;

    cargando = false;

}

cargarDashboard();

setInterval(async () => {

    if (cargando)
        return;

    // Solo actualizar automáticamente si está viendo la ronda actual
    if (rondaVisualizada === rondaActual) {

        rondaVisualizada = null;

        await cargarDashboard();

    }

}, 2000);

document.getElementById("anteriorRonda").addEventListener("click", async () => {

    if (cargando)
        return;

        if (rondaVisualizada > 1) {

            rondaVisualizada--;

            await cargarDashboard();

        }

});

document.getElementById("siguienteRonda").addEventListener("click", async () => {

    if (cargando)
        return;

        if (rondaVisualizada < rondaActual) {

            rondaVisualizada++;

            await cargarDashboard();

        }

});