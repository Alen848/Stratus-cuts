"""
Sincronización de turnos con un Google Sheet (pedido de marketing de Blue Moon).

Por qué no es un webhook más: cada salón tiene UNA sola `webhook_url`, y la de
Blue Moon ya la usa el sistema de otro programador (contrato cerrado). Además
el webhook no avisa cobros, pagos ni reservas abandonadas, que es justo lo que
marketing necesita para medir cierres. Este módulo escribe directo en el Sheet
con la API de Google y no toca nada del contrato de `/integracion/*`.

Las pestañas y las columnas son las que ya armó marketing en su Sheet
("12Blue_Moon_Performance_Ventas"), y los valores salen de su pestaña LISTAS
para que sus fórmulas y su Dashboard los entiendan:
  - TURNOS VENTAS: una fila por turno, que se busca por "ID turno" y se
    reescribe (upsert). Los turnos borrados no desaparecen: quedan marcados.
  - WEBHOOK_LOG: una fila por evento, el historial.

Las columnas se mapean POR NOMBRE de encabezado, no por posición, así que
marketing puede reordenar o sumar columnas. Hay dos tipos:
  - Del turnero (COLUMNAS_TURNOS): se reescriben en cada evento.
  - De marketing (SOLO_AL_CREAR: Origen, Anuncio, Atribución, Notas): las
    completan a mano. Solo les ponemos un valor inicial al crear la fila y
    después NUNCA las tocamos.

Diseño defensivo (mismo criterio que webhook_service):
  - Opt-in por salón (`sheets_activo` + `sheets_spreadsheet_id`) y requiere la
    cuenta de servicio global (env GOOGLE_SERVICE_ACCOUNT_JSON). Sin eso no
    pasa nada.
  - La fila se arma en el hilo del request (los datos están cargados) y la
    escritura la hace UN solo hilo de fondo, en orden: dos eventos del mismo
    turno nunca compiten por crear la fila. Alcanza porque el backend corre
    en un único proceso (ver Dockerfile).
  - Nunca lanza: un Sheet caído o sin permiso jamás rompe un turno. Sin
    reintentos por evento; la resincronización nocturna completa corrige lo
    que se haya perdido en el día.

Autenticación: firmamos el JWT de la cuenta de servicio con python-jose (ya es
dependencia) y lo cambiamos por un access token. Sin librerías nuevas.
"""
import asyncio
import json
import logging
import os
import queue
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session, joinedload

from app.database.connection import SessionLocal
from app.models.config_salon import ConfigSalon
from app.models.servicio import Servicio
from app.models.turno import Turno
from app.models.turno_servicio import TurnoServicio

log = logging.getLogger(__name__)

ARG_TZ = timezone(timedelta(hours=-3))
TAB_TURNOS = "TURNOS VENTAS"
TAB_LOG = "WEBHOOK_LOG"

_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
_TOKEN_URL = "https://oauth2.googleapis.com/token"
_API = "https://sheets.googleapis.com/v4/spreadsheets"
_TIMEOUT_SEG = 20
_LOTE = 500  # filas por request en la importación (límites de payload de Google)

# Hora (Argentina) de la resincronización completa diaria
HORA_RESYNC = int(os.getenv("SHEETS_RESYNC_HORA", "4"))

# ── Columnas (nombres exactos del Sheet de marketing) ─────────────────────────
COL_ID = "ID turno"
COLUMNAS_TURNOS = [
    "Fecha turno", "Cliente ID", "Servicio", "Estado turno",
    "Seña confirmada ARS", "Seña pendiente ARS", "Saldo mostrado ARS",
    "Valor servicio ARS", "Asistió", "Venta", COL_ID, "Teléfono cliente",
    "Fecha creación", "Profesional", "Estado seña", "Estado webhook",
    "Evento webhook", "Actualizado webhook", "HMAC verificada",
    "Estado raw turnero", "Webhook/API", "Error técnico",
]
# Columnas manuales de marketing: valor inicial al crear la fila, nunca más.
# No se agregan si el Sheet no las tiene.
SOLO_AL_CREAR = ["Origen", "Anuncio", "Atribución a pauta", "Notas"]

COL_ID_LOG = "id_turno"
COLUMNAS_LOG = [
    "received_at", "event_id", "evento_turnero", COL_ID_LOG, "cliente_id",
    "telefono_cliente", "fecha_creacion", "fecha_turno", "servicio",
    "profesional", "estado_turno_raw", "importe_sena", "estado_sena",
    "valor_total_servicio", "asistencia", "cancelacion",
    "turno_completado_venta", "firma_hmac_ok", "payload_json",
    "procesado_turnos_ventas", "error", "observaciones",
]

# ── Vocabulario de la pestaña LISTAS ──────────────────────────────────────────
ESTADO_TURNO = {                       # LISTAS → ESTADO_TURNO
    "pendiente":      "Pendiente",
    "pendiente_pago": "Pendiente pago",
    "confirmado":     "Confirmado",
    "completado":     "Completado",
    "cancelado":      "Cancelado",
    "no_show":        "No show",
    "expirado":       "Expirado",
    "abandonada":     "Expirado",      # hold de la seña vencido (el turno se borra)
    "eliminado":      "Cancelado",     # borrado desde el admin; el raw dice "eliminado"
}
ESTADO_SENA = {                        # LISTAS → ESTADO_SEÑA
    "no_aplica": "No aplica",
    "pendiente": "Pendiente",
    "pagada":    "Pagada",
    "anulada":   "Vencida",
}
# LISTAS → SERVICIOS. Se elige por palabra clave en la categoría del servicio
# (o en su nombre si no tiene categoría). El nombre exacto va en "Notas".
SERVICIOS = [
    ("depil", "Depilación"),
    ("masaj", "Masajes"),
    ("facial", "Faciales"),
    ("cosmetolog", "Faciales"),
    ("pestan", "Pestañas"),
    ("ceja", "Perfilado / Cejas"),
    ("perfilad", "Perfilado / Cejas"),
]
PENDIENTE_VALIDAR = "Pendiente validar"

# Estados en los que el turno ya no se va a cobrar
_SIN_COBRO = ("cancelado", "no_show", "expirado", "abandonada", "eliminado")


class SheetsError(Exception):
    pass


def _ahora():
    return datetime.now(ARG_TZ).replace(tzinfo=None)


def _fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M") if dt else ""


# ─── Credenciales de la cuenta de servicio ────────────────────────────────────

_token_cache = {"token": None, "vence": 0.0}
_token_lock = threading.Lock()


def _credenciales():
    """
    GOOGLE_SERVICE_ACCOUNT_JSON acepta el JSON entero (cómodo en Docker) o la
    ruta al archivo. Devuelve None si no está configurada o es inválida.
    """
    raw = (os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or "").strip()
    if not raw:
        return None
    try:
        if not raw.startswith("{"):
            with open(raw, encoding="utf-8") as f:
                raw = f.read()
        data = json.loads(raw)
        if data.get("client_email") and data.get("private_key"):
            # Al pasar por variables de entorno (Dokploy, compose) los saltos de
            # línea de la clave a veces llegan escapados como texto "\n"
            if "\n" not in data["private_key"]:
                data["private_key"] = data["private_key"].replace("\\n", "\n")
            return data
    except Exception as e:
        log.warning("GOOGLE_SERVICE_ACCOUNT_JSON inválida: %s", e)
    return None


def email_cuenta_servicio():
    cred = _credenciales()
    return cred["client_email"] if cred else None


def _access_token():
    with _token_lock:
        if _token_cache["token"] and time.time() < _token_cache["vence"] - 60:
            return _token_cache["token"]
        cred = _credenciales()
        if not cred:
            raise SheetsError("Falta la cuenta de servicio (GOOGLE_SERVICE_ACCOUNT_JSON).")
        ahora = int(time.time())
        try:
            assertion = jwt.encode(
                {"iss": cred["client_email"], "scope": _SCOPE, "aud": _TOKEN_URL,
                 "iat": ahora, "exp": ahora + 3600},
                cred["private_key"], algorithm="RS256",
            )
        except Exception as e:
            # No incluir el detalle: podría arrastrar parte de la clave
            raise SheetsError(f"No se pudo firmar con la clave de la cuenta de servicio ({type(e).__name__}).")
        cuerpo = urllib.parse.urlencode({
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        }).encode()
        req = urllib.request.Request(_TOKEN_URL, data=cuerpo, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=_TIMEOUT_SEG) as resp:
                data = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            raise SheetsError(f"Google rechazó la cuenta de servicio: HTTP {e.code} {e.read()[:300]!r}")
        except (urllib.error.URLError, OSError) as e:
            raise SheetsError(f"Sin conexión con Google al pedir el token: {type(e).__name__}: {e}")
        _token_cache["token"] = data["access_token"]
        _token_cache["vence"] = time.time() + int(data.get("expires_in", 3600))
        return _token_cache["token"]


# ─── Cliente mínimo de la API de Sheets ───────────────────────────────────────

def _api(metodo, sid, ruta, params=None, body=None):
    url = f"{_API}/{urllib.parse.quote(sid)}{ruta}"
    if params:
        url += "?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(
        url, method=metodo,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {_access_token()}",
                 "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SEG) as resp:
            return json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        detalle = e.read()[:400].decode("utf-8", "replace")
        if e.code == 403:
            raise SheetsError(
                f"Sin permiso sobre el Sheet: compartilo como Editor con {email_cuenta_servicio()}."
            )
        if e.code == 404:
            raise SheetsError("No se encontró el Sheet (revisá el ID).")
        if e.code == 400 and "Unable to parse range" in detalle:
            raise SheetsError(f"No existe alguna de las pestañas '{TAB_TURNOS}' / '{TAB_LOG}'.")
        raise SheetsError(f"HTTP {e.code}: {detalle}")
    except urllib.error.URLError as e:
        raise SheetsError(f"Sin conexión con Google: {e.reason}")
    except OSError as e:  # timeouts de lectura (TimeoutError) y cortes de conexión
        raise SheetsError(f"Sin conexión con Google: {type(e).__name__}: {e}")


def _rango(tab, a1):
    return "'" + tab.replace("'", "''") + "'!" + a1


def _letra(idx):
    """0 → A, 25 → Z, 26 → AA."""
    s = ""
    idx += 1
    while idx:
        idx, r = divmod(idx - 1, 26)
        s = chr(65 + r) + s
    return s


def _norm(texto):
    t = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode()
    return "".join(c for c in t.lower() if c.isalnum())


def _asegurar_encabezados(sid, tab, columnas, opcionales=()):
    """
    Devuelve ({columna: índice}, {opcional: índice}) según la fila 1 de la
    pestaña. Las `columnas` que falten se agregan a la derecha; las
    `opcionales` solo se usan si ya existen.
    """
    res = _api("GET", sid, f"/values/{urllib.parse.quote(_rango(tab, '1:1'))}")
    actuales = (res.get("values") or [[]])[0]
    por_nombre = {_norm(h): i for i, h in enumerate(actuales) if str(h).strip()}
    mapa, faltan = {}, []
    for col in columnas:
        if _norm(col) in por_nombre:
            mapa[col] = por_nombre[_norm(col)]
        else:
            faltan.append(col)
    if faltan:
        inicio = len(actuales)
        for i, col in enumerate(faltan):
            mapa[col] = inicio + i
        _api("PUT", sid,
             f"/values/{urllib.parse.quote(_rango(tab, f'{_letra(inicio)}1'))}",
             params={"valueInputOption": "RAW"}, body={"values": [faltan]})
    extra = {c: por_nombre[_norm(c)] for c in opcionales if _norm(c) in por_nombre}
    return mapa, extra


def _filas_por_id(sid, mapa):
    """{id_turno (str): número de fila} leyendo la columna ID (primera aparición)."""
    letra = _letra(mapa[COL_ID])
    res = _api("GET", sid, f"/values/{urllib.parse.quote(_rango(TAB_TURNOS, f'{letra}2:{letra}'))}",
               params={"majorDimension": "COLUMNS"})
    valores = (res.get("values") or [[]])[0]
    filas = {}
    for i, v in enumerate(valores):
        clave = str(v).strip()
        if clave and clave not in filas:
            filas[clave] = i + 2
    return filas


def _tramos(fila, mapa, nro_fila, tab):
    """
    Rangos a escribir para actualizar una fila existente, uno por cada tramo
    contiguo de NUESTRAS columnas: nunca pisa las columnas manuales de
    marketing que estén en el medio.
    """
    celdas = sorted((mapa[c], fila.get(c, "")) for c in mapa)
    data, tramo, desde, previo = [], [], None, None
    for idx, valor in celdas:
        if previo is not None and idx != previo + 1:
            data.append({"range": _rango(tab, f"{_letra(desde)}{nro_fila}"), "values": [tramo]})
            tramo, desde = [], None
        if desde is None:
            desde = idx
        tramo.append(valor)
        previo = idx
    if tramo:
        data.append({"range": _rango(tab, f"{_letra(desde)}{nro_fila}"), "values": [tramo]})
    return data


def _fila_completa(fila, mapa):
    """Fila nueva: ancho hasta nuestra última columna, en blanco el resto."""
    ancho = max(mapa.values()) + 1
    out = [""] * ancho
    for col, idx in mapa.items():
        out[idx] = fila.get(col, "")
    return out


def _actualizar(sid, data):
    for i in range(0, len(data), _LOTE):
        _api("POST", sid, "/values:batchUpdate",
             body={"valueInputOption": "USER_ENTERED", "data": data[i:i + _LOTE]})


def _agregar(sid, tab, filas):
    for i in range(0, len(filas), _LOTE):
        _api("POST", sid, f"/values/{urllib.parse.quote(_rango(tab, 'A1'))}:append",
             params={"valueInputOption": "USER_ENTERED", "insertDataOption": "INSERT_ROWS"},
             body={"values": filas[i:i + _LOTE]})


def _escribir_turnos(sid, filas):
    """Upsert de varias filas de TURNOS VENTAS por ID. Devuelve (actualizadas, nuevas)."""
    mapa, manuales = _asegurar_encabezados(sid, TAB_TURNOS, COLUMNAS_TURNOS, SOLO_AL_CREAR)
    existentes = _filas_por_id(sid, mapa)
    updates, nuevas = [], []
    for fila in filas:
        nro = existentes.get(str(fila[COL_ID]))
        if nro:
            updates.extend(_tramos(fila, mapa, nro, TAB_TURNOS))
        else:
            nuevas.append(_fila_completa(fila, {**mapa, **manuales}))
    if updates:
        _actualizar(sid, updates)
    if nuevas:
        _agregar(sid, TAB_TURNOS, nuevas)
    return len(filas) - len(nuevas), len(nuevas)


def _escribir_log(sid, filas):
    mapa, _ = _asegurar_encabezados(sid, TAB_LOG, COLUMNAS_LOG)
    _agregar(sid, TAB_LOG, [_fila_completa(f, mapa) for f in filas])


# ─── Armado de filas ──────────────────────────────────────────────────────────

def _total(turno):
    if turno.monto_total is not None:
        return round(float(turno.monto_total), 2)
    return round(sum((ts.precio_unitario or 0.0) * (ts.cantidad or 1) for ts in turno.servicios), 2)


def _rubro(servicio):
    """Servicio de Stratus → valor de LISTAS → SERVICIOS ('Otro' si no matchea)."""
    textos = [servicio.categoria.nombre if servicio.categoria else "", servicio.nombre or ""]
    for texto in textos:
        t = _norm(texto)
        for clave, rubro in SERVICIOS:
            if clave in t:
                return rubro
    return "Otro"


def _si_no_pendiente(estado, si):
    """LISTAS → SI_NO: 'Sí' si `si`, 'No' si el turno ya no se concreta, si no 'Pendiente'."""
    if si:
        return "Sí"
    if estado in _SIN_COBRO:
        return "No"
    return "Pendiente"


def fila_turno(turno, evento, estado_forzado=None):
    """
    Fila de TURNOS VENTAS para un turno (con relaciones cargadas).
    `estado_forzado` se usa cuando el turno está por borrarse
    ('eliminado' o 'abandonada'), para que la fila no quede colgada.
    Incluye las columnas manuales (SOLO_AL_CREAR), que solo se usan si la
    fila es nueva.
    """
    estado = estado_forzado or turno.estado or ""
    aprobados = [p for p in (turno.pagos or []) if p.estado == "aprobada"]
    sena_confirmada = round(sum(p.monto or 0 for p in aprobados if p.tipo == "sena"), 2)
    cobrado = round(sum(p.monto or 0 for p in aprobados), 2)
    total = _total(turno)
    sena_pendiente = (
        round(max((turno.monto_sena or 0) - sena_confirmada, 0), 2)
        if turno.sena_estado == "pendiente" and estado not in _SIN_COBRO else 0
    )
    servicios = [ts.servicio for ts in turno.servicios if ts.servicio]
    rubros = list(dict.fromkeys(_rubro(s) for s in servicios))  # sin repetir, en orden
    cliente = turno.cliente
    return {
        "Fecha turno": _fmt(turno.fecha_hora),
        "Cliente ID": (f"{cliente.nombre} {cliente.apellido or ''}".strip() if cliente else "Sin cliente"),
        "Servicio": rubros[0] if len(rubros) == 1 else ("Otro" if not rubros else ", ".join(rubros)),
        "Estado turno": ESTADO_TURNO.get(estado, estado),
        "Seña confirmada ARS": sena_confirmada,
        "Seña pendiente ARS": sena_pendiente,
        "Saldo mostrado ARS": 0 if estado in _SIN_COBRO else round(total - cobrado, 2),
        "Valor servicio ARS": total,
        "Asistió": _si_no_pendiente(estado, estado == "completado"),
        "Venta": _si_no_pendiente(estado, estado == "completado"),
        COL_ID: turno.id,
        # El apóstrofo fuerza texto: si no, Sheets toma "+54..." como fórmula/número
        "Teléfono cliente": f"'{cliente.telefono}" if cliente and cliente.telefono else "",
        "Fecha creación": _fmt(turno.creado_en),
        "Profesional": turno.empleado.nombre if turno.empleado else "",
        "Estado seña": ESTADO_SENA.get(turno.sena_estado or "no_aplica", turno.sena_estado),
        "Estado webhook": "OK",
        "Evento webhook": evento,
        "Actualizado webhook": _fmt(_ahora()),
        # No hay webhook ni HMAC: escribimos con una cuenta de servicio de Google
        "HMAC verificada": "No aplica",
        # "abandonada" es interno: para el turnero es una reserva cuya seña venció
        "Estado raw turnero": "expirado" if estado == "abandonada" else estado,
        "Webhook/API": "API",
        "Error técnico": "",
        # Manuales de marketing (solo al crear la fila)
        "Origen": PENDIENTE_VALIDAR,
        "Anuncio": PENDIENTE_VALIDAR,
        "Atribución a pauta": PENDIENTE_VALIDAR,
        "Notas": ", ".join(s.nombre.strip() for s in servicios),
    }


def _fila_log(fila, evento, detalle):
    ahora = _ahora()
    estado = fila["Estado raw turnero"]
    payload = {k: fila[k] for k in COLUMNAS_TURNOS}
    return {
        "received_at": _fmt(ahora),
        "event_id": f"{fila[COL_ID]}-{evento}-{ahora.strftime('%Y%m%d%H%M%S%f')}",
        "evento_turnero": evento,
        COL_ID_LOG: fila[COL_ID],
        "cliente_id": fila["Cliente ID"],
        "telefono_cliente": fila["Teléfono cliente"],
        "fecha_creacion": fila["Fecha creación"],
        "fecha_turno": fila["Fecha turno"],
        "servicio": fila["Notas"] or fila["Servicio"],
        "profesional": fila["Profesional"],
        "estado_turno_raw": estado,
        "importe_sena": fila["Seña confirmada ARS"] or fila["Seña pendiente ARS"],
        "estado_sena": fila["Estado seña"],
        "valor_total_servicio": fila["Valor servicio ARS"],
        "asistencia": fila["Asistió"],
        "cancelacion": "Sí" if estado in ("cancelado", "eliminado") else "No",
        "turno_completado_venta": fila["Venta"],
        "firma_hmac_ok": "No aplica",
        "payload_json": json.dumps(payload, ensure_ascii=False, default=str),
        "procesado_turnos_ventas": "Sí",
        "error": "",
        "observaciones": detalle or "",
    }


# ─── Cola y worker ────────────────────────────────────────────────────────────

_cola = queue.Queue()
_worker = None
_worker_lock = threading.Lock()
# Resultado de la última importación/resync por salón (se muestra en el admin)
_ultima_sync = {}


def _arrancar_worker():
    global _worker
    with _worker_lock:
        if _worker is None or not _worker.is_alive():
            _worker = threading.Thread(target=_procesar, name="sheets-sync", daemon=True)
            _worker.start()


def _procesar():
    while True:
        tarea = _cola.get()
        try:
            if tarea[0] == "evento":
                _, sid, fila, fila_log = tarea
                _escribir_turnos(sid, [fila])
                _escribir_log(sid, [fila_log])
            elif tarea[0] == "completa":
                _sincronizar_todo(tarea[1])
        except Exception as e:
            log.warning("Sheets: no se pudo escribir (%s): %s", tarea[0], e)
        finally:
            _cola.task_done()


def _config_activa(db, salon_id):
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg or not cfg.sheets_activo or not cfg.sheets_spreadsheet_id:
        return None
    if not _credenciales():
        return None
    return cfg.sheets_spreadsheet_id


def sync_turno(db: Session, turno, evento: str, detalle: str = None, estado_forzado: str = None) -> None:
    """
    Encola la actualización del turno en el Sheet + una fila de log.
    Llamar DESPUÉS del commit (o antes de borrar el turno, con estado_forzado).
    Nunca lanza.
    """
    try:
        if turno is None:
            return
        sid = _config_activa(db, turno.salon_id)
        if not sid:
            return
        fila = fila_turno(turno, evento, estado_forzado)
        _cola.put(("evento", sid, fila, _fila_log(fila, evento, detalle)))
        _arrancar_worker()
    except Exception as e:
        log.warning("Sheets: no se pudo encolar %s: %s", evento, e)


def sync_turno_id(db: Session, salon_id: int, turno_id: int, evento: str, detalle: str = None) -> None:
    """Como sync_turno, pero carga el turno (para quien solo tiene el id)."""
    try:
        if not _config_activa(db, salon_id):
            return
        turno = db.query(Turno).filter(Turno.id == turno_id, Turno.salon_id == salon_id).first()
        sync_turno(db, turno, evento, detalle)
    except Exception as e:
        log.warning("Sheets: no se pudo encolar %s: %s", evento, e)


# ─── Importación / resincronización completa ──────────────────────────────────

def _sincronizar_todo(salon_id):
    """
    Reescribe TODOS los turnos del salón en TURNOS VENTAS (upsert por ID) y
    deja una sola línea en el log. Sirve para importar el histórico y como
    resync nocturna. Las filas de turnos ya borrados se dejan como están.
    """
    inicio = _ahora()
    db = SessionLocal()
    try:
        sid = _config_activa(db, salon_id)
        if not sid:
            return
        turnos = db.query(Turno).options(
            joinedload(Turno.cliente),
            joinedload(Turno.empleado),
            joinedload(Turno.pagos),
            joinedload(Turno.servicios).joinedload(TurnoServicio.servicio).joinedload(Servicio.categoria),
        ).filter(Turno.salon_id == salon_id).order_by(Turno.id).all()
        filas = [fila_turno(t, "sync.completa") for t in turnos]
    finally:
        db.close()

    try:
        actualizadas, nuevas = _escribir_turnos(sid, filas) if filas else (0, 0)
        detalle = f"{len(filas)} turnos: {nuevas} nuevos, {actualizadas} actualizados"
        _escribir_log(sid, [{
            "received_at": _fmt(_ahora()), "evento_turnero": "sync.completa",
            "procesado_turnos_ventas": "Sí", "observaciones": detalle,
        }])
        _ultima_sync[salon_id] = {"ok": True, "detalle": detalle,
                                  "inicio": inicio, "fin": _ahora()}
    except Exception as e:
        _ultima_sync[salon_id] = {"ok": False, "detalle": str(e),
                                  "inicio": inicio, "fin": _ahora()}
        raise


def encolar_sync_completa(salon_id: int) -> None:
    _ultima_sync[salon_id] = {"ok": None, "detalle": "En curso…", "inicio": _ahora(), "fin": None}
    _cola.put(("completa", salon_id))
    _arrancar_worker()


async def loop_resync_nocturno():
    """Una vez por día (HORA_RESYNC, hora Argentina) resincroniza cada salón activo."""
    while True:
        ahora = _ahora()
        proxima = ahora.replace(hour=HORA_RESYNC, minute=0, second=0, microsecond=0)
        if proxima <= ahora:
            proxima += timedelta(days=1)
        await asyncio.sleep((proxima - ahora).total_seconds())
        db = SessionLocal()
        try:
            salones = [c.salon_id for c in db.query(ConfigSalon).filter(
                ConfigSalon.sheets_activo == True,  # noqa: E712
                ConfigSalon.sheets_spreadsheet_id.isnot(None),
            ).all()]
        except Exception as e:
            log.warning("Sheets: no se pudo listar salones para la resync: %s", e)
            salones = []
        finally:
            db.close()
        for salon_id in salones:
            encolar_sync_completa(salon_id)


# ─── Configuración y prueba (admin) ───────────────────────────────────────────

def extraer_spreadsheet_id(valor: str) -> str:
    """Acepta el ID pelado o la URL completa del Sheet."""
    valor = (valor or "").strip()
    if "/d/" in valor:
        valor = valor.split("/d/", 1)[1].split("/", 1)[0]
    return valor


def estado(db: Session, salon_id: int) -> dict:
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    return {
        "activo": bool(cfg and cfg.sheets_activo),
        "spreadsheet_id": cfg.sheets_spreadsheet_id if cfg else None,
        "cuenta_servicio": email_cuenta_servicio(),
        "ultima_sync": _ultima_sync.get(salon_id),
    }


def probar(db: Session, salon_id: int) -> dict:
    """
    Verifica credenciales, acceso al Sheet y que existan las dos pestañas con
    sus columnas (agrega las que falten). Sincrónico (lo dispara el admin).
    """
    cfg = db.query(ConfigSalon).filter(ConfigSalon.salon_id == salon_id).first()
    if not cfg or not cfg.sheets_spreadsheet_id:
        return {"ok": False, "detalle": "No hay un Sheet configurado."}
    if not _credenciales():
        return {"ok": False, "detalle": "Falta la cuenta de servicio en el servidor (GOOGLE_SERVICE_ACCOUNT_JSON)."}
    try:
        _asegurar_encabezados(cfg.sheets_spreadsheet_id, TAB_TURNOS, COLUMNAS_TURNOS)
        _asegurar_encabezados(cfg.sheets_spreadsheet_id, TAB_LOG, COLUMNAS_LOG)
    except SheetsError as e:
        return {"ok": False, "detalle": str(e)}
    except Exception as e:
        log.exception("Sheets: error inesperado al probar")
        return {"ok": False, "detalle": f"Error inesperado: {type(e).__name__}: {e}"}
    return {"ok": True, "detalle": f"Acceso OK. Columnas listas en '{TAB_TURNOS}' y '{TAB_LOG}'."}
