ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{"voice": true, "sms": true}'::jsonb;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS assigned_agent_name VARCHAR(255);
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

INSERT INTO phone_numbers (
    id, tenant_id, number, phone_number, friendly_name, country,
    assigned_agent_id, assigned_agent_name, assigned_campaign_id, status, monthly_cost
) VALUES (
    'pn-6c65d8c8', 1, '+14153845276', '+14153845276', 'Inbound DID (MILL VALLEY)', 'US',
    'agent-solar-1', 'Marcus (Solar Advisor)', 'Direct Inbound', 'active', 2.50
) ON CONFLICT (id) DO UPDATE SET 
    tenant_id = 1,
    number = EXCLUDED.number,
    phone_number = EXCLUDED.phone_number,
    friendly_name = EXCLUDED.friendly_name,
    assigned_agent_id = 'agent-solar-1',
    assigned_agent_name = 'Marcus (Solar Advisor)',
    assigned_campaign_id = 'Direct Inbound',
    status = 'active',
    updated_at = NOW();

UPDATE phone_numbers 
SET tenant_id = 1,
    assigned_agent_id = 'agent-solar-1', 
    assigned_agent_name = 'Marcus (Solar Advisor)', 
    assigned_campaign_id = 'Direct Inbound',
    status = 'active',
    updated_at = NOW() 
WHERE number = '+14153845276' OR id = 'pn-6c65d8c8';

UPDATE agents 
SET assigned_phone_number = '+1 (415) 384-5276', 
    assigned_phone_number_id = 'pn-6c65d8c8',
    status = 'active',
    knowledge_base_ids = '["kb-enterprise-faq", "kb-pricing-2026", "kb-support-returns"]'::jsonb,
    updated_at = NOW() 
WHERE id = 'agent-solar-1';

UPDATE knowledge_base
SET assigned_agent_ids = '["agent-solar-1", "agent-sdr-2", "agent-cs-3"]'::jsonb,
    updated_at = NOW()
WHERE id IN ('kb-enterprise-faq', 'kb-pricing-2026', 'kb-support-returns');
