from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Torneo(Base):
    __tablename__ = "torneos"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)

    jugadores = relationship("Jugador", back_populates="torneo")
    partidos = relationship("Partido", back_populates="torneo")


class Jugador(Base):
    __tablename__ = "jugadores"

    id = Column(Integer, primary_key=True)

    nombre = Column(String, nullable=False)

    puntos = Column(Integer, default=0)

    torneo_id = Column(Integer, ForeignKey("torneos.id"))

    torneo = relationship("Torneo", back_populates="jugadores")


class Partido(Base):
    __tablename__ = "partidos"

    id = Column(Integer, primary_key=True)

    ronda = Column(Integer, nullable=False)
    cancha = Column(Integer, nullable=False)

    jugador1_id = Column(Integer, ForeignKey("jugadores.id"))
    jugador2_id = Column(Integer, ForeignKey("jugadores.id"))
    jugador3_id = Column(Integer, ForeignKey("jugadores.id"))
    jugador4_id = Column(Integer, ForeignKey("jugadores.id"))

    games_equipo1 = Column(Integer, default=0)
    games_equipo2 = Column(Integer, default=0)

    finalizado = Column(Integer, default=0)

    torneo_id = Column(Integer, ForeignKey("torneos.id"))

    torneo = relationship("Torneo", back_populates="partidos")