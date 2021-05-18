# eclipse-glsp/ci
# 0.0.4
FROM ubuntu:18.04 
# Install node & other Theia related dependencies
RUN apt-get update && \
	apt-get upgrade -y && \
	#Install tools
	apt-get install wget gnupg curl make maven g++-multilib g++-5-multilib -y && \
	#Install node
	curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
	apt-get install nodejs -y && \
	npm install -g yarn && \
	apt-get install lsof xvfb -y

# Install chrome for UI tests
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
	dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install


