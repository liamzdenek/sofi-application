#!/bin/bash
set -e

# Check if this is a dry run
DRY_RUN=false
if [[ "$*" == *"--dry-run"* ]]; then
    DRY_RUN=true
    echo "Running in dry-run mode. Commands will be printed but not executed."
fi

echo "Building report-generator JAR..."
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute: gradle shadowJar"
else
    gradle shadowJar
fi

echo "Building Docker image..."
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute: docker build -t experimentation-report-generator:latest ."
else
    docker build -t experimentation-report-generator:latest .
fi

echo "Logging in to AWS ECR..."
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute: aws ecr get-login-password --region us-west-2 --profile lz-demos | docker login --username AWS --password-stdin 129013835758.dkr.ecr.us-west-2.amazonaws.com"
else
    aws ecr get-login-password --region us-west-2 --profile lz-demos | docker login --username AWS --password-stdin 129013835758.dkr.ecr.us-west-2.amazonaws.com
fi

echo "Tagging Docker image..."
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute: docker tag experimentation-report-generator:latest 129013835758.dkr.ecr.us-west-2.amazonaws.com/experimentation-report-generator:latest"
else
    docker tag experimentation-report-generator:latest 129013835758.dkr.ecr.us-west-2.amazonaws.com/experimentation-report-generator:latest
fi

echo "Pushing Docker image to ECR..."
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would execute: docker push 129013835758.dkr.ecr.us-west-2.amazonaws.com/experimentation-report-generator:latest"
else
    docker push 129013835758.dkr.ecr.us-west-2.amazonaws.com/experimentation-report-generator:latest
fi

echo "Report generator Docker image successfully built and pushed to ECR"