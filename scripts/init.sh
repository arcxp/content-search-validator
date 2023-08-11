#!/bin/bash

################################################################################
# NODE
################################################################################

if command -v curl >/dev/null 2>&1; then
    echo "✅ curl installed"
else
    apt-get update
    apt-get install -y curl wget
fi

################################################################################
# VOLTA
################################################################################

export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

if command -v node >/dev/null 2>&1; then
    echo "✅ node installed"
else
    cd /tmp &&
        wget https://github.com/volta-cli/volta/releases/download/v1.1.1/volta-1.1.1-linux.tar.gz &&
        cd /usr/local/bin &&
        tar -xvzf /tmp/volta-1.1.1-linux.tar.gz &&
        rm /tmp/volta-1.1.1-linux.tar.gz &&
        volta install node@18
fi

################################################################################
# MAPPINGS
################################################################################

cd /scripts || exit 1
npm install
