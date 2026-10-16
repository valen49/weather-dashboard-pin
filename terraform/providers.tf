terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "pin-terraform-state-506581103804"
    key            = "pin/weather-dashboard-pin/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "pin-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}
