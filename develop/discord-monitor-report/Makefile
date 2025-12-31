.PHONY: help install dev build test lint tsc clean docker-build docker-run deploy setup-gcloud

# Variables
PROJECT_ID := discord-management-482906
SERVICE_NAME := discord-monitor-report
REGION := asia-northeast1
IMAGE_NAME := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

help: ## Show this help message
	@echo "Discord監視日報システム - Makefile Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm ci
	npx prisma generate

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

test: ## Run all tests
	npm run test

lint: ## Run linter
	npm run lint

tsc: ## Run TypeScript type check
	npm run tsc

check: lint tsc test ## Run all checks (lint, tsc, test)

clean: ## Clean build artifacts
	rm -rf .next node_modules .turbo

prisma-generate: ## Generate Prisma Client
	npx prisma generate

prisma-migrate: ## Run Prisma migrations
	npx prisma migrate dev

prisma-push: ## Push Prisma schema to database
	npx prisma db push

prisma-studio: ## Open Prisma Studio
	npx prisma studio

docker-build: ## Build Docker image locally
	docker build -t $(IMAGE_NAME):latest .

docker-run: ## Run Docker container locally
	docker run -p 8080:8080 \
		-e DATABASE_URL=${DATABASE_URL} \
		-e JWT_SECRET=${JWT_SECRET} \
		-e NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
		$(IMAGE_NAME):latest

docker-push: ## Push Docker image to GCR
	docker push $(IMAGE_NAME):latest

setup-gcloud: ## Set up Google Cloud configuration
	gcloud config set project $(PROJECT_ID)
	gcloud auth configure-docker

deploy-build: ## Build and push Docker image
	docker build -t $(IMAGE_NAME):latest .
	docker tag $(IMAGE_NAME):latest $(IMAGE_NAME):$(shell date +%Y%m%d-%H%M%S)
	docker push $(IMAGE_NAME):latest
	docker push $(IMAGE_NAME):$(shell date +%Y%m%d-%H%M%S)

deploy: deploy-build ## Deploy to Cloud Run
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):latest \
		--region $(REGION) \
		--platform managed \
		--allow-unauthenticated \
		--set-env-vars DATABASE_URL=${DATABASE_URL} \
		--set-env-vars JWT_SECRET=${JWT_SECRET} \
		--set-env-vars NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
		--min-instances 0 \
		--max-instances 10 \
		--memory 512Mi \
		--cpu 1 \
		--timeout 60 \
		--project $(PROJECT_ID)
	@echo ""
	@echo "Deployment URL:"
	@gcloud run services describe $(SERVICE_NAME) \
		--region $(REGION) \
		--format 'value(status.url)' \
		--project $(PROJECT_ID)

deploy-url: ## Show deployment URL
	@gcloud run services describe $(SERVICE_NAME) \
		--region $(REGION) \
		--format 'value(status.url)' \
		--project $(PROJECT_ID)

logs: ## Show Cloud Run logs
	gcloud run services logs read $(SERVICE_NAME) \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--limit 50

logs-tail: ## Tail Cloud Run logs
	gcloud run services logs tail $(SERVICE_NAME) \
		--region $(REGION) \
		--project $(PROJECT_ID)

rollback: ## Rollback to previous revision
	gcloud run services update-traffic $(SERVICE_NAME) \
		--region $(REGION) \
		--to-revisions LATEST=0 \
		--project $(PROJECT_ID)

delete: ## Delete Cloud Run service
	gcloud run services delete $(SERVICE_NAME) \
		--region $(REGION) \
		--project $(PROJECT_ID)

all: clean install check build ## Clean, install, check, and build
