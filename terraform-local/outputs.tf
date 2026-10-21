output "app_url" {
  description = "URL local de la app"
  value       = "http://localhost:${var.app_port}"
}

output "grafana_url" {
  description = "URL local de Grafana"
  value       = "http://localhost:${var.grafana_port}"
}

output "prometheus_url" {
  description = "URL local de Prometheus"
  value       = "http://localhost:${var.prometheus_port}"
}

output "ssh_comando" {
  description = "Comando para conectarse por SSH a la VM"
  value       = "ssh -p ${var.ssh_port} ${var.vm_user}@127.0.0.1"
}
