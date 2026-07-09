from pydantic import BaseModel


class CrearTorneoRequest(BaseModel):
    nombre_torneo: str
    jugadores: list[str]