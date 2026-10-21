#!/bin/bash
# Crea y arranca la VM de VirtualBox para la opcion local del PIN.
# Invocado por Terraform (null_resource.vm, local-exec) con estos argumentos posicionales:
#   1=vm_name 2=memory_mb 3=cpus 4=disk_mb 5=ssh_port 6=app_port 7=grafana_port
#   8=prometheus_port 9=iso_path 10=vm_user 11=vm_password
set -euo pipefail

VM_NAME="$1"
MEMORY="$2"
CPUS="$3"
DISK_MB="$4"
SSH_PORT="$5"
APP_PORT="$6"
GRAFANA_PORT="$7"
PROM_PORT="$8"
ISO_PATH="$9"
VM_USER="${10}"
VM_PASSWORD="${11}"

if VBoxManage list vms | grep -q "\"$VM_NAME\""; then
  echo "La VM $VM_NAME ya existe, no se recrea."
  exit 0
fi

echo "Creando VM $VM_NAME..."
VBoxManage createvm --name "$VM_NAME" --ostype Ubuntu_64 --register

VBoxManage modifyvm "$VM_NAME" \
  --memory "$MEMORY" \
  --cpus "$CPUS" \
  --nic1 nat \
  --natpf1 "ssh,tcp,127.0.0.1,$SSH_PORT,,22" \
  --natpf1 "app,tcp,127.0.0.1,$APP_PORT,,5000" \
  --natpf1 "grafana,tcp,127.0.0.1,$GRAFANA_PORT,,3000" \
  --natpf1 "prometheus,tcp,127.0.0.1,$PROM_PORT,,9090" \
  --audio none \
  --boot1 dvd --boot2 disk --boot3 none --boot4 none

VM_DIR=$(VBoxManage showvminfo "$VM_NAME" --machinereadable | grep '^CfgFile=' | sed 's/CfgFile="\(.*\)\/.*"/\1/')
VDI_PATH="$VM_DIR/$VM_NAME.vdi"

VBoxManage createmedium disk --filename "$VDI_PATH" --size "$DISK_MB"

VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci --portcount 2
VBoxManage storageattach "$VM_NAME" --storagectl "SATA" --port 0 --device 0 --type hdd --medium "$VDI_PATH"

VBoxManage storagectl "$VM_NAME" --name "IDE" --add ide
VBoxManage storageattach "$VM_NAME" --storagectl "IDE" --port 0 --device 0 --type dvddrive --medium "$ISO_PATH"

echo "Lanzando instalacion desatendida de Ubuntu Server..."
# El perfil unattended por defecto de VBoxManage no instala openssh-server ni
# deja sudo sin password — sin esto, Terraform no puede conectarse por SSH
# despues del install, y el remote-exec se cuelga esperando un password de
# sudo que nunca llega (no hay TTY interactivo). Se resuelve en un solo paso
# post-instalacion, dentro del propio sistema ya instalado.
POST_INSTALL_CMD="apt-get install -y openssh-server; systemctl enable ssh; echo '$VM_USER ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-pin-local; chmod 440 /etc/sudoers.d/90-pin-local"

VBoxManage unattended install "$VM_NAME" \
  --iso="$ISO_PATH" \
  --user="$VM_USER" \
  --password="$VM_PASSWORD" \
  --full-user-name="$VM_USER" \
  --hostname="pin-local.weather-dashboard-pin" \
  --post-install-command="$POST_INSTALL_CMD" \
  --start-vm=headless

echo "VM $VM_NAME arrancada, instalando en background. Terraform va a esperar a que SSH responda."
