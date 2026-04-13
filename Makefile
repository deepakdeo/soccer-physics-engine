DOCKER_IMAGE ?= spe:latest

dev:
	uv sync --extra dev

test:
	uv run pytest tests/ -v

lint:
	uv run ruff check src/ tests/

typecheck:
	uv run mypy src/

format:
	uv run ruff format src/ tests/

run-api:
	uv run python -m uvicorn src.api.main:app --reload

docker-build:
	docker build -t $(DOCKER_IMAGE) .

docker-run:
	docker run --rm -p 8000:8000 $(DOCKER_IMAGE)
