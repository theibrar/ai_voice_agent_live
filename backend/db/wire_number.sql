ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
UPDATE phone_numbers SET phone_number = number WHERE phone_number IS NULL OR phone_number = '';

UPDATE phone_numbers 
SET assigned_agent_id = 'agent-solar-1', 
    assigned_agent_name = 'Marcus (Solar Advisor)', 
    assigned_campaign_id = 'Direct Inbound',
    updated_at = NOW() 
WHERE number = '+14153845276' OR id = 'pn-6c65d8c8';

UPDATE agents 
SET assigned_phone_number = '+1 (415) 384-5276', 
    assigned_phone_number_id = 'pn-6c65d8c8',
    knowledge_base_ids = '["kb-enterprise-faq", "kb-pricing-2026", "kb-support-returns"]'::jsonb,
    updated_at = NOW() 
WHERE id = 'agent-solar-1';

UPDATE knowledge_base
SET assigned_agent_ids = '["agent-solar-1", "agent-sdr-2", "agent-cs-3"]'::jsonb,
    updated_at = NOW()
WHERE id IN ('kb-enterprise-faq', 'kb-pricing-2026', 'kb-support-returns');
