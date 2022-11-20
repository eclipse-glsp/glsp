# eclipseglsp/ci:alpine
# 1.0
FROM alpine:3.13

# Install Java, Maven, Git and dependecies for Theia
ENV JAVA_HOME="/usr/lib/jvm/default-jvm/"
RUN apk add --no-cache openjdk11 maven git openssh \
    make pkgconfig gcc g++ python3  libx11-dev libxkbfile-dev libsecret-dev
# Install node 14 and yarn
RUN  apk -U upgrade && apk add --repository https://dl-cdn.alpinelinux.org/alpine/v3.12/main/ --no-cache \
    "nodejs<16" \
    "nodejs-npm<16" \
    yarn \
    curl

RUN npm install -g lerna
# Has to be set explictly to find binaries 
ENV PATH=$PATH:${JAVA_HOME}/

CMD ["/bin/sh"]
