# BeQ Shared Models

Shared data models and schemas for the Bricks and Quantas (BeQ) project.

## Installation

### From source
```bash
pip install -e .
```

### Development installation
```bash
pip install -e ".[dev]"
```

## Usage

```python
from schemas.user import User
from schemas.schedule import Schedule
from schemas.resources import Resource

# Use the shared models in your application
user = User(id="123", email="user@example.com")
```

## Available Models

- **User**: User account and profile data
- **Schedule**: Schedule and calendar data structures
- **Resources**: Learning resources and recommendations
- **Responses**: API response models

## Development

### Running tests
```bash
pytest
```

### Code formatting
```bash
black schemas/
isort schemas/
```

### Type checking
```bash
mypy schemas/
```
