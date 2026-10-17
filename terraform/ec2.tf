data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "pin_instance" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  key_name               = "pin-key"
  vpc_security_group_ids = [aws_security_group.pin_sg.id]

  user_data = <<-EOF2
              #!/bin/bash
              apt-get update
              apt-get install -y docker.io docker-compose-plugin
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu
              EOF2

  tags = {
    Name    = "pin-weather-dashboard"
    Project = "PIN-DevOps"
  }
}
