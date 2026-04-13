"""HTTP middleware and exception formatting for the FastAPI service."""

from __future__ import annotations

import json
import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def configure_logging() -> None:
    """Configure a simple structured logger for the API."""
    logging.basicConfig(level=logging.INFO, format="%(message)s", force=True)


def add_api_middleware(app: FastAPI) -> None:
    """Attach request logging and formatted error handlers to an app."""

    @app.middleware("http")
    async def request_timing_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        started_at = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started_at) * 1000.0
        response.headers["X-Request-ID"] = request_id
        logging.info(
            json.dumps(
                {
                    "event": "request_complete",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(elapsed_ms, 2),
                }
            )
        )
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        """Return a formatted JSON response for handled HTTP errors."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": str(exc.detail),
                "status_code": exc.status_code,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Return a formatted JSON response for validation errors."""
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Request validation failed.",
                "status_code": 422,
                "request_id": getattr(request.state, "request_id", None),
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Return a formatted JSON response for unexpected errors."""
        logging.exception("Unhandled API exception", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error.",
                "status_code": 500,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
