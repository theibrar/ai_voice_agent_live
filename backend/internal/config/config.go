package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Port               string `mapstructure:"PORT"`
	Env                string `mapstructure:"ENV"`
	DBHost             string `mapstructure:"DB_HOST"`
	DBPort             string `mapstructure:"DB_PORT"`
	DBUser             string `mapstructure:"DB_USER"`
	DBPassword         string `mapstructure:"DB_PASSWORD"`
	DBName             string `mapstructure:"DB_NAME"`
	DBSSLMode          string `mapstructure:"DB_SSLMODE"`
	RedisHost          string `mapstructure:"REDIS_HOST"`
	RedisPort          string `mapstructure:"REDIS_PORT"`
	RedisPassword      string `mapstructure:"REDIS_PASSWORD"`
	JWTSecret          string `mapstructure:"JWT_SECRET"`
	JWTExpirationHours int    `mapstructure:"JWT_EXPIRATION_HOURS"`
	OpenAIAPIKey       string `mapstructure:"OPENAI_API_KEY"`
	GeminiAPIKey       string `mapstructure:"GEMINI_API_KEY"`
	DeepSeekAPIKey     string `mapstructure:"DEEPSEEK_API_KEY"`
}

func LoadConfig() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")

	// Fallback environment variable values
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "5432")
	viper.SetDefault("DB_USER", "postgres")
	viper.SetDefault("DB_PASSWORD", "postgres")
	viper.SetDefault("DB_NAME", "chatbot_db")
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("REDIS_PASSWORD", "redispassword")
	viper.SetDefault("JWT_SECRET", "default_secret_key")
	viper.SetDefault("JWT_EXPIRATION_HOURS", 24)
	viper.SetDefault("OPENAI_API_KEY", "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")
	viper.SetDefault("GEMINI_API_KEY", "AQ.Ab8RN6JyfBrZTS8O8PnGvOTH59Aqm0F3V98uUcs9RDzbbCmlFQ")
	viper.SetDefault("DEEPSEEK_API_KEY", "sk-6afcb9c9ea194924b7037362f7aaa30f")

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: .env file not found, using default/environment variables: %v", err)
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
