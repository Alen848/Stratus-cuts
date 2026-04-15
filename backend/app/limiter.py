from slowapi import Limiter
from slowapi.util import get_remote_address

# Instancia compartida del rate limiter — se importa en main.py y en los routers
limiter = Limiter(key_func=get_remote_address)
