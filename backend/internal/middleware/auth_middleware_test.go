package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ramzan/backend-chatbot/internal/services"
)

func setupTestRouter(authService *services.AuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// 1. Protected Tenant Route
	tenantRoute := r.Group("/api/v1")
	tenantRoute.Use(AuthRequired(authService), TenantContextMiddleware())
	{
		tenantRoute.GET("/agents", func(c *gin.Context) {
			tenantID, _ := c.Get("tenantID")
			userID, _ := c.Get("userID")
			role, _ := c.Get("role")
			isPreview, _ := c.Get("isPreview")
			c.JSON(http.StatusOK, gin.H{
				"tenantId":  tenantID,
				"userId":    userID,
				"role":      role,
				"isPreview": isPreview,
			})
		})
	}

	// 2. Super Admin Route (RBAC: super_admin)
	saRoute := r.Group("/api/v1/superadmin")
	saRoute.Use(AuthRequired(authService), RequireRole("super_admin"))
	{
		saRoute.GET("/stats", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"stats": "ok"})
		})
	}

	return r
}

func TestUnauthenticatedRequest(t *testing.T) {
	authService := services.NewAuthService("test_secret_key_2026", 1)
	router := setupTestRouter(authService)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/agents", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 Unauthorized, got %d", w.Code)
	}
}

func TestTenantAdminAccess(t *testing.T) {
	authService := services.NewAuthService("test_secret_key_2026", 1)
	router := setupTestRouter(authService)

	token, _ := authService.GenerateAccessToken("usr-admin-1", "admin@apexvoice.ai", "admin", 1, false, "")

	// Test with HttpOnly Cookie
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/agents", nil)
	req.AddCookie(&http.Cookie{
		Name:  "access_token",
		Value: token,
	})
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200 OK, got %d", w.Code)
	}

	// Test that Tenant Admin CANNOT access Super Admin routes (RBAC check)
	wSA := httptest.NewRecorder()
	reqSA, _ := http.NewRequest("GET", "/api/v1/superadmin/stats", nil)
	reqSA.AddCookie(&http.Cookie{
		Name:  "access_token",
		Value: token,
	})
	router.ServeHTTP(wSA, reqSA)

	if wSA.Code != http.StatusForbidden {
		t.Errorf("Expected status 403 Forbidden for Tenant Admin accessing /superadmin, got %d", wSA.Code)
	}
}

func TestSuperAdminAccessAndPreview(t *testing.T) {
	authService := services.NewAuthService("test_secret_key_2026", 1)
	router := setupTestRouter(authService)

	saToken, _ := authService.GenerateAccessToken("usr-superadmin-1", "alexander@apexsuperadmin.io", "super_admin", 0, false, "")

	// 1. Super Admin accesses /superadmin
	wSA := httptest.NewRecorder()
	reqSA, _ := http.NewRequest("GET", "/api/v1/superadmin/stats", nil)
	reqSA.AddCookie(&http.Cookie{
		Name:  "access_token",
		Value: saToken,
	})
	router.ServeHTTP(wSA, reqSA)

	if wSA.Code != http.StatusOK {
		t.Errorf("Expected status 200 OK for Super Admin accessing /superadmin, got %d", wSA.Code)
	}

	// 2. Super Admin in Preview Mode on Tenant 5
	previewToken, _ := authService.GeneratePreviewToken("usr-superadmin-1", "alexander@apexsuperadmin.io", 5)

	wPreview := httptest.NewRecorder()
	reqPreview, _ := http.NewRequest("GET", "/api/v1/agents", nil)
	reqPreview.AddCookie(&http.Cookie{
		Name:  "preview_token",
		Value: previewToken,
	})
	router.ServeHTTP(wPreview, reqPreview)

	if wPreview.Code != http.StatusOK {
		t.Errorf("Expected status 200 OK for Super Admin in Preview Mode, got %d", wPreview.Code)
	}
}
