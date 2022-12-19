# eclipseglsp/ci:uitest
# 4.0
FROM ubuntu:18.04 
# Install node & other Theia related dependencies
RUN apt-get update && \
    #Install tools
    apt-get install wget gnupg curl make maven git g++-multilib g++-5-multilib \
    libx11-dev libxkbfile-dev libsecret-1-dev rsync -y && \
    #Install node
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install nodejs -y && \
    npm install -g yarn lerna &&\
    apt-get install lsof xvfb -y

# Install chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
