"""
Mini-migraciones idempotentes.

`Base.metadata.create_all` crea tablas que faltan pero NO agrega columnas nuevas
a tablas ya existentes. Como el proyecto no usa Alembic, este módulo agrega las
columnas faltantes con `ALTER TABLE ... ADD COLUMN` (compatible MySQL y SQLite).

Se ejecuta en el arranque (main.py) después de create_all. Es seguro correrlo
siempre: solo agrega lo que no existe.
"""
from sqlalchemy import inspect, text


# tabla -> { columna: definición DDL }
COLUMNS_TO_ADD = {
    "config_salon": {
        "mp_activo":        "BOOLEAN NOT NULL DEFAULT 0",
        "mp_access_token":  "TEXT NULL",
        "mp_public_key":    "VARCHAR(255) NULL",
        "sena_porcentaje":  "INTEGER NOT NULL DEFAULT 0",
        "sena_obligatoria": "BOOLEAN NOT NULL DEFAULT 0",
        "webhook_url":      "VARCHAR(300) NULL",
        "webhook_secret":   "VARCHAR(80) NULL",
        "webhook_activo":   "BOOLEAN NOT NULL DEFAULT 0",
        "transferencia_activa":  "BOOLEAN NOT NULL DEFAULT 0",
        "transferencia_cbu":     "VARCHAR(30) NULL",
        "transferencia_alias":   "VARCHAR(100) NULL",
        "transferencia_titular": "VARCHAR(120) NULL",
        "config_password_hash":  "VARCHAR(255) NULL",
    },
    "turnos": {
        "monto_total":      "FLOAT NULL",
        "monto_sena":       "FLOAT NULL",
        "saldo_pendiente":  "FLOAT NULL",
        "sena_estado":      "VARCHAR(20) NOT NULL DEFAULT 'no_aplica'",
        "mp_payment_id":    "VARCHAR(50) NULL",
        "mp_preference_id": "VARCHAR(80) NULL",
        "expira_en":        "DATETIME NULL",
        "comprobante_subido": "BOOLEAN NOT NULL DEFAULT 0",
    },
    "pagos": {
        "tipo":          "VARCHAR(20) NOT NULL DEFAULT 'saldo'",
        "estado":        "VARCHAR(20) NOT NULL DEFAULT 'aprobada'",
        "mp_payment_id": "VARCHAR(50) NULL",
    },
    "cierres_caja": {
        "total_mercadopago": "FLOAT NOT NULL DEFAULT 0",
    },
    "servicios": {
        # Agrupador opcional: los servicios sin categoría se muestran sueltos
        "categoria_id": "INTEGER NULL",
    },
}


# Columnas que se agrandaron: tabla -> { columna: (largo_nuevo, DDL) }
# `create_all` tampoco cambia el TIPO de una columna que ya existe, así que las
# ampliaciones de VARCHAR van acá. Solo aplica a MySQL: SQLite ignora el largo
# declarado de un VARCHAR, así que ahí no hay nada que hacer.
COLUMNS_TO_WIDEN = {
    "servicios": {
        # Las descripciones son listas de beneficios de varias líneas: 255 era poco
        "descripcion": (1000, "VARCHAR(1000) NULL"),
    },
}


def run_migrations(engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table, columns in COLUMNS_TO_ADD.items():
            if table not in existing_tables:
                continue  # la tabla la crea create_all con las columnas ya incluidas
            existing_cols = {c["name"] for c in inspector.get_columns(table)}
            for col, ddl in columns.items():
                if col not in existing_cols:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))

        if engine.dialect.name == "mysql":
            for table, columns in COLUMNS_TO_WIDEN.items():
                if table not in existing_tables:
                    continue
                actuales = {c["name"]: c for c in inspector.get_columns(table)}
                for col, (largo_nuevo, ddl) in columns.items():
                    info = actuales.get(col)
                    if not info:
                        continue
                    largo_actual = getattr(info["type"], "length", None)
                    if largo_actual is not None and largo_actual < largo_nuevo:
                        conn.execute(text(f"ALTER TABLE {table} MODIFY {col} {ddl}"))
