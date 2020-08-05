#!/bin/bash
function linkLocalModule(){
    _moduleName=${1}
    _baseDir=$PWD
    cd $_moduleName && yarn $2 && cd $_baseDir
}

function linkExampleNodeModules(){
    cd $2 || exit
    cd glsp-examples/client/node_modules/ || exit
    linkLocalModule @theia/application-manager $1
    linkLocalModule @theia/application-package $1
    linkLocalModule @theia/core $1
    linkLocalModule @theia/editor $1
    linkLocalModule @theia/filesystem $1
    linkLocalModule @theia/languages $1
    linkLocalModule @theia/markers $1
    linkLocalModule @theia/messages $1
    linkLocalModule @theia/monaco $1
    linkLocalModule @theia/monaco-editor-core $1
    linkLocalModule @theia/navigator $1
    linkLocalModule @theia/node-pty $1
    linkLocalModule @theia/outline-view $1
    linkLocalModule @theia/output $1
    linkLocalModule @theia/process $1
    linkLocalModule @theia/variable-resolver $1
    linkLocalModule @theia/workspace $1
    linkLocalModule sprotty-theia $1
    linkLocalModule sprotty $1
}

function linkExample(){
    cd $2 || exit
    cd glsp-examples/client || exit
    yarn $1 @eclipse-glsp/theia-integration
    yarn $1 @eclipse-glsp/client
    yarn install --force
}

function linkClient(){
    cd $2 || exit
    cd glsp-client || exit
    yarn $1 sprotty
    yarn $1
    yarn install --force
}

function linkTheiaIntegration(){
    cd $2 ||exit
    cd glsp-theia-integration || exit
    yarn $1 @eclipse-glsp/client
    yarn $1 @theia/application-manager
    yarn $1 @theia/application-package
    yarn $1 @theia/core
    yarn $1 @theia/editor
    yarn $1 @theia/filesystem
    yarn $1 @theia/languages
    yarn $1 @theia/markers
    yarn $1 @theia/messages
    yarn $1 @theia/monaco
    yarn $1 @theia/monaco-editor-core
    yarn $1 @theia/navigator
    yarn $1 @theia/node-pty
    yarn $1 @theia/outline-view
    yarn $1 @theia/output
    yarn $1 @theia/process
    yarn $1 @theia/variable-resolver
    yarn $1 @theia/workspace
    yarn $1 sprotty-theia
    yarn $1 sprotty
    yarn $1
    yarn install --force
}

#### MAIN Script
baseDir=$(cd $1|| exit; pwd)
if [[ "$baseDir" == "" ]]; then
    echo "ERROR: No basedir was defined"
    exit 0
fi

linkCmd="link"
if [[ "$2" == "--unlink" ]]; then
    linkCmd="unlink"
    
fi

cd $baseDir || exit
if [[ "$2" != "--unlink" ]]; then
    echo "--- Start linking all necessary packages --- "
    cd glsp-examples/client || exit
    yarn install
    linkExampleNodeModules $linkCmd $baseDir
    linkClient $linkCmd $baseDir
    linkTheiaIntegration $linkCmd $baseDir
    linkExample $linkCmd $baseDir
    echo "--- LINKING SUCCESSFULL --- "
else
    echo "--- Start unlinking all previously linked packages --- "
    linkTheiaIntegration $linkCmd $baseDir
    linkClient $linkCmd $baseDir
    linkExampleNodeModules $linkCmd $baseDir
    linkExample $linkCmd $baseDir
    echo "--- UNLINKING SUCCESSFULL --- "
fi
