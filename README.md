# Bricks and Quantas (BeQ): Efficient Life Management

<div align="center">

![BeQ Logo](https://via.placeholder.com/200x80/2563eb/ffffff?text=BeQ)

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

*Architecting a More Purposeful Humanity*

</div>

## 🎯 Vision & Mission

BeQ is an avant-garde AI-powered life management application that transcends traditional calendar planning by serving as a dynamic and intuitive personal assistant. Our mission is to empower humanity to unlock their potential for a more organized, enriched, and fulfilling life through intelligent design that balances ambition with well-being.

### Core Innovation: Bricks & Quantas System
- **Bricks**: Main tasks and projects (e.g., "Learn Spanish", "Complete quarterly report")
- **Quantas**: Sub-components and actionable steps within Bricks (e.g., "Study vocabulary", "Draft executive summary")

## ✨ Key Features

### 🤖 AI-Powered Orchestration
- **Conversational AI**: Natural language interaction powered by LangGraph workflows
- **Intelligent Scheduling**: AI-driven optimization considering health, preferences, and constraints
- **Proactive Assistance**: Context-aware suggestions and resource recommendations with state management

### 📅 Smart Calendar Integration
- **Universal Sync**: Google Calendar, Microsoft Teams, Outlook integration
- **Real-time Optimization**: On-the-fly rescheduling with instant plan re-optimization
- **Conflict Resolution**: Intelligent handling of scheduling conflicts

### 🎯 Holistic Life Optimization
- **Well-being Focus**: Sleep, rest, and health optimization in scheduling
- **Personal Development**: AI-curated learning resources and habit formation
- **Work-Life Balance**: Professional and personal life harmonization

### 📚 Resource Intelligence
- **Curated Content**: AI-selected articles, videos, courses, and tools
- **Contextual Recommendations**: Task-specific resource suggestions
- **Learning Pathways**: Structured development plans

## 🏗️ Architecture

BeQ follows a modern microservices architecture designed for scalability, maintainability, and performance:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │  External APIs  │
│   (Next.js)     │    │   (React Native)│    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Orchestrator Service   │
                    │   (FastAPI + LangGraph)  │
                    └────────────┬────────────┘
                                 │
        ┌────────────┬────────────┼────────────┬────────────┐
        │            │            │            │            │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼──────┐ ┌───▼──────┐ ┌───▼──────┐
│  Scheduler   │ │   RAG    │ │ Calendar │ │  User    │ │   ...    │
│  Service     │ │Recommender│ │Integration│ │ Profile  │ │          │
│  (CP-SAT)    │ │ (Vector  │ │ Service   │ │ Service  │ │          │
│              │ │  Search) │ │           │ │          │ │          │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 🔧 Technology Stack

**Backend Services:**
- **FastAPI**: High-performance async web framework
- **LangGraph**: Advanced AI workflow orchestration and agent management
- **PostgreSQL**: Primary data storage with per-service databases
- **Redis**: Caching and session management
- **Qdrant**: Vector database for RAG and semantic search

**Frontend:**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management

**AI & ML:**
- **OpenAI GPT-4**: Primary language model
- **OR-Tools**: Constraint programming for optimization
- **Sentence Transformers**: Text embeddings
- **LangGraph Workflows**: Advanced AI agent capabilities and state management

**Infrastructure:**
- **Docker**: Containerization
- **PostgreSQL**: Multi-database setup
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: Latest version
- **Git**: For cloning the repository
- **OpenAI API Key**: For AI functionality (optional for development)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/beq-efficient-life-management.git
cd beq-efficient-life-management
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment variables
nano .env
```

**Required Environment Variables:**
```bash
# AI Services
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional

# Security
SECRET_KEY=your_super_secret_key_here

# Calendar Integration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 3. Install Shared Dependencies

```bash
# Install the shared models package
cd packages/shared-models
pip install -e .
cd ../..
```

### 4. Build and Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# To include monitoring services (Prometheus, Grafana)
docker-compose --profile monitoring up -d --build
```

### 5. Verify Installation

Open your browser and navigate to:

- **Web Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📖 Usage Examples

### Basic Conversation Flow

```
User: "I work 9-5 and want to add workout sessions and Spanish learning to my schedule."

BeQ: "Great! I'd love to help you add these activities. A few questions to optimize your schedule:

1. How many workout sessions per week would you prefer?
2. What type of workouts do you enjoy?
3. For Spanish learning, are you a beginner or do you have some experience?
4. Do you prefer learning in the morning, evening, or during lunch breaks?
5. How much time can you dedicate to Spanish learning daily?"

User: "3 workouts per week, I like strength training, I'm a beginner in Spanish, and I prefer evening learning sessions, maybe 30 minutes daily."

BeQ: "Perfect! Here's what I've planned for you:

**Workouts (Strength Training)**
🏋️ Monday, Wednesday, Friday: 6:00-7:00 PM
- I've scheduled these after work with time to commute home
- Found a great beginner strength training program for you

**Spanish Learning**
📚 Daily: 7:30-8:00 PM (except workout days: 8:00-8:30 PM)
- Starting with Duolingo + conversation practice
- Curated beginner-friendly Spanish resources

Would you like me to adjust the timing or add these to your calendar?"
```

### Advanced Scheduling Scenarios

```
User: "I have a big presentation next Friday and need to reschedule this week."

BeQ: "I understand you need to prioritize your presentation. Let me help you reschedule optimally:

**Current conflicts identified:**
- Spanish learning sessions this week
- Wednesday workout overlaps with prep time
- Thursday evening social commitment

**Suggested adjustments:**
1. Move Wednesday workout to Thursday 6 AM
2. Reduce Spanish sessions to 15 mins during lunch
3. Block Thursday-Friday evenings for presentation prep
4. Schedule presentation practice session Friday morning

I've also found relevant resources:
- "Effective Presentation Techniques" course
- Public speaking confidence exercises
- Presentation template library

Shall I implement these changes and sync with your calendar?"
```

## 🔧 Development

### Local Development Setup

```bash
# Set up development environment
python -m venv beq-env
source beq-env/bin/activate  # On Windows: beq-env\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Run individual services
cd services/orchestrator
uvicorn app.main:app --reload --port 8000

cd ../scheduler
uvicorn app.main:app --reload --port 8001
```

### Frontend Development

```bash
cd clients/web
npm install
npm run dev
```

### Running Tests

```bash
# Run all tests
docker-compose -f docker-compose.test.yml up --build

# Run specific service tests
cd services/orchestrator
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Code Quality

```bash
# Format code
black services/ packages/
isort services/ packages/

# Lint code
flake8 services/ packages/
mypy services/ packages/

# Frontend linting
cd clients/web
npm run lint
npm run type-check
```

## 📁 Project Structure

```
beq/
├── .github/workflows/          # CI/CD pipelines
├── clients/                    # Frontend applications
│   └── web/                   # Next.js web application
├── services/                   # Backend microservices
│   ├── orchestrator/          # Main AI orchestration service
│   ├── scheduler/             # Constraint solving and optimization
│   ├── rag-recommender/       # Resource recommendations
│   └── calendar-integration/  # External calendar sync
├── packages/                   # Shared code packages
│   └── shared-models/         # Common data models
├── infra/                     # Infrastructure configurations
│   └── docker/               # Docker configurations
├── docker-compose.yml         # Development environment
└── README.md                  # This file
```

## 🚦 Service Health

Monitor service health at:

- **Orchestrator**: http://localhost:8000/health/detailed
- **Scheduler**: http://localhost:8001/health
- **RAG Service**: http://localhost:8002/health
- **Calendar Service**: http://localhost:8003/health

## 📊 Monitoring (Optional)

When running with monitoring profile:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test` and `pytest`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [BeQ Docs](https://docs.beq.app)
- **Discord Community**: [Join our Discord](https://discord.gg/beq)
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-org/beq/issues)
- **Email Support**: support@beq.app

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core AI orchestration
- ✅ Basic scheduling optimization
- ✅ Calendar integration
- 🔄 Resource recommendations

### Phase 2
- 📱 Mobile application
- 🔗 Advanced integrations (Slack, Notion, etc.)
- 📈 Advanced analytics and insights
- 🌐 Multi-language support

### Phase 3
- 🤖 Enhanced AI capabilities
- 👥 Team and family scheduling
- 🎯 Goal tracking and achievement
- 🌟 Habit formation and tracking

---

<div align="center">

**Built with ❤️ by the BeQ team**

*Empowering humanity to live more purposefully, one Brick and Quanta at a time.*

</div>
