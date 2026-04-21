FROM python:3.12-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    # WeasyPrint system deps (pango/glib) installed separately to isolate network failures
    && apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info \
    && rm -rf /var/lib/apt/lists/* \
    || true

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv

# Copy dependency definition
COPY pyproject.toml .

# Install Python dependencies
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY . .

# Dev target: run with reload
FROM base AS dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
