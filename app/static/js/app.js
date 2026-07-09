console.log("INDEX JS CARGADO");
const players = document.getElementById("players");

for (let i = 1; i <= 8; i++) {

    players.innerHTML += `
        <label>Jugador ${i}</label>

        <input
            id="jugador${i}"
            type="text"
            placeholder="Nombre del jugador ${i}"
            required
        >
    `;

}

const form = document.getElementById("torneoForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const jugadores = [];

    for (let i = 1; i <= 8; i++) {

        jugadores.push(
            document.getElementById(`jugador${i}`).value
        );

    }

    const response = await fetch("/nuevo_torneo", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            nombre_torneo: document.getElementById("nombreTorneo").value,
            jugadores: jugadores

        })

    });

    const data = await response.json();

    window.location.href = `/dashboard/${data.torneo}`;

});

async function cargarTorneos() {

    const response = await fetch("/api/torneos");
    const torneos = await response.json();

    const div = document.getElementById("listaTorneos");

    div.innerHTML = "";

    if (torneos.length === 0) {

        div.innerHTML = "<p>No hay torneos creados.</p>";
        return;

    }

    torneos.forEach(torneo => {

        div.innerHTML += `

            <div class="card-torneo">

                <h3>${torneo.nombre}</h3>

                <p>${torneo.estado}</p>

                <button onclick="window.location='/dashboard/${torneo.id}'">
                    Abrir
                </button>

            </div>

        `;

    });

}

window.addEventListener("load", cargarTorneos);