"""Formatos de erro que o front ja espera (services/api.ts e os componentes).

- Validacao de campos (POST /api/experiences): 400 {"fieldErrors": {campo: mensagem}}
- Demais erros: {"error": "mensagem"} com 404 ou 422
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from services.validation import validate_experience


class ApiError(Exception):
    def __init__(
        self, status_code: int, message: str, headers: dict[str, str] | None = None
    ):
        self.status_code = status_code
        self.message = message
        self.headers = headers


class FieldValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]):
        self.field_errors = field_errors


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(_: Request, exc: ApiError):
        return JSONResponse(
            {"error": exc.message}, status_code=exc.status_code, headers=exc.headers
        )

    @app.exception_handler(FieldValidationError)
    async def field_error_handler(_: Request, exc: FieldValidationError):
        return JSONResponse({"fieldErrors": exc.field_errors}, status_code=400)

    @app.exception_handler(RequestValidationError)
    async def body_error_handler(request: Request, _: RequestValidationError):
        # Corpo ausente ou JSON invalido.
        if request.method == "POST" and request.url.path == "/api/experiences":
            return JSONResponse(
                {"fieldErrors": validate_experience({})}, status_code=400
            )
        return JSONResponse({"error": "Requisição inválida"}, status_code=422)
