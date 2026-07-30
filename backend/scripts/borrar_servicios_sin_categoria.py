"""
Borra los servicios SIN categoría de un salón.

Los servicios sin categoría no se muestran agrupados en la reserva y quedaron
sueltos al migrar a categorías. Este script los elimina de verdad (DELETE),
incluidas sus filas en turno_servicios (el historial de turnos) y en
empleado_servicios, que son las que impiden el borrado por clave foránea.

    # 1) Ver qué se va a borrar (NO borra nada):
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug>

    # 2) Borrar de verdad:
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug> --confirm

OJO: es irreversible y toca el historial. Los turnos NO se borran, pero los que
solo tenían servicios eliminados quedan sin detalle de servicios y, si no
tienen monto_total guardado (reservas sin seña), la caja los va a calcular en
$0. Los pagos ya cobrados (tabla pagos) no se tocan: la plata cobrada sigue
figurando en caja. El script te dice cuántos turnos quedan así ANTES de borrar.
"""
import argparse
import os
import sys

# Ejecutado como `python scripts/xxx.py`, sys.path apunta a scripts/, no a /app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models.salon import Salon
from app.models.servicio import Servicio
from app.models.turno import Turno
from app.models.turno_servicio import TurnoServicio
from app.models.empleado_servicio import empleado_servicios


def main() -> int:
    parser = argparse.ArgumentParser(description="Borra los servicios sin categoría de un salón.")
    parser.add_argument("slug", help="slug del salón (ej: bluemoon)")
    parser.add_argument("--confirm", action="store_true",
                        help="ejecuta el borrado; sin este flag solo muestra el informe")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        salon = db.query(Salon).filter(Salon.slug == args.slug).first()
        if not salon:
            print(f"✗ No existe un salón con slug '{args.slug}'.")
            return 1

        servicios = db.query(Servicio).filter(
            Servicio.salon_id == salon.id,
            Servicio.categoria_id.is_(None),
        ).order_by(Servicio.nombre).all()

        print(f"Salón: {salon.nombre} (slug={salon.slug}, id={salon.id})")

        if not servicios:
            print("✓ No hay servicios sin categoría. Nada que borrar.")
            return 0

        ids = [s.id for s in servicios]

        # Turnos que referencian estos servicios
        filas = db.query(TurnoServicio).filter(TurnoServicio.servicio_id.in_(ids)).all()
        turnos_afectados = {f.turno_id for f in filas}

        # De esos turnos, los que se quedan SIN ningún servicio
        turnos_vacios = set()
        for turno_id in turnos_afectados:
            restantes = db.query(TurnoServicio).filter(
                TurnoServicio.turno_id == turno_id,
                ~TurnoServicio.servicio_id.in_(ids),
            ).count()
            if restantes == 0:
                turnos_vacios.add(turno_id)

        # De los que quedan vacíos, los que ADEMÁS no tienen monto_total guardado
        # son los que la caja va a calcular en $0.
        turnos_en_cero = 0
        if turnos_vacios:
            turnos_en_cero = db.query(Turno).filter(
                Turno.id.in_(turnos_vacios),
                Turno.monto_total.is_(None),
            ).count()

        print(f"\nServicios sin categoría a borrar ({len(servicios)}):")
        for s in servicios:
            usos = sum(1 for f in filas if f.servicio_id == s.id)
            print(f"  - [id={s.id}] {s.nombre} — ${s.precio} / {s.duracion_minutos} min — {usos} turno(s)")

        print(f"\nImpacto en el historial:")
        print(f"  - filas de turno_servicios que se borran: {len(filas)}")
        print(f"  - turnos afectados (NO se borran):        {len(turnos_afectados)}")
        print(f"  - turnos que quedan sin ningún servicio:  {len(turnos_vacios)}")
        print(f"  - de esos, los que la caja calculará $0:  {turnos_en_cero}")
        print(f"  - pagos ya cobrados: intactos (no se tocan)")

        if not args.confirm:
            print("\n── DRY RUN ── No se borró nada.")
            print(f"Para borrar de verdad, repetí el comando con --confirm:")
            print(f"  python scripts/borrar_servicios_sin_categoria.py {args.slug} --confirm")
            return 0

        # ── Borrado real ──────────────────────────────────────────────────────
        # Orden obligatorio: primero las filas hijas (FK), después los servicios.
        borradas_emp = db.execute(
            empleado_servicios.delete().where(empleado_servicios.c.servicio_id.in_(ids))
        ).rowcount
        borradas_ts = db.query(TurnoServicio).filter(
            TurnoServicio.servicio_id.in_(ids)
        ).delete(synchronize_session=False)
        borrados_sv = db.query(Servicio).filter(
            Servicio.id.in_(ids),
            Servicio.salon_id == salon.id,
        ).delete(synchronize_session=False)
        db.commit()

        print("\n✓ Borrado hecho:")
        print(f"  - empleado_servicios: {borradas_emp}")
        print(f"  - turno_servicios:    {borradas_ts}")
        print(f"  - servicios:          {borrados_sv}")
        return 0
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error, se hizo rollback (no se borró nada): {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
