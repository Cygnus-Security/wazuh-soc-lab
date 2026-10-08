FROM python:3.11-slim
# Install required system packages for compiling hnswlib
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY requirements.txt /app/requirements.txt
# Install any needed dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY src /app
COPY certs /app/certs
COPY retrieval /app/retrieval
RUN mkdir -p /app/vectorstore
RUN mkdir -p /app/resources
COPY src/resources/crapi-openapi-spec.json /app/resources/crapi-openapi-spec.json
ENV PYTHONPATH="/app"
COPY entrypoint.sh /app/entrypoint.sh
CMD /app/entrypoint.sh
EXPOSE 5002 5500