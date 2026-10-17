# Cómo contribuir a Weather Dashboard

## Nomenclatura de branches

| Tipo | Patrón | Ejemplo |
|------|---------|---------|
| Feature | `feature/<descripción-corta>` | `feature/unit-toggle` |
| Fix | `fix/<descripción-corta>` | `fix/health-endpoint` |
| Chore / refactor | `chore/<descripción-corta>` | `chore/update-deps` |

Nunca commitear directo a `main`. Todos los cambios van por PR.

## Mensajes de commit

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Celsius/Fahrenheit toggle
fix: return dynamic timestamp in /health
chore: update playwright to 1.44
```

Tipos: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`.

## Flujo de trabajo

1. Crear branch desde `main`: `git checkout -b feature/mi-feature`
2. Hacer los cambios y commitear
3. Pushear: `git push origin feature/mi-feature`
4. Abrir un PR contra `main`
5. El CI (GitHub Actions) tiene que pasar antes de mergear
6. Squash and merge

## Correr los tests localmente

```bash
# Tests unitarios
pip install -r requirements.txt -r requirements-dev.txt
pytest tests/ -v

# Tests E2E
npm ci
npx playwright install chromium --with-deps
python run.py &
npx playwright test --project=chromium
```

## Estilo de código

Este proyecto usa [Black](https://black.readthedocs.io/) e [isort](https://pycqa.github.io/isort/). Correr antes de commitear:

```bash
black app/ tests/
isort app/ tests/
```

O instalar los hooks de pre-commit:

```bash
pip install pre-commit
pre-commit install
```
