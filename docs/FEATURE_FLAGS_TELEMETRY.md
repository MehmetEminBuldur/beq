# Feature Flags & Telemetry Implementation

## Overview

This document describes the feature flag and telemetry system implemented for the BeQ Schedule Optimization feature.

## Feature Flags

### Configuration

Feature flags are configured via environment variables in the orchestrator service:

```bash
# Enable/disable schedule optimization
FEATURE_SCHEDULE_OPTIMIZATION_ENABLED=true

# Enable/disable AI chat
FEATURE_AI_CHAT_ENABLED=true

# Enable/disable calendar sync (disabled by default)
FEATURE_CALENDAR_SYNC_ENABLED=false

# Enable/disable brick management
FEATURE_BRICK_MANAGEMENT_ENABLED=true

# Enable/disable advanced analytics
FEATURE_ADVANCED_ANALYTICS_ENABLED=false
```

### API Endpoints

#### Get All Feature Status
```http
GET /api/v1/features/status?user_id={user_id}
```

Response:
```json
{
  "features": {
    "schedule_optimization": {
      "enabled": true,
      "user_specific": true,
      "description": "AI-powered schedule generation and optimization"
    },
    "ai_chat": {
      "enabled": true,
      "user_specific": false,
      "description": "Conversational AI chat interface"
    }
  },
  "user_id": "user-123"
}
```

#### Get Specific Feature Status
```http
GET /api/v1/features/status/{feature_name}?user_id={user_id}
```

Response:
```json
{
  "feature": "schedule_optimization",
  "enabled": true,
  "user_specific": true,
  "rollout_percentage": null
}
```

## Telemetry & Metrics

### Prometheus Metrics

The system collects comprehensive metrics using Prometheus:

#### Schedule Generation Metrics
- `beq_schedule_generation_requests_total` - Total generation requests
- `beq_schedule_generation_duration_seconds` - Request duration
- `beq_schedule_events_count` - Number of scheduled events
- `beq_schedule_confidence_scores` - AI confidence scores

#### Schedule Optimization Metrics
- `beq_schedule_optimization_requests_total` - Total optimization requests
- `beq_schedule_optimization_duration_seconds` - Optimization duration
- `beq_schedule_events_count` - Events after optimization
- `beq_schedule_confidence_scores` - Optimization confidence

#### Feature Usage Metrics
- `beq_feature_requests_total` - Feature usage by feature and user
- `beq_feature_errors_total` - Feature errors by type

#### AI Model Metrics
- `beq_ai_model_requests_total` - AI model usage
- `beq_ai_model_latency_seconds` - Model response time

### Structured Logging

All operations are logged with structured data:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "user_id": "user-123",
  "operation": "schedule_generation",
  "duration": 1.23,
  "status": "success",
  "event_count": 5,
  "confidence_score": 0.85
}
```

## Client-Side Integration

### Feature Flag Hook

```typescript
import { useFeatureFlags, useFeatureFlag } from '@/lib/hooks/use-feature-flags';

function MyComponent() {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled('schedule_optimization')) {
    return <div>Feature not available</div>;
  }

  // Feature is enabled, render component
  return <ScheduleOptimizer />;
}

// Or use specific feature hook
function MyComponent() {
  const isScheduleEnabled = useFeatureFlag('schedule_optimization');

  return isScheduleEnabled ? <ScheduleOptimizer /> : <div>Feature disabled</div>;
}
```

## Error Handling

### Feature Disabled
When a feature is disabled, the API returns:
```json
{
  "detail": {
    "error": "Schedule optimization feature is not enabled for this user"
  }
}
```

### Telemetry Collection
- All feature checks are recorded
- Success/error rates are tracked
- Performance metrics are collected
- User adoption is monitored

## Environment Variables

Required environment variables for feature flags:

```bash
# Feature flags
FEATURE_SCHEDULE_OPTIMIZATION_ENABLED=true
FEATURE_AI_CHAT_ENABLED=true
FEATURE_CALENDAR_SYNC_ENABLED=false
FEATURE_BRICK_MANAGEMENT_ENABLED=true
FEATURE_ADVANCED_ANALYTICS_ENABLED=false

# Service URLs
SCHEDULER_SERVICE_URL=http://scheduler:8001
```

## Monitoring Dashboard

Metrics are exposed at `/metrics` endpoint for Prometheus scraping and can be visualized using Grafana dashboards showing:

- Feature adoption rates
- Performance metrics
- Error rates
- User engagement
- AI model usage statistics

## Usage Examples

### Backend Usage

```python
from app.core.feature_flags import is_feature_enabled, FeatureFlag
from app.core.telemetry import record_feature_usage

# Check if feature is enabled
if not is_feature_enabled(FeatureFlag.SCHEDULE_OPTIMIZATION, user_id):
    raise HTTPException(status_code=403, detail="Feature not enabled")

# Record feature usage
record_feature_usage("schedule_generation", user_id, "success")
```

### Frontend Usage

```typescript
import { useFeatureFlag } from '@/lib/hooks/use-feature-flags';

function SchedulePage() {
  const isEnabled = useFeatureFlag('schedule_optimization');

  if (!isEnabled) {
    return (
      <div className="feature-disabled">
        <h2>Feature Not Available</h2>
        <p>This feature is currently disabled for your account.</p>
      </div>
    );
  }

  return <ScheduleOptimizer />;
}
```

## Benefits

1. **Gradual Rollout**: Features can be enabled for specific users or percentage of users
2. **Monitoring**: Comprehensive metrics and logging for feature performance
3. **User Experience**: Graceful degradation when features are disabled
4. **Operational Insights**: Data-driven decisions about feature rollout and optimization
5. **Error Tracking**: Detailed error categorization and monitoring

## Future Enhancements

- A/B testing framework
- Percentage-based rollouts
- Feature flag management UI
- Advanced analytics dashboards
- Real-time metrics streaming
