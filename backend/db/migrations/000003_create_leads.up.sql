CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_campaign_status ON leads (campaign_id, status);
CREATE INDEX idx_active_leads ON leads (campaign_id) WHERE status = 'new';