package services

import (
	"testing"
)

func TestPasswordHashingAndVerification(t *testing.T) {
	authService := NewAuthService("test_secret_key_2026", 1)

	rawPassword := "SecureP@ssw0rd2026!"

	// 1. Hash password
	hash, err := authService.HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == rawPassword {
		t.Fatal("Hash cannot be equal to plain text password")
	}

	// 2. Verify correct password
	if !authService.CheckPasswordHash(rawPassword, hash) {
		t.Errorf("Expected password verification to succeed for valid password")
	}

	// 3. Reject wrong password
	if authService.CheckPasswordHash("WrongPassword!", hash) {
		t.Errorf("Expected password verification to fail for invalid password")
	}
}

func TestTenantJWTGenerationAndValidation(t *testing.T) {
	secret := "test_secret_key_2026"
	authService := NewAuthService(secret, 1)

	userID := "usr-admin-test-1"
	email := "admin@tenant-alpha.com"
	role := "admin"
	tenantID := 42

	// 1. Generate Access Token
	token, err := authService.GenerateAccessToken(userID, email, role, tenantID, false, "")
	if err != nil {
		t.Fatalf("Failed to generate access token: %v", err)
	}

	if token == "" {
		t.Fatal("Generated token is empty")
	}

	// 2. Validate Token
	claims, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}

	if claims.TenantID != tenantID {
		t.Errorf("Expected TenantID %d, got %d", tenantID, claims.TenantID)
	}

	if claims.Role != role {
		t.Errorf("Expected Role %s, got %s", role, claims.Role)
	}

	if claims.IsPreview {
		t.Errorf("Expected IsPreview to be false")
	}
}

func TestSuperAdminPreviewToken(t *testing.T) {
	secret := "test_secret_key_2026"
	authService := NewAuthService(secret, 1)

	superAdminID := "usr-superadmin-1"
	superAdminEmail := "alexander@apexsuperadmin.io"
	targetTenantID := 99

	// Generate Preview Token
	token, err := authService.GeneratePreviewToken(superAdminID, superAdminEmail, targetTenantID)
	if err != nil {
		t.Fatalf("Failed to generate preview token: %v", err)
	}

	claims, err := authService.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate preview token: %v", err)
	}

	if !claims.IsPreview {
		t.Errorf("Expected IsPreview to be true")
	}

	if claims.TenantID != targetTenantID {
		t.Errorf("Expected TenantID %d, got %d", targetTenantID, claims.TenantID)
	}

	if claims.SuperAdminID != superAdminID {
		t.Errorf("Expected SuperAdminID %s, got %s", superAdminID, claims.SuperAdminID)
	}
}

func TestTamperedTokenRejection(t *testing.T) {
	authService := NewAuthService("test_secret_key_2026", 1)

	token, _ := authService.GenerateAccessToken("usr-1", "user@test.com", "user", 1, false, "")

	// Tamper with token string
	tamperedToken := token + "tampered"

	_, err := authService.ValidateToken(tamperedToken)
	if err == nil {
		t.Errorf("Expected validation to fail for tampered token")
	}
}
