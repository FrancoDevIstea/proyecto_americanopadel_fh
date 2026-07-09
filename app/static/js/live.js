cargarDashboard();

// Actualizar automáticamente cada 2 segundos
setInterval(async () => {

    if (cargando)
        return;

    // Solo actualizar automáticamente si está viendo la ronda actual
    if (rondaVisualizada === rondaActual) {

        rondaVisualizada = null;
        await cargarDashboard();

    }

}, 2000);


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

    if (rondaVisualizada < rondaActual) {

        rondaVisualizada++;

        await cargarDashboard();

    }

});
