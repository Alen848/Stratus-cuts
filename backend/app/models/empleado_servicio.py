from sqlalchemy import Table, Column, Integer, ForeignKey, Time
from app.database.connection import Base

# Relación muchos-a-muchos: qué servicios realiza cada profesional.
# Un empleado SIN filas en esta tabla se interpreta como "hace todos los
# servicios" (compatibilidad con salones que no configuran esto).
empleado_servicios = Table(
    "empleado_servicios",
    Base.metadata,
    Column("empleado_id", Integer, ForeignKey("empleados.id", ondelete="CASCADE"), primary_key=True),
    Column("servicio_id", Integer, ForeignKey("servicios.id", ondelete="CASCADE"), primary_key=True),
    # Hasta qué hora el profesional toma ESTE servicio (NULL = su horario normal).
    # Ej.: el día de depilación una empleada solo puede hasta las 15.
    Column("hora_limite", Time, nullable=True),
)
