# Eclipse GLSP Docker

The Dockerfile sources for all images that are hosted in the [Eclipse GLSP
Dockerhub](https://hub.docker.com/u/eclipseglsp) organization.

## Repositories

### [eclipseglsp/ci](https://hub.docker.com/r/eclipseglsp/ci)

Collection of images that are used in Continuos Integration jobs of Eclipse GLSP and related projects (e.g. [EMF.cloud](https://www.eclipse.org/emfcloud/)). The `ci` images come in different flavors, each designed for a specific use case. The images ship with the necessary libraries to enable both node-based client builds and Java/Maven-based server builds. They are mainly used for CI jobs that require the possibility to build client and server components in one shared container.

Currently each image variant has at least the following components installed:

-   Git >=2.17.1
-   Node 12 and yarn 1.22.4
-   OpenJDK 11 and Maven >=3.6.0
-   Python and GCC libraries to enable [Theia](https://theia-ide.org/) builds

## License

Eclipse Eclipse is released under the [EPL-2.0](https://www.eclipse.org/legal/epl-2.0/)/[GPL-2.0-with-classpath-exception](https://spdx.org/licenses/GPL-2.0-with-classpath-exception.html),

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).
