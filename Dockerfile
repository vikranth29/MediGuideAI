# =============================================================================
# MediGuide AI – Multi-stage Dockerfile
# =============================================================================
# Stage 1 (builder): installs all Python dependencies into an isolated prefix.
# Stage 2 (runtime): copies only the compiled packages into a slim base image,
#   keeping the final image small and free of build toolchains.
# =============================================================================

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

LABEL stage="builder"

# Install OS packages needed to compile any C extensions (e.g. cryptography, grpcio)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        libffi-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy only the requirements file first so Docker can cache this layer.
# The heavy pip install only re-runs when requirements.txt changes.
COPY requirements.txt .

# Install all wheels into a custom prefix so Stage 2 can copy them cleanly.
RUN pip install --upgrade pip \
 && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.13-slim AS runtime

LABEL maintainer="MediGuide AI <contact@mediguide.ai>"
LABEL description="MediGuide AI – AI-powered healthcare web application"

# Add a non-root user for security (never run Flask/gunicorn as root in production)
RUN addgroup --system mediguide \
 && adduser  --system --ingroup mediguide --no-create-home mediguide

# Copy pre-built packages from the builder stage
COPY --from=builder /install /usr/local

# Set working directory
WORKDIR /app

# Copy the application source (everything not excluded by .dockerignore)
COPY . .

# Create the database directory and set ownership so the app can write to it
RUN mkdir -p /app/database \
 && chown -R mediguide:mediguide /app

# Switch to the non-root user for all subsequent commands and at runtime
USER mediguide

# Expose gunicorn's default port
EXPOSE 5000

# Health-check: hit the home page every 30 s; allow 5 failures before marking unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
    CMD python -c \
        "import urllib.request; urllib.request.urlopen('http://localhost:5000/')" \
        || exit 1

# Run gunicorn in production mode.
#   --workers   : 2 × CPU cores + 1 is the standard rule; 2 is safe for a single-core container.
#   --threads   : allow each worker to serve multiple requests concurrently (good for I/O-heavy routes).
#   --bind      : listen on all interfaces so Docker can forward the port.
#   --access-logfile -  : stream access logs to stdout (picked up by docker logs / compose logs).
#   --error-logfile  -  : stream error logs to stderr.
CMD ["gunicorn", \
     "--workers",        "2", \
     "--threads",        "2", \
     "--worker-class",   "gthread", \
     "--bind",           "0.0.0.0:5000", \
     "--access-logfile", "-", \
     "--error-logfile",  "-", \
     "--log-level",      "info", \
     "--timeout",        "120", \
     "app:app"]
