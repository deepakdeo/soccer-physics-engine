"""FastAPI application entrypoint."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.dependencies import get_app_config
from src.api.middleware import add_api_middleware, configure_logging
from src.api.routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    config = get_app_config()
    configure_logging()
    app = FastAPI(
        title=str(config.app_name),
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    add_api_middleware(app)
    app.include_router(router)
    return app


app = create_app()
