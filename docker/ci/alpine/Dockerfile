# eclipseglsp/ci:alpine
# 8.0
FROM node:22-alpine3.21

# Install Java, Maven, Git and dependecies for Theia
ENV JAVA_HOME="/usr/lib/jvm/java-21-openjdk"
RUN apk add --no-cache openjdk21 openjdk11 maven git openssh \
    make pkgconfig gcc g++ python3  libx11-dev libxkbfile-dev libsecret-dev rsync \
    yarn curl

RUN npm install -g lerna
# Has to be set explictly to find binaries
ENV PATH=$PATH:${JAVA_HOME}/bin

CMD ["/bin/sh"]
