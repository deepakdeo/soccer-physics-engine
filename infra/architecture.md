# AWS Deployment Architecture

This document captures the intended Phase 10 deployment shape for the Soccer Physics Engine. It is configuration and planning only; no infrastructure is created by this repository.

## Summary

- The FastAPI service is packaged as a Docker image and pushed to Amazon ECR.
- GitHub Actions builds and publishes the image, then updates an ECS Fargate service.
- API Gateway sits in front of the ECS-backed service to provide a stable public API surface, throttling, and stage management.
- CloudWatch collects application logs and alarm signals for latency and error-rate monitoring.

## Text Diagram

```text
GitHub Actions
    |
    | build + push container
    v
Amazon ECR
    |
    | image pull
    v
Amazon ECS Fargate Service
    |
    | container traffic via ALB or public service URL
    v
API Gateway
    |
    | HTTPS
    v
Clients
    |
    +--> React dashboard
    +--> notebooks / analysts
    +--> external API consumers

Application logs ------> CloudWatch Logs
API + service metrics -> CloudWatch Alarms -> SNS / on-call channel
Artifacts / config ----> S3
```

## Request Flow

1. A client sends a request to API Gateway.
2. API Gateway applies stage-level throttling and forwards the request to the FastAPI backend endpoint.
3. The ECS Fargate task serves the request through `uvicorn` and writes structured logs.
4. CloudWatch collects logs and alarm metrics for API Gateway and ECS health.

## Build and Release Flow

1. A push to `main` triggers the deploy workflow.
2. GitHub Actions builds the Docker image from the repository `Dockerfile`.
3. The workflow authenticates to Amazon ECR and pushes the tagged image.
4. The workflow renders the ECS task definition with the new image URI.
5. ECS deploys the new task definition to the Fargate service.

## Core AWS Resources

### Container and compute

- ECR repository for versioned API images
- ECS cluster for service orchestration
- ECS Fargate service for the FastAPI runtime
- ECS task execution role and task role

### API edge

- API Gateway HTTP API or REST API stage
- Custom domain and stage mapping if a public domain is added
- Throttling and request validation policies

### Observability

- CloudWatch log group for application logs
- CloudWatch alarms for 4XX/5XX spikes and latency regressions
- SNS topic or equivalent notification target for alerts

### Supporting services

- S3 bucket for artifacts, reports, and configuration assets
- KMS key for encrypting stored artifacts if required

## Network Assumptions

- ECS tasks run in a VPC with at least two subnets across different Availability Zones.
- Security groups allow API ingress only from the approved edge layer.
- API Gateway forwards traffic to a stable backend URL or load balancer endpoint.

## Environment Separation

Recommended environments:

- `dev` for manual testing and workflow validation
- `staging` for integration checks against the frontend
- `prod` for external consumers and dashboard traffic

Each environment should have:

- a distinct API Gateway stage
- its own ECS service or task set
- separate CloudWatch alarms
- separate image tags or deployment channels

## Operational Notes

- The current application uses deterministic in-memory demo data for API responses; production data access would replace that dependency layer without changing the external API contract.
- The GitHub workflows created in Phase 10 are templates and expect repository secrets or GitHub environment variables to be populated before use.
- Actual AWS provisioning and deployment are intentionally out of scope for this phase.
