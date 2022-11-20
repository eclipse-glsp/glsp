#!/bin/bash

version=$1
if [ -z "$version" ]; then
    echo "[ERROR] Version argument not found. Please pass a version as first argument. eg: ./deploy.sh 3.1"
    exit 1
else
    echo "[INFO] Start deployment for version v${version} of all ci images"
fi

echo "[INFO] Build eclipseglsp/ci:alpine"
cd ci/alpine || exit
docker build -t eclipseglsp/ci:alpine -t eclipseglsp/ci:alpine-v${version} . --no-cache
cd ../..

echo "[INFO] Build eclipseglsp/ci:ubuntu"
cd ci/ubuntu || exit
docker build -t eclipseglsp/ci:ubuntu -t eclipseglsp/ci:ubuntu-v${version} -t eclipseglsp/ci:latest . --no-cache
cd ../..

echo "[INFO] Build eclipseglsp/ci:uitest"
cd ci/uitest || exit
docker build -t eclipseglsp/ci:uitest -t eclipseglsp/ci:uitest-v${version} . --no-cache
cd ../..

echo "[INFO] Push images to dockerhub"
docker push eclipseglsp/ci --all-tags
