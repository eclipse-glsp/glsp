#!/bin/bash

version=$1
if [ -z "$version" ]; then
    echo "[ERROR] Version argument not found. Please pass a version as first argument. eg: ./deploy.sh 8.0"
    exit 1
else
    echo "[INFO] Start deployment for version v${version} of the ci image"
fi

echo "[INFO] Build eclipseglsp/ci:alpine"
cd ci/alpine || exit
docker build -t eclipseglsp/ci:alpine -t eclipseglsp/ci:alpine-v${version} . --no-cache
cd ../..

echo "[INFO] Push images to dockerhub"
docker push eclipseglsp/ci --all-tags
