membery/server
===

yay docker!
---

### Prerequisites

- Docker
- Docker Compose

### Setup

1. `cp sample.env_file env_file`
2. `docker-compose up --build`

This will fire up the app on port `5000` and expose the postgresql database on
port `5432`.

If you want different ports you can copy **`docker-compose.yml`** to
**`docker-compose.override.yml`** and change the ports however you want.

### Postgresql connection info

Username: `membery`

Password: `membery`
