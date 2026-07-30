"""
Borra los servicios SIN categoría de un salón y los turnos de prueba que se
sacaron con ellos.

Los servicios sin categoría quedaron sueltos al migrar a categorías y los turnos
que los usan fueron pruebas. Por defecto este script borra:

  - los servicios con categoria_id NULL del salón
  - los turnos cuyos servicios son TODOS de esa lista (turnos de prueba),
    junto con sus pagos, comprobantes y filas de turno_servicios

Los turnos MIXTOS (que tienen algún servicio con categoría) no se borran: se
informan aparte y solo pierden el ítem del servicio borrado.

    # 1) Ver qué se va a borrar (NO borra nada):
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug>

    # 2) Borrar de verdad:
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug> --confirm

    # Variante: borrar solo los servicios y dejar los turnos donde estaban
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug> --solo-servicios --confirm

OJO: es irreversible. Los cierres de caja ya hechos (tabla cierres_caja) guardan
sus totales y NO se recalculan, así que un día ya cerrado va a seguir mostrando
los montos de antes; los días sin cerrar se recalculan y bajan.
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
from app.models.pago import Pago
from app.models.comprobante import Comprobante
from app.models.empleado_servicio import empleado_servicios


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Borra los servicios sin categoría de un salón y sus turnos de prueba."
    )
    parser.add_argument("slug", help="slug del salón (ej: bluemoon)")
    parser.add_argument("--confirm", action="store_true",
                        help="ejecuta el borrado; sin este flag solo muestra el informe")
    parser.add_argument("--solo-servicios", action="store_true",
                        help="no borra turnos: solo los servicios (los turnos quedan sin ese ítem)")
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

        filas = db.query(TurnoServicio).filter(TurnoServicio.servicio_id.in_(ids)).all()
        turnos_afectados = {f.turno_id for f in filas}

        # Turnos de prueba = todos sus servicios están en la lista a borrar.
        # Turnos mixtos = les queda algún servicio con categoría.
        turnos_prueba, turnos_mixtos = set(), set()
        for turno_id in turnos_afectados:
            restantes = db.query(TurnoServicio).filter(
                TurnoServicio.turno_id == turno_id,
                ~TurnoServicio.servicio_id.in_(ids),
            ).count()
            (turnos_mixtos if restantes else turnos_prueba).add(turno_id)

        borra_turnos = not args.solo_servicios

        print(f"\nServicios sin categoría a borrar ({len(servicios)}):")
        for s in servicios:
            usos = sum(1 for f in filas if f.servicio_id == s.id)
            print(f"  - [id={s.id}] {s.nombre} — ${s.precio} / {s.duracion_minutos} min — {usos} turno(s)")

        pagos_n = comprobantes_n = 0
        if turnos_prueba:
            pagos_n = db.query(Pago).filter(Pago.turno_id.in_(turnos_prueba)).count()
            comprobantes_n = db.query(Comprobante).filter(
                Comprobante.turno_id.in_(turnos_prueba)
            ).count()

        print("\nTurnos:")
        if borra_turnos:
            print(f"  - turnos de prueba que SE BORRAN:      {len(turnos_prueba)}")
            print(f"    · sus pagos que se borran:           {pagos_n}")
            print(f"    · sus comprobantes que se borran:    {comprobantes_n}")
        else:
            print(f"  - turnos de prueba (--solo-servicios): {len(turnos_prueba)} → NO se borran")
        print(f"  - turnos mixtos (con servicio con categoría, se conservan): {len(turnos_mixtos)}")
        if turnos_mixtos:
            print(f"    · pierden el ítem del servicio borrado: {sorted(turnos_mixtos)}")

        if turnos_prueba and borra_turnos:
            fechas = db.query(Turno.fecha_hora).filter(Turno.id.in_(turnos_prueba)) \
                       .order_by(Turno.fecha_hora).all()
            if fechas:
                print(f"  - rango de fechas de los turnos a borrar: "
                      f"{fechas[0][0]} → {fechas[-1][0]}")

        if not args.confirm:
            print("\n── DRY RUN ── No se borró nada.")
            extra = " --solo-servicios" if args.solo_servicios else ""
            print("Para borrar de verdad, repetí el comando con --confirm:")
            print(f"  python scripts/borrar_servicios_sin_categoria.py {args.slug}{extra} --confirm")
            return 0

        # ── Borrado real ──────────────────────────────────────────────────────
        # Orden obligatorio: primero las filas hijas (FK), después los padres.
        borr = {}
        if borra_turnos and turnos_prueba:
            borr["pagos"] = db.query(Pago).filter(
                Pago.turno_id.in_(turnos_prueba)
            ).delete(synchronize_session=False)
            borr["comprobantes"] = db.query(Comprobante).filter(
                Comprobante.turno_id.in_(turnos_prueba)
            ).delete(synchronize_session=False)
            borr["turno_servicios (de esos turnos)"] = db.query(TurnoServicio).filter(
                TurnoServicio.turno_id.in_(turnos_prueba)
            ).delete(synchronize_session=False)
            borr["turnos"] = db.query(Turno).filter(
                Turno.id.in_(turnos_prueba),
                Turno.salon_id == salon.id,
            ).delete(synchronize_session=False)

        borr["empleado_servicios"] = db.execute(
            empleado_servicios.delete().where(empleado_servicios.c.servicio_id.in_(ids))
        ).rowcount
        # Lo que quede apuntando a los servicios (turnos mixtos)
        borr["turno_servicios (restantes)"] = db.query(TurnoServicio).filter(
            TurnoServicio.servicio_id.in_(ids)
        ).delete(synchronize_session=False)
        borr["servicios"] = db.query(Servicio).filter(
            Servicio.id.in_(ids),
            Servicio.salon_id == salon.id,
        ).delete(synchronize_session=False)

        db.commit()

        print("\n✓ Borrado hecho:")
        for k, v in borr.items():
            print(f"  - {k}: {v}")
        return 0
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error, se hizo rollback (no se borró nada): {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
