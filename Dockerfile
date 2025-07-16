# Multi-stage build for TypeScript compilation
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpserver -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R mcpserver:nodejs /app
USER mcpserver

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Define the command to run the application
CMD ["npm", "run", "start:remote"] 

# # Use a base image with Node.js and Alpine Linux for a small footprint
# FROM node:20-alpine

# # Set the working directory inside the container
# WORKDIR /app

# # Copy the application's source code into the container
# COPY . .

# # Install application dependencies
# RUN yarn install --production

# # Expose the port your application listens on
# EXPOSE 3000

# # Set environment variables
# ENV NODE_ENV=production
# ENV PORT=3000
# ENV HOST=0.0.0.0

# # Define the command to run the application
# CMD ["npm", "run", "start:remote"] 