# GLSP Releng Docker file

The releng Docker file is based on [eclipseglsp/ci:uitest](../docker/ci/uitest/Dockerfile).
It has the local version of the [@eclipse-glsp/releng](../dev-packages/releng/) package preinstalled and ships with all libraries and tools need for the CLI application.

# Build the docker file

To build the docker file execute the following command from the repository root:

```bash
docker build -f docker/releng/Dockerfile -t eclipseglsp/releng ./
```

# Start the container

If you want to start the container for the first time use this command:

```bash
docker run -it --name releng-container eclipseglsp/releng
```

For consecutive starts you can simply start the previously created releng-container:

```
docker container start releng-container -i
```

The GLSP Releng CLI is preinstalled and executed with the `glsp-releng` command.
