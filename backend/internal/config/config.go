package config

import (
	"log"
	"os"

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
	viper.SetDefault("REDIS_PASSWORD", "")
	viper.SetDefault("JWT_SECRET", "default_secret_key")
	viper.SetDefault("JWT_EXPIRATION_HOURS", 24)
	viper.SetDefault("OPENAI_API_KEY", "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")
	viper.SetDefault("GEMINI_API_KEY", "AQ.Ab8RN6JyfBrZTS8O8PnGvOTH59Aqm0F3V98uUcs9RDzbbCmlFQ")
	viper.SetDefault("DEEPSEEK_API_KEY", "sk-6afcb9c9ea194924b7037362f7aaa30f")

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Notice: Local .env file not loaded directly (%v), relying on active process environment variables.", err)
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	// Always prioritize direct environment variables passed by Docker Compose / Host
	if h := os.Getenv("DB_HOST"); h != "" {
		cfg.DBHost = h
	}
	if p := os.Getenv("DB_PORT"); p != "" {
		cfg.DBPort = p
	}
	if u := os.Getenv("DB_USER"); u != "" {
		cfg.DBUser = u
	}
	if pass := os.Getenv("DB_PASSWORD"); pass != "" {
		cfg.DBPassword = pass
	}
	if n := os.Getenv("DB_NAME"); n != "" {
		cfg.DBName = n
	}
	if ssl := os.Getenv("DB_SSLMODE"); ssl != "" {
		cfg.DBSSLMode = ssl
	} else if cfg.DBSSLMode == "" {
		cfg.DBSSLMode = "disable"
	}
	if rHost := os.Getenv("REDIS_HOST"); rHost != "" {
		cfg.RedisHost = rHost
	}
	if rPort := os.Getenv("REDIS_PORT"); rPort != "" {
		cfg.RedisPort = rPort
	}
	if rPass := os.Getenv("REDIS_PASSWORD"); rPass != "" {
		cfg.RedisPassword = rPass
	}
	if jwt := os.Getenv("JWT_SECRET"); jwt != "" {
		cfg.JWTSecret = jwt
	}

	return &cfg, nil
}
