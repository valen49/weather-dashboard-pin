#!/bin/bash
# Apaga y elimina la VM de VirtualBox. Invocado por Terraform en destroy-time
# (null_resource.vm, local-exec con when = destroy).
set -euo pipefail

VM_NAME="$1"

if ! VBoxManage list vms | grep -q "\"$VM_NAME\""; then
  echo "La VM $VM_NAME no existe, nada que destruir."
  exit 0
fi

echo "Apagando $VM_NAME (si esta corriendo)..."
VBoxManage controlvm "$VM_NAME" poweroff 2>/dev/null || true
sleep 3

echo "Eliminando $VM_NAME y sus discos..."
VBoxManage unregistervm "$VM_NAME" --delete

echo "VM $VM_NAME destruida."
