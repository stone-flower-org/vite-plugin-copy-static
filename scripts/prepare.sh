#!/bin/sh

cd "$(dirname $0)" && cd ../

echo "Info: Trying to install husky deps"
yarn husky install
