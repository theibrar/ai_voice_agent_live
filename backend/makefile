# Load environment variables from .env file if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Default fallback variables
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_NAME ?= chatbot_db
DB_SSLMODE ?= disable
DB_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)

MIGRATIONS_PATH ?= db/migrations

.PHONY: run migrate-up migrate-down compose-up compose-down

run:
	go run main.go

compose-up:
	docker-compose up -d

compose-down:
	docker-compose down

migrate-up:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" up

migrate-down:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" down 1