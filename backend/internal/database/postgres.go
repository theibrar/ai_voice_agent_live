package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ramzan/backend-chatbot/internal/config"
)

func NewPostgresPool(cfg *config.Config) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSSLMode)

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database DSN: %w", err)
	}

	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5
	poolConfig.MaxConnLifetime = 30 * time.Minute

	var pool *pgxpool.Pool
	var lastErr error

	// Retry connection up to 10 times (20 seconds) to ensure Postgres is ready
	for attempt := 1; attempt <= 10; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		pool, lastErr = pgxpool.NewWithConfig(ctx, poolConfig)
		if lastErr == nil {
			if pingErr := pool.Ping(ctx); pingErr == nil {
				cancel()
				log.Println("PostgreSQL connection pool initialized successfully!")
				return pool, nil
			} else {
				lastErr = pingErr
				pool.Close()
			}
		}
		cancel()
		log.Printf("[Attempt %d/10] Waiting for PostgreSQL at %s:%s... (%v)", attempt, cfg.DBHost, cfg.DBPort, lastErr)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("unable to connect to PostgreSQL after multiple attempts: %w", lastErr)
}
