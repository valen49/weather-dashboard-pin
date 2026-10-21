variable "vm_name" {
  description = "Nombre de la VM en VirtualBox"
  type        = string
  default     = "pin-weather-dashboard-local"
}

variable "vm_memory_mb" {
  description = "Memoria RAM asignada a la VM (MB)"
  type        = number
  default     = 2048
}

variable "vm_cpus" {
  description = "CPUs asignadas a la VM"
  type        = number
  default     = 2
}

variable "vm_disk_mb" {
  description = "Tamaño del disco virtual (MB)"
  type        = number
  default     = 12000
}

variable "ssh_port" {
  description = "Puerto en el host (127.0.0.1) reenviado al SSH (22) de la VM"
  type        = number
  default     = 2222
}

variable "app_port" {
  description = "Puerto en el host reenviado a la app Flask (5000) de la VM"
  type        = number
  default     = 5000
}

variable "grafana_port" {
  description = "Puerto en el host reenviado a Grafana (3000) de la VM"
  type        = number
  default     = 3000
}

variable "prometheus_port" {
  description = "Puerto en el host reenviado a Prometheus (9090) de la VM"
  type        = number
  default     = 9090
}

variable "iso_path" {
  description = "Ruta local a la ISO de Ubuntu Server 22.04 ya descargada"
  type        = string
  default     = "/home/valen/vm-isos/ubuntu-22.04-live-server-amd64.iso"
}

variable "vm_user" {
  description = "Usuario a crear dentro de la VM vía unattended install"
  type        = string
  default     = "ubuntu"
}

variable "vm_password" {
  description = "Password del usuario dentro de la VM (solo accesible via localhost, infra efimera)"
  type        = string
  default     = "pin-local-2026!"
  sensitive   = true
}

variable "grafana_admin_user" {
  description = "Usuario admin de Grafana dentro de la VM local"
  type        = string
  default     = "admin"
}

variable "grafana_admin_password" {
  description = "Password admin de Grafana dentro de la VM local"
  type        = string
  default     = "pin-grafana-local-2026!"
  sensitive   = true
}
