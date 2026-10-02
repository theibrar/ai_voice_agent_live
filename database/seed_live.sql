ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{"voice": true, "sms": true}'::jsonb;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS assigned_agent_name VARCHAR(255);
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS carrier VARCHAR(50) DEFAULT 'telnyx';

ALTER TABLE agents ADD COLUMN IF NOT EXISTS assigned_phone_number VARCHAR(100);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS assigned_phone_number_id VARCHAR(100);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS knowledge_base_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS greeting TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;

INSERT INTO agents (id, name, status, assigned_phone_number, assigned_phone_number_id, knowledge_base_ids, greeting, system_prompt, llm_model, language, created_at, updated_at) 
VALUES ('agent-solar-1', 'Marcus (Solar Advisor)', 'active', '+1 (415) 384-5276', 'pn-6c65d8c8', '["kb-enterprise-faq", "kb-pricing-2026", "kb-support-returns"]'::jsonb, 'Hello, this is Marcus with Apex Solar Solutions. How are you today?', 'You are Marcus, an empathetic and professional solar consultant.', 'Qwen/Qwen2.5-7B-Instruct-AWQ', 'English (US)', NOW(), NOW()) 
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, assigned_phone_number=EXCLUDED.assigned_phone_number, assigned_phone_number_id=EXCLUDED.assigned_phone_number_id, knowledge_base_ids=EXCLUDED.knowledge_base_ids, status='active', updated_at=NOW();

INSERT INTO phone_numbers (id, tenant_id, number, phone_number, friendly_name, country, assigned_agent_id, assigned_agent_name, assigned_campaign_id, status, monthly_cost, capabilities, carrier, created_at, updated_at) 
VALUES ('pn-6c65d8c8', 1, '+14153845276', '+14153845276', 'Inbound DID (MILL VALLEY)', 'US', 'agent-solar-1', 'Marcus (Solar Advisor)', 'Direct Inbound', 'active', 1.00, '{"voice": true, "sms": true}'::jsonb, 'telnyx', NOW(), NOW()) 
ON CONFLICT (id) DO UPDATE SET assigned_agent_id='agent-solar-1', assigned_agent_name='Marcus (Solar Advisor)', number='+14153845276', phone_number='+14153845276', status='active', updated_at=NOW();

INSERT INTO appointments (appointment_id, tenant_id, caller_name, phone, email, scheduled_at, duration_minutes, status, agent_name, agent_id, calendar_type, notes, created_at) 
VALUES 
('apt-live-101', 1, 'Jonathan Vance', '+1 (415) 890-2341', 'jonathan.vance@solarenergy.org', NOW() + INTERVAL '1 day', 30, 'confirmed', 'Marcus (Solar Advisor)', 'agent-solar-1', 'google', 'Commercial solar consultation.', NOW()),
('apt-live-102', 1, 'Sarah Lin', '+1 (310) 456-7890', 'sarah.lin@apexvoice.io', NOW() + INTERVAL '2 days', 45, 'confirmed', 'Marcus (Solar Advisor)', 'agent-solar-1', 'google', 'Roof architecture survey.', NOW()),
('apt-live-103', 1, 'David Miller', '+1 (212) 345-6789', 'david.m@cleanpower.net', NOW() - INTERVAL '1 day', 30, 'completed', 'Marcus (Solar Advisor)', 'agent-solar-1', 'google', 'Completed consultation.', NOW()) 
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO knowledge_base (id, name, type, status, chunk_count, size_kb, last_indexed, assigned_agent_ids, content_preview, created_at, updated_at) 
VALUES 
('kb-enterprise-faq', 'Apex Enterprise Architecture & Security FAQ 2026.pdf', 'document', 'indexed', 48, 850, NOW(), '["agent-solar-1", "agent-sdr-2"]'::jsonb, 'SOC2 Type II compliance audits.', NOW(), NOW()),
('kb-pricing-2026', 'Apex Pricing, Tier Matrix & Volume Discounts.xlsx', 'document', 'indexed', 32, 420, NOW(), '["agent-solar-1"]'::jsonb, 'Enterprise volume discount Tier 3 pricing.', NOW(), NOW()),
('kb-support-returns', 'Customer Support & Order Return Policies.pdf', 'faq', 'indexed', 24, 310, NOW(), '["agent-solar-1"]'::jsonb, 'Return & refund window: 30 days money-back guarantee.', NOW(), NOW()) 
ON CONFLICT (id) DO UPDATE SET assigned_agent_ids=EXCLUDED.assigned_agent_ids, status='indexed', updated_at=NOW();
