FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

# Next.js dev server run with 0.0.0.0 binding
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]