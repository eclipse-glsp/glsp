# Eclipse GLSP CI

## Quick reference

-   **Maintained by**:  
    [Eclipse GLSP](https://github.com/eclipse-glsp/glsp)

-   **Where to get help**:  
    [the Eclipse Community Forum](https://www.eclipse.org/forums/index.php/f/465/), [the GLSP Discussions](https://github.com/eclipse-glsp/glsp/discussions), [the Docker Community Forums](https://forums.docker.com/), [the Docker Community Slack](https://dockr.ly/slack)

-   **Where to file issues**:  
    <https://github.com/eclipse-glsp/glsp/issues>

## Supported tags and respective `Dockerfile` links

-   [`alpine`, `alpine-v8.0`, `alpine-v7.1`, `alpine-v7.0`](https://github.com/eclipse-glsp/glsp/blob/master/docker/ci/alpine/Dockerfile)

Note that these tags are fluent and not bound to a fixed image version.
If you want to use a fixed version you can use the base tag with a version suffix e.g. `alpine-v8.0`.
An increment of the major version number (e.g. v7.0-> v8.0) indicates an update of a major component e.g a new OS, Node or Java version.
Minor version increments indicate bug fixes or changes in the minor dev dependencies.
(See also: [Image Version History](#image-version-history))

## What is Eclipse GLSP CI

An Alpine-based image that is used in Continuous Integration jobs of Eclipse GLSP and related projects (e.g. [EMF.cloud](https://www.eclipse.org/emfcloud/)).
The image ships with the necessary libraries to enable both node-based client builds and Java/Maven-based server builds.
It is mainly used for CI jobs that require the possibility to build client and server components in one shared container.

The image has the following components installed:

-   Git >=2.17.1
-   Node 22, yarn 1.22.19 and lerna
-   OpenJDK 21 and Maven >=3.6.0
-   Python and GCC libraries to enable [Theia](https://theia-ide.org/) builds

## How to use this image

You can run any shell command by using the docker image directly, passing a shell command to `docker run`:

    docker run eclipseglsp/ci:alpine echo "Hello World"

Alternatively, you can run the image in interactive mode and gain full access to the shell:

    docker run -it eclipseglsp/ci:alpine

## Image Details

### `ci:alpine<-suffix>`

This image is based on the popular [Alpine Linux project](https://alpinelinux.org), available in [the `alpine` official image](https://hub.docker.com/_/alpine).
Alpine Linux is much smaller than most distribution base images (~5MB), and thus leads to much slimmer images in general.

It only provides the essential libraries needed for building client and server components and is the recommended image for classical CI jobs like building branches or PRs on change, or deploying build artifacts.

## Image Version History

-   [v1.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v1.0): Node version: 12. Only supports Theia >1.15.0
-   [v2.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v2.0): Update preinstalled dependencies to support Theia >=1.15.0
-   [v3.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v3.0): Update to node 14
-   [v3.1](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v3.1): Pre-install latest lerna version
-   [v4.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v4.0): Update to node 16
-   [v5.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v5.0): Update to node 18, Java 17 and Alpine 3.17/Ubuntu 22.04
-   [v6.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v6.0): Update to node 20
-   [v7.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v7.0): Update to Java 21
-   [v7.1](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v7.1): Additionally install Java 11
-   [v8.0](https://hub.docker.com/r/eclipseglsp/ci/tags?page=1&name=v8.0): Update to Node 22. Ubuntu and uitest variants have been removed.

## License

Eclipse Eclipse is released under the [EPL-2.0](https://www.eclipse.org/legal/epl-2.0/)/[GPL-2.0-with-classpath-exception](https://spdx.org/licenses/GPL-2.0-with-classpath-exception.html),

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).
