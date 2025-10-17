#!/bin/bash

docker compose -f ./dockerfiles/docker-compose.yml --env-file ./invoice-parsing/.env up --build -d

docker exec -i pgsql psql -U admin -d invoice_parser < ./db_schema.sql