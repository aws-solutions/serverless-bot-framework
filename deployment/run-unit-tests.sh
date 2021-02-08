#!/bin/bash

# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh

# Run unit tests
echo "Running unit tests"

# Get reference for source folder
source_dir="$PWD/../source"

echo "cd $source_dir/samples/bot-weather-forecast"
cd $source_dir/samples/bot-weather-forecast
python3 setup.py install
pip3 install -r requirements.txt --target .
pip3 install -r dev-requirements.txt
python3 test.py

echo "cd $source_dir/samples/order-pizza"
cd $source_dir/samples/order-pizza
npm ci
npm test
