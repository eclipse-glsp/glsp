# Eclipse GLSP CI

## Quick reference

-   **Maintained by**:  
    [Eclipse GLSP](https://github.com/eclipse-glsp/glsp)

-   **Where to get help**:  
    [the Eclipse Community Forum](https://www.eclipse.org/forums/index.php/f/465/), [the GLSP Discussions](https://github.com/eclipse-glsp/glsp/discussions), [the Docker Community Forums](https://forums.docker.com/), [the Docker Community Slack](https://dockr.ly/slack)

-   **Where to file issues**:  
    <https://github.com/eclipse-glsp/glsp/issues>

## Supported tags and respective `Dockerfile` links

-   [`latest`, `ubuntu`, `ubuntu-18.04`, `ubuntu-base`](https://github.com/eclipse-glsp/glsp/blob/master/docker/ci/ubuntu/Dockerfile)
-   [`uitest`, `uitest-ubuntu-18.04`, `ubuntu-chrome`](https://github.com/eclipse-glsp/glsp/blob/master/docker/ci/uitest/Dockerfile)

-   [`alpine`, `alpine-3.12`](https://github.com/eclipse-glsp/glsp/blob/master/docker/ci/alpine/Dockerfile)

Note that these tags are fluent and not bound to a fixed image version. If you want to use a fixed version you can use the base tag with a version suffix e.g. `ubuntu-v1.0`. An increment of the major version number (e.g. v1.0-> v2.0) indicates an update of a major component e.g a new OS, Node or Java version.

## What is Eclipse GLSP CI

Collection of images that are used in Continuos Integration jobs of Eclipse GLSP and related projects (e.g. [EMF.cloud](https://www.eclipse.org/emfcloud/)). The `ci` images come in different flavors, each designed for a specific use case. The images ship with the necessary libraries to enable both node-based client builds and Java/Maven-based server builds. They are mainly used for CI jobs that require the possibility to build client and server components in one shared container.

Currently each image variant has at least the following components installed:

-   Git >=2.17.1
-   Node 12 and yarn 1.22.4
-   OpenJDK 11 and Maven >=3.6.0
-   Python and GCC libraries to enable [Theia](https://theia-ide.org/) builds

## How to use this image

You can run any shell command by using the docker image directly, passing a shell command to `docker run`:

    docker run eclipseglsp/ci:latest echo "Hello World"

Alternatively, you can run the image in interactive mode and gain full access to the shell:

    docker run -it eclipseglsp/ci:latest

## Image Variants

The `ci` images come in different flavors, each designed for a specific use case.

## `ci:ubuntu<-suffix>`

This is the defacto base image. If you are unsure about what your needs are, you probably want to use this one. It is designed to be used both as a throw away container (mount your source code and start the container to start your app), as well as the base to build other images off of.

As the name indicates this image builds onto of [Ubuntu](https://ubuntu.com/). This makes it very easy to use and customize but also results in a larger image size compared to the `alpine` variant.

## `node:alpine<-suffix>`

This image is based on the popular [Alpine Linux project](https://alpinelinux.org), available in [the `alpine` official image](https://hub.docker.com/_/alpine). Alpine Linux is much smaller than most distribution base images (~5MB), and thus leads to much slimmer images in general.

It only provides the essential libraries needed for building client and server components and is the recommended image for classical CI jobs like building branches or PRs on change, or deploying build artifacts. Due to its slim size, it cannot be used for more sophisticated jobs like UI-Testing out-of-the-box, because essential components like a display server or a browser are not included.

## `node:uitest<-suffix>`

This is the recommend image for CI jobs that execute any sort of UI tests. It uses the same base as the `ubuntu` image but has additional libraries installed (including Xvfb which enables headless UI testing). In addition, Google Chrome is installed which enables browser-based UI testing of client components.

## License

Eclipse Eclipse is released under the [EPL-2.0](https://www.eclipse.org/legal/epl-2.0/)/[GPL-2.0-with-classpath-exception](https://spdx.org/licenses/GPL-2.0-with-classpath-exception.html),

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).
