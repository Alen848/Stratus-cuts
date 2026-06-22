"""
Cifrado simétrico para datos sensibles por salón (ej: Access Token de Mercado Pago).

La clave vive SOLO en el entorno del backend (`MP_ENCRYPTION_KEY`), nunca en la base
de datos. Así, aunque alguien acceda a la BD, no puede leer las credenciales.

Generar una clave (una sola vez) y ponerla en backend/.env:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import os
from cryptography.fernet import Fernet


def _fernet() -> Fernet:
    key = os.getenv("MP_ENCRYPTION_KEY", "")
    if not key:
        raise RuntimeError(
            "MP_ENCRYPTION_KEY no está configurada en el entorno. "
            "Generá una con: python -c \"from cryptography.fernet import "
            "Fernet; print(Fernet.generate_key().decode())\""
        )
    return Fernet(key.encode())


def encrypt(plaintext: str) -> str:
    """Cifra un texto plano y devuelve el token cifrado (str)."""
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    """Descifra un token previamente cifrado con encrypt()."""
    return _fernet().decrypt(token.encode()).decode()
