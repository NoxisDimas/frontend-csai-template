# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL

# Set as environment variables for Vite to use during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

# Copy package.json and package-lock.json
COPY package*.json ./

# Increase timeout limits to prevent EIDLETIMEOUT on slow networks
ENV npm_config_fetch_retry_maxtimeout=600000 \
    npm_config_fetch_timeout=600000

# Install dependencies (using legacy peer deps if needed based on previous config)
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using Node.js
FROM node:20-alpine

WORKDIR /app

# Install 'serve' to serve static files
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application using 'serve' on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
