"""
Limpia los datos de PRUEBA de un salón: borra los servicios sin categoría, los
turnos que se sacaron con ellos y resetea la caja.

Por defecto, con --confirm borra:

  1. los servicios con categoria_id NULL del salón
  2. los turnos cuyos servicios son TODOS de esa lista (turnos de prueba),
     junto con sus pagos, comprobantes y filas de turno_servicios
  3. los cierres de caja del salón (reset de caja)

Los turnos MIXTOS (que tienen algún servicio con categoría) NO se borran: se
informan aparte y solo pierden el ítem del servicio borrado.

    # 1) Ver qué se va a borrar (NO borra nada):
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug>

    # 2) Borrar de verdad:
    cd /app && python scripts/borrar_servicios_sin_categoria.py <slug> --confirm

Flags opcionales:
    --con-gastos       borra además los gastos cargados del salón
    --sin-reset-caja   deja los cierres de caja como están
    --solo-servicios   borra solo los servicios (ni turnos ni caja)

Por qué la caja se resetea completa y no por día: el saldo inicial de cada día
sale del fondo_caja del cierre anterior (una cadena), así que borrar cierres
sueltos dejaría los saldos descolgados. Borrando todos, la caja arranca de cero.

OJO: es irreversible.
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
from app.models.gasto import Gasto
from app.models.cierre_caja import CierreCaja
from app.models.empleado_servicio import empleado_servicios


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Borra los servicios sin categoría de un salón, sus turnos de prueba y resetea la caja."
    )
    parser.add_argument("slug", help="slug del salón (ej: bluemoon)")
    parser.add_argument("--confirm", action="store_true",
                        help="ejecuta el borrado; sin este flag solo muestra el informe")
    parser.add_argument("--solo-servicios", action="store_true",
                        help="borra solo los servicios: no toca turnos ni caja")
    parser.add_argument("--sin-reset-caja", action="store_true",
                        help="no borra los cierres de caja")
    parser.add_argument("--con-gastos", action="store_true",
                        help="borra además los gastos cargados del salón")
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
        borra_turnos = not args.solo_servicios
        resetea_caja = borra_turnos and not args.sin_reset_caja

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

        # ── Informe ───────────────────────────────────────────────────────────
        print(f"\n1) Servicios sin categoría a borrar ({len(servicios)}):")
        for s in servicios:
            usos = sum(1 for f in filas if f.servicio_id == s.id)
            print(f"   - [id={s.id}] {s.nombre} — ${s.precio} / {s.duracion_minutos} min — {usos} turno(s)")

        pagos_n = comprobantes_n = 0
        if turnos_prueba:
            pagos_n = db.query(Pago).filter(Pago.turno_id.in_(turnos_prueba)).count()
            comprobantes_n = db.query(Comprobante).filter(
                Comprobante.turno_id.in_(turnos_prueba)).count()

        print("\n2) Turnos:")
        if borra_turnos:
            print(f"   - turnos de prueba que SE BORRAN:   {len(turnos_prueba)}")
            print(f"     · sus pagos:                      {pagos_n}")
            print(f"     · sus comprobantes:               {comprobantes_n}")
            if turnos_prueba:
                fechas = db.query(Turno.fecha_hora).filter(
                    Turno.id.in_(turnos_prueba)).order_by(Turno.fecha_hora).all()
                print(f"     · rango de fechas:                {fechas[0][0]} → {fechas[-1][0]}")
        else:
            print(f"   - turnos de prueba: {len(turnos_prueba)} → NO se borran (--solo-servicios)")
        print(f"   - turnos mixtos (se conservan):     {len(turnos_mixtos)}")
        if turnos_mixtos:
            print(f"     · pierden el ítem del servicio borrado: {sorted(turnos_mixtos)}")

        # Turnos del salón que NO se tocan, para que se vea qué sobrevive
        total_turnos = db.query(Turno).filter(Turno.salon_id == salon.id).count()
        print(f"   - turnos del salón que quedan:      "
              f"{total_turnos - (len(turnos_prueba) if borra_turnos else 0)} de {total_turnos}")

        cierres = db.query(CierreCaja).filter(CierreCaja.salon_id == salon.id) \
                    .order_by(CierreCaja.fecha).all()
        gastos_n = db.query(Gasto).filter(Gasto.salon_id == salon.id).count()

        print("\n3) Caja:")
        if resetea_caja:
            print(f"   - cierres de caja que SE BORRAN:    {len(cierres)}")
            if cierres:
                print(f"     · rango de fechas:                {cierres[0].fecha} → {cierres[-1].fecha}")
        else:
            print(f"   - cierres de caja: {len(cierres)} → NO se borran")
        if args.con_gastos:
            print(f"   - gastos que SE BORRAN:             {gastos_n}")
        else:
            print(f"   - gastos: {gastos_n} → NO se borran (usá --con-gastos si también son de prueba)")

        if not args.confirm:
            print("\n── DRY RUN ── No se borró nada.")
            extras = "".join([
                " --solo-servicios" if args.solo_servicios else "",
                " --sin-reset-caja" if args.sin_reset_caja else "",
                " --con-gastos" if args.con_gastos else "",
            ])
            print("Revisá la lista de arriba. Si está bien, repetí con --confirm:")
            print(f"  python scripts/borrar_servicios_sin_categoria.py {args.slug}{extras} --confirm")
            return 0

        # ── Borrado real ──────────────────────────────────────────────────────
        # Orden obligatorio: primero las filas hijas (FK), después los padres.
        borr = {}
        if borra_turnos and turnos_prueba:
            borr["pagos"] = db.query(Pago).filter(
                Pago.turno_id.in_(turnos_prueba)).delete(synchronize_session=False)
            borr["comprobantes"] = db.query(Comprobante).filter(
                Comprobante.turno_id.in_(turnos_prueba)).delete(synchronize_session=False)
            borr["turno_servicios (de esos turnos)"] = db.query(TurnoServicio).filter(
                TurnoServicio.turno_id.in_(turnos_prueba)).delete(synchronize_session=False)
            borr["turnos"] = db.query(Turno).filter(
                Turno.id.in_(turnos_prueba),
                Turno.salon_id == salon.id,
            ).delete(synchronize_session=False)

        if resetea_caja:
            borr["cierres_caja"] = db.query(CierreCaja).filter(
                CierreCaja.salon_id == salon.id).delete(synchronize_session=False)
        if args.con_gastos:
            borr["gastos"] = db.query(Gasto).filter(
                Gasto.salon_id == salon.id).delete(synchronize_session=False)

        borr["empleado_servicios"] = db.execute(
            empleado_servicios.delete().where(empleado_servicios.c.servicio_id.in_(ids))
        ).rowcount
        # Lo que quede apuntando a los servicios (turnos mixtos)
        borr["turno_servicios (restantes)"] = db.query(TurnoServicio).filter(
            TurnoServicio.servicio_id.in_(ids)).delete(synchronize_session=False)
        borr["servicios"] = db.query(Servicio).filter(
            Servicio.id.in_(ids),
            Servicio.salon_id == salon.id,
        ).delete(synchronize_session=False)

        db.commit()

        print("\n✓ Borrado hecho:")
        for k, v in borr.items():
            print(f"   - {k}: {v}")
        if resetea_caja:
            print("\nLa caja quedó en cero: el próximo día abre con saldo anterior 0.")
        return 0
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error, se hizo rollback (no se borró nada): {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
