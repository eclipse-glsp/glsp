# eclipseglsp/ci:ubuntu
# 6.0
FROM ubuntu:22.04 
# Install node & other Theia related dependencies
RUN apt-get update && \
    #Install tools
    apt-get install wget gnupg curl make maven git \
    openjdk-17-jdk \
    libxkbfile-dev \
    libsecret-1-dev \
    build-essential libssl-dev rsync -y && \
    #Install node
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install nodejs -y && \
    npm install -g yarn lerna
