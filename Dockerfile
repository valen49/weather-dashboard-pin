FROM python:3.11-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Crear un usuario no-root por seguridad
RUN adduser --disabled-password --gecos '' appuser

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY app/ ./app/
COPY run.py .

# Commit desde el que se construyó la imagen (lo pasa el CI); se muestra en el footer
ARG GIT_SHA=dev
ENV APP_VERSION=$GIT_SHA

# Cambiar al usuario no-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health').read()" || exit 1

EXPOSE 5000

# Correr la aplicación
CMD ["python", "run.py"]