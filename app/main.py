from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import app.database

from app.database import SessionLocal
from app.models import Torneo, Jugador, Partido
from app.schemas import CrearTorneoRequest
from app.fixture import FIXTURE
from fastapi import Body
from typing import Optional

app = FastAPI(
    title="Americano Padel",
    version="1.0.0"
)

# Archivos estáticos (CSS y JS)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates HTML
templates = Jinja2Templates(directory="app/templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html"
    )

@app.post("/nuevo_torneo")
def nuevo_torneo(data: CrearTorneoRequest):

    db = SessionLocal()

    try:

        torneo = Torneo(
            nombre=data.nombre_torneo
        )

        db.add(torneo)
        db.commit()
        db.refresh(torneo)

        jugadores_db = []

        for nombre in data.jugadores:

            jugador = Jugador(
                nombre=nombre,
                torneo_id=torneo.id
            )

            db.add(jugador)
            jugadores_db.append(jugador)

        db.commit()

        mapa = {}

        for i, jugador in enumerate(jugadores_db):

            mapa[i + 1] = jugador.id

        for partido in FIXTURE:

            db.add(

                Partido(

                    ronda=partido["ronda"],
                    cancha=partido["cancha"],

                    jugador1_id=mapa[partido["equipo1"][0]],
                    jugador2_id=mapa[partido["equipo1"][1]],
                    jugador3_id=mapa[partido["equipo2"][0]],
                    jugador4_id=mapa[partido["equipo2"][1]],

                    torneo_id=torneo.id

                )

            )

        db.commit()

        return {
            "ok": True,
            "torneo": torneo.id
        }

    finally:

        db.close()


@app.get("/dashboard/{torneo_id}", response_class=HTMLResponse)
def dashboard(request: Request, torneo_id: int):

    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {
            "torneo_id": torneo_id
        }
    )

def calcular_tabla(db, torneo_id):

    jugadores = (
        db.query(Jugador)
        .filter(Jugador.torneo_id == torneo_id)
        .all()
    )

    partidos = (
        db.query(Partido)
        .filter(
            Partido.torneo_id == torneo_id,
            Partido.finalizado == 1
        )
        .all()
    )

    tabla = []

    for jugador in jugadores:

        games = 0

        for partido in partidos:

            if jugador.id in [partido.jugador1_id, partido.jugador2_id]:

                games += partido.games_equipo1

            elif jugador.id in [partido.jugador3_id, partido.jugador4_id]:

                games += partido.games_equipo2

        tabla.append({

            "nombre": jugador.nombre,
            "games": games

        })

    tabla.sort(key=lambda x: x["games"], reverse=True)

    return tabla


@app.get("/api/dashboard/{torneo_id}")
def obtener_dashboard(
    torneo_id: int,
    ronda: Optional[int] = None
):

    db = SessionLocal()
    try:

        torneo = (
            db.query(Torneo)
            .filter(Torneo.id == torneo_id)
            .first()
        )

        jugadores = (
            db.query(Jugador)
            .filter(Jugador.torneo_id == torneo_id)
            .all()
        )

        tabla = calcular_tabla(db, torneo_id)

        # Si no se pasa una ronda, buscar la próxima pendiente
        if ronda is None:

            ronda_actual = (
                db.query(Partido.ronda)
                .filter(
                    Partido.torneo_id == torneo_id,
                    Partido.finalizado == 0
                )
                .order_by(Partido.ronda)
                .first()
            )

            if ronda_actual is None:

                return {

                    "torneo": torneo.nombre,
                    "finalizado": True,
                    "ronda": 7,
                    "partidos": [],
                    "tabla": tabla

                }

            numero_ronda = ronda_actual[0]

        else:

            numero_ronda = ronda

        partidos = (
            db.query(Partido)
            .filter(
                Partido.torneo_id == torneo_id,
                Partido.ronda == numero_ronda
            )
            .order_by(Partido.cancha)
            .all()
        )

        mapa = {}

        for jugador in jugadores:
            mapa[jugador.id] = jugador.nombre

        partidos_json = []

        for partido in partidos:

            partidos_json.append({

                "id": partido.id,

                "cancha": partido.cancha,

                "equipo1": [
                    mapa[partido.jugador1_id],
                    mapa[partido.jugador2_id]
                ],

                "equipo2": [
                    mapa[partido.jugador3_id],
                    mapa[partido.jugador4_id]
                ],

                "games1": partido.games_equipo1,
                "games2": partido.games_equipo2,
                "finalizado": partido.finalizado

            })

        return {

                            "torneo": torneo.nombre,
                            "finalizado": False,
                            "ronda": numero_ronda,
                            "partidos": partidos_json,
                            "tabla": tabla
                        }
    
    finally: 
        db.close()



@app.post("/api/ronda/{torneo_id}")
def guardar_ronda(torneo_id: int, body: dict = Body(...)):

    db = SessionLocal()
    try:  

        ronda = body["ronda"]

        partidos = (
            db.query(Partido)
            .filter(
                Partido.torneo_id == torneo_id,
                Partido.ronda == ronda
            )
            .order_by(Partido.cancha)
            .all()
        )

        for partido, resultado in zip(partidos, body["resultados"]):

            games1 = resultado["games1"]
            games2 = resultado["games2"]

            # No permitir 0-0
            if games1 == 0 and games2 == 0:
                return {
                    "ok": False,
                    "mensaje": "No se puede guardar un partido con resultado 0-0."
                }

            partido.games_equipo1 = games1
            partido.games_equipo2 = games2

            if partido.finalizado == 0:
                partido.finalizado = 1

        db.commit()

        return {
            "ok": True
        }
    finally:
        db.close()

@app.get("/debug/{torneo_id}")
def debug(torneo_id: int):

    db = SessionLocal()

    try:

        partidos = (
            db.query(Partido)
            .filter(Partido.torneo_id == torneo_id)
            .order_by(Partido.ronda, Partido.cancha)
            .all()
        )

        datos = []

        for p in partidos:

            datos.append({

                "ronda": p.ronda,
                "cancha": p.cancha,
                "games1": p.games_equipo1,
                "games2": p.games_equipo2,
                "finalizado": p.finalizado

            })

        return datos
    
    finally:
        db.close()

@app.post("/reiniciar")
def reiniciar():

    db = SessionLocal()

    try:

        db.query(Partido).delete()
        db.query(Jugador).delete()
        db.query(Torneo).delete()

        db.commit()

        return {
            "ok": True
        }
    
    finally:
        db.close()

@app.get("/resultado/{torneo_id}", response_class=HTMLResponse)
async def resultado(request: Request, torneo_id: int):

    return templates.TemplateResponse(
        request=request,
        name="resultado.html"
    )

@app.put("/api/partido/{partido_id}")
def modificar_partido(partido_id: int, body: dict = Body(...)):

    db = SessionLocal()

    try:

        partido = (
            db.query(Partido)
            .filter(Partido.id == partido_id)
            .first()
        )

        partido.games_equipo1 = body["games1"]
        partido.games_equipo2 = body["games2"]

        db.commit()

        return {
            "ok": True
        }
    
    finally:
        db.close()


@app.get("/api/torneos")
def listar_torneos():

    db = SessionLocal()

    try:

        torneos = db.query(Torneo).all()

        resultado = []

        for torneo in torneos:

            pendientes = (
                db.query(Partido)
                .filter(
                    Partido.torneo_id == torneo.id,
                    Partido.finalizado == 0
                )
                .count()
            )

            estado = "🏁 Finalizado"

            if pendientes > 0:
                estado = "🟢 En curso"

            resultado.append({

                "id": torneo.id,
                "nombre": torneo.nombre,
                "estado": estado

            })

        

        return resultado
    
    finally:
        db.close()


@app.get("/live/{torneo_id}", response_class=HTMLResponse)
def live(request: Request, torneo_id: int):

    return templates.TemplateResponse(
        request,
        "live.html",
        {
            "torneo_id": torneo_id
        }
    )