# Environment Variables Consolidation

This document describes the consolidation of environment variables across all BeQ services into a single global configuration file.

## Changes Made

### 1. Global Environment File

- **Created**: `global.env` - Single source of truth for all environment variables
- **Created**: `global.env.example` - Template with documentation for all required variables
- **Updated**: `.gitignore` - Added patterns to ignore environment files while preserving examples

### 2. Docker Compose Updates

- **Updated**: `docker-compose.yml` 
  - Replaced all inline `environment:` blocks with `env_file: - ./global.env`
  - Removed hardcoded environment variables
  - Removed volume mount for calendar service .env file
  - All services now use the same global environment configuration

### 3. Dockerfile Updates

- **Updated**: `clients/web/Dockerfile`
  - Removed hardcoded ENV statements
  - Environment variables now provided by docker-compose env_file

- **Verified**: All Python service Dockerfiles were already clean
  - Only contain build-time Python environment variables
  - No application-specific hardcoded values

### 4. Setup Script Updates

- **Updated**: `setup-env.sh`
  - Now focuses on single global.env file
  - Provides clear instructions for required variables
  - Improved documentation and guidance

## Environment Variables Included

The `global.env` file consolidates all environment variables from:

### Application Settings
- `ENVIRONMENT`, `NODE_ENV`

### Database Configuration
- `DATABASE_URL`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- Backend variants: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

### AI/LLM Configuration
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `OPENROUTER_API_KEY`

### OAuth Configuration
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Microsoft: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`

### Security Settings
- `SECRET_KEY`, `SESSION_SECRET`
- `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`

### Service URLs
- Internal: `SCHEDULER_SERVICE_URL`, `RAG_SERVICE_URL`, `CALENDAR_SERVICE_URL`
- Frontend: `NEXT_PUBLIC_*` variants for all APIs
- `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_SITE_URL`

### Infrastructure
- `REDIS_URL`, `QDRANT_URL`
- `HOST`, `PORT`

### Feature Flags & Performance
- `ENABLE_AI_SUGGESTIONS`, `ENABLE_AUTO_SCHEDULING`, etc.
- `AGENT_MAX_ITERATIONS`, `SCHEDULING_LOOKAHEAD_DAYS`, etc.

### Logging & Monitoring
- `LOG_LEVEL`, `LOG_FORMAT`, `DEBUG`
- `METRICS_ENABLED`, `TRACING_ENABLED`, `JAEGER_ENDPOINT`

### Development & Testing
- `NEXT_TELEMETRY_DISABLED`
- `API_VERSION`, `DEPRECATION_WARNINGS`
- `TESTING`, `TEST_DATABASE_URL`

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cp global.env.example global.env
   ```

2. **Run the setup script**:
   ```bash
   ./setup-env.sh
   ```

3. **Edit global.env with your actual values**:
   - Add your OpenAI API key
   - Add your Supabase project URL and keys
   - Generate secure SECRET_KEY and SESSION_SECRET values
   - Add OAuth credentials for calendar integrations (optional)

4. **Start the services**:
   ```bash
   docker-compose up -d
   ```

## Benefits

1. **Single Source of Truth**: All environment variables in one place
2. **Consistency**: All services use the same configuration
3. **Maintainability**: Easier to update and manage environment variables
4. **Security**: Single file to secure instead of multiple scattered files
5. **Development**: Simpler setup for new developers
6. **Production**: Easier deployment with single environment file

## Security Notes

- The `global.env` file is now ignored by git
- Only `global.env.example` is tracked
- All secrets are in one place for easier security management
- Make sure to set appropriate file permissions on `global.env` in production

## Migration from Old Setup

✅ **COMPLETED** - All individual service .env files have been consolidated:

### Files Removed:
- `.env` (root)
- `services/orchestrator/.env`
- `services/scheduler/.env`
- `services/rag-recommender/.env`
- `services/calendar-integration/.env`
- `clients/web/.env.local`
- `clients/web/.env`

### Variables Consolidated:
All environment variables from these files have been merged into `global.env`, including:
- Actual API keys (OpenAI)
- Real Supabase configuration
- Service-specific settings
- LLM configuration parameters
- OAuth redirect URIs
- RAG/Vector database settings

## Troubleshooting

- **Services can't find variables**: Ensure `global.env` exists and has correct values
- **Permission issues**: Check file permissions on `global.env`
- **Missing variables**: Compare with `global.env.example` for required variables
- **Service failures**: Check docker-compose logs for specific environment variable errors
