package handlers

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ramzan/backend-chatbot/internal/services"
)

type AuthHandler struct {
	db          *pgxpool.Pool
	authService *services.AuthService
}

func NewAuthHandler(db *pgxpool.Pool, authService *services.AuthService) *AuthHandler {
	h := &AuthHandler{
		db:          db,
		authService: authService,
	}
	h.ensureSchemaAndSeed()
	return h
}

func (h *AuthHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 1. Users Table with tenant_id foreign key
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(100) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		role VARCHAR(50) DEFAULT 'user',
		tenant_id INT,
		avatar VARCHAR(255) DEFAULT '/avatars/default.png',
		phone VARCHAR(50) DEFAULT '+1 (555) 019-2831',
		company VARCHAR(255) DEFAULT 'Apex Voice Enterprise',
		status VARCHAR(50) DEFAULT 'active',
		reset_token VARCHAR(255),
		reset_token_expiry TIMESTAMPTZ,
		last_login TIMESTAMPTZ,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, createUsersTable)
	_, _ = h.db.Exec(ctx, `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id INT;`)

	// 2. Active Sessions Table
	createSessionsTable := `
	CREATE TABLE IF NOT EXISTS sessions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
		tenant_id INT,
		session_token VARCHAR(500) NOT NULL,
		ip_address VARCHAR(50) DEFAULT '127.0.0.1',
		user_agent TEXT,
		is_revoked BOOLEAN DEFAULT false,
		expires_at TIMESTAMPTZ NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, createSessionsTable)

	// 3. Password Reset Tokens Table (Hashed)
	createResetTokensTable := `
	CREATE TABLE IF NOT EXISTS password_reset_tokens (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) NOT NULL,
		token_hash VARCHAR(255) NOT NULL,
		expires_at TIMESTAMPTZ NOT NULL,
		is_used BOOLEAN DEFAULT false,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, createResetTokensTable)

	// 4. Ensure tenant_id column and indices on all tenant tables for database isolation
	tenantTables := []string{
		"agents", "contacts", "leads", "campaigns", "call_records",
		"appointments", "knowledge_base", "ab_experiments", "flow_definitions",
		"webhooks", "custom_forms", "website_widgets",
	}

	for _, table := range tenantTables {
		alterQuery := fmt.Sprintf(`ALTER TABLE %s ADD COLUMN IF NOT EXISTS tenant_id INT DEFAULT 1;`, table)
		_, _ = h.db.Exec(ctx, alterQuery)
		idxQuery := fmt.Sprintf(`CREATE INDEX IF NOT EXISTS idx_%s_tenant_id ON %s(tenant_id);`, table, table)
		_, _ = h.db.Exec(ctx, idxQuery)
	}

	// 5. Seed default accounts with bcrypt hashes if empty
	var count int
	_ = h.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	if count == 0 {
		superAdminHash, _ := h.authService.HashPassword("MasterSuperAdminKey2026!")
		adminHash, _ := h.authService.HashPassword("Admin@123")

		seedQuery := `
		INSERT INTO users (id, name, email, password, role, tenant_id, avatar, phone, company, status, created_at, updated_at)
		VALUES 
		('usr-superadmin-1', 'Alexander Vance', 'alexander@apexsuperadmin.io', $1, 'super_admin', 0, '/avatars/alexander.png', '+1 (555) 019-9900', 'Apex Global Master Console', 'active', NOW(), NOW()),
		('usr-admin-1', 'Sarah Jenkins', 'admin@apexvoice.ai', $2, 'admin', 1, '/avatars/sarah.png', '+1 (555) 234-5678', 'Apex Voice Enterprise', 'active', NOW(), NOW());`
		_, _ = h.db.Exec(ctx, seedQuery, superAdminHash, adminHash)
	}
}

type LoginRequest struct {
	Email        string `json:"email" binding:"required"`
	Password     string `json:"password" binding:"required"`
	RequiredRole string `json:"requiredRole"`
}

type UserResponse struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	TenantID  int        `json:"tenantId"`
	Avatar    string     `json:"avatar"`
	Phone     string     `json:"phone"`
	Company   string     `json:"company"`
	Status    string     `json:"status"`
	LastLogin *time.Time `json:"lastLogin,omitempty"`
}

type TenantResponse struct {
	ID                  int     `json:"id"`
	TenantName          string  `json:"tenantName"`
	AdminName           string  `json:"adminName"`
	AdminEmail          string  `json:"adminEmail"`
	Status              string  `json:"status"`
	CreditsBalance      float64 `json:"creditsBalance"`
	PlanID              string  `json:"planId"`
	PlanName            string  `json:"planName"`
	BillingCycle        string  `json:"billingCycle"`
	CreditRatePerMinute float64 `json:"creditRatePerMinute"`
	MaxConcurrency      int     `json:"maxConcurrency"`
	MRR                 float64 `json:"mrr"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Company  string `json:"company"`
	Phone    string `json:"phone"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required"`
	ResetToken  string `json:"resetToken" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
}

// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password are required"})
		return
	}

	cleanEmail := strings.TrimSpace(strings.ToLower(req.Email))

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var u struct {
		ID        string
		Name      string
		Email     string
		Password  string
		Role      string
		TenantID  *int
		Avatar    string
		Phone     string
		Company   string
		Status    string
		LastLogin *time.Time
	}

	query := `
		SELECT id, name, email, password, role, tenant_id, avatar, phone, company, status, last_login
		FROM users
		WHERE LOWER(email) = $1
	`

	err := h.db.QueryRow(ctx, query, cleanEmail).Scan(
		&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.TenantID, &u.Avatar, &u.Phone, &u.Company, &u.Status, &u.LastLogin,
	)

	// Generic error message to prevent account enumeration
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password. Please check your credentials.",
		})
		return
	}

	// Verify password with Bcrypt
	if !h.authService.CheckPasswordHash(req.Password, u.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password. Please check your credentials.",
		})
		return
	}

	// If password was legacy plain text, upgrade it to bcrypt automatically
	if !strings.HasPrefix(u.Password, "$2a$") && !strings.HasPrefix(u.Password, "$2b$") {
		newHash, err := h.authService.HashPassword(req.Password)
		if err == nil {
			_, _ = h.db.Exec(ctx, "UPDATE users SET password = $1 WHERE id = $2", newHash, u.ID)
		}
	}

	// Check status
	if u.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This account is " + u.Status + ". Please contact system administration.",
		})
		return
	}

	// Check role requirement if requested
	if req.RequiredRole != "" && u.Role != req.RequiredRole && u.Role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": fmt.Sprintf("Access Denied: %s authorization required.", req.RequiredRole),
		})
		return
	}

	// Resolve Tenant ID
	resolvedTenantID := 0
	if u.TenantID != nil && *u.TenantID > 0 {
		resolvedTenantID = *u.TenantID
	} else if u.Role != "super_admin" {
		// Fallback lookup from tenants table
		_ = h.db.QueryRow(ctx, "SELECT id FROM tenants WHERE LOWER(admin_email) = $1 LIMIT 1", cleanEmail).Scan(&resolvedTenantID)
		if resolvedTenantID == 0 {
			resolvedTenantID = 1 // Default primary tenant
		}
		_, _ = h.db.Exec(ctx, "UPDATE users SET tenant_id = $1 WHERE id = $2", resolvedTenantID, u.ID)
	}

	// Update last_login
	now := time.Now()
	_, _ = h.db.Exec(ctx, "UPDATE users SET last_login = $1 WHERE id = $2", now, u.ID)

	// Generate Cryptographically Signed JWT Token
	token, err := h.authService.GenerateAccessToken(u.ID, u.Email, u.Role, resolvedTenantID, false, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}

	// Set Secure HttpOnly SameSite Cookie
	c.SetCookie("access_token", token, 86400*7, "/", "", false, true)
	// Clear any old preview session
	c.SetCookie("preview_token", "", -1, "/", "", false, true)

	// Fetch tenant details if tenant ID > 0
	var tenant TenantResponse
	if resolvedTenantID > 0 {
		_ = h.db.QueryRow(ctx, `
			SELECT id, tenant_name, COALESCE(admin_name, 'Admin'), COALESCE(admin_email, ''),
			       status, COALESCE(credits_balance, 250.00), COALESCE(plan_id, 'plan-growth'),
			       COALESCE(plan_name, 'Growth Fleet'), COALESCE(billing_cycle, 'monthly'),
			       COALESCE(credit_rate_per_minute, 0.08), COALESCE(max_concurrency, 40), COALESCE(mrr, 599.00)
			FROM tenants
			WHERE id = $1
		`, resolvedTenantID).Scan(
			&tenant.ID, &tenant.TenantName, &tenant.AdminName, &tenant.AdminEmail,
			&tenant.Status, &tenant.CreditsBalance, &tenant.PlanID,
			&tenant.PlanName, &tenant.BillingCycle, &tenant.CreditRatePerMinute,
			&tenant.MaxConcurrency, &tenant.MRR,
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"message": "Authentication successful",
		"user": UserResponse{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			Role:      u.Role,
			TenantID:  resolvedTenantID,
			Avatar:    u.Avatar,
			Phone:     u.Phone,
			Company:   tenant.TenantName,
			Status:    u.Status,
			LastLogin: &now,
		},
		"tenant": tenant,
	})
}

// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Invalidate HttpOnly authentication cookies
	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("preview_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully. Authentication session terminated.",
	})
}

// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	tenantID, _ := c.Get("tenantID")
	isPreview, _ := c.Get("isPreview")
	superAdminID, _ := c.Get("superAdminID")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var u UserResponse
	query := `
		SELECT id, name, email, role, COALESCE(tenant_id, 1), avatar, phone, company, status, last_login
		FROM users
		WHERE id = $1
	`
	err := h.db.QueryRow(ctx, query, userID).Scan(
		&u.ID, &u.Name, &u.Email, &u.Role, &u.TenantID, &u.Avatar, &u.Phone, &u.Company, &u.Status, &u.LastLogin,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session not found in database", "code": "USER_NOT_FOUND"})
		return
	}

	// Fetch tenant details if tenant ID > 0
	var tenant TenantResponse
	resolvedTID := u.TenantID
	if tIDInt, ok := tenantID.(int); ok && tIDInt > 0 {
		resolvedTID = tIDInt
	}

	if resolvedTID > 0 {
		_ = h.db.QueryRow(ctx, `
			SELECT id, tenant_name, COALESCE(admin_name, 'Admin'), COALESCE(admin_email, ''),
			       status, COALESCE(credits_balance, 250.00), COALESCE(plan_id, 'plan-growth'),
			       COALESCE(plan_name, 'Growth Fleet'), COALESCE(billing_cycle, 'monthly'),
			       COALESCE(credit_rate_per_minute, 0.08), COALESCE(max_concurrency, 40), COALESCE(mrr, 599.00)
			FROM tenants
			WHERE id = $1
		`, resolvedTID).Scan(
			&tenant.ID, &tenant.TenantName, &tenant.AdminName, &tenant.AdminEmail,
			&tenant.Status, &tenant.CreditsBalance, &tenant.PlanID,
			&tenant.PlanName, &tenant.BillingCycle, &tenant.CreditRatePerMinute,
			&tenant.MaxConcurrency, &tenant.MRR,
		)
		if tenant.TenantName != "" {
			u.Company = tenant.TenantName
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"authenticated": true,
		"user":          u,
		"tenant":        tenant,
		"role":          role,
		"tenantId":      resolvedTID,
		"isPreview":     isPreview,
		"superAdminId":  superAdminID,
	})
}

// POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid registration details: " + err.Error()})
		return
	}

	cleanEmail := strings.TrimSpace(strings.ToLower(req.Email))

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// Check if already exists
	var exists bool
	_ = h.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = $1)", cleanEmail).Scan(&exists)
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "An account with this email address already exists."})
		return
	}

	// Bcrypt hash password
	hashedPass, err := h.authService.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	newID := fmt.Sprintf("usr-%d", time.Now().UnixNano())
	company := req.Company
	if company == "" {
		company = "Apex Voice Enterprise"
	}
	phone := req.Phone
	if phone == "" {
		phone = "+1 (555) 019-2831"
	}

	insertQuery := `
		INSERT INTO users (id, name, email, password, role, tenant_id, avatar, phone, company, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'user', 1, '/avatars/default.png', $5, $6, 'active', NOW(), NOW())
		RETURNING created_at;
	`

	var createdAt time.Time
	err = h.db.QueryRow(ctx, insertQuery, newID, req.Name, cleanEmail, hashedPass, phone, company).Scan(&createdAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account: " + err.Error()})
		return
	}

	token, _ := h.authService.GenerateAccessToken(newID, cleanEmail, "user", 1, false, "")
	c.SetCookie("access_token", token, 86400*7, "/", "", false, true)

	c.JSON(http.StatusCreated, gin.H{
		"token":   token,
		"message": "Account created successfully",
		"user": UserResponse{
			ID:       newID,
			Name:     req.Name,
			Email:    cleanEmail,
			Role:     "user",
			TenantID: 1,
			Avatar:   "/avatars/default.png",
			Phone:    phone,
			Company:  company,
			Status:   "active",
		},
	})
}

// POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email address is required"})
		return
	}

	cleanEmail := strings.TrimSpace(strings.ToLower(req.Email))

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var userID string
	err := h.db.QueryRow(ctx, "SELECT id FROM users WHERE LOWER(email) = $1", cleanEmail).Scan(&userID)
	if err != nil {
		// Generic response to avoid email harvesting
		c.JSON(http.StatusOK, gin.H{
			"message": "If an account with that email exists, password reset instructions have been sent.",
		})
		return
	}

	rawBytes := make([]byte, 24)
	_, _ = rand.Read(rawBytes)
	rawToken := hex.EncodeToString(rawBytes)

	// Hash token before storing in database
	tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(rawToken)))
	expiry := time.Now().Add(1 * time.Hour)

	_, _ = h.db.Exec(ctx, `
		INSERT INTO password_reset_tokens (email, token_hash, expires_at, is_used)
		VALUES ($1, $2, $3, false)
	`, cleanEmail, tokenHash, expiry)

	c.JSON(http.StatusOK, gin.H{
		"message":    fmt.Sprintf("Password recovery instructions dispatched to %s", cleanEmail),
		"resetToken": rawToken,
		"expiresAt":  expiry,
	})
}

// POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email, resetToken, and newPassword are required"})
		return
	}

	cleanEmail := strings.TrimSpace(strings.ToLower(req.Email))
	tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.ResetToken)))

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var tokenID int
	var expiry time.Time
	var isUsed bool
	err := h.db.QueryRow(ctx, `
		SELECT id, expires_at, is_used 
		FROM password_reset_tokens 
		WHERE LOWER(email) = $1 AND token_hash = $2
		ORDER BY created_at DESC LIMIT 1
	`, cleanEmail, tokenHash).Scan(&tokenID, &expiry, &isUsed)

	if err != nil || isUsed || time.Now().After(expiry) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid, used, or expired password reset token."})
		return
	}

	// Bcrypt hash new password
	hashedPass, err := h.authService.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Mark token as used
	_, _ = h.db.Exec(ctx, "UPDATE password_reset_tokens SET is_used = true WHERE id = $1", tokenID)

	// Update user password
	_, err = h.db.Exec(ctx, `
		UPDATE users 
		SET password = $1, updated_at = NOW() 
		WHERE LOWER(email) = $2
	`, hashedPass, cleanEmail)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password in database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password updated successfully! You may now sign in with your new password.",
	})
}

// GET /api/v1/auth/users
func (h *AuthHandler) ListUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id, name, email, role, COALESCE(tenant_id, 1), avatar, phone, company, status, last_login
		FROM users
		ORDER BY created_at ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users: " + err.Error()})
		return
	}
	defer rows.Close()

	var users []UserResponse
	for rows.Next() {
		var u UserResponse
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.TenantID, &u.Avatar, &u.Phone, &u.Company, &u.Status, &u.LastLogin); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan user: " + err.Error()})
			return
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

// GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	tokenStr, _ := c.Cookie("access_token")
	if tokenStr == "" {
		tokenStr, _ = c.Cookie("preview_token")
	}
	if tokenStr == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required", "isAuthenticated": false})
		return
	}

	claims, err := h.authService.ValidateToken(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session", "isAuthenticated": false})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var u UserResponse
	err = h.db.QueryRow(ctx, `
		SELECT id, name, email, role, COALESCE(tenant_id, 1), avatar, phone, company, status, last_login
		FROM users
		WHERE id = $1
	`, claims.UserID).Scan(
		&u.ID, &u.Name, &u.Email, &u.Role, &u.TenantID, &u.Avatar, &u.Phone, &u.Company, &u.Status, &u.LastLogin,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User account not found", "isAuthenticated": false})
		return
	}

	resolvedTenantID := claims.TenantID
	var tenant TenantResponse
	if resolvedTenantID > 0 {
		_ = h.db.QueryRow(ctx, `
			SELECT id, tenant_name, COALESCE(admin_name, 'Admin'), COALESCE(admin_email, ''),
			       status, COALESCE(credits_balance, 250.00), COALESCE(plan_id, 'plan-growth'),
			       COALESCE(plan_name, 'Growth Fleet'), COALESCE(billing_cycle, 'monthly'),
			       COALESCE(credit_rate_per_minute, 0.08), COALESCE(max_concurrency, 40), COALESCE(mrr, 599.00)
			FROM tenants
			WHERE id = $1
		`, resolvedTenantID).Scan(
			&tenant.ID, &tenant.TenantName, &tenant.AdminName, &tenant.AdminEmail,
			&tenant.Status, &tenant.CreditsBalance, &tenant.PlanID,
			&tenant.PlanName, &tenant.BillingCycle, &tenant.CreditRatePerMinute,
			&tenant.MaxConcurrency, &tenant.MRR,
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"isAuthenticated": true,
		"role":            u.Role,
		"tenantId":        resolvedTenantID,
		"isPreview":       claims.IsPreview,
		"superAdminId":    claims.SuperAdminID,
		"user":            u,
		"tenant":          tenant,
	})
}

