# Project Scaffolding Command

**Task ID:** {{task_id}}

You are an expert at setting up project structures. Your task is to create the
complete directory structure, configuration files, and boilerplate code based on
the specification analysis and task breakdown.

## Input

Read the following artifacts:

- `.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json`
- `.alfred/tasks/{{task_id}}/artifacts/task-breakdown.json`

## Scaffolding Strategy

Based on the architecture and technology stack, create:

1. **Directory Structure:** Organize code by feature, component, or layer
2. **Configuration Files:** Package manifests, build configs, linters,
   formatters
3. **Base Files:** Entry points, main modules, core utilities
4. **Test Infrastructure:** Test directories, test configs, sample tests
5. **Documentation Templates:** README, API docs, contribution guides
6. **CI/CD Setup:** GitHub Actions, deployment configs (if specified)

## Common Project Structures

### Node.js/TypeScript API

```
src/
├── config/           # Configuration management
├── models/           # Data models
├── services/         # Business logic
├── controllers/      # API controllers
├── middleware/       # Express middleware
├── utils/            # Utility functions
└── index.ts          # Entry point
test/
├── unit/
├── integration/
└── e2e/
```

### React Frontend

```
src/
├── components/       # React components
│   ├── common/      # Shared components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── services/        # API clients
├── utils/           # Utilities
├── types/           # TypeScript types
├── App.tsx          # Root component
└── index.tsx        # Entry point
```

### Python API

```
src/
├── api/             # API endpoints
├── models/          # Data models
├── services/        # Business logic
├── utils/           # Utilities
├── config.py        # Configuration
└── main.py          # Entry point
tests/
├── unit/
├── integration/
└── conftest.py      # Pytest configuration
```

## Configuration Files to Create

Based on the technology stack, create appropriate configs:

### TypeScript/Node.js

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - Linting rules
- `.prettierrc` - Code formatting
- `jest.config.js` or `vitest.config.ts` - Testing framework

### Python

- `requirements.txt` or `pyproject.toml` - Dependencies
- `pytest.ini` or `pyproject.toml` - Test configuration
- `.pylintrc` or `pyproject.toml` - Linting rules
- `.env.example` - Environment variables template

### Common

- `.gitignore` - Git ignore patterns
- `README.md` - Project documentation
- `.env.example` - Environment configuration template
- `.editorconfig` - Editor configuration

## Execution Steps

1. **Analyze Tech Stack:** Determine what scaffolding is needed
2. **Create Directories:** Build the directory structure
3. **Generate Configs:** Create all configuration files with sensible defaults
4. **Create Entry Points:** Generate main application entry files
5. **Setup Testing:** Create test directory structure and configs
6. **Initialize Git:** Create .gitignore and optionally initialize repo
7. **Generate README:** Create initial documentation

## README Template

The README should include:

````markdown
# [Project Name]

[Overview from spec]

## Setup

```bash
# Install dependencies
npm install  # or pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev  # or python src/main.py
```
````

## Architecture

[Brief architecture overview from spec]

## Requirements

[Link to functional and non-functional requirements]

## Testing

```bash
# Run tests
npm test  # or pytest

# Run linting
npm run lint  # or pylint src
```

## Project Structure

[Directory structure with descriptions]

## Contributing

[Basic contribution guidelines]

## License

[License information]

````

## Output

After scaffolding, create a manifest at `.alfred/tasks/{{task_id}}/artifacts/scaffold-manifest.json`:

```json
{
  "created_at": "ISO timestamp",
  "project_root": "string",
  "directories_created": ["array of paths"],
  "files_created": [
    {
      "path": "string",
      "type": "config|source|test|doc",
      "description": "string"
    }
  ],
  "next_steps": [
    "Install dependencies: npm install",
    "Configure environment: cp .env.example .env",
    "Start implementation with task T001"
  ]
}
````

Then output:

### Project Scaffolding Complete

**Directories Created:** [count] **Files Created:** [count]

**Configuration Files:**

- [list key config files]

**Structure:**

```
[Show tree of created structure]
```

**Next Steps:**

1. Install dependencies: `npm install` (or equivalent)
2. Configure environment: Copy and edit `.env.example`
3. Start implementation:
   `alfred run impl:from-spec --task {{task_id}} --subtask T001`

---

**Scaffold manifest saved to:**
`.alfred/tasks/{{task_id}}/artifacts/scaffold-manifest.json`

## Important Notes

- Use the technology stack from spec-analysis.json
- Follow best practices for the chosen languages/frameworks
- Include sensible defaults in all configuration files
- Create .gitignore with appropriate patterns for the tech stack
- Ensure cross-platform compatibility (Windows, macOS, Linux)
- Add comments in configuration files explaining key settings
