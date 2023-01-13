# Releng Docker Image
FROM eclipseglsp/ci:uitest

RUN useradd -m releng
# Install node & other Theia related dependencies

RUN  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg;
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null; 
RUN apt-get update && apt-get install -y gh jq zsh &&\
	npm install -g verdaccio lerna-update-wizard lerna@^4.0.0
RUN chsh -s $(which zsh)
COPY . /glsp-build/
RUN cd  /glsp-build && \
	yarn && cd dev-packages/cli && \
	yarn link && export PATH=$(yarn global bin):$PATH
RUN mkdir -p /home/releng/workspace
RUN chown -R releng:releng /home/releng/workspace
WORKDIR /home/releng/workspace
USER releng 

RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
CMD ["/bin/zsh"]
