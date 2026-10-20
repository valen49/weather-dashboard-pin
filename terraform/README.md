# Terraform — Infraestructura del PIN

Este directorio contiene el Terraform que provisiona la infraestructura en AWS usada por
el pipeline de CI/CD del PIN (build en GHCR + deploy por SSH a EC2).

## Qué crea

- **Instancia EC2** (`ec2.tf`): un `t2.micro` con Ubuntu 22.04. La AMI no está hardcodeada:
  se resuelve dinámicamente con un `data "aws_ami"` filtrado por el owner de Canonical
  (`099720109477`) y el nombre `ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*`,
  tomando siempre la más reciente. Vía `user_data` se instala Docker (`docker.io`), se
  habilita el servicio y se agrega el usuario `ubuntu` al grupo `docker`; también se baja
  el binario de **Docker Compose** directo desde los releases oficiales de GitHub a
  `/usr/local/lib/docker/cli-plugins/docker-compose` (el paquete `docker-compose-plugin` no
  existe en los repos default de Ubuntu 22.04, solo en el repo propio de Docker — se evita
  depender de ese repo extra). Con esto la instancia queda lista para `docker run` y
  `docker compose up` apenas termina de arrancar.
- **Security Group** (`security_group.tf`): habilita entrada en los puertos `22` (SSH),
  `5000` (la app weather-dashboard), `3000` (Grafana) y `9090` (Prometheus). Egress
  abierto sin restricciones.
- **Outputs** (`outputs.tf`): expone `ip_publica` (la IP pública de la instancia) y
  `comando_ssh` (el comando `ssh ubuntu@<ip>` ya armado) para no tener que ir a buscar la
  IP a mano después de cada `apply`.

## Estado remoto

El estado de Terraform se guarda en S3, no localmente:

- **Bucket S3**: `pin-terraform-state-506581103804` (versionado y cifrado).
- **Tabla DynamoDB**: `pin-terraform-locks`, usada para el locking del estado (evita que
  dos `apply` corran al mismo tiempo y corrompan el state).

Esto está declarado en el bloque `backend "s3"` de `providers.tf`.

## Requisitos previos (una sola vez, con AWS CLI — no con Terraform)

El bucket de estado no puede crearse a sí mismo vía Terraform, porque Terraform necesita
un backend ya existente para guardar el estado de lo que crea. Por eso este paso se hace
manualmente, una única vez, antes del primer `terraform init`:

```bash
# Bucket S3 para el estado remoto
aws s3api create-bucket --bucket pin-terraform-state-506581103804 --region us-east-1
aws s3api put-bucket-versioning --bucket pin-terraform-state-506581103804 --versioning-configuration Status=Enabled

# Tabla DynamoDB para el locking del estado
aws dynamodb create-table --table-name pin-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST

# Par de claves SSH para la instancia EC2
aws ec2 create-key-pair --key-name pin-key --query 'KeyMaterial' --output text > pin-key.pem
chmod 400 pin-key.pem
```

La clave `pin-key.pem` generada en el último paso **nunca se sube al repo** (está excluida
por `.gitignore`, igual que cualquier `.tfstate` o la carpeta `.terraform/`).

## Credenciales

Las credenciales de AWS se configuran una vez con `aws configure` (o variables de entorno
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`). **Nunca se escriben dentro de los archivos
`.tf`** — el provider en `providers.tf` solo declara la región, no credenciales.

## Uso

```bash
terraform init      # descarga el provider de AWS y configura el backend S3
terraform plan       # muestra qué se va a crear/modificar
terraform apply       # crea la infraestructura
terraform destroy    # la destruye cuando no se necesita más
```

**Importante**: la IP pública de la instancia **cambia en cada `apply`** (no se reserva una
Elastic IP). Después de cada `apply`, hay que tomar el valor del output `ip_publica` y
actualizar el secret `EC2_HOST` en GitHub (Settings → Secrets and variables → Actions) del
repo `weather-dashboard-pin`, para que el job `build-and-deploy` del workflow siga apuntando a
la instancia correcta.

## Nota de seguridad

El puerto 22 (SSH) está abierto a `0.0.0.0/0` en el Security Group. Esto es intencional
para este contexto: los runners de GitHub Actions no tienen un rango de IPs fijo y
predecible, así que restringir el origen del SSH a una IP específica rompería el deploy
automático. Se acepta este riesgo porque la infraestructura es efímera — se destruye con
`terraform destroy` cuando no está en uso activo, reduciendo la ventana de exposición.

En un entorno productivo real, esto se resolvería restringiendo el acceso a rangos de IP
conocidos (oficina, VPN) o, mejor aún, eliminando el SSH abierto por completo y usando
AWS Systems Manager Session Manager para administrar la instancia sin exponer el puerto 22
a Internet.
