# eclipseglsp/ci:ubuntu
# 1.0
FROM ubuntu:18.04 
# Install node & other Theia related dependencies
RUN apt-get update && \
    #Install tools
    apt-get install wget gnupg curl make maven git g++-multilib g++-5-multilib libx11-dev libxkbfile-dev libsecret-1-dev -y && \
    #Install node
    curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install nodejs -y && \
    npm install -g yarn
