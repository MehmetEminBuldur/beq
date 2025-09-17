# 🚀 Vercel Serverless Migration Guide

This document outlines the complete migration from **Docker-based microservices** to **Vercel serverless functions** for the BeQ project.

## 📋 **Migration Overview**

### **Before: Docker Microservices**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Orchestrator  │    │    Scheduler    │    │  RAG Recommender│
│   (Port 8000)   │    │   (Port 8001)   │    │   (Port 8002)   │
│     FastAPI     │    │     FastAPI     │    │     FastAPI     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              Docker Compose                     │
         │  + PostgreSQL + Redis + Qdrant + Monitoring    │
         └─────────────────────────────────────────────────┘
```

### **After: Vercel Serverless**
```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                  │
│                                                         │
│  /api/health                   → Health checks          │
│  /api/v1/chat/message          → AI conversations       │
│  /api/v1/schedule/generate     → AI scheduling          │
│  /api/v1/recommendations       → RAG recommendations    │
│  /api/v1/calendar/events       → Calendar integration   │
│  /api/v1/bricks                → Task management        │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                       │                       │
  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
  │  Supabase   │    │   OpenRouter    │    │ Local Storage   │
  │ PostgreSQL  │    │  Gemma 27B IT   │    │   + Caching     │
  │ Auth + RT   │    │ (Open Source)   │    │   + Offline     │
  └─────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 **API Routes Migration**

### **1. Orchestrator Service → Multiple API Routes**

| **FastAPI Endpoint** | **Vercel API Route** | **Function** |
|---------------------|---------------------|---------------|
| `POST /api/v1/chat/message` | `/api/v1/chat/message/route.ts` | AI conversations |
| `GET /api/v1/bricks` | `/api/v1/bricks/route.ts` | Bricks management |
| `POST /api/v1/bricks` | `/api/v1/bricks/route.ts` | Create Bricks |
| `GET /health` | `/api/health/route.ts` | Health checks |

### **2. Scheduler Service → Scheduling API**

| **FastAPI Endpoint** | **Vercel API Route** | **Function** |
|---------------------|---------------------|---------------|
| `POST /api/v1/schedule` | `/api/v1/schedule/generate/route.ts` | AI-powered scheduling |
| `POST /api/v1/optimize` | `/api/v1/schedule/generate/route.ts` | Schedule optimization |

### **3. RAG Service → Recommendations API**

| **FastAPI Endpoint** | **Vercel API Route** | **Function** |
|---------------------|---------------------|---------------|
| `POST /api/v1/recommend` | `/api/v1/recommendations/route.ts` | Resource recommendations |
| `GET /api/v1/trending` | `/api/v1/recommendations/route.ts` | Trending resources |

### **4. Calendar Service → Calendar API**

| **FastAPI Endpoint** | **Vercel API Route** | **Function** |
|---------------------|---------------------|---------------|
| `POST /api/v1/sync` | `/api/v1/calendar/events/route.ts` | Calendar synchronization |
| `GET /api/v1/events` | `/api/v1/calendar/events/route.ts` | Fetch calendar events |

## 🏗️ **Architecture Changes**

### **Database Migration**
- ❌ **Removed**: Local PostgreSQL Docker container
- ✅ **Added**: Supabase PostgreSQL (managed)
- ✅ **Added**: Supabase Auth integration
- ✅ **Added**: Supabase Real-time subscriptions

### **Caching Migration**
- ❌ **Removed**: Redis Docker container
- ✅ **Added**: Browser Local Storage
- ✅ **Added**: Service Worker caching
- ✅ **Added**: Offline support

### **AI Services Migration**
- ❌ **Removed**: OpenAI, Anthropic (closed source)
- ✅ **Added**: OpenRouter + Gemma 3 27B IT (100% open source)
- ✅ **Added**: Consistent AI across all services

## 📦 **Removed Components**

### **Docker Infrastructure**
```bash
# All removed files:
docker-compose.yml                    # Main orchestration
services/*/Dockerfile                 # Service containers
clients/web/Dockerfile                # Frontend container
infra/docker/                         # Docker configs
infra/monitoring/                     # Prometheus/Grafana
packages/shared-models/               # Python shared models
```

### **Microservices**
```bash
# All removed directories:
services/orchestrator/                # FastAPI orchestrator
services/scheduler/                   # FastAPI scheduler
services/rag-recommender/             # FastAPI RAG service
services/calendar-integration/        # FastAPI calendar service
```

### **Dependencies**
```bash
# Removed from environment:
- PostgreSQL Docker containers
- Redis Docker containers
- Python virtual environments
- uvicorn/gunicorn servers
- Docker Compose networking
- Service discovery
- Load balancing
```

## 🚀 **Deployment Process**

### **1. Pre-Migration (Docker)**
```bash
# Old deployment process
docker-compose up -d                  # Start all services
docker-compose build                  # Build containers
docker-compose logs                   # View logs
```

### **2. Post-Migration (Vercel)**
```bash
# New deployment process
vercel --prod                         # Deploy to production
vercel dev                           # Local development
vercel logs                          # View function logs
```

## 🔧 **Environment Variables Migration**

### **Removed Variables**
```bash
# Docker & Microservices
DATABASE_URL=postgresql://...
REDIS_URL=redis://redis:6379
SCHEDULER_SERVICE_URL=http://scheduler:8001
RAG_SERVICE_URL=http://rag-recommender:8002
CALENDAR_SERVICE_URL=http://calendar-integration:8003

# Closed Source AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### **Added Variables**
```bash
# Vercel & Serverless
VERCEL_URL=https://your-app.vercel.app
NODE_ENV=production

# Supabase (replaces PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenRouter (replaces OpenAI/Anthropic)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemma-2-27b-it
```

## 📊 **Performance Improvements**

### **Cold Start Times**
- **Docker**: 30-60 seconds (container startup)
- **Vercel**: 0-300ms (serverless function)

### **Scaling**
- **Docker**: Manual scaling, resource limits
- **Vercel**: Automatic scaling, global edge network

### **Cost Efficiency**
- **Docker**: Always running (even idle)
- **Vercel**: Pay-per-request (zero idle cost)

### **Geographic Distribution**
- **Docker**: Single region deployment
- **Vercel**: Global edge network (100+ locations)

## 🔄 **Development Workflow**

### **Local Development**
```bash
# Navigate to web client
cd clients/web

# Install dependencies
npm install

# Set up environment
cp ../../env.example .env.local

# Start development server
npm run dev                           # Runs on http://localhost:3000

# API routes available at:
# http://localhost:3000/api/health
# http://localhost:3000/api/v1/chat/message
# http://localhost:3000/api/v1/schedule/generate
# etc.
```

### **Testing API Routes**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_id": "test"}'

# Test scheduling endpoint
curl -X POST http://localhost:3000/api/v1/schedule/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "tasks": [...], "user_preferences": {...}}'
```

## 🎯 **Benefits of Migration**

### **✅ Simplified Architecture**
- Single codebase (Next.js)
- No service orchestration
- No container management
- No networking configuration

### **✅ Better Performance**
- Edge computing
- Faster cold starts
- Automatic scaling
- Global CDN

### **✅ Lower Costs**
- No always-running servers
- Pay-per-request pricing
- No infrastructure management
- Reduced DevOps overhead

### **✅ Enhanced Developer Experience**
- Single development environment
- Integrated frontend/backend
- Hot reload for API routes
- Simplified debugging

### **✅ Production Ready**
- Automatic HTTPS
- Built-in monitoring
- Error tracking
- Performance analytics

## 🔍 **Monitoring & Debugging**

### **Vercel Dashboard**
- Function logs and metrics
- Performance analytics
- Error tracking
- Deployment history

### **Development Tools**
```bash
# Local development with debugging
npm run dev                           # Hot reload enabled
vercel dev                           # Vercel environment simulation
vercel logs --follow                 # Real-time logs
```

## 📚 **Next Steps**

1. **Complete Supabase setup** (database schema, auth policies)
2. **Update frontend API calls** to use new routes
3. **Test all endpoints** thoroughly
4. **Deploy to Vercel** and configure environment variables
5. **Set up monitoring** and error tracking
6. **Update documentation** for team onboarding

## 🎉 **Conclusion**

The migration from Docker microservices to Vercel serverless functions provides:

- **⚡ Faster deployment** and development cycles
- **🌍 Global scale** with zero configuration
- **💰 Cost optimization** through pay-per-use model
- **🛠️ Better developer experience** with integrated tools
- **🔒 Enhanced security** with managed infrastructure

This modern serverless architecture positions BeQ for rapid scaling and efficient development! 🚀
