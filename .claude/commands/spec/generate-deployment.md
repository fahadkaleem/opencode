# Generate Deployment Configuration

**Task ID:** {{task_id}}

You are a DevOps automation specialist. Your task is to generate
production-ready deployment configurations, CI/CD pipelines, and
infrastructure-as-code based on the architecture design.

## Purpose

This command generates all deployment-related files:

1. **Containerization** - Dockerfiles, docker-compose
2. **CI/CD Pipelines** - GitHub Actions, GitLab CI, Jenkins
3. **Infrastructure as Code** - Kubernetes, Terraform, CloudFormation
4. **Deployment Scripts** - Automation scripts for deployment
5. **Environment Configs** - Production, staging, development configs

## Input Context

Read these artifacts:

- `.alfred/tasks/{{task_id}}/artifacts/architecture-design.json`
- `.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json`

## Deployment Configuration Strategy

### Step 1: Determine Deployment Model

From architecture-design.json, identify:

- **Deployment type:** Containerized, serverless, traditional
- **Hosting platform:** AWS, GCP, Azure, on-premise
- **Orchestration:** Kubernetes, ECS, Docker Swarm, none

### Step 2: Generate Containerization

#### Dockerfile (if containerized)

Create optimized Dockerfile based on project type:

**Node.js/TypeScript Example:**

```dockerfile
# Multi-stage build for optimization
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Python Example:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Security: non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Docker Compose (for local development)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/appdb
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  pgdata:
```

#### .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
.vscode
.idea
*.test.ts
coverage
.alfred
```

### Step 3: Generate CI/CD Pipeline

#### GitHub Actions

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add deployment commands here
```

#### GitLab CI (if using GitLab)

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: '/certs'

test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run lint
    - npm test
    - npm run build
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  only:
    - main
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  only:
    - main
  script:
    - echo "Deploy to production"
```

### Step 4: Generate Kubernetes Configuration (if applicable)

#### Deployment

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: app
          image: ghcr.io/username/myapp:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Service

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

#### Ingress

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: app-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80
```

#### ConfigMap and Secrets

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  app.env: production
  log.level: info
```

Create `k8s/secrets.yaml.template`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: 'postgresql://user:CHANGEME@db:5432/appdb'
  redis-url: 'redis://redis:6379'
  api-key: 'CHANGEME'
```

### Step 5: Generate Infrastructure as Code

#### Terraform (for AWS)

Create `terraform/main.tf`:

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "myapp-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "myapp-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "myapp-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier        = "myapp-db"
  engine            = "postgres"
  engine_version    = "15.3"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot     = false
  final_snapshot_identifier = "myapp-db-final-snapshot"

  tags = {
    Name = "myapp-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "myapp-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
}
```

Create `terraform/variables.tf`:

```hcl
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
```

### Step 6: Generate Deployment Scripts

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}

echo "Deploying to ${ENVIRONMENT} environment..."

# Build Docker image
echo "Building Docker image..."
docker build -t myapp:${IMAGE_TAG} .

# Tag for registry
docker tag myapp:${IMAGE_TAG} ghcr.io/username/myapp:${IMAGE_TAG}

# Push to registry
echo "Pushing to container registry..."
docker push ghcr.io/username/myapp:${IMAGE_TAG}

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl set image deployment/app-deployment \
  app=ghcr.io/username/myapp:${IMAGE_TAG} \
  --namespace=${ENVIRONMENT}

# Wait for rollout
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/app-deployment \
  --namespace=${ENVIRONMENT}

echo "Deployment complete!"
```

Create `scripts/rollback.sh`:

```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-production}

echo "Rolling back deployment in ${ENVIRONMENT}..."

kubectl rollout undo deployment/app-deployment \
  --namespace=${ENVIRONMENT}

kubectl rollout status deployment/app-deployment \
  --namespace=${ENVIRONMENT}

echo "Rollback complete!"
```

### Step 7: Generate Environment Configurations

Create `.env.production.example`:

```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://host:6379
REDIS_TTL=900

# API Keys
API_KEY=your-api-key-here
JWT_SECRET=your-jwt-secret-here

# External Services
SENDGRID_API_KEY=your-sendgrid-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

## Output Format

Create deployment manifest at
`.alfred/tasks/{{task_id}}/artifacts/deployment-manifest.json`:

```json
{
  "generated_at": "ISO timestamp",
  "task_id": "{{task_id}}",
  "deployment_model": "containerized|serverless|traditional",
  "files_generated": [
    {
      "path": "Dockerfile",
      "type": "containerization",
      "description": "Multi-stage Docker build"
    },
    {
      "path": "docker-compose.yml",
      "type": "local_development",
      "description": "Local development environment"
    },
    {
      "path": ".github/workflows/ci-cd.yml",
      "type": "ci_cd",
      "description": "CI/CD pipeline"
    },
    {
      "path": "k8s/deployment.yaml",
      "type": "orchestration",
      "description": "Kubernetes deployment"
    }
  ],
  "deployment_instructions": {
    "local": "docker-compose up",
    "staging": "scripts/deploy.sh staging",
    "production": "scripts/deploy.sh production"
  },
  "prerequisites": [
    "Docker installed",
    "Kubernetes cluster configured",
    "Container registry access",
    "Environment variables configured"
  ],
  "security_checklist": [
    "All secrets stored in secret management system",
    "Non-root user in containers",
    "Resource limits configured",
    "Network policies defined",
    "TLS/SSL certificates configured"
  ]
}
```

## Output Summary

After generation, output:

### Deployment Configuration Generated

**Deployment Model:** [model] **Platform:** [platform]

#### Files Created

**Containerization:** {{#if has_dockerfile}}✓{{else}}−{{/if}} Dockerfile
{{#if has_docker_compose}}✓{{else}}−{{/if}} docker-compose.yml
{{#if has_dockerignore}}✓{{else}}−{{/if}} .dockerignore

**CI/CD:** {{#if has_github_actions}}✓{{else}}−{{/if}} GitHub Actions workflow
{{#if has_gitlab_ci}}✓{{else}}−{{/if}} GitLab CI config

**Orchestration:** {{#if has_k8s}}✓{{else}}−{{/if}} Kubernetes manifests
{{#if has_terraform}}✓{{else}}−{{/if}} Terraform configuration

**Scripts:** {{#if has_deploy_script}}✓{{else}}−{{/if}} Deployment script
{{#if has_rollback_script}}✓{{else}}−{{/if}} Rollback script

#### Deployment Commands

**Local Development:**

```bash
docker-compose up
```

**Build Image:**

```bash
docker build -t myapp:latest .
```

**Deploy to Staging:**

```bash
./scripts/deploy.sh staging
```

**Deploy to Production:**

```bash
./scripts/deploy.sh production
```

**Rollback:**

```bash
./scripts/rollback.sh production
```

#### Prerequisites

Before deploying, ensure: {{#each prerequisites}}

- [ ] {{this}} {{/each}}

#### Security Checklist

{{#each security_checklist}}

- [ ] {{this}} {{/each}}

---

**Next Steps:**

1. Review generated configurations
2. Update environment variables in `.env.production.example`
3. Configure secrets in your secret management system
4. Test local deployment: `docker-compose up`
5. Configure CI/CD secrets in repository settings
6. Deploy to staging environment for testing

**Deployment manifest saved to:**
`.alfred/tasks/{{task_id}}/artifacts/deployment-manifest.json`

## Important Notes

- **Never commit secrets** to version control
- **Use secret management** (AWS Secrets Manager, HashiCorp Vault, etc.)
- **Test deployments** in staging before production
- **Monitor deployments** with health checks and alerts
- **Plan rollbacks** before deploying
- **Document runbooks** for common operations
- **Use infrastructure as code** for reproducibility
- **Implement blue-green or canary deployments** for zero-downtime
- **Set resource limits** to prevent resource exhaustion
- **Enable monitoring** and logging from day one
