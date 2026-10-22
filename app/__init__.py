import os

from flask import Flask
from prometheus_client import CollectorRegistry
from prometheus_flask_exporter import PrometheusMetrics

def create_app():
    app = Flask(__name__)

    PrometheusMetrics(app, registry=CollectorRegistry())

    from app.routes import main
    app.register_blueprint(main)

    @app.context_processor
    def inject_version():
        return {"app_version": os.environ.get("APP_VERSION", "dev")}

    return app
