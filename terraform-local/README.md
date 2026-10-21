# Terraform — Infraestructura local (VirtualBox)

Modalidad **local** del Proyecto 1 del PIN, alternativa a [`terraform/`](../terraform) (nube/AWS).
Levanta una VM Ubuntu Server en VirtualBox, orquestada por Terraform, con Docker corriendo la misma
imagen publicada en GHCR y el mismo stack de Prometheus + Grafana que la modalidad nube.

## Por qué `VBoxManage` en vez de un provider de Terraform para VirtualBox

El provider más conocido para VirtualBox (`terra-farm/virtualbox`) está poco mantenido y es frágil
contra versiones recientes de VirtualBox/Terraform. En cambio, este módulo usa `null_resource` con
provisioners `local-exec` que invocan `VBoxManage` (la CLI nativa de VirtualBox) para crear, instalar y
destruir la VM — sigue siendo Terraform el que gestiona el ciclo de vida completo de principio a fin
(`terraform apply`/`destroy`), solo que sin depender de un provider de terceros poco confiable.

La instalación del sistema operativo es automatizada con `VBoxManage unattended install` (nativo de
VirtualBox desde la versión 6.1), sin intervención manual.

## Qué crea

- **`null_resource.vm`**: corre `scripts/create-vm.sh`, que:
  1. Crea la VM (`VBoxManage createvm`), le asigna memoria/CPUs y configura NAT con 4 puertos
     reenviados a `127.0.0.1` (SSH, app, Grafana, Prometheus).
  2. Crea y adjunta un disco virtual, adjunta la ISO de Ubuntu Server 22.04 como DVD.
  3. Lanza la instalación desatendida (`VBoxManage unattended install`) con el usuario/password
     definidos en `variables.tf`, headless. Un `--post-install-command` instala `openssh-server` y
     deja sudo sin password para ese usuario: el perfil por defecto de VirtualBox no hace ninguna de
     las dos cosas, y sin ellas Terraform no puede entrar por SSH ni correr comandos con `sudo` (no
     hay terminal interactiva para tipear el password).
- **`null_resource.provision`** (depende del anterior): espera a que la VM termine de instalar y
  reiniciar (Terraform reintenta la conexión SSH automáticamente hasta 20 minutos), empaqueta
  `monitoring/` en un `.tar.gz` y lo copia a la VM (el provisioner `file` de Terraform no copia bien
  directorios con subcarpetas), instala Docker + Docker Compose (mismo enfoque que `terraform/ec2.tf`: el
  binario de Compose se baja directo de GitHub, no del paquete `docker-compose-plugin` que no existe en
  los repos default de Ubuntu), baja la imagen publicada en GHCR y levanta la app + el stack de
  monitoring.

## Requisitos previos

1. VirtualBox instalado en la máquina donde se corre `terraform apply` (no en el host de AWS ni en
   ningún lado remoto — esto corre 100% local):
   ```bash
   sudo apt-get install -y virtualbox
   sudo usermod -aG vboxusers $USER   # relogin despues de esto
   ```
2. ISO de Ubuntu Server 22.04 descargada una vez (se reusa en cada `apply`):
   ```bash
   mkdir -p ~/vm-isos
   curl -L -o ~/vm-isos/ubuntu-22.04-live-server-amd64.iso \
     https://releases.ubuntu.com/22.04/ubuntu-22.04.5-live-server-amd64.iso
   ```
   Si la ruta es distinta en tu máquina, ajustar la variable `iso_path`.

## Uso

```bash
cd terraform-local
terraform init
terraform apply
```

La instalación desatendida del SO + el provisioning de Docker tardan varios minutos (instalación de
Ubuntu, reinicio, instalación de Docker). Terraform espera automáticamente a que la VM esté lista antes
de seguir con el provisioning.

Al terminar, los outputs dan las URLs locales:
- App: `http://localhost:5000`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`

```bash
terraform destroy
```

## Diferencia clave con la modalidad nube: el deploy acá es manual

A diferencia de `terraform/` (AWS), **el pipeline de GitHub Actions no despliega a esta VM**. Un runner
de GitHub Actions corre en los servidores de GitHub, en la nube pública — no tiene forma de llegar a una
VM que vive detrás de NAT en una red doméstica/privada. Esta es una limitación de red real, no un
recorte de alcance: para que el CI pudiera llegar acá haría falta exponer la VM a internet (mala idea
para algo efímero y local) o correr un self-hosted runner en la misma red (una pieza más para mantener,
fuera del alcance de esta modalidad).

Por eso, para traer una versión nueva de la imagen a esta VM después de un cambio, hay que repetir
manualmente el provisioning (`terraform apply` de nuevo, o entrar por SSH y correr `docker pull` +
`docker restart` a mano).

## Nota de seguridad

El usuario/password de la VM y de Grafana están definidos en `variables.tf` con valores por defecto
simples — es intencional: esta infraestructura es efímera (se destruye con `terraform destroy`), corre
exclusivamente en `localhost` (los puertos NAT están reenviados solo a `127.0.0.1`, no accesibles desde
otras máquinas de la red), y no maneja datos reales ni se expone a internet.
