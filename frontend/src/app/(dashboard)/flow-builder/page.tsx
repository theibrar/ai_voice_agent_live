"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { FlowNode } from "@/lib/types";
import {
  Workflow,
  Plus,
  Play,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bot,
  HelpCircle,
  FileText,
  GitBranch,
  Calendar,
  PhoneForwarded,
  MessageSquare,
  Webhook,
  PhoneOff,
  Trash2,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Send,
  User,
  ArrowLeft,
  Edit3,
  Sliders,
  Check,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Split,
  MessageCircle,
  FileCode,
  Radio,
  StickyNote,
  Volume2,
  Activity,
  Zap,
  MousePointer,
  Hand,
  CornerDownRight,
  Copy,
  Layers,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export interface FlowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: "top" | "bottom" | "true" | "false";
  toPort?: "top" | "bottom";
  label?: string;
}

export interface CanvasNote {
  id: string;
  text: string;
  color: "yellow" | "blue" | "green" | "pink";
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface FlowItem {
  id: string;
  name: string;
  description: string;
  agentId?: string;
  agentName?: string;
  status: "active" | "inactive";
  nodesCount: number;
  connectionsCount: number;
  lastUpdated: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  notes: CanvasNote[];
}

export const AVAILABLE_NODE_TEMPLATES = [
  {
    type: "message" as const,
    title: "Message",
    subtitle: "Send a messa...",
    color: "#2563EB",
    gradient: "from-[#2563EB] to-[#3B82F6]",
    icon: MessageSquare,
    accentClass: "border-l-4 border-l-[#2563EB]",
    iconBg: "bg-[#EEF2FD] text-[#2563EB]",
    portBg: "bg-[#93C5FD]",
  },
  {
    type: "question" as const,
    title: "Question",
    subtitle: "Ask a question",
    color: "#9333EA",
    gradient: "from-[#9333EA] to-[#A855F7]",
    icon: HelpCircle,
    accentClass: "border-l-4 border-l-[#9333EA]",
    iconBg: "bg-purple-50 text-purple-600",
    portBg: "bg-[#C084FC]",
  },
  {
    type: "condition" as const,
    title: "Condition",
    subtitle: "Branch logic",
    color: "#EA580C",
    gradient: "from-[#EA580C] to-[#F97316]",
    icon: Split,
    accentClass: "border-l-4 border-l-[#EA580C]",
    iconBg: "bg-orange-50 text-orange-600",
    portBg: "bg-[#FDBA74]",
  },
  {
    type: "appointment" as const,
    title: "Appointment",
    subtitle: "Book appoint...",
    color: "#16A34A",
    gradient: "from-[#16A34A] to-[#22C55E]",
    icon: Calendar,
    accentClass: "border-l-4 border-l-[#16A34A]",
    iconBg: "bg-emerald-50 text-emerald-600",
    portBg: "bg-[#86EFAC]",
  },
  {
    type: "form" as const,
    title: "Form",
    subtitle: "Collect data",
    color: "#0891B2",
    gradient: "from-[#0891B2] to-[#06B6D4]",
    icon: FileText,
    accentClass: "border-l-4 border-l-[#0891B2]",
    iconBg: "bg-cyan-50 text-cyan-600",
    portBg: "bg-[#67E8F9]",
  },
  {
    type: "webhook" as const,
    title: "Webhook",
    subtitle: "Trigger webh...",
    color: "#7C3AED",
    gradient: "from-[#7C3AED] to-[#8B5CF6]",
    icon: Webhook,
    accentClass: "border-l-4 border-l-[#7C3AED]",
    iconBg: "bg-violet-50 text-violet-600",
    portBg: "bg-[#C4B5FD]",
  },
  {
    type: "transfer" as const,
    title: "Transfer",
    subtitle: "Transfer call",
    color: "#E11D48",
    gradient: "from-[#E11D48] to-[#F43F5E]",
    icon: PhoneForwarded,
    accentClass: "border-l-4 border-l-[#E11D48]",
    iconBg: "bg-rose-50 text-rose-600",
    portBg: "bg-[#FDA4AF]",
  },
  {
    type: "email" as const,
    title: "Email & SMS",
    subtitle: "Send follow-up",
    color: "#D97706",
    gradient: "from-[#D97706] to-[#F59E0B]",
    icon: Mail,
    accentClass: "border-l-4 border-l-[#D97706]",
    iconBg: "bg-amber-50 text-amber-600",
    portBg: "bg-[#FCD34D]",
  },
  {
    type: "end_call" as const,
    title: "End Call",
    subtitle: "End conversation",
    color: "#DC2626",
    gradient: "from-[#DC2626] to-[#EF4444]",
    icon: PhoneOff,
    accentClass: "border-l-4 border-l-[#DC2626]",
    iconBg: "bg-red-50 text-red-600",
    portBg: "bg-[#FCA5A5]",
  },
];

// Default nodes matching user's screenshot exactly
const DEFAULT_FLOW_NODES: FlowNode[] = [
  {
    id: "node-1787763843976",
    type: "question" as any,
    label: "Question",
    position: { x: 300, y: 160 },
    data: {
      question: "Are you inquiring about a commercial solution or residential demo?",
      variable: "transfer_consent",
      prompt: "Are you inquiring about a commercial solution or residential demo?",
    },
  },
  {
    id: "node-1787763844512",
    type: "condition" as any,
    label: "Condition",
    position: { x: 440, y: 350 },
    data: {
      variable: "transfer_consent",
      branches: [
        { id: "b1", label: "True", condition: "transfer_consent == 'yes'" },
        { id: "b2", label: "False", condition: "transfer_consent == 'no'" },
      ],
    },
  },
];

const DEFAULT_CONNECTIONS: FlowConnection[] = [
  {
    id: "conn-1",
    fromNodeId: "node-1787763843976",
    toNodeId: "node-1787763844512",
    fromPort: "bottom",
    toPort: "top",
  },
];

export const INITIAL_FLOWS: FlowItem[] = [
  {
    id: "flow-1",
    name: "Untitled Flow",
    description: "Describe what this flow does",
    agentId: undefined,
    status: "inactive",
    nodesCount: 2,
    connectionsCount: 1,
    lastUpdated: "26/08/2026",
    nodes: DEFAULT_FLOW_NODES,
    connections: DEFAULT_CONNECTIONS,
    notes: [],
  },
  {
    id: "flow-2",
    name: "Solar Appointment Booking",
    description: "Outbound campaign follow-up and appointment booking flow.",
    agentId: "agent-solar-1",
    agentName: "Marcus (Solar Advisor)",
    status: "inactive",
    nodesCount: 0,
    connectionsCount: 0,
    lastUpdated: "03/08/2026",
    nodes: [],
    connections: [],
    notes: [],
  },
];

export default function FlowBuilderPage() {
  const { addToast, agents } = useAppStore();

  // View state: "list" (Screenshot 1) vs "editor" (Screenshot 2 & 3)
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [flowsList, setFlowsList] = useState<FlowItem[]>([]);
  const [activeTab, setActiveTab] = useState<"flows" | "templates" | "logs">("flows");
  const [deleteModalFlow, setDeleteModalFlow] = useState<FlowItem | null>(null);

  // Current Active Flow
  const [currentFlow, setCurrentFlow] = useState<FlowItem>({
    id: "flow-primary",
    name: "Autonomous Voice Flow",
    description: "Visual conversational flow with CRM auto-sync.",
    status: "active",
    nodesCount: DEFAULT_FLOW_NODES.length,
    connectionsCount: DEFAULT_CONNECTIONS.length,
    lastUpdated: new Date().toLocaleDateString("en-GB"),
    nodes: DEFAULT_FLOW_NODES,
    connections: DEFAULT_CONNECTIONS,
    notes: [],
  });
  const [flowTitle, setFlowTitle] = useState("Untitled Flow");
  const [flowDescription, setFlowDescription] = useState("Describe what this flow does");
  const [assignedAgent, setAssignedAgent] = useState("no_agent");

  // Canvas State
  const [nodes, setNodes] = useState<FlowNode[]>(DEFAULT_FLOW_NODES);
  const [connections, setConnections] = useState<FlowConnection[]>(DEFAULT_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-1787763843976");

  // Fetch flows from PostgreSQL database on mount
  useEffect(() => {
    async function loadFlows() {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + '/flows';
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.flows)) {
            setFlowsList(data.flows);
            if (data.flows.length > 0) {
              const first = data.flows[0];
              setCurrentFlow(first);
              setFlowTitle(first.name);
              setFlowDescription(first.description || "");
              setAssignedAgent(first.agentId || (agents && agents.length > 0 ? agents[0].id : "no_agent"));
              if (Array.isArray(first.nodes) && first.nodes.length > 0) {
                setNodes(first.nodes);
              }
              if (Array.isArray(first.connections) && first.connections.length > 0) {
                setConnections(first.connections);
              }
            } else {
              setNodes([]);
              setConnections([]);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load flows from database:", err);
      }
    }
    loadFlows();
  }, [agents]);

  // Extra Property Inspector State for Selected Node
  const [waitForResponse, setWaitForResponse] = useState(true);

  // Pan & Zoom Engine
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Global Drag State (Node dragging, Pan, Port-to-Port Wiring)
  const [activeDrag, setActiveDrag] = useState<{
    type: "node" | "pan" | "wire";
    targetId?: string;
    startNodePos?: { x: number; y: number };
    startMouse?: { x: number; y: number };
    wireStartPos?: { x: number; y: number };
    wireCurrentPos?: { x: number; y: number };
    fromPort?: "top" | "bottom" | "true" | "false";
  } | null>(null);

  const activeDragRef = useRef(activeDrag);
  useEffect(() => {
    activeDragRef.current = activeDrag;
  }, [activeDrag]);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Simulator State
  const [testSimulatorOpen, setTestSimulatorOpen] = useState(false);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [simulatorLogs, setSimulatorLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [userChatInput, setUserChatInput] = useState("");
  const [conversationTurns, setConversationTurns] = useState<{ speaker: "bot" | "user"; text: string; time: string }[]>([]);

  // Pagination for List View
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Convert Screen Mouse to Canvas Coords
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const currentPan = panRef.current;
    const currentZoom = zoomRef.current;
    return {
      x: (clientX - rect.left - currentPan.x) / currentZoom,
      y: (clientY - rect.top - currentPan.y) / currentZoom,
    };
  }, []);

  // Native Non-Passive Wheel Event Listener for Smooth Zoom
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const newZoom = Math.min(2.5, Math.max(0.35, currentZoom * zoomFactor));

      const newPanX = mouseX - (mouseX - currentPan.x) * (newZoom / currentZoom);
      const newPanY = mouseY - (mouseY - currentPan.y) * (newZoom / currentZoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onNativeWheel);
    };
  }, [viewMode]);

  // Window-Level Mouse Event Listeners for Reliable Drag & Drop and Port Wiring
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;

      const currentZoom = zoomRef.current;

      // 1. Moving Node
      if (drag.type === "node" && drag.targetId && drag.startNodePos && drag.startMouse) {
        const dx = (e.clientX - drag.startMouse.x) / currentZoom;
        const dy = (e.clientY - drag.startMouse.y) / currentZoom;

        setNodes((prev) =>
          prev.map((n) =>
            n.id === drag.targetId
              ? {
                  ...n,
                  position: {
                    x: Math.round(drag.startNodePos!.x + dx),
                    y: Math.round(drag.startNodePos!.y + dy),
                  },
                }
              : n
          )
        );
      }

      // 2. Panning Canvas
      if (drag.type === "pan" && drag.startNodePos && drag.startMouse) {
        const dx = e.clientX - drag.startMouse.x;
        const dy = e.clientY - drag.startMouse.y;
        setPan({
          x: drag.startNodePos.x + dx,
          y: drag.startNodePos.y + dy,
        });
      }

      // 3. Drawing Connection Wire
      if (drag.type === "wire") {
        const canvasCoords = screenToCanvas(e.clientX, e.clientY);
        setActiveDrag((prev) => (prev ? { ...prev, wireCurrentPos: canvasCoords } : null));
      }
    };

    const onWindowMouseUp = (e: MouseEvent) => {
      const drag = activeDragRef.current;
      if (!drag) return;

      if (drag.type === "wire" && drag.targetId) {
        const coords = screenToCanvas(e.clientX, e.clientY);
        // Find if dropped on any node
        const targetNode = nodes.find(
          (n) =>
            n.id !== drag.targetId &&
            coords.x >= n.position.x - 30 &&
            coords.x <= n.position.x + 280 &&
            coords.y >= n.position.y - 30 &&
            coords.y <= n.position.y + 90
        );

        if (targetNode) {
          const exists = connections.some(
            (c) => c.fromNodeId === drag.targetId && c.toNodeId === targetNode.id
          );
          if (!exists) {
            const newConn: FlowConnection = {
              id: `conn-${Date.now()}`,
              fromNodeId: drag.targetId,
              toNodeId: targetNode.id,
              fromPort: drag.fromPort || "bottom",
              toPort: "top",
            };
            setConnections((prev) => [...prev, newConn]);
            addToast({
              title: "Nodes Connected",
              description: `Connected ${drag.fromPort || 'bottom'} port to top port.`,
              type: "success",
            });
          }
        }
      }

      setActiveDrag(null);
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [screenToCanvas, nodes, connections, addToast]);

  // Start Node Dragging
  const handleStartNodeDrag = (e: React.MouseEvent, node: FlowNode) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedNodeId(node.id);

    setActiveDrag({
      type: "node",
      targetId: node.id,
      startNodePos: { ...node.position },
      startMouse: { x: e.clientX, y: e.clientY },
    });
  };

  // Start Canvas Pan
  const handleStartCanvasPan = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setSelectedNodeId(null);
      setActiveDrag({
        type: "pan",
        startNodePos: { ...pan },
        startMouse: { x: e.clientX, y: e.clientY },
      });
    }
  };

  // Calculate Node Port Position Coordinates
  const getPortCoordinates = useCallback((node: FlowNode, portType: "top" | "bottom" | "true" | "false") => {
    const width = 250;
    const height = 54;

    if (portType === "top") {
      return { x: node.position.x + width / 2, y: node.position.y };
    }
    if (portType === "true") {
      return { x: node.position.x + width * 0.35, y: node.position.y + height };
    }
    if (portType === "false") {
      return { x: node.position.x + width * 0.75, y: node.position.y + height };
    }
    // Default bottom port
    return { x: node.position.x + width / 2, y: node.position.y + height };
  }, []);

  // Start Connection Wire from Port
  const handleStartWire = (e: React.MouseEvent, fromNode: FlowNode, portType: "top" | "bottom" | "true" | "false") => {
    e.stopPropagation();
    e.preventDefault();

    const startPos = getPortCoordinates(fromNode, portType);
    const mousePos = screenToCanvas(e.clientX, e.clientY);

    setActiveDrag({
      type: "wire",
      targetId: fromNode.id,
      fromPort: portType,
      wireStartPos: startPos,
      wireCurrentPos: mousePos,
    });
  };

  // Complete Connection Wire on In Port Click/Release
  const handleCompleteWire = (e: React.MouseEvent, toNodeId: string, portType: "top" | "bottom") => {
    e.stopPropagation();
    const drag = activeDragRef.current;
    if (drag && drag.type === "wire" && drag.targetId && drag.targetId !== toNodeId) {
      const exists = connections.some(
        (c) => c.fromNodeId === drag.targetId && c.toNodeId === toNodeId
      );
      if (!exists) {
        const newConn: FlowConnection = {
          id: `conn-${Date.now()}`,
          fromNodeId: drag.targetId,
          toNodeId,
          fromPort: drag.fromPort || "bottom",
          toPort: portType,
        };
        setConnections((prev) => [...prev, newConn]);
        addToast({
          title: "Nodes Connected",
          description: `Linked conversation path.`,
          type: "success",
        });
      }
      setActiveDrag(null);
    }
  };

  // Delete Connection Line
  const handleDeleteConnection = (connId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    addToast({
      title: "Connection Removed",
      description: "Wire disconnected.",
      type: "info",
    });
  };

  // HTML5 Drag & Drop from Sidebar onto Canvas
  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData("application/flow-node-type");
    if (!nodeType) return;

    const coords = screenToCanvas(e.clientX, e.clientY);
    const template = AVAILABLE_NODE_TEMPLATES.find((t) => t.type === nodeType) || AVAILABLE_NODE_TEMPLATES[0];

    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: nodeType as any,
      label: template.title,
      position: { x: Math.round(coords.x - 120), y: Math.round(coords.y - 25) },
      data: {
        prompt: nodeType === "message" ? "Hello! How can I assist you with Apex Voice today?" : "",
        question: nodeType === "question" ? "Enter question to ask..." : "",
        variable: nodeType === "question" ? "user_intent" : "",
        transferTo: nodeType === "transfer" ? "+1 (415) 890-2341" : "",
        webhookUrl: nodeType === "webhook" ? "https://api.yourdomain.com/webhooks/voice" : "",
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    addToast({
      title: `Added ${template.title}`,
      description: "Placed block at cursor position.",
      type: "success",
    });
  };

  // Add Node by Click in Sidebar
  const handleAddNodeByClick = (type: string) => {
    const template = AVAILABLE_NODE_TEMPLATES.find((t) => t.type === type) || AVAILABLE_NODE_TEMPLATES[0];
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: type as any,
      label: template.title,
      position: {
        x: Math.round(300 + (nodes.length % 3) * 60 - pan.x / zoom),
        y: Math.round(180 + nodes.length * 70 - pan.y / zoom),
      },
      data: {
        prompt: type === "message" ? "Hello! How can I assist you today?" : "",
        question: type === "question" ? "Enter question to ask..." : "",
        variable: type === "question" ? "user_intent" : "",
        transferTo: type === "transfer" ? "+1 (415) 890-2341" : "",
        webhookUrl: type === "webhook" ? "https://api.yourdomain.com/webhooks/voice" : "",
      },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    addToast({
      title: `Added ${template.title}`,
      description: "Placed block on canvas. Drag to position and link ports.",
      type: "success",
    });
  };

  // Open Flow in Editor
  const handleOpenEditor = (flow?: FlowItem) => {
    if (flow) {
      setCurrentFlow(flow);
      setFlowTitle(flow.name);
      setFlowDescription(flow.description || "Describe what this flow does");
      setAssignedAgent(flow.agentId || (agents && agents.length > 0 ? agents[0].id : "no_agent"));
      setNodes(flow.nodes && flow.nodes.length > 0 ? flow.nodes : DEFAULT_FLOW_NODES);
      setConnections(flow.connections && flow.connections.length > 0 ? flow.connections : DEFAULT_CONNECTIONS);
    } else {
      const defaultAgentObj = agents && agents.length > 0 ? agents[0] : null;
      const newFlow: FlowItem = {
        id: `flow-${Date.now()}`,
        name: "New Autonomous Voice Flow",
        description: "Visual conversational decision tree and agent routing logic.",
        agentId: defaultAgentObj?.id,
        agentName: defaultAgentObj?.name || "AI Voice Agent",
        status: "active",
        nodesCount: DEFAULT_FLOW_NODES.length,
        connectionsCount: DEFAULT_CONNECTIONS.length,
        lastUpdated: new Date().toLocaleDateString("en-GB"),
        nodes: DEFAULT_FLOW_NODES,
        connections: DEFAULT_CONNECTIONS,
        notes: [],
      };
      setCurrentFlow(newFlow);
      setFlowTitle(newFlow.name);
      setFlowDescription(newFlow.description);
      setAssignedAgent(defaultAgentObj?.id || "no_agent");
      setNodes(DEFAULT_FLOW_NODES);
      setConnections(DEFAULT_CONNECTIONS);
    }
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedNodeId(null);
    setViewMode("editor");
  };

  // Toggle Flow Status in Database
  const handleToggleFlowStatus = async (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetFlow = flowsList.find((f) => f.id === flowId);
    if (!targetFlow) return;

    const nextStatus: "active" | "inactive" = targetFlow.status === "active" ? "inactive" : "active";
    const updated: FlowItem = { ...targetFlow, status: nextStatus };

    setFlowsList((prev) => prev.map((f) => (f.id === flowId ? updated : f)));

    addToast({
      title: nextStatus === "active" ? "Flow Activated" : "Flow Paused",
      description: `'${targetFlow.name}' status set to ${nextStatus}.`,
      type: nextStatus === "active" ? "success" : "info",
    });

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + '/flows/save';
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updated.id,
          name: updated.name,
          description: updated.description,
          agentId: updated.agentId,
          agentName: updated.agentName,
          status: updated.status,
          nodes: updated.nodes,
          connections: updated.connections,
          edges: updated.connections,
        }),
      });
    } catch (err) {
      console.warn("Failed to update flow status in database:", err);
    }
  };

  // Delete Flow from Database
  const handleDeleteFlow = async (flowId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlowsList((prev) => prev.filter((f) => f.id !== flowId));
    setDeleteModalFlow(null);

    addToast({
      title: "Flow Deleted",
      description: "Flow permanently removed from database.",
      type: "info",
    });

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + `/flows/${flowId}`;
      await fetch(apiUrl, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete flow from backend:", err);
    }
  };

  // Save Flow to PostgreSQL Database
  const handleSaveFlow = async () => {
    const chosenAgent = agents.find((a) => a.id === assignedAgent);
    const updatedFlow: FlowItem = {
      ...currentFlow,
      name: flowTitle.trim() || "Untitled Flow",
      description: flowDescription.trim(),
      agentId: assignedAgent === "no_agent" ? undefined : assignedAgent,
      agentName: chosenAgent?.name || currentFlow.agentName || "AI Voice Agent",
      status: currentFlow.status || "active",
      nodesCount: nodes.length,
      connectionsCount: connections.length,
      lastUpdated: new Date().toLocaleDateString("en-GB"),
      nodes,
      connections,
      notes: [],
    };

    setFlowsList((prev) => {
      const exists = prev.some((f) => f.id === updatedFlow.id);
      if (exists) {
        return prev.map((f) => (f.id === updatedFlow.id ? updatedFlow : f));
      }
      return [updatedFlow, ...prev];
    });

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + '/flows/save';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatedFlow.id,
          name: updatedFlow.name,
          description: updatedFlow.description,
          agentId: updatedFlow.agentId || "",
          agentName: updatedFlow.agentName || "",
          status: updatedFlow.status,
          nodes: updatedFlow.nodes,
          connections: updatedFlow.connections,
          edges: updatedFlow.connections,
          assigned_phone_number: "+1 (415) 890-2341",
        }),
      });
      if (res.ok) {
        addToast({
          title: "Flow Saved & Deployed",
          description: `Workflow '${updatedFlow.name}' successfully saved to database with ${nodes.length} nodes and assigned to ${updatedFlow.agentName}.`,
          type: "success",
        });
      }
    } catch (err) {
      console.warn("Failed to persist flow to database:", err);
      addToast({
        title: "Flow Saved Locally",
        description: `Workflow '${updatedFlow.name}' cached in local memory.`,
        type: "info",
      });
    }
  };

  // Run Flow Simulator with Attached Agent Persona
  const handleRunSimulator = () => {
    setTestSimulatorOpen(true);
    setIsSimulating(true);
    setConversationTurns([]);

    const firstNode = nodes.find((n) => n.type === "greeting" || n.type === "message" || n.type === "question") || nodes[0];
    const initialBotMessage =
      firstNode?.data?.prompt || firstNode?.data?.question || "Hello! Thank you for contacting us. How may I assist you today?";
    setActiveExecutingNodeId(firstNode?.id || null);

    const activeAgentObj = agents.find((a) => a.id === assignedAgent);
    const agentDisplayName = activeAgentObj?.name || currentFlow.agentName || (agents && agents.length > 0 ? agents[0].name : "AI Voice Agent");

    setSimulatorLogs([
      "⚡ Real-Time Conversation Turn Runner Initialized...",
      `✓ Flow Target: ${flowTitle}`,
      `✓ Attached Persona: ${agentDisplayName} (Database Active)`,
      `→ Executing Start Node [${firstNode?.label || "Start"}]: "${initialBotMessage}"`,
    ]);

    setConversationTurns([
      {
        speaker: "bot",
        text: initialBotMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsSimulating(false);
  };

  // Handle User Chat Turn in Simulator (Real-Time Agent Simulation Engine)
  const handleSendSimulatorChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;

    const userText = userChatInput.trim();
    setUserChatInput("");
    setConversationTurns((prev) => [
      ...prev,
      {
        speaker: "user",
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsSimulating(true);

    const currentConn = connections.find((c) => c.fromNodeId === activeExecutingNodeId);
    const nextNode = currentConn ? nodes.find((n) => n.id === currentConn.toNodeId) : null;

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1') + '/flows/simulate';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId: currentFlow.id,
          agentId: assignedAgent,
          currentNodeId: activeExecutingNodeId,
          userMessage: userText,
        }),
      });

      if (res.ok) {
        const simData = await res.json();
        if (nextNode) {
          setActiveExecutingNodeId(nextNode.id);
          setActiveEdgeId(currentConn?.id || null);
        }

        const botReply = simData.botResponse || "I am processing your inquiry right away.";

        setSimulatorLogs((prev) => [
          ...prev,
          `✓ User Intent Captured: "${userText}"`,
          `⚡ Signal evaluated on node [${nextNode?.label || 'Turn Execution'}]`,
          `🤖 [${simData.agentName}]: "${botReply}"`,
          `✓ Telemetry: ${simData.actionLog} (${simData.executionTime})`,
        ]);

        setConversationTurns((prev) => [
          ...prev,
          {
            speaker: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setIsSimulating(false);
        return;
      }
    } catch (err) {
      console.warn("Simulator backend call failed, falling back to local runner:", err);
    }

    // Local execution fallback
    setTimeout(() => {
      if (nextNode) {
        setActiveExecutingNodeId(nextNode.id);
        setActiveEdgeId(currentConn?.id || null);

        let botReply =
          nextNode.data?.prompt ||
          nextNode.data?.question ||
          "Evaluating condition logic and proceeding to the next step.";
        if (nextNode.type === "condition") {
          botReply = `Condition evaluated for variable '${nextNode.data?.variable || 'intent'}'. Taking active branch.`;
        }

        setSimulatorLogs((prev) => [
          ...prev,
          `✓ User Intent Captured: "${userText}"`,
          `⚡ Signal traveled along connection [${currentConn?.id}]`,
          `→ Executed Node [${nextNode.label}]: "${botReply}"`,
        ]);

        setConversationTurns((prev) => [
          ...prev,
          {
            speaker: "bot",
            text: botReply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setSimulatorLogs((prev) => [
          ...prev,
          `✓ User Speech Processed: "${userText}"`,
          "ℹ Flow end reached. Conversation step completed.",
        ]);
        setConversationTurns((prev) => [
          ...prev,
          {
            speaker: "bot",
            text: "Thank you! Have a wonderful day.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
      setIsSimulating(false);
    }, 500);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // ==========================================
  // VIEW 1: FLOWS MANAGEMENT LIST (Screenshot 1)
  // ==========================================
  if (viewMode === "list") {
    return (
      <div className="space-y-6 text-[#0F172A]">
        {/* Header Card (Matching Screenshot 1) */}
        <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#3157D5] text-white flex items-center justify-center shadow-lg shadow-[#3157D5]/20 shrink-0">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Flow Builder</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Create and manage conversation flows with drag-and-drop visual builder
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Row & + Create Flow Action (Matching Screenshot 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center bg-white p-1 rounded-2xl border border-[#E2E8F0] shadow-2xs">
            <button
              onClick={() => setActiveTab("flows")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "flows"
                  ? "bg-[#3157D5] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>My Flows ({flowsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "templates"
                  ? "bg-[#3157D5] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "logs"
                  ? "bg-[#3157D5] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execution Logs</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold shadow-md shadow-[#3157D5]/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Flow</span>
          </button>
        </div>

        {/* Flow Cards Grid (Matching Screenshot 1) */}
        {activeTab === "flows" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {flowsList.map((flow) => (
              <div
                key={flow.id}
                onClick={() => handleOpenEditor(flow)}
                className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#3157D5]/40 transition-all space-y-4 cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        flow.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      <Workflow className="w-3 h-3 text-[#3157D5]" />
                      <span className="capitalize">{flow.status}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleToggleFlowStatus(flow.id, e)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        flow.status === "active" ? "bg-[#3157D5]" : "bg-[#CBD5E1]"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          flow.status === "active" ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#3157D5] transition-colors">
                    {flow.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] font-semibold text-[#64748B]">
                      {flow.nodesCount} nodes
                    </span>
                    <span className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px] font-semibold text-[#64748B]">
                      {flow.connectionsCount} connections
                    </span>
                    {flow.agentName && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-[#EEF2FD] border border-[#3157D5]/20 rounded-xl text-[11px] font-bold text-[#3157D5]">
                        <Bot className="w-3 h-3" />
                        <span>{flow.agentName}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#64748B]">Last updated: {flow.lastUpdated}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditor(flow);
                    }}
                    className="flex-1 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditor(flow);
                      setTimeout(() => handleRunSimulator(), 300);
                    }}
                    className="flex-1 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl text-xs font-bold text-[#0F172A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Test</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModalFlow(flow);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete flow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
          <div>
            <span>Showing 1 to {flowsList.length} of {flowsList.length} items</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
                className="px-2 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F172A] outline-none"
              >
                <option value="9">9</option>
                <option value="18">18</option>
                <option value="36">36</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] cursor-pointer">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 h-7 rounded-lg bg-[#3157D5] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                1
              </span>
              <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] cursor-pointer">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal for Flows */}
        <ConfirmDeleteModal
          isOpen={!!deleteModalFlow}
          onClose={() => setDeleteModalFlow(null)}
          onConfirm={async () => {
            if (deleteModalFlow) {
              await handleDeleteFlow(deleteModalFlow.id);
            }
          }}
          itemName={deleteModalFlow?.name}
          itemType="Conversation Flow"
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: VISUAL WORKFLOW EDITOR (Matching Screenshot media_1787763888892.png exactly)
  // ==========================================
  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col bg-[#F8FAFC] rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm select-none">
      {/* Top Header Bar (Matching Screenshot) */}
      <div className="h-16 px-5 bg-white border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Flows</span>
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-xl bg-[#3157D5] text-white flex items-center justify-center font-bold shadow-xs">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#0F172A] leading-tight">Flow Builder</h2>
              <p className="text-[10px] text-[#64748B] leading-tight">Visual workflow editor</p>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md text-center hidden md:block">
          <input
            type="text"
            value={flowTitle}
            onChange={(e) => setFlowTitle(e.target.value)}
            className="w-full text-center font-bold text-sm text-[#0F172A] bg-transparent outline-none hover:bg-[#F8FAFC] focus:bg-white focus:border focus:border-[#3157D5] rounded-lg px-2 py-0.5"
            placeholder="Untitled Flow"
          />
          <input
            type="text"
            value={flowDescription}
            onChange={(e) => setFlowDescription(e.target.value)}
            className="w-full text-center text-xs text-[#64748B] bg-transparent outline-none hover:bg-[#F8FAFC] focus:bg-white focus:border focus:border-[#3157D5] rounded-lg px-2 py-0.5"
            placeholder="Describe what this flow does"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] text-[#64748B] font-medium whitespace-nowrap">
              Voice Agent (Optional)
            </span>
            <select
              value={assignedAgent}
              onChange={(e) => setAssignedAgent(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="no_agent">No agent</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              addToast({
                title: "Flow Builder Help",
                description: "Drag nodes from the left palette onto the canvas. Connect top and bottom ports with dashed wires.",
                type: "info",
              });
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span>Help</span>
          </button>

          <button
            onClick={handleRunSimulator}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 text-[#3157D5]" />
            <span>Test</span>
          </button>

          <button
            onClick={handleSaveFlow}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3157D5] hover:bg-[#2646B8] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#3157D5]/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - "ADD NODES" (Matching Screenshot) */}
        <div className="w-64 bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between shrink-0 overflow-y-auto space-y-3 z-20">
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-[#3157D5] uppercase tracking-wider mb-2">
              ADD NODES
            </p>

            <div className="space-y-2">
              {AVAILABLE_NODE_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.type}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/flow-node-type", tpl.type);
                    }}
                    onClick={() => handleAddNodeByClick(tpl.type)}
                    className={`w-full p-2.5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#3157D5]/60 hover:shadow-xs transition-all flex items-center justify-between group cursor-grab active:cursor-grabbing select-none ${tpl.accentClass}`}
                    title="Drag onto canvas or click to add"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${tpl.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#0F172A] leading-tight truncate">{tpl.title}</p>
                        <p className="text-[10px] text-[#64748B] leading-tight truncate">{tpl.subtitle}</p>
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-md text-[#3157D5] group-hover:bg-[#EEF2FD] flex items-center justify-center shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-[#EEF2FD] rounded-2xl border border-[#3157D5]/20 text-[11px] text-[#3157D5] space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Interactive Wiring
            </p>
            <p className="text-[#64748B] text-[10px]">
              • <b>Drag nodes</b> freely to position
              <br />• <b>Drag from port circles</b> to draw dashed lines
              <br />• <b>Scroll wheel</b> to zoom in / out
            </p>
          </div>
        </div>

        {/* Center Interactive Pan/Zoom Canvas */}
        <div
          ref={canvasContainerRef}
          onMouseDown={handleStartCanvasPan}
          onDragOver={handleDragOverCanvas}
          onDrop={handleDropOnCanvas}
          className={`flex-1 relative overflow-hidden bg-[#F8FAFC] ${
            activeDrag?.type === "pan" ? "cursor-grabbing" : "cursor-default"
          }`}
        >
          {/* Dot Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#CBD5E1 1.4px, transparent 1.4px)",
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              opacity: 0.8,
            }}
          />

          {/* SVG Dashed Teal Connection Layer (Matching Screenshot) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              overflow: "visible",
            }}
          >
            {/* Existing Connections */}
            {connections.map((conn) => {
              const fromNode = nodes.find((n) => n.id === conn.fromNodeId);
              const toNode = nodes.find((n) => n.id === conn.toNodeId);
              if (!fromNode || !toNode) return null;

              const fromPos = getPortCoordinates(fromNode, conn.fromPort || "bottom");
              const toPos = getPortCoordinates(toNode, conn.toPort || "top");

              const dy = Math.max(40, Math.abs(toPos.y - fromPos.y) * 0.5);
              const pathStr = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x} ${fromPos.y + dy}, ${toPos.x} ${toPos.y - dy}, ${toPos.x} ${toPos.y}`;
              const isAnimated = activeEdgeId === conn.id;

              return (
                <g key={conn.id} className="pointer-events-auto cursor-pointer group">
                  {/* Thick hover target */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    onClick={(e) => handleDeleteConnection(conn.id, e)}
                  />
                  {/* Dashed Teal/Cyan Line (Matching Screenshot) */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="#0891B2"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    className={isAnimated ? "animate-pulse" : "group-hover:stroke-[#0284C7]"}
                  />
                  {/* Midpoint Delete Dot */}
                  <circle
                    cx={(fromPos.x + toPos.x) / 2}
                    cy={(fromPos.y + toPos.y) / 2}
                    r="8"
                    fill="#FFFFFF"
                    stroke="#0891B2"
                    strokeWidth="2"
                    className="group-hover:fill-rose-50 group-hover:stroke-rose-500"
                    onClick={(e) => handleDeleteConnection(conn.id, e)}
                  />
                </g>
              );
            })}

            {/* Live Interactive Wire being drawn */}
            {activeDrag?.type === "wire" && activeDrag.wireStartPos && activeDrag.wireCurrentPos && (() => {
              const fromPos = activeDrag.wireStartPos;
              const toPos = activeDrag.wireCurrentPos;
              const dy = Math.max(40, Math.abs(toPos.y - fromPos.y) * 0.5);
              const pathStr = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x} ${fromPos.y + dy}, ${toPos.x} ${toPos.y - dy}, ${toPos.x} ${toPos.y}`;

              return (
                <path
                  d={pathStr}
                  fill="none"
                  stroke="#0891B2"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              );
            })()}
          </svg>

          {/* Transformed Nodes Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {/* Solid Pill-Styled Flow Nodes (Matching Screenshot media_1787763888892.png) */}
            {nodes.map((node) => {
              const template = AVAILABLE_NODE_TEMPLATES.find((t) => t.type === node.type) || AVAILABLE_NODE_TEMPLATES[0];
              const Icon = template.icon;
              const isSelected = selectedNodeId === node.id;
              const isExecuting = activeExecutingNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleStartNodeDrag(e, node)}
                  style={{
                    position: "absolute",
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    width: "250px",
                    height: "54px",
                  }}
                  className={`rounded-2xl border-2 p-3 shadow-lg transition-all cursor-grab active:cursor-grabbing flex items-center justify-between relative bg-gradient-to-r ${template.gradient} text-white ${
                    isExecuting
                      ? "border-emerald-400 ring-4 ring-emerald-400/40 shadow-xl scale-105"
                      : isSelected
                      ? "border-white ring-4 ring-[#3157D5]/30 shadow-xl"
                      : "border-white/80 hover:border-white"
                  }`}
                >
                  {/* Top Input/Output Port Dot */}
                  <div
                    onMouseDown={(e) => handleStartWire(e, node, "top")}
                    onMouseUp={(e) => handleCompleteWire(e, node.id, "top")}
                    className={`w-3.5 h-3.5 rounded-full ${template.portBg} border-2 border-white absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center hover:scale-130 transition-transform cursor-pointer shadow-xs z-10`}
                    title="Connect top port"
                  />

                  {/* Left Icon & Node Label */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm text-white tracking-wide truncate">
                      {node.label}
                    </span>
                  </div>

                  {/* Node Bottom Port Dots */}
                  {node.type === "condition" ? (
                    <>
                      {/* Condition True Port Dot (Green) */}
                      <div
                        onMouseDown={(e) => handleStartWire(e, node, "true")}
                        onMouseUp={(e) => handleCompleteWire(e, node.id, "bottom")}
                        className="w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-white absolute -bottom-1.5 left-[35%] -translate-x-1/2 flex items-center justify-center hover:scale-130 transition-transform cursor-pointer shadow-xs z-10"
                        title="True branch port"
                      />
                      {/* Condition False Port Dot (Red) */}
                      <div
                        onMouseDown={(e) => handleStartWire(e, node, "false")}
                        onMouseUp={(e) => handleCompleteWire(e, node.id, "bottom")}
                        className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-white absolute -bottom-1.5 left-[75%] -translate-x-1/2 flex items-center justify-center hover:scale-130 transition-transform cursor-pointer shadow-xs z-10"
                        title="False branch port"
                      />
                    </>
                  ) : (
                    /* Standard Bottom Port Dot */
                    <div
                      onMouseDown={(e) => handleStartWire(e, node, "bottom")}
                      onMouseUp={(e) => handleCompleteWire(e, node.id, "bottom")}
                      className={`w-3.5 h-3.5 rounded-full ${template.portBg} border-2 border-white absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center hover:scale-130 transition-transform cursor-pointer shadow-xs z-10`}
                      title="Connect bottom port"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom-Left Canvas Zoom Controls */}
          <div className="absolute bottom-5 left-5 bg-white border border-[#E2E8F0] rounded-xl shadow-md p-1 flex items-center gap-1 z-20">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar - "Node Properties" Panel (Matching Screenshot media_1787763888892.png exactly) */}
        {selectedNode ? (
          <div className="w-80 bg-white border-l border-[#E2E8F0] p-5 flex flex-col justify-between shrink-0 overflow-y-auto space-y-4 text-xs z-30 shadow-xs">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#3157D5]" />
                  <h3 className="font-bold text-sm text-[#0F172A]">Node Properties</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
                      setConnections((prev) =>
                        prev.filter((c) => c.fromNodeId !== selectedNode.id && c.toNodeId !== selectedNode.id)
                      );
                      setSelectedNodeId(null);
                    }}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Node ID */}
              <div>
                <label className="text-xs text-[#64748B] block mb-1">Node ID</label>
                <p className="font-mono text-xs text-[#0F172A] font-medium">{selectedNode.id}</p>
              </div>

              {/* Question / Message Field */}
              <div>
                <label className="font-bold text-xs text-[#0F172A] block mb-1">
                  {selectedNode.type === "question" ? "Question" : "Message"}
                </label>
                <textarea
                  rows={4}
                  value={selectedNode.data?.question || selectedNode.data?.prompt || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? {
                              ...n,
                              data: {
                                ...n.data,
                                question: val,
                                prompt: val,
                              },
                            }
                          : n
                      )
                    );
                  }}
                  className="w-full p-3 bg-white border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#3157D5] resize-none"
                  placeholder={selectedNode.type === "question" ? "Enter question to ask..." : "Enter message to speak..."}
                />
              </div>

              {/* Variable Name */}
              <div>
                <label className="font-bold text-xs text-[#0F172A] flex items-center gap-1 mb-1">
                  <span>Variable Name</span>
                  <Info className="w-3 h-3 text-[#64748B]" />
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.variable || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, variable: val } }
                          : n
                      )
                    );
                  }}
                  placeholder="e.g., transfer_consent"
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#3157D5]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  Use lowercase with underscores (e.g., transfer_consent, user_age)
                </p>
              </div>

              {/* Checkbox: Wait for response before proceeding */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wait-response-cb"
                  checked={waitForResponse}
                  onChange={(e) => setWaitForResponse(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3157D5] focus:ring-[#3157D5] cursor-pointer"
                />
                <label htmlFor="wait-response-cb" className="text-xs font-medium text-[#0F172A] cursor-pointer">
                  Wait for response before proceeding
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Simulator Modal */}
      {testSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#0F172A] text-white rounded-3xl shadow-2xl border border-white/20 p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2 text-emerald-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="font-bold text-sm">Real-Time Flow Runner & Simulator</span>
              </div>
              <button
                onClick={() => {
                  setTestSimulatorOpen(false);
                  setActiveExecutingNodeId(null);
                  setActiveEdgeId(null);
                }}
                className="p-1 text-white/60 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-black/50 rounded-2xl border border-white/10 p-4 space-y-3 overflow-y-auto max-h-72">
              {conversationTurns.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${
                    turn.speaker === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      turn.speaker === "user" ? "bg-emerald-500 text-white" : "bg-[#3157D5] text-white"
                    }`}
                  >
                    {turn.speaker === "user" ? "U" : "AI"}
                  </div>
                  <div
                    className={`p-3 rounded-2xl max-w-[80%] space-y-1 ${
                      turn.speaker === "user"
                        ? "bg-emerald-950/80 border border-emerald-500/30 text-emerald-100"
                        : "bg-slate-900 border border-white/10 text-white"
                    }`}
                  >
                    <p className="leading-relaxed">{turn.text}</p>
                    <span className="text-[9px] text-white/40 block text-right font-mono">{turn.time}</span>
                  </div>
                </div>
              ))}
              {isSimulating && (
                <div className="flex items-center gap-2 text-sky-400 text-xs font-mono animate-pulse">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Evaluating speech intent and advancing flow...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendSimulatorChat} className="flex items-center gap-2">
              <input
                type="text"
                value={userChatInput}
                onChange={(e) => setUserChatInput(e.target.value)}
                placeholder="Speak or type caller response (e.g. 'yes, I want a demo')..."
                className="flex-1 px-4 py-2.5 bg-black/60 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-[#3157D5]"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2.5 bg-[#3157D5] hover:bg-[#2646B8] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#3157D5]/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-[10px] text-white/70 space-y-1">
              <span className="font-bold text-white block">Telemetry Logs:</span>
              <p className="text-emerald-400 truncate">{simulatorLogs[simulatorLogs.length - 1]}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
