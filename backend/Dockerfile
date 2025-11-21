FROM python:3.11

WORKDIR /app

# Regular python image already has libpq
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app
COPY ./data ./data

RUN mkdir -p /app/index_data

EXPOSE 8000
