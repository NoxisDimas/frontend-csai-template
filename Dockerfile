# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

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
