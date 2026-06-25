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
    },
    "turnos": {
        "monto_total":      "FLOAT NULL",
        "monto_sena":       "FLOAT NULL",
        "saldo_pendiente":  "FLOAT NULL",
        "sena_estado":      "VARCHAR(20) NOT NULL DEFAULT 'no_aplica'",
        "mp_payment_id":    "VARCHAR(50) NULL",
        "mp_preference_id": "VARCHAR(80) NULL",
        "expira_en":        "DATETIME NULL",
    },
    "pagos": {
        "tipo":          "VARCHAR(20) NOT NULL DEFAULT 'saldo'",
        "estado":        "VARCHAR(20) NOT NULL DEFAULT 'aprobada'",
        "mp_payment_id": "VARCHAR(50) NULL",
    },
    "cierres_caja": {
        "total_mercadopago": "FLOAT NOT NULL DEFAULT 0",
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
