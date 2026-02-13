FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Vite's default port
EXPOSE 5173

# Start Vite with the --host flag (required for Docker)
CMD ["npm", "run", "dev", "--", "--host"]