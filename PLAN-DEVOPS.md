# Plan de acción — Alinear weather-dashboard con lo aprendido en el curso DevOps

> ⚠️ **Snapshot histórico, no refleja el estado actual.** Generado el 2026-09-17, antes de
> adaptar el repo al Proyecto 1 del PIN. Varios de los gaps acá listados ya se resolvieron
> (ver [README.md](README.md) para el estado real y actualizado).

Este documento compara lo cubierto en el curso DevOps (repo devops-curso) contra
el estado real de este repo, identificando gaps concretos y un plan priorizado para
cerrarlos.

## Docker
- [x] Imágenes base fijadas (python:3.11-slim) — pendiente confirmar pin exacto de Node 20 en Dockerfile.e2e
- [x] Non-root user en ambos Dockerfiles
- [x] HEALTHCHECK configurado en Dockerfile de app
- [x] Limpieza de containers (docker image prune en Jenkinsfile)
- [ ] Multi-stage builds — ninguno de los dos Dockerfiles lo usa
- [ ] Versionado por digest — Jenkins tagea con BUILD_NUMBER y latest, nunca promueve por digest

## Kubernetes
- [x] Namespace no hardcodeado (corregido)
- [x] Deployment usado correctamente (no Pods sueltos)
- [ ] NetworkPolicy — no existe ninguna
- [ ] Liveness/readiness/startup probes — no detectados en k8s-deployment.yaml (el HEALTHCHECK de Docker existe pero K8s no lo usa)
- [ ] RollingUpdate con maxSurge/maxUnavailable explícitos — usa el default sin documentar
- [ ] Helm/Kustomize para multi-entorno — no existe; el Jenkinsfile perdió lógica multi-entorno que tenía antes

## Build & Package / Registro de artefactos
- [ ] **GAP PRINCIPAL: no hay ningún registro de imágenes configurado** (ni Docker Hub, ni GHCR, ni Harbor pese a que Harbor ya está instalado en cx-server). Jenkins construye y despliega en el mismo host sin publicar a ningún lado; GitHub Actions no construye imagen en absoluto.
- [ ] SemVer real — solo se usa BUILD_NUMBER
- [ ] SBOM — no se genera
- [ ] Firmas de imágenes (Sigstore/cosign) — no implementado

## Calidad
- [x] 15 tests unitarios (pytest), corren en CI
- [x] 19 tests E2E (Playwright, Page Object Model), corren en ambos pipelines
- [ ] Cobertura medida — README menciona pytest --cov pero el workflow real no lo corre
- [ ] Análisis estático (SonarQube/ESLint) — no integrado
- [ ] Quality gates — no existen
- [ ] SCA (Trivy) — no hay escaneo de vulnerabilidades de dependencias/imagen
- [ ] SAST / DAST — no implementados
- [ ] Pruebas de carga/estrés/rendimiento — no existen

## Documentación
- [ ] README documenta "Webhook support" como completado en 4 secciones (Features, Tech Stack, Arquitectura, CI/CD, Monitoring, Roadmap) sin que exista código real — corregir o implementar

## Plan priorizado

**Prioridad 1 — cerrar el pipeline real (build → publish → deploy):**
1. Conectar Jenkins con Harbor: agregar `docker push` al proyecto correspondiente usando una robot account de Harbor (no credenciales personales).
2. Reemplazar BUILD_NUMBER/latest por versionado SemVer real; promover por digest si en el futuro hay más de un ambiente.
3. Agregar liveness/readiness probes reales a k8s-deployment.yaml basados en el endpoint /health ya existente.

**Prioridad 2 — quality gates básicos:**
4. Agregar `pytest --cov` real al workflow de GH Actions, ya que el README lo promete.
5. Integrar Trivy escaneando la imagen antes del deploy.

**Prioridad 3 — consistencia y limpieza:**
6. Corregir o implementar la feature de webhooks documentada sin código.
7. Documentar explícitamente maxSurge/maxUnavailable en el Deployment.
8. Borrar branch local obsoleta fix/Jenkinsfilepipeline (remoto ya no existe).

**Prioridad 4 — mejoras estructurales, no urgentes:**
9. Multi-stage builds en ambos Dockerfiles.
10. Helm o Kustomize si se necesita manejar más de un entorno real.
11. SAST, DAST, pruebas de carga — dejar para cuando el resto esté sólido.
