# Wazuh SOC Lab Setup Guide

## 1. Requirements

- Linux or macOS with Docker Engine or Docker Desktop running.
- Docker Compose v2 (`docker compose`).
- At least 8 CPU cores, 16 GB of RAM, and 40 GB of free disk space are
  recommended when running Wazuh, IRIS, and crAPI together.
- On Linux, increase `vm.max_map_count` for Wazuh Indexer:

  ```bash
  sudo sysctl -w vm.max_map_count=262144
  ```

Verify the required tools:

```bash
docker --version
docker compose version
```

## 2. Prepare the Shared Network

IRIS uses the external `soc_shared` network. Create it once before starting the
lab:

```bash
docker network inspect soc_shared >/dev/null 2>&1 || docker network create soc_shared
```

## 3. Start Wazuh

```bash
cd src/wazuh-lab/single-node
cp ../.env.example .env
docker compose -f generate-indexer-certs.yml run --rm generator
docker compose up -d
docker compose ps
```

The dashboard is available at `https://localhost:443` by default. The browser
will warn about the self-signed certificate used by the lab. Sample credentials
are defined in the Compose configuration and must be changed before deployment
beyond a local development machine.

The Compose file currently binds manager ports to the lab IP `172.16.1.1`. If
that address is not assigned to the host, remove the `172.16.1.1:` prefix from
the relevant `ports` entries before starting the stack.

## 4. Start DFIR-IRIS

```bash
cd src/iris-web
cp .env.example .env
# Replace all change_me values in .env before starting the stack.
docker compose pull
docker compose up -d
docker compose ps
```

IRIS is available at `https://localhost`. The initial `administrator` password
is printed in the application service logs:

```bash
docker compose logs app | grep 'create_safe_admin'
```

## 5. Start crAPI

The lab Compose configuration bind-mounts a log directory, so create it before
starting the stack:

```bash
cd src/crapi/deploy/docker
mkdir -p logs/crapi-web
docker compose pull
docker compose --compatibility up -d
docker compose ps
```

The current port bindings use the lab IP `10.10.1.130`. If that address is not
assigned to the host, change the two `ports` mappings for the `network-router`
service in `docker-compose.yml` to `8889:8888` and `8026:8025`. You can then
access crAPI at `http://localhost:8889` and MailHog at
`http://localhost:8026`.

## 6. Verify and Stop the Lab

Check each stack with `docker compose ps` and inspect errors with
`docker compose logs --tail=100`. Stop each stack from its corresponding
Compose directory:

```bash
docker compose down
```

Use `docker compose down -v` only when you intend to delete all volume data and
accept that the lab data cannot be recovered.

## Detailed Documentation

- `src/crapi/README.md` and `src/crapi/docs/setup.md`
- `src/iris-web/README.md` and `src/iris-web/CONFIGURATION.md`
- `src/wazuh-lab/single-node/README.md`
- `src/wazuh-lab/LAB_CONFIG_REVIEW.md`
