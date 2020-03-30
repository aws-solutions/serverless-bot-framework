#!/bin/bash

# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh

# Run unit tests
echo "Running unit tests"

# Get reference for source folder
source_dir="$PWD/../source"

echo "cd $source_dir/modules/b2.core"
cd $source_dir/modules/b2.core
npm install
# npm test

echo "cd $source_dir/services/core"
cd $source_dir/services/core
npm install
# npm test

echo "cd $source_dir/services/polly-service"
cd $source_dir/services/polly-service
npm install
# npm test

echo "cd $source_dir/services/train-model"
cd $source_dir/services/train-model
npm install
# npm test

echo "cd $source_dir/samples/bot-weather-forecast"
cd $source_dir/samples/bot-weather-forecast
# npm test

echo "cd $source_dir/samples/leave-feedback"
cd $source_dir/samples/leave-feedback
# npm test
