terraform {
  required_version = ">= 1.5"
}

resource "null_resource" "vm" {
  triggers = {
    vm_name = var.vm_name
  }

  provisioner "local-exec" {
    command = join(" ", [
      "bash", "${path.module}/scripts/create-vm.sh",
      var.vm_name,
      var.vm_memory_mb,
      var.vm_cpus,
      var.vm_disk_mb,
      var.ssh_port,
      var.app_port,
      var.grafana_port,
      var.prometheus_port,
      var.iso_path,
      var.vm_user,
      var.vm_password,
    ])
  }

  provisioner "local-exec" {
    when    = destroy
    command = "bash ${path.module}/scripts/destroy-vm.sh ${self.triggers.vm_name}"
  }
}

resource "null_resource" "provision" {
  depends_on = [null_resource.vm]

  connection {
    type     = "ssh"
    host     = "127.0.0.1"
    port     = var.ssh_port
    user     = var.vm_user
    password = var.vm_password
    timeout  = "20m"
  }

  # El provisioner "file" de Terraform tiene un bug conocido subiendo directorios
  # con subcarpetas por SFTP (colapsa el árbol al contenido del primer archivo).
  # Se empaqueta monitoring/ en un tarball local y se extrae del lado remoto.
  provisioner "local-exec" {
    command = "tar -czf ${path.module}/monitoring.tar.gz -C ${path.module}/../monitoring ."
  }

  provisioner "file" {
    source      = "${path.module}/monitoring.tar.gz"
    destination = "/home/${var.vm_user}/monitoring.tar.gz"
  }

  provisioner "remote-exec" {
    inline = [
      "set -e",
      "mkdir -p /home/${var.vm_user}/monitoring",
      "tar -xzf /home/${var.vm_user}/monitoring.tar.gz -C /home/${var.vm_user}/monitoring",
      "rm /home/${var.vm_user}/monitoring.tar.gz",
      "sudo apt-get update",
      "sudo apt-get install -y docker.io curl",
      "sudo systemctl enable docker",
      "sudo systemctl start docker",
      "sudo mkdir -p /usr/local/lib/docker/cli-plugins",
      "sudo curl -SL https://github.com/docker/compose/releases/download/v5.6.0/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose",
      "sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose",
      "sudo docker pull ghcr.io/valen49/weather-dashboard-pin:latest",
      "sudo docker stop weather-dashboard 2>/dev/null || true",
      "sudo docker rm weather-dashboard 2>/dev/null || true",
      "sudo docker run -d --name weather-dashboard -p 5000:5000 --restart unless-stopped ghcr.io/valen49/weather-dashboard-pin:latest",
      "for i in 1 2 3 4 5; do curl -sf http://localhost:5000/health && break; sleep 5; done",
      "cd /home/${var.vm_user}/monitoring && sudo GRAFANA_ADMIN_USER='${var.grafana_admin_user}' GRAFANA_ADMIN_PASSWORD='${var.grafana_admin_password}' docker compose up -d",
    ]
  }
}
