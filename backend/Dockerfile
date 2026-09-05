# Step 1: Build Stage
FROM golang:alpine AS builder

ENV GOTOOLCHAIN=auto

WORKDIR /app

# Copy dependency files and download modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Step 2: Final Runtime Stage
FROM alpine:latest

WORKDIR /root/

# Copy compiled binary
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]