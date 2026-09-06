package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ramzan/backend-chatbot/internal/config"
	"github.com/ramzan/backend-chatbot/internal/database"
	"github.com/ramzan/backend-chatbot/internal/handlers"
	"github.com/ramzan/backend-chatbot/internal/middleware"
	"github.com/ramzan/backend-chatbot/internal/repository"
	"github.com/ramzan/backend-chatbot/internal/services"
	ws "github.com/ramzan/backend-chatbot/internal/websocket"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	dbPool, err := database.NewPostgresPool(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Postgres: %v", err)
	}
	defer dbPool.Close()

	redisClient, err := database.NewRedisClient(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	wsHub := ws.NewHub()
	go wsHub.Run()

	leadRepo := repository.NewLeadRepository(dbPool)
	authService := services.NewAuthService(cfg.JWTSecret, cfg.JWTExpirationHours)
	ragService := services.NewRAGService(dbPool, redisClient)

	ragHandler := handlers.NewRAGHandler(ragService)
	callsHandler := handlers.NewCallsHandler(dbPool, wsHub)
	leadsHandler := handlers.NewLeadsHandler(leadRepo)
	campaignsHandler := handlers.NewCampaignsHandler(dbPool)
	widgetsHandler := handlers.NewWidgetsHandler(dbPool)
	analyticsHandler := handlers.NewAnalyticsHandler(dbPool)
	superAdminHandler := handlers.NewSuperAdminHandler(dbPool, authService)
	webhooksHandler := handlers.NewWebhooksHandler(dbPool)
	integrationsHandler := handlers.NewIntegrationsHandler(dbPool)
	flowHandler := handlers.NewFlowHandler(dbPool)
	appointmentsHandler := handlers.NewAppointmentsHandler(dbPool)
	agentsHandler := handlers.NewAgentsHandler(dbPool)
	knowledgeHandler := handlers.NewKnowledgeHandler(dbPool)
	authHandler := handlers.NewAuthHandler(dbPool, authService)
	abHandler := handlers.NewABHandler(dbPool)
	formsHandler := handlers.NewFormsHandler(dbPool)
	contactsHandler := handlers.NewContactsHandler(dbPool)
	phoneNumbersHandler := handlers.NewPhoneNumbersHandler(dbPool)
	ttsHandler := handlers.NewTTSHandler()
	simulatorHandler := handlers.NewSimulatorHandler()

	r := gin.Default()

	// Robust CORS & Cookie Security Middleware
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = "http://localhost:3000"
		}
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Tenant-Id")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "up"})
	})
	r.POST("/api/tts/synthesize", ttsHandler.SynthesizeSpeech)
	r.POST("/api/simulator/chat", simulatorHandler.SimulateChat)
	r.POST("/simulator-api/chat", simulatorHandler.SimulateChat)

	api := r.Group("/api/v1")
	{
		api.POST("/simulator/chat", simulatorHandler.SimulateChat)
		// ==========================================
		// 1. Public / Unauthenticated Endpoints
		// ==========================================
		api.POST("/auth/login", authHandler.Login)
		api.GET("/auth/me", authHandler.GetMe)
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/forgot-password", authHandler.ForgotPassword)
		api.POST("/auth/reset-password", authHandler.ResetPassword)

		// Public Webhook Ingestion & Forms
		api.POST("/webhooks/incoming", webhooksHandler.IngestIncomingWebhook)
		api.POST("/webhooks/telnyx", webhooksHandler.IngestTelnyxWebhook)
		api.POST("/forms/:id/submit", formsHandler.SubmitFormWebhook)
		api.POST("/webhooks/forms/:id", formsHandler.SubmitFormWebhook)

		// Telephony & Neural Speech Synthesis
		api.POST("/calls/start", callsHandler.StartCall)
		api.POST("/calls/end", callsHandler.EndCall)
		api.POST("/tts/synthesize", ttsHandler.SynthesizeSpeech)
		api.POST("/rag/search", ragHandler.Search)
		api.POST("/rag/query", ragHandler.Search)
		api.POST("/appointments", appointmentsHandler.CreateAppointment)
		api.POST("/contacts", contactsHandler.CreateOrUpdateContact)
		api.GET("/knowledge", knowledgeHandler.ListKnowledgeSources)

		// Real-Time WebSocket Endpoint
		api.GET("/ws/calls", func(c *gin.Context) {
			ws.ServeWS(wsHub, c)
		})

		// ==========================================
		// 2. Authenticated Session Endpoints
		// ==========================================
		authGroup := api.Group("")
		authGroup.Use(middleware.AuthRequired(authService))
		{
			authGroup.POST("/auth/logout", authHandler.Logout)
			authGroup.GET("/auth/users", authHandler.ListUsers)
		}

		// ==========================================
		// 3. Tenant-Isolated Endpoints (RBAC + TenantContext)
		// ==========================================
		tenantGroup := api.Group("")
		tenantGroup.Use(middleware.AuthRequired(authService), middleware.TenantContextMiddleware())
		{
			// Voice AI Agents
			tenantGroup.GET("/agents", agentsHandler.GetAgents)
			tenantGroup.GET("/agents/:id", agentsHandler.GetAgentByID)
			tenantGroup.POST("/agents", agentsHandler.CreateAgent)
			tenantGroup.PUT("/agents/:id", agentsHandler.UpdateAgent)
			tenantGroup.PATCH("/agents/:id/status", agentsHandler.ToggleAgentStatus)
			tenantGroup.DELETE("/agents/:id", agentsHandler.DeleteAgent)

			// Live Calls & Recordings
			tenantGroup.GET("/calls", callsHandler.GetTenantCalls)

			// Unified CRM Contacts & Leads
			tenantGroup.GET("/contacts", contactsHandler.GetContacts)
			tenantGroup.PUT("/contacts/:id/notes", contactsHandler.UpdateNotes)
			tenantGroup.DELETE("/contacts/:id", contactsHandler.DeleteContact)
			tenantGroup.POST("/leads/update", leadsHandler.UpdateStatus)

			// Knowledge Base & Grounding RAG
			tenantGroup.GET("/knowledge/:id", knowledgeHandler.GetKnowledgeSource)
			tenantGroup.POST("/knowledge", knowledgeHandler.CreateKnowledgeSource)
			tenantGroup.PUT("/knowledge/:id", knowledgeHandler.UpdateKnowledgeSource)
			tenantGroup.DELETE("/knowledge/:id", knowledgeHandler.DeleteKnowledgeSource)

			// Voice Campaigns
			tenantGroup.GET("/campaigns", campaignsHandler.GetCampaigns)
			tenantGroup.GET("/campaigns/:id", campaignsHandler.GetCampaignByID)
			tenantGroup.POST("/campaigns", campaignsHandler.CreateCampaign)
			tenantGroup.POST("/campaigns/import-leads", campaignsHandler.ImportLeads)
			tenantGroup.PATCH("/campaigns/:id/status", campaignsHandler.UpdateCampaignStatus)
			tenantGroup.DELETE("/campaigns/:id", campaignsHandler.DeleteCampaign)
			tenantGroup.GET("/campaigns/:id/script", campaignsHandler.GetScript)

			// Appointments & Calendar Bookings
			tenantGroup.GET("/appointments", appointmentsHandler.GetAppointments)
			tenantGroup.PATCH("/appointments/:id/status", appointmentsHandler.UpdateAppointmentStatus)
			tenantGroup.DELETE("/appointments/:id", appointmentsHandler.DeleteAppointment)

			// Telephony & Telnyx DID Phone Numbers
			tenantGroup.GET("/phone-numbers", phoneNumbersHandler.GetTenantPhoneNumbers)
			tenantGroup.GET("/phone-numbers/available", phoneNumbersHandler.SearchAvailableNumbers)
			tenantGroup.POST("/phone-numbers/provision", phoneNumbersHandler.ProvisionPhoneNumber)
			tenantGroup.PATCH("/phone-numbers/:id/assign", phoneNumbersHandler.AssignPhoneNumber)
			tenantGroup.DELETE("/phone-numbers/:id", phoneNumbersHandler.DeletePhoneNumber)

			// Analytics & Conversation Intelligence
			tenantGroup.GET("/analytics/daily", analyticsHandler.GetDailyAnalytics)
			tenantGroup.GET("/analytics/overview", analyticsHandler.GetOverview)
			tenantGroup.GET("/analytics/funnel", analyticsHandler.GetFunnelSteps)
			tenantGroup.POST("/analytics/funnel/update-step", analyticsHandler.UpdateFunnelStep)

			// Prompt & Voice A/B Testing Studio
			tenantGroup.GET("/ab-experiments", abHandler.GetExperiments)
			tenantGroup.POST("/ab-experiments", abHandler.CreateExperiment)
			tenantGroup.PUT("/ab-experiments/:id/winner", abHandler.CrownWinner)
			tenantGroup.DELETE("/ab-experiments/:id", abHandler.DeleteExperiment)

			// Visual Conversation Flow Builder
			tenantGroup.GET("/flows", flowHandler.GetFlows)
			tenantGroup.GET("/flows/active", flowHandler.GetActiveFlow)
			tenantGroup.GET("/flows/:id", flowHandler.GetFlowByID)
			tenantGroup.POST("/flows", flowHandler.SaveFlow)
			tenantGroup.POST("/flows/save", flowHandler.SaveFlow)
			tenantGroup.DELETE("/flows/:id", flowHandler.DeleteFlow)
			tenantGroup.POST("/flows/simulate", flowHandler.SimulateFlowTurn)
			tenantGroup.POST("/flows/execute-step", flowHandler.ExecuteFlowStep)

			// Website Voice Widgets
			tenantGroup.GET("/widgets", widgetsHandler.GetWidgets)
			tenantGroup.POST("/widgets", widgetsHandler.CreateWidget)
			tenantGroup.DELETE("/widgets/:id", widgetsHandler.DeleteWidget)

			// Webhooks Configuration & Logs
			tenantGroup.GET("/webhooks", webhooksHandler.GetWebhooks)
			tenantGroup.POST("/webhooks", webhooksHandler.CreateWebhook)
			tenantGroup.DELETE("/webhooks/:id", webhooksHandler.DeleteWebhook)
			tenantGroup.GET("/webhooks/logs", webhooksHandler.GetWebhookLogs)

			// Custom Lead Capture Forms
			tenantGroup.GET("/forms", formsHandler.GetForms)
			tenantGroup.POST("/forms", formsHandler.CreateForm)
			tenantGroup.DELETE("/forms/:id", formsHandler.DeleteForm)

			// Third-Party Integrations
			tenantGroup.GET("/integrations", integrationsHandler.GetIntegrations)
			tenantGroup.GET("/integrations/google/status", integrationsHandler.GetGoogleStatus)
			tenantGroup.POST("/integrations/google/connect", integrationsHandler.ConnectGoogleAccount)
			tenantGroup.POST("/integrations/google/disconnect", integrationsHandler.DisconnectGoogleAccount)
			tenantGroup.POST("/integrations/google-calendar/sync", integrationsHandler.SyncGoogleCalendar)
			tenantGroup.POST("/integrations/google-sheets/create", integrationsHandler.CreateGoogleSheet)
			tenantGroup.GET("/integrations/google-sheets/rows", integrationsHandler.GetGoogleSheetRows)
			tenantGroup.POST("/integrations/google-sheets/sync", integrationsHandler.SyncGoogleSheets)
			tenantGroup.POST("/integrations/google-drive/sync", integrationsHandler.SyncGoogleDrive)
			tenantGroup.POST("/integrations/email/send", integrationsHandler.SendFlowEmail)

			// Active LLM Models for Builder
			tenantGroup.GET("/models", superAdminHandler.GetActiveLLMModels)

			// Tenant Isolated Billing & Voice Credits
			tenantGroup.GET("/billing/details", superAdminHandler.GetTenantBillingDetails)
			tenantGroup.POST("/billing/top-up", superAdminHandler.TopUpTenantCredits)

			// Real-Time System Announcements Broadcast to Tenant Admins
			tenantGroup.GET("/announcements", superAdminHandler.GetTenantAnnouncements)
		}

		// Public/read-only access to active database AI engines
		api.GET("/ai-engines", superAdminHandler.GetAIEngines)

		// ==========================================
		// 4. Super Admin Global Management (RBAC: super_admin only)
		// ==========================================
		sa := api.Group("/superadmin")
		sa.Use(middleware.AuthRequired(authService), middleware.RequireRole("super_admin"))
		{
			sa.GET("/stats", superAdminHandler.GetSystemStats)
			sa.GET("/tenants", superAdminHandler.GetTenants)
			sa.POST("/tenants", superAdminHandler.CreateTenant)
			sa.PUT("/tenants/:id", superAdminHandler.UpdateTenant)
			sa.PATCH("/tenants/:id/status", superAdminHandler.UpdateTenantStatus)
			sa.DELETE("/tenants/:id", superAdminHandler.DeleteTenant)
			sa.POST("/tenants/credits", superAdminHandler.UpdateTenantCredits)
			sa.POST("/tenants/assign-plan", superAdminHandler.AssignTenantPlan)

			// System Announcements & Broadcasts
			sa.GET("/announcements", superAdminHandler.GetAnnouncements)
			sa.POST("/announcements", superAdminHandler.CreateAnnouncement)
			sa.PATCH("/announcements/:id/toggle", superAdminHandler.ToggleAnnouncement)
			sa.DELETE("/announcements/:id", superAdminHandler.DeleteAnnouncement)

			// Platform Plans & Rates
			sa.GET("/plans", superAdminHandler.GetPlans)
			sa.POST("/plans", superAdminHandler.CreatePlan)
			sa.PUT("/plans/:id", superAdminHandler.UpdatePlan)
			sa.DELETE("/plans/:id", superAdminHandler.DeletePlan)

			// Super Admin Preview Mode (Start & Exit)
			sa.POST("/preview/start", superAdminHandler.StartTenantPreview)
			sa.POST("/preview/exit", superAdminHandler.ExitTenantPreview)

			// Infrastructure & SIP Carrier Trunks
			sa.GET("/trunks", superAdminHandler.GetTrunks)
			sa.POST("/trunks", superAdminHandler.CreateTrunk)
			sa.PUT("/trunks/:id", superAdminHandler.UpdateTrunk)
			sa.PATCH("/trunks/:id/status", superAdminHandler.UpdateTrunkStatus)
			sa.POST("/trunks/:id/set-default", superAdminHandler.SetDefaultTrunk)
			sa.DELETE("/trunks/:id", superAdminHandler.DeleteTrunk)
			// Email & SMS Gateways
			sa.GET("/gateways", superAdminHandler.GetGateways)
			sa.POST("/gateways", superAdminHandler.CreateGateway)
			sa.PUT("/gateways/:id", superAdminHandler.UpdateGateway)
			sa.DELETE("/gateways/:id", superAdminHandler.DeleteGateway)
			sa.POST("/gateways/:id/set-default", superAdminHandler.SetDefaultGateway)
			sa.POST("/gateways/:id/test", superAdminHandler.TestGatewayDispatch)

			// External Server & API Inspector
			sa.GET("/inspector/logs", superAdminHandler.GetInspectorLogs)
			sa.POST("/inspector/probe", superAdminHandler.ProbeInspectorAPI)
			sa.DELETE("/inspector/logs", superAdminHandler.ClearInspectorLogs)

			// AI Engines
			sa.GET("/ai-engines", superAdminHandler.GetAIEngines)
			sa.POST("/ai-engines", superAdminHandler.CreateAIEngine)
			sa.PATCH("/ai-engines/:id/status", superAdminHandler.UpdateAIEngineStatus)
			sa.DELETE("/ai-engines/:id", superAdminHandler.DeleteAIEngine)
			sa.GET("/audit-logs", superAdminHandler.GetAuditLogs)
		}
	}

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// Graceful Shutdown Channel
	go func() {
		fmt.Printf("Starting Server on port %s...\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Listen error: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited cleanly.")
}
