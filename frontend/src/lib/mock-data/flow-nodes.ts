import { FlowNode, FlowEdge } from "../types";

export const initialFlowNodes: FlowNode[] = [
  {
    id: "node-1",
    type: "greeting",
    title: "1. Welcome Greeting",
    description: "Plays warm introduction and identifies company brand.",
    position: { x: 80, y: 120 },
    data: {
      prompt: "Hi there! Thanks for calling Apex Voice Technologies. My name is Rachel. How can I help power your team today?",
    },
  },
  {
    id: "node-2",
    type: "question",
    title: "2. Qualification Intent",
    description: "Listens for caller use case and estimated monthly call volume.",
    position: { x: 420, y: 120 },
    data: {
      prompt: "Are you looking to deploy automated voice agents for inbound support or outbound campaigns?",
      variableName: "use_case_type",
    },
  },
  {
    id: "node-3",
    type: "condition",
    title: "3. Branch by Volume",
    description: "Evaluates monthly minutes (>20k min -> Enterprise Route).",
    position: { x: 760, y: 120 },
    data: {
      branches: [
        { id: "b1", label: "> 20,000 mins (Enterprise)", condition: "volume >= 20000" },
        { id: "b2", label: "< 20,000 mins (Growth)", condition: "volume < 20000" },
      ],
    },
  },
  {
    id: "node-4",
    type: "knowledge_lookup",
    title: "4. Architecture & SLA Match",
    description: "Retrieves SOC2 and low latency technical specs from Vector DB.",
    position: { x: 1100, y: 40 },
    data: {
      toolName: "vector_search_kb",
      tags: ["SOC2", "Latency", "SLA"],
    },
  },
  {
    id: "node-5",
    type: "appointment",
    title: "5. Book Solutions Demo",
    description: "Connects with Google Calendar to reserve 30-min live demo.",
    position: { x: 1100, y: 240 },
    data: {
      toolName: "book_appointment",
      destination: "Enterprise AE Calendar",
    },
  },
  {
    id: "node-6",
    type: "send_sms",
    title: "6. Send SMS Confirmation",
    description: "Dispatches SMS confirmation with meeting link and agenda.",
    position: { x: 1440, y: 140 },
    data: {
      prompt: "Thanks for speaking with Apex! Your demo is confirmed for {{meeting_time}}.",
    },
  },
  {
    id: "node-7",
    type: "send_email",
    title: "7. Follow-up Briefing Email",
    description: "Dispatches automated calendar invite and solution overview PDF.",
    position: { x: 1780, y: 140 },
    data: {
      emailSubject: "Apex Voice AI - Demo Consultation & Overview",
      emailRecipient: "{{contact.email}}",
      emailTemplate: "Hi {{contact.name}},\n\nThank you for speaking with our voice assistant. Your demo is reserved. Meeting link and materials attached.",
      emailGateway: "smtp",
    },
  },
  {
    id: "node-8",
    type: "end_call",
    title: "8. Graceful Hangup",
    description: "Plays closing thank you message and logs call outcome.",
    position: { x: 2120, y: 140 },
    data: {
      prompt: "Thank you for choosing Apex. We look forward to speaking soon. Have a great day!",
    },
  },
];

export const initialFlowEdges: FlowEdge[] = [
  { id: "e1-2", source: "node-1", target: "node-2" },
  { id: "e2-3", source: "node-2", target: "node-3" },
  { id: "e3-4", source: "node-3", target: "node-4", label: "Enterprise" },
  { id: "e3-5", source: "node-3", target: "node-5", label: "Standard / Growth" },
  { id: "e4-5", source: "node-4", target: "node-5" },
  { id: "e5-6", source: "node-5", target: "node-6" },
  { id: "e6-7", source: "node-6", target: "node-7" },
  { id: "e7-8", source: "node-7", target: "node-8" },
];

