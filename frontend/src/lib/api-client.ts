export const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (window.location.protocol === "https:" || window.location.hostname !== "localhost") {
      return "/api/v1";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
};

export interface DailyCallMetric {
  date: string;
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  avg_duration_seconds: number;
}

export interface DailyLeadMetric {
  date: string;
  total_leads: number;
  interested_leads: number;
}

export interface AnalyticsResponse {
  call_analytics: DailyCallMetric[];
  lead_analytics: DailyLeadMetric[];
}

export interface RAGSearchResult {
  chunk_id: string;
  document_title: string;
  content: string;
  score: number;
}

// 1. Analytics & Fleet Overview
export async function fetchDailyAnalytics(campaignId: string = ''): Promise<AnalyticsResponse> {
  try {
    const url = campaignId ? `${getApiBaseUrl()}/analytics/daily?campaign_id=${campaignId}` : `${getApiBaseUrl()}/analytics/daily`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return { call_analytics: [], lead_analytics: [] };
  }
}

// 2. RAG Knowledge Base Retrieval API
export async function searchRAGKnowledgeBase(query: string, topK: number = 3): Promise<RAGSearchResult[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.chunks || [];
  } catch (error) {
    console.error('Failed to search RAG KB:', error);
    return [];
  }
}

// 3. Voice Agent Call Controllers
export async function startVoiceCall(callId: string, leadId: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/calls/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_id: callId, lead_id: leadId }),
    });
    return await res.json();
  } catch (error) {
    console.error('Start call error:', error);
    return null;
  }
}

export async function endVoiceCall(callId: string, duration: number, transcript: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/calls/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_id: callId, duration, transcript }),
    });
    return await res.json();
  } catch (error) {
    console.error('End call error:', error);
    return null;
  }
}

// 4. Lead Status Update
export async function updateLeadStatus(leadId: string, status: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/leads/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, status }),
    });
    return await res.json();
  } catch (error) {
    console.error('Update lead error:', error);
    return null;
  }
}

// 5. Inbound Website Webhook Intake (Auto-creates Leads & Contacts)
export async function submitInboundWebhook(payload: any) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/webhooks/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Inbound webhook error:', error);
    return null;
  }
}

// 6. Webhooks Management API
export async function fetchWebhooks() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/webhooks`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch webhooks error:', error);
    return { webhooks: [] };
  }
}

export async function createWebhook(name: string, url: string, events: string[]) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, events }),
    });
    return await res.json();
  } catch (error) {
    console.error('Create webhook error:', error);
    return null;
  }
}

// 7. Google Drive & Google Sheets Integration
export async function syncGoogleDrive(appointmentId: string = '', fileName: string = '') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/integrations/google-drive/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id: appointmentId, file_name: fileName }),
    });
    return await res.json();
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return null;
  }
}

export async function syncGoogleSheets(sheetTab: string = 'leads_2026', rowData: any = {}) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/integrations/google-sheets/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_tab: sheetTab, row_data: rowData }),
    });
    return await res.json();
  } catch (error) {
    console.error('Google Sheets sync error:', error);
    return null;
  }
}

// 8. Flow Email Action Dispatch
export async function sendFlowEmail(recipient: string, subject: string, body: string, gatewayType: string = 'smtp') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/integrations/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, subject, body, gateway_type: gatewayType }),
    });
    return await res.json();
  } catch (error) {
    console.error('Send flow email error:', error);
    return null;
  }
}

// 9. Visual Flow Builder API
export async function fetchActiveFlow() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/flows/active`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch active flow error:', error);
    return null;
  }
}

export async function saveFlowDefinition(id: string, name: string, nodes: any[], edges: any[], assignedPhoneNumber: string = '+1 (415) 890-2341') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/flows/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, nodes, edges, assigned_phone_number: assignedPhoneNumber }),
    });
    return await res.json();
  } catch (error) {
    console.error('Save flow error:', error);
    return null;
  }
}

export async function executeFlowStep(nodeType: string, prompt: string, variables: Record<string, any> = {}) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/flows/execute-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_type: nodeType, prompt, variables }),
    });
    return await res.json();
  } catch (error) {
    console.error('Execute flow step error:', error);
    return null;
  }
}

// 10. Appointments & Calendar API
export async function fetchAppointments() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/appointments`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return { appointments: [], drive_files: [] };
  }
}

export async function createAppointment(apt: any) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apt),
    });
    return await res.json();
  } catch (error) {
    console.error('Create appointment error:', error);
    return null;
  }
}

// 11. Live WebSockets URL
export function getVoiceWebSocketURL(): string {
  const wsBase = getApiBaseUrl().replace(/^http/, 'ws');
  return `${wsBase}/ws/calls`;
}

// 12. Campaigns Database API
export async function fetchCampaigns() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/campaigns`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch campaigns error:', error);
    return { campaigns: [] };
  }
}

export async function saveCampaignToDB(campaign: any) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });
    return await res.json();
  } catch (error) {
    console.error('Save campaign error:', error);
    return null;
  }
}

export async function updateCampaignStatusInDB(campaignId: string, status: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/campaigns/${campaignId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    console.error('Update campaign status error:', error);
    return null;
  }
}

export async function deleteCampaignFromDB(campaignId: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (error) {
    console.error('Delete campaign error:', error);
    return null;
  }
}

// 13. Website Voice Widgets Database API
export async function fetchWebsiteWidgets() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/widgets`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Fetch widgets error:', error);
    return { widgets: [] };
  }
}

export async function saveWebsiteWidgetToDB(widget: any) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widget),
    });
    return await res.json();
  } catch (error) {
    console.error('Save widget error:', error);
    return null;
  }
}

export async function deleteWebsiteWidgetFromDB(widgetId: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/widgets/${widgetId}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (error) {
    console.error('Delete widget error:', error);
    return null;
  }
}

