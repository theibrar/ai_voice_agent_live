package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ramzan/backend-chatbot/internal/config"
	"github.com/redis/go-redis/v9"
)

func NewRedisClient(cfg *config.Config) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		// If password auth failed or rejected, try without password
		if cfg.RedisPassword != "" {
			rdbNoPass := redis.NewClient(&redis.Options{
				Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
				Password: "",
				DB:       0,
			})
			if pingErr := rdbNoPass.Ping(ctx).Err(); pingErr == nil {
				log.Println("Redis connected successfully without password authentication.")
				return rdbNoPass, nil
			}
		}
		log.Printf("Warning: Redis ping failed (%v). Continuing in standalone mode.", err)
		return rdb, nil
	}

	log.Println("Redis client connected successfully!")
	return rdb, nil
}
