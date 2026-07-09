async function cargarResultado(){

    const response = await fetch(`/api/dashboard/${TORNEO_ID}`);

    const data = await response.json();

    document.getElementById("nombreTorneo").innerText = data.torneo;

    const podio = document.getElementById("podio");

    podio.innerHTML = `

<div class="podio">

    <div class="puesto plata">

        <h2>🥈</h2>

        <h3>${data.tabla[1].nombre}</h3>

        <p>${data.tabla[1].games} Games</p>

    </div>

    <div class="puesto oro">

        <h1>🏆</h1>

        <h2>${data.tabla[0].nombre}</h2>

        <strong>${data.tabla[0].games} Games</strong>

    </div>

    <div class="puesto bronce">

        <h2>🥉</h2>

        <h3>${data.tabla[2].nombre}</h3>

        <p>${data.tabla[2].games} Games</p>

    </div>

</div>

`;

    const tabla=document.getElementById("tablaFinal");

    tabla.innerHTML="";

    data.tabla.forEach((jugador,index)=>{

        tabla.innerHTML+=`

        <div class="fila-tabla">

            <span>${index+1}. ${jugador.nombre}</span>

            <strong>${jugador.games}</strong>

        </div>

        `;

    });

}

cargarResultado();

document.getElementById("nuevoTorneo").addEventListener("click",()=>{

    window.location.href="/";

});