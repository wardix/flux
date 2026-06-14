# Stage 1: Build
FROM oven/bun:latest AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the backend (if necessary, though Bun can run TS directly)
# For production, we can run TS directly using bun, but copying everything is fine.
# We will just copy the src and necessary files in the runner stage.

# Stage 2: Runner
FROM oven/bun:latest AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Start backend
CMD ["bun", "src/index.ts"]
