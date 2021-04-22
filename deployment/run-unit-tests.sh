#!/bin/bash
######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh

[ "$DEBUG" == 'true' ] && set -x
set -e

run_python_test() {
    local component_path=$1
	local component_name=$2

    echo "------------------------------------------------------------------------------"
    echo "[Test] Run python unit test with coverage"
    echo "------------------------------------------------------------------------------"
    echo "cd $component_path"
    cd $component_path

    # setup python environment and install dependencies
    if [ -e ./setup.py ]; then
        python3 setup.py install
    fi
    pip3 install -r requirements.txt --target .
    pip3 install -r requirements-dev.txt

    # setup coverage report path
    mkdir -p $coverage_reports_top_path
    coverage_report_path=$coverage_reports_top_path/$component_name.coverage.xml
    echo "coverage report path set to $coverage_report_path"

    # run unittests
    coverage run -m unittest discover

    # prepare coverage reports
    coverage xml -o $coverage_report_path
    coverage report

    # The coverage with its parameters and .coveragerc generates a xml coverage report with `coverage/sources` list
    # with absolute path for the source directories. To avoid dependencies of tools (such as SonarQube) on different
    # absolute paths for source directories, this substitution is used to convert each absolute source directory
    # path to the corresponding project relative path. The $source_dir holds the absolute path for source directory.
    sed -i -e "s,<source>$source_dir,<source>source,g" $coverage_report_path

    # Note: leaving behind the $coverage_reports_top_path directory to allow further processing of coverage reports
    rm -rf .coverage
}

run_javascript_test() {
    local component_path=$1
	local component_name=$2

    echo "------------------------------------------------------------------------------"
    echo "[Test] Run javascript unit test with coverage"
    echo "------------------------------------------------------------------------------"
    echo "cd $component_path"
    cd $component_path

    # setup and install dependencies
    npm ci

    # run unittest
    npm test

    # prepare coverage reports
    rm -fr coverage/lcov-report
    mkdir -p $coverage_reports_top_path/jest
    coverage_report_path=$coverage_reports_top_path/jest/$component_name
    rm -fr $coverage_report_path
    mv coverage $coverage_report_path
}

run_cdk_project_test() {
	local component_path=$1
    local component_name=solutions-constructs
	echo "------------------------------------------------------------------------------"
	echo "[Test] $component_name"
	echo "------------------------------------------------------------------------------"
    cd $component_path


	[ "${CLEAN:-true}" = "true" ] && npm run clean
	npm ci
	npm run build

	## Option to suppress the Override Warning messages while synthesizing using CDK
	# export overrideWarningsEnabled=false

	npm run test -- -u

    [ "${CLEAN:-true}" = "true" ] && rm -rf coverage/lcov-report
    mkdir -p $source_dir/test/coverage-reports/jest
    coverage_report_path=$source_dir/test/coverage-reports/jest/$component_name
    rm -fr $coverage_report_path
    mv coverage $coverage_report_path
}

# Run unit tests
echo "Running unit tests"

# Get reference for source folder
source_dir="$(cd $PWD/../source; pwd -P)"
coverage_reports_top_path=$source_dir/test/coverage-reports

#
# run unit tests
#

run_cdk_project_test $source_dir/infrastructure

run_python_test $source_dir/samples/lex-lambdas lex-lambdas

run_python_test $source_dir/samples/write-api-to-ssm-custom-resource write-api-to-ssm-custom-resource

run_javascript_test $source_dir/services/core services-core

run_javascript_test $source_dir/services/polly-service services-polly

run_python_test $source_dir/services/lex-bot services-lex-bot

run_python_test $source_dir/services/webclient-setup services-webclient

run_python_test $source_dir/services/solution-helper services-solutions-helper
