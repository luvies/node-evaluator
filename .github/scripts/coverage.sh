#!/bin/sh

set -e

export CI_BRANCH=$(node -e "process.stdout.write(process.env.GITHUB_REF.split('/').slice(2).join('/'))")
cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
