# 🌤️ Weather Dashboard — PIN

Proyecto Integrador Final (PIN) del curso **DevOps** de [mundosE](https://mundose.com/) (UNC/FCEFyN) —
**Proyecto 1: CI/CD con GitHub Actions + Terraform + Docker**.

Dashboard de clima en Flask que consume la API pública y gratuita de [Open-Meteo](https://open-meteo.com/)
para mostrar el clima actual y el pronóstico de 7 días de cualquier ciudad del mundo. La aplicación en sí
es el "sujeto de prueba" sobre el que se construye todo el pipeline de CI/CD, la infraestructura como
código y el stack de observabilidad que pide la consigna del PIN.

## 📖 La historia de este proyecto

Durante el curso llevé en paralelo dos repos con propósitos distintos: **`devops-curso`**, un repo
teórico-práctico donde iba resolviendo los laboratorios y ejercicios de cada encuentro tal cual los pedía
la cursada, y **`weather-dashboard`**, un repo 100% práctico que arranqué por mi cuenta para ir
integrando todo lo que aprendía sobre una aplicación real: pipelines de CI/CD, contenedores, Kubernetes,
infraestructura como código, seguridad, observabilidad. La idea siempre fue tener algo concreto para
mostrar en entrevistas de trabajo al terminar el curso, no solo ejercicios sueltos.

En el camino llegué a correr un Jenkins self-hosted en una mini PC propia, desplegando a un clúster de
Kubernetes local — una forma de practicar un pipeline completo sin depender de servicios en la nube. Esa
etapa quedó documentada en el historial de commits del repo original.

Cuando llegó el momento del PIN y tocó elegir uno de los 4 proyectos posibles, elegimos el **Proyecto 1**
(GitHub Actions + Terraform + Docker, con despliegue en AWS). Le había agarrado cariño al
`weather-dashboard` original —no quería tocarlo ni perder ese historial—, así que en vez de modificarlo
in situ, lo **cloné completo** (con todos los commits) a este repo, `weather-dashboard-pin`, y acá es
donde se hizo toda la limpieza, el ajuste de infraestructura y la alineación 1 a 1 con la rúbrica del
Proyecto 1. El original sigue intacto como estaba.

> La aplicación base (Flask + Open-Meteo) fue generada con asistencia de IA, como parte del encuentro de
> "IA en DevOps" del curso, y luego evolucionada manualmente sprint a sprint.

## ✨ Features

- 🔍 **Búsqueda por ciudad**: clima en tiempo real por nombre de ciudad
- 🌡️ **Condiciones actuales**: temperatura, velocidad del viento y estado del clima
- 📅 **Pronóstico a 7 días**: predicción extendida
- 🔄 **Toggle de unidad**: cambiar entre Celsius y Fahrenheit
- ⚖️ **Comparación de ciudades**: comparar el clima entre dos ubicaciones
- 🌦️ **Íconos dinámicos**: según el código de clima WMO
- 📱 **Diseño responsive**: optimizado para mobile, tablet y desktop
- 📍 **Ciudad por defecto**: Mendoza, Argentina, cuando no se busca ninguna

## 🏗️ Arquitectura

```
┌──────────────┐     push a main      ┌──────────────────────┐
│   GitHub     │ ───────────────────► │   GitHub Actions      │
│   Actions    │                      │   (unit → security →  │
│   (CI/CD)    │                      │    e2e → build&deploy)│
└──────────────┘                      └───────────┬───────────┘
                                                    │
                        ┌───────────────────────────┼───────────────────────────┐
                        ▼                            ▼                           ▼
                ┌───────────────┐           ┌────────────────┐         ┌─────────────────┐
                │  GHCR         │           │  SBOM           │         │  Snyk +          │
                │  (imagen      │           │  CycloneDX      │         │  SonarQube Cloud │
                │   Docker)     │           │  (artifact)     │         │  (deps + código)  │
                └───────┬───────┘           └────────────────┘         └─────────────────┘
                        │ docker pull / deploy por SSH
                        ▼
        ┌──────────────────────────────────────────────────┐
        │  EC2 (AWS, provisionada con Terraform)             │
        │                                                     │
        │  ┌───────────────┐   scrape /metrics   ┌──────────┐│
        │  │ weather-       │ ◄─────────────────── │Prometheus││
        │  │ dashboard      │                       └────┬─────┘│
        │  │ (Flask, :5000) │                            │       │
        │  └───────────────┘                       ┌────▼─────┐│
        │                                            │ Grafana  ││
        │                                            │ (:3000)  ││
        │                                            └──────────┘│
        └──────────────────────────────────────────────────┘
```

## 🛠️ Stack (herramientas exigidas por el Proyecto 1, una por categoría)

| Categoría | Herramienta | Uso |
|---|---|---|
| **CI/CD** | GitHub Actions | `unit-tests` → `security` → `e2e-tests` → `build-and-deploy` |
| **IaC** | Terraform | EC2 + Security Group en AWS, backend remoto en S3 + DynamoDB |
| **Contenedores** | Docker | Imagen de la app, publicada en GHCR |
| **Seguridad** | Snyk + SonarQube Cloud | Vulnerabilidades de dependencias + análisis estático de código |
| **Monitoreo** | Prometheus + Grafana | Scraping de `/metrics` + dashboard de métricas |

Más abajo, el resto del stack de la aplicación en sí:

| Componente | Tecnología |
|---|---|
| Backend | Python 3.11 + Flask |
| Frontend | HTML5 + CSS3 + JavaScript (sin frameworks) |
| API de clima | Open-Meteo (gratuita, sin API key) |
| Tests unitarios | pytest |
| Tests E2E | Playwright (Page Object Model) |

## 🚀 Quick start (desarrollo local)

### Requisitos
- Docker y Docker Compose
- Python 3.11+ (para desarrollo sin contenedores)
- Node.js 20+ (para correr los tests E2E)

```bash
git clone https://github.com/valen49/weather-dashboard-pin.git
cd weather-dashboard-pin

# Con Docker Compose (recomendado)
docker compose up --build
```

Abrir `http://localhost:5000`.

```bash
# O corriendo localmente sin Docker
python -m venv venv
source venv/bin/activate      # Linux/Mac
# venv\Scripts\activate       # Windows
pip install -r requirements.txt -r requirements-dev.txt
python run.py
```

### Tests

```bash
# Tests unitarios
pytest tests/ -v

# Tests E2E
npm ci
npx playwright install chromium --with-deps
npx playwright test --project=chromium
```

## 🐳 Docker

```bash
# Build de la imagen de la app
docker build -t weather-dashboard:latest .

# Build de la imagen de E2E
docker build -f Dockerfile.e2e -t weather-dashboard-e2e:latest .

# Correr la app sola
docker run -p 5000:5000 weather-dashboard:latest
```

El `Dockerfile` usa `python:3.11-slim`, corre como usuario no-root, y define un `HEALTHCHECK` contra
`/health`.

## 🔄 Pipeline de CI/CD (GitHub Actions)

Workflow en [`.github/workflows/ci.yml`](.github/workflows/ci.yml), con 4 jobs encadenados:

1. **`unit-tests`**: instala dependencias y corre `pytest tests/ -v`.
2. **`security`** (en PR o push a `main`): escaneo de dependencias con **Snyk** y análisis estático de
   código con **SonarQube Cloud**.
3. **`e2e-tests`** (depende de `unit-tests`): levanta la app y corre los tests de Playwright contra ella.
4. **`build-and-deploy`** (depende de `e2e-tests` y `security`, solo en push a `main`):
   - build y push de la imagen Docker a GHCR (`ghcr.io/valen49/weather-dashboard-pin`)
   - generación del **SBOM** en formato CycloneDX (subido como artifact del workflow)
   - deploy por SSH a la EC2: `docker pull` + `docker run` de la imagen nueva, con health check contra `/health`
   - copia del stack de `monitoring/` a la EC2 y `docker compose up -d` para levantar Prometheus + Grafana

## ☁️ Infraestructura (Terraform)

Todo en [`terraform/`](terraform/):

- `providers.tf`: provider de AWS (`us-east-1`) y backend remoto del state en S3 + DynamoDB (para lock).
- `ec2.tf`: instancia EC2 `t2.micro` (Ubuntu 22.04), con Docker y `docker-compose-plugin` instalados vía
  `user_data`.
- `security_group.tf`: abre los puertos 22 (SSH, deploy desde GitHub Actions), 5000 (app), 3000 (Grafana)
  y 9090 (Prometheus).
- `outputs.tf`: IP pública de la instancia y comando de SSH listo para copiar/pegar.

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Detalle completo del setup (bootstrap del bucket de state, manejo de la keypair, etc.) en
[`terraform/README.md`](terraform/README.md).

## 📊 Observabilidad

La app expone métricas en formato Prometheus en `/metrics` (vía `prometheus-flask-exporter`). El stack de
[`monitoring/`](monitoring/) las scrapea y las visualiza:

- **Prometheus** (`:9090`): scrapea `weather-dashboard:5000/metrics` cada 15s.
- **Grafana** (`:3000`): datasource de Prometheus y dashboard provisionados automáticamente al levantar
  el stack (no requiere configuración manual). El dashboard incluye 3 paneles: requests por método,
  requests por status code, y latencia p95 por endpoint.

<!-- TODO: agregar captura del dashboard de Grafana acá después del ensayo final -->

## 🔒 Seguridad

- **Snyk**: escaneo de vulnerabilidades en las dependencias de Python (`--severity-threshold=high`).
- **SonarQube Cloud**: análisis estático de código (bugs, code smells, duplicación) sobre `app/`.
- **SBOM**: generado en cada build con `anchore/sbom-action` (formato CycloneDX), subido como artifact
  del workflow.
- Imagen Docker corre con usuario no-root.
- Sin credenciales ni secretos hardcodeados en el código — todo vía GitHub Secrets.

## 📁 Estructura del proyecto

```
weather-dashboard-pin/
├── app/                          # Aplicación Flask
│   ├── __init__.py               # App factory + métricas de Prometheus
│   ├── routes.py                 # Endpoints (/, /health)
│   ├── services.py                # Integración con Open-Meteo
│   └── templates/index.html      # UI
├── tests/                        # Tests unitarios (pytest)
├── e2e/                          # Tests E2E (Playwright, Page Object Model)
├── terraform/                    # Infraestructura como código (AWS)
├── monitoring/                   # Prometheus + Grafana (docker-compose + provisioning)
├── .github/workflows/ci.yml      # Pipeline de CI/CD
├── Dockerfile                    # Imagen de la app
├── Dockerfile.e2e                # Imagen para correr los tests E2E
├── docker-compose.yml            # Desarrollo local
├── PLAN-DEVOPS.md                # Gap analysis histórico vs. el curso
└── README.md                     # Este archivo
```

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licencia

MIT License — ver [LICENSE](LICENSE).

## 🙏 Agradecimientos

- [Open-Meteo](https://open-meteo.com/) por la API de clima gratuita
- [Flask](https://flask.palletsprojects.com/), [Playwright](https://playwright.dev/), [Docker](https://www.docker.com/), [Terraform](https://www.terraform.io/), [Prometheus](https://prometheus.io/) y [Grafana](https://grafana.com/)
- El curso **DevOps** de [mundosE](https://mundose.com/) (UNC/FCEFyN) y su equipo docente

---

**Proyecto Integrador Final — Curso DevOps, mundosE, 2026**
