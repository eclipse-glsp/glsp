# eclipseglsp/ci:alpine
# 6.0
FROM node:20-alpine3.22

# Install Java, Maven, Git and dependecies for Theia
ENV JAVA_HOME="/usr/lib/jvm/default-jvm/"
RUN apk add --no-cache openjdk17 maven git openssh \
    make pkgconfig gcc g++ python3  libx11-dev libxkbfile-dev libsecret-dev rsync \
    yarn curl

RUN npm install -g lerna
# Has to be set explictly to find binaries 
ENV PATH=$PATH:${JAVA_HOME}/

CMD ["/bin/sh"]
