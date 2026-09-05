package services

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type JWTClaims struct {
	UserID       string `json:"user_id"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	TenantID     int    `json:"tenant_id"`
	IsPreview    bool   `json:"is_preview,omitempty"`
	SuperAdminID string `json:"super_admin_id,omitempty"`
	jwt.RegisteredClaims
}

type AuthService struct {
	secretKey []byte
	expHours  int
}

func NewAuthService(secretKey string, expHours int) *AuthService {
	if secretKey == "" {
		secretKey = "apex-voice-ai-super-secure-jwt-signing-key-2026"
	}
	if expHours <= 0 {
		expHours = 24
	}
	return &AuthService{
		secretKey: []byte(secretKey),
		expHours:  expHours,
	}
}

// HashPassword generates a bcrypt hash of the password
func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

// CheckPasswordHash verifies a password against a hash with legacy fallback
func (s *AuthService) CheckPasswordHash(password, hash string) bool {
	// If it's a bcrypt hash
	if strings.HasPrefix(hash, "$2a$") || strings.HasPrefix(hash, "$2b$") || strings.HasPrefix(hash, "$2y$") {
		err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
		return err == nil
	}
	// Legacy plain-text fallback (during transition)
	return password == hash
}

// GenerateAccessToken creates a signed JWT access token containing tenant and user context
func (s *AuthService) GenerateAccessToken(userID, email, role string, tenantID int, isPreview bool, superAdminID string) (string, error) {
	expDuration := time.Duration(s.expHours) * time.Hour
	if isPreview {
		expDuration = 30 * time.Minute // Preview sessions are strictly short-lived
	}

	claims := &JWTClaims{
		UserID:       userID,
		Email:        email,
		Role:         role,
		TenantID:     tenantID,
		IsPreview:    isPreview,
		SuperAdminID: superAdminID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "apex-voice-auth",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secretKey)
}

// GeneratePreviewToken creates a server-authorized short-lived preview session for Super Admin
func (s *AuthService) GeneratePreviewToken(superAdminID, superAdminEmail string, targetTenantID int) (string, error) {
	return s.GenerateAccessToken(superAdminID, superAdminEmail, "admin", targetTenantID, true, superAdminID)
}

// ValidateToken parses, validates signature and expiration of JWT
func (s *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	tokenString = strings.TrimSpace(tokenString)
	if tokenString == "" {
		return nil, errors.New("empty token")
	}

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing algorithm")
		}
		return s.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid or expired authentication token")
	}

	return claims, nil
}
