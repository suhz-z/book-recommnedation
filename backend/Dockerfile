FROM python:3.11

WORKDIR /app

# Install system dependencies (including libpq-dev for PostgreSQL)

# Install CPU-only PyTorch first (reduces image size)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app
COPY ./data ./data

# Create directory for FAISS index
RUN mkdir -p /app/index_data

EXPOSE 8000

# Railway will use the start command from dashboard
# But include a default for local testing
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
