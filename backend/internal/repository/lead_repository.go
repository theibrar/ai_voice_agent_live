package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ramzan/backend-chatbot/internal/domain"
)

type LeadRepository interface {
	CreateLead(ctx context.Context, lead *domain.Lead) error
	UpdateLeadStatus(ctx context.Context, leadID uuid.UUID, status string) error
	GetLeadByID(ctx context.Context, id uuid.UUID) (*domain.Lead, error)
	GetCampaignByID(ctx context.Context, id uuid.UUID) (*domain.Campaign, error)
}

type leadRepository struct {
	db *pgxpool.Pool
}

func NewLeadRepository(db *pgxpool.Pool) LeadRepository {
	return &leadRepository{db: db}
}

func (r *leadRepository) CreateLead(ctx context.Context, lead *domain.Lead) error {
	query := `
		INSERT INTO leads (campaign_id, phone, status, metadata)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRow(ctx, query, lead.CampaignID, lead.Phone, lead.Status, lead.Metadata).
		Scan(&lead.ID, &lead.CreatedAt, &lead.UpdatedAt)
}

func (r *leadRepository) UpdateLeadStatus(ctx context.Context, leadID uuid.UUID, status string) error {
	query := `
		UPDATE leads
		SET status = $1, updated_at = NOW()
		WHERE id = $2`

	cmd, err := r.db.Exec(ctx, query, status, leadID)
	if err != nil {
		return err
	}

	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("lead not found")
	}

	return nil
}

func (r *leadRepository) GetLeadByID(ctx context.Context, id uuid.UUID) (*domain.Lead, error) {
	query := `
		SELECT id, campaign_id, phone, status, metadata, created_at, updated_at
		FROM leads WHERE id = $1`

	var lead domain.Lead
	err := r.db.QueryRow(ctx, query, id).
		Scan(&lead.ID, &lead.CampaignID, &lead.Phone, &lead.Status, &lead.Metadata, &lead.CreatedAt, &lead.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &lead, nil
}

func (r *leadRepository) GetCampaignByID(ctx context.Context, id uuid.UUID) (*domain.Campaign, error) {
	query := `
		SELECT id, organization_id, name, script_template, voice_prompt, created_at, updated_at
		FROM campaigns WHERE id = $1`

	var campaign domain.Campaign
	err := r.db.QueryRow(ctx, query, id).
		Scan(&campaign.ID, &campaign.OrganizationID, &campaign.Name, &campaign.ScriptTemplate, &campaign.VoicePrompt, &campaign.CreatedAt, &campaign.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &campaign, nil
}
