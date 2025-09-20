# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV development
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_ORCHESTRATOR_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_SCHEDULER_API_URL=http://localhost:8001
ENV NEXT_PUBLIC_RAG_API_URL=http://localhost:8002
ENV NEXT_PUBLIC_CALENDAR_API_URL=http://localhost:8003
ENV NEXT_PUBLIC_ENVIRONMENT=development
ENV NEXT_PUBLIC_SUPABASE_URL=https://ncuqhnggwiayzqvrelql.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdXFobmdnd2lheXpxdnJlbHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODkwODcsImV4cCI6MjA3Mzg2NTA4N30.EQG8bwa0uhYv3u8TkH5bHiTJoJupcG8m_ETDLUuos9I
ENV SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_placeholder

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
