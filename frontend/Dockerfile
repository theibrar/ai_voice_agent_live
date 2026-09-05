FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Next.js production application
RUN npm run build

EXPOSE 3000

# Run production Next.js server
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]