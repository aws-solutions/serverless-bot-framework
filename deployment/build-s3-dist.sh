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
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name version-code
# source-bucket-base-name should be the base name for the S3 bucket location where the template will source the Lambda code from.
# The template will append '-[region_name]' to this bucket name.
# For example: ./build-s3-dist.sh solutions
# The template will then expect the source code to be located in the solutions-[region_name] bucket
[ "$DEBUG" == 'true' ] && set -x
set -e

# Important: CDK global version number
cdk_version=1.126.0

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademarked solution name, and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

# Get reference for all important folders
template_dir="$PWD"
staging_dist_dir="$template_dir/staging"
template_dist_dir="$template_dir/global-s3-assets"
build_dist_dir="$template_dir/regional-s3-assets"
source_dir="$template_dir/../source"

# Grabbing input parameters
bucket_name="$1"
solution_name="$2"
version="$3"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist and node_modules folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $template_dist_dir"
rm -rf "$template_dist_dir"
echo "rm -rf $build_dist_dir"
rm -rf "$build_dist_dir"
echo "rm -rf $staging_dist_dir"
rm -rf "$staging_dist_dir"
echo "find ../ -type f -name '.DS_Store' -delete"
find $source_dir -type f -name '.DS_Store' -delete
echo "mkdir -p $template_dist_dir"
mkdir -p "$template_dist_dir"
echo "mkdir -p $build_dist_dir"
mkdir -p "$build_dist_dir"
echo "mkdir -p $staging_dist_dir"
mkdir -p "$staging_dist_dir"

echo "------------------------------------------------------------------------------"
echo "[Init] Install dependencies for the cdk-solution-helper"
echo "------------------------------------------------------------------------------"
cd $template_dir/cdk-solution-helper
npm ci --only=prod

echo "------------------------------------------------------------------------------"
echo "[Packing] Core Service"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/core
npm ci --only=prod

echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Webclient Setup"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/webclient-setup
pip3 install -r requirements.txt --target .

echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Polly Service"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/polly-service
npm ci --only=prod

echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Solution Helper"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/solution-helper
pip3 install -r requirements.txt --target .
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Lex Bot"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/lex-bot
pip3 install -r requirements.txt --target .

echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample Bot lex lambdas"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/lex-lambdas
pip3 install -r requirements.txt --target .

echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample WebClient"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/webclient
npm ci --only=prod && npm run build

echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample API To SSM Custom Resource"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/write-api-to-ssm-custom-resource
pip3 install -r requirements.txt --target .

echo "------------------------------------------------------------------------------"
echo "[Synth] CDK Project"
echo "------------------------------------------------------------------------------"
cd $source_dir/infrastructure

npm install aws-cdk@$cdk_version
node_modules/aws-cdk/bin/cdk synth --output=$staging_dist_dir

cd $staging_dist_dir
rm tree.json manifest.json cdk.out


echo "------------------------------------------------------------------------------"
echo "[Packing] Template artifacts"
echo "------------------------------------------------------------------------------"
cp $staging_dist_dir/*.template.json $template_dist_dir/
rm *.template.json

for f in $template_dist_dir/*.template.json; do
    mv -- "$f" "${f%.template.json}.template"
done

node $template_dir/cdk-solution-helper/index


echo "------------------------------------------------------------------------------"
echo "Updating placeholders"
echo "------------------------------------------------------------------------------"
for file in $template_dist_dir/*.template
do
    replace="s/%%BUCKET_NAME%%/$bucket_name/g"
    sed -i -e $replace $file

    replace="s/%%SOLUTION_NAME%%/$solution_name/g"
    sed -i -e $replace $file

    replace="s/%%VERSION%%/$version/g"
    sed -i -e $replace $file
done

echo "------------------------------------------------------------------------------"
echo "[Packing] Source code artifacts"
echo "------------------------------------------------------------------------------"
# ... For each asset.* source code artifact in the temporary /staging folder...
cd $staging_dist_dir
for d in `find . -mindepth 1 -maxdepth 1 -type d`; do
    # Rename the artifact, removing the period for handler compatibility
    pfname="$(basename -- $d)"
    fname="$(echo $pfname | sed -e 's/\.//g')"
    mv $d $fname

    # Zip artifacts from asset folder
    cd $fname
    zip -r ../$fname.zip *
    cd ..

    # Copy the zipped artifact from /staging to /regional-s3-assets
    cp $fname.zip $build_dist_dir

    # Remove the old artifacts from /staging
    rm -rf $fname
    rm $fname.zip
done

echo "------------------------------------------------------------------------------"
echo "[Cleanup] Remove temporary files"
echo "------------------------------------------------------------------------------"
rm -rf $staging_dist_dir
