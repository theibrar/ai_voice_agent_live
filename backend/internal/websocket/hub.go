package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type Event struct {
	Type    string      `json:"type"` // e.g. "call_started", "call_ended", "transcript_chunk"
	Payload interface{} `json:"payload"`
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Println("[WebSocket] New dashboard client connected.")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Println("[WebSocket] Client disconnected.")
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) BroadcastEvent(eventType string, payload interface{}) {
	event := Event{
		Type:    eventType,
		Payload: payload,
	}

	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("[WebSocket] Failed to marshal event: %v", err)
		return
	}

	h.broadcast <- data
}
