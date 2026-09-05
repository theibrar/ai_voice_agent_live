package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ramzan/backend-chatbot/internal/services"
)

// AuthRequired validates JWT tokens from HttpOnly cookie or Authorization Bearer header
func AuthRequired(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// 1. For superadmin routes, always use the master access_token
		isSuperAdminRoute := strings.HasPrefix(c.Request.URL.Path, "/api/v1/superadmin")

		if !isSuperAdminRoute {
			// Check preview token cookie first for tenant dashboard inspection
			if previewCookie, err := c.Cookie("preview_token"); err == nil && previewCookie != "" {
				tokenString = previewCookie
			}
		}

		// 2. If no preview token (or on superadmin route), check primary access_token cookie
		if tokenString == "" {
			if cookieToken, err := c.Cookie("access_token"); err == nil && cookieToken != "" {
				tokenString = cookieToken
			}
		}

		// 3. Fallback to Authorization: Bearer <token> header for API / external clients
		if tokenString == "" {
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
					tokenString = parts[1]
				}
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required. Please log in to access this resource.",
				"code":  "UNAUTHENTICATED",
			})
			c.Abort()
			return
		}

		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Session expired or invalid: " + err.Error(),
				"code":  "INVALID_TOKEN",
			})
			c.Abort()
			return
		}

		// Store verified identity details in request context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("tenantID", claims.TenantID)
		c.Set("isPreview", claims.IsPreview)
		c.Set("superAdminID", claims.SuperAdminID)

		c.Next()
	}
}

// RequireRole ensures the authenticated user has one of the allowed roles (or is Super Admin)
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required", "code": "UNAUTHENTICATED"})
			c.Abort()
			return
		}

		userRole, _ := roleVal.(string)

		// Super Admins possess root global authority unless in preview mode restricting them
		if userRole == "super_admin" {
			c.Next()
			return
		}

		for _, r := range allowedRoles {
			if strings.EqualFold(userRole, r) {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access Denied: You do not have permission to access this resource.",
			"code":  "FORBIDDEN",
		})
		c.Abort()
	}
}

// TenantContextMiddleware ensures every tenant request has a valid tenantID from the verified session
func TenantContextMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantIDVal, exists := c.Get("tenantID")
		roleVal, _ := c.Get("role")
		userRole, _ := roleVal.(string)

		// Super admin without tenant context may proceed to global administrative endpoints or default workspace
		if userRole == "super_admin" {
			if !exists || tenantIDVal == nil {
				c.Set("tenantID", 5)
			} else if tid, ok := tenantIDVal.(int); !ok || tid <= 0 {
				c.Set("tenantID", 5)
			}
			c.Next()
			return
		}

		tenantID, ok := tenantIDVal.(int)
		if !ok || tenantID <= 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Tenant context missing or unauthorized.",
				"code":  "TENANT_ISOLATION_FAILURE",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
