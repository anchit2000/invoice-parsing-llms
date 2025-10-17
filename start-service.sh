#!/bin/bash

docker compose -f ./dockerfiles/docker-compose.yml --env-file ./invoice-parsing/.env up --build -d