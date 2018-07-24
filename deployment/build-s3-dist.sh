#!/bin/bash

# This assumes all of the OS-level configuration has been completed and git repo has already been cloned

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name version-code
# source-bucket-base-name should be the base name for the S3 bucket location where the template will source the Lambda code from.
# The template will append '-[region_name]' to this bucket name.
# For example: ./build-s3-dist.sh solutions
# The template will then expect the source code to be located in the solutions-[region_name] bucket

# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide the base source bucket name and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions v1.0.0"
    exit 1
fi

# Get reference for all important folders
template_dir="$PWD"
dist_dir="$template_dir/dist"
source_dir="$template_dir/../source"

echo "------------------------------------------------------------------------------"
echo "[Init] Clean old dist and node_modules folders"
echo "------------------------------------------------------------------------------"
echo "rm -rf $dist_dir"
rm -rf "$dist_dir"
echo "find $source_dir/node_modules -iname "node_modules" -type d -exec rm -r "{}" \; 2> /dev/null"
echo "find $source_dir/services -iname "node_modules" -type d -exec rm -r "{}" \; 2> /dev/null"
echo "find $source_dir/samples -iname "node_modules" -type d -exec rm -r "{}" \; 2> /dev/null"
echo "find ../ -type f -name 'package-lock.json' -delete"
find $source_dir -type f -name 'package-lock.json' -delete
echo "find ../ -type f -name '.DS_Store' -delete"
find $source_dir -type f -name '.DS_Store' -delete
echo "mkdir -p $dist_dir"
mkdir -p "$dist_dir"

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates"
echo "------------------------------------------------------------------------------"
echo "cp -f $template_dir/serverless-bot-framework.template dist"
cp -f "$template_dir/serverless-bot-framework.template" $dist_dir
echo "Updating code source bucket in template with $1"
replace="s/%%BUCKET_NAME%%/$1/g"
echo "sed -i '' -e $replace $dist_dir/serverless-bot-framework.template"
sed -i '' -e $replace "$dist_dir/serverless-bot-framework.template"
echo "Updating code source version in template with $2"
replace="s/%%VERSION%%/$2/g"
echo "sed -i '' -e $replace $dist_dir/serverless-bot-framework.template"
sed -i '' -e $replace "$dist_dir/serverless-bot-framework.template"

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates - Security Resources"
echo "------------------------------------------------------------------------------"
echo "cp -f $template_dir/serverless-bot-framework-security.template dist"
cp -f "$template_dir/serverless-bot-framework-security.template" $dist_dir
echo "Updating code source bucket in template with $1"
replace="s/%%BUCKET_NAME%%/$1/g"
echo "sed -i '' -e $replace $dist_dir/serverless-bot-framework-security.template"
sed -i '' -e $replace "$dist_dir/serverless-bot-framework-security.template"
echo "Updating code source version in template with $2"
replace="s/%%VERSION%%/$2/g"
echo "sed -i '' -e $replace $dist_dir/serverless-bot-framework-security.template"
sed -i '' -e $replace "$dist_dir/serverless-bot-framework-security.template"

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates - Sample Resources"
echo "------------------------------------------------------------------------------"
echo "cp -f $template_dir/serverless-bot-framework-sample.template dist"
cp -f "$template_dir/serverless-bot-framework-sample.template" $dist_dir
echo "Updating code source bucket in template with $1"
replace="s/%%BUCKET_NAME%%/$1/g"
echo "sed -i '' -e $replace $dist_dir/serverless-bot-framework-sample.template"
sed -i '' -e $replace "$dist_dir/serverless-bot-framework-sample.template"
echo "Updating code source version in template with $2"
replace="s/%%VERSION%%/$2/g"
echo "sed -i '' -e $replace $dist_dir/serverless-bot-framework-sample.template"
sed -i '' -e $replace "$dist_dir/serverless-bot-framework-sample.template"

echo "------------------------------------------------------------------------------"
echo "[Rebuild] Core Resource"
echo "------------------------------------------------------------------------------"
cd $source_dir/modules/b2.core
npm install
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Core Service"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/core
npm install
zip -q -r9 $dist_dir/core.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Custom Resource"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/custom-resource
zip -q -r9 $dist_dir/custom-resource.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Polly Service"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/polly-service
npm install
zip -q -r9 $dist_dir/polly-service.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Train Model"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/train-model
npm install
zip -q -r9 $dist_dir/train-model.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample Bot Weather Forecast"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/bot-weather-forecast
zip -q -r9 $dist_dir/sample-bot-weather-forecast.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample Bot Password Reset"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/bot-password-reset
zip -q -r9 $dist_dir/sample-bot-password-reset.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample WebClient"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/webclient
zip -q -r9 $dist_dir/sample-webclient.zip *

echo "------------------------------------------------------------------------------"
echo "[Clean] node_modules folders"
echo "------------------------------------------------------------------------------"
rm -fR $source_dir/modules/b2.core/node_modules
rm -fR $source_dir/services/core/node_modules
rm -fR $source_dir/services/polly-service/node_modules
rm -fR $source_dir/services/train-model/node_modules
