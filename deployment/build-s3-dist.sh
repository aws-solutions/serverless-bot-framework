#!/bin/bash

# This assumes all of the OS-level configuration has been completed and git repo has already been cloned

# This script should be run from the repo's deployment directory
# cd deployment
# ./build-s3-dist.sh source-bucket-base-name version-code
# source-bucket-base-name should be the base name for the S3 bucket location where the template will source the Lambda code from.
# The template will append '-[region_name]' to this bucket name.
# For example: ./build-s3-dist.sh solutions
# The template will then expect the source code to be located in the solutions-[region_name] bucket
set -e
# Check to see if input has been provided:
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Please provide the base source bucket name, trademarked solution name, and version where the lambda code will eventually reside."
    echo "For example: ./build-s3-dist.sh solutions trademarked-solution-name v1.0.0"
    exit 1
fi

# Get reference for all important folders
template_dir="$PWD"
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
echo "find $source_dir/node_modules -iname "node_modules" -type d -exec rm -r "{}" \; 2> /dev/null"
echo "find $source_dir/services -iname "node_modules" -type d -exec rm -r "{}" \; 2> /dev/null"
echo "find $source_dir/samples -iname "node_modules" -type d -exec rm -r "{}" \; 2> /dev/null"
echo "find ../ -type f -name '.DS_Store' -delete"
find $source_dir -type f -name '.DS_Store' -delete
echo "mkdir -p $template_dist_dir"
mkdir -p "$template_dist_dir"
echo "mkdir -p $build_dist_dir"
mkdir -p "$build_dist_dir"

echo "------------------------------------------------------------------------------"
echo "[Packing] Templates"
echo "------------------------------------------------------------------------------"
echo "cp -f $template_dir/${solution_name}.yaml $template_dist_dir/${solution_name}.template"
cp -f $template_dir/${solution_name}.yaml $template_dist_dir/${solution_name}.template

echo "cp -f $template_dir/${solution_name}-security.yaml $template_dist_dir/${solution_name}-security.template"
cp -f $template_dir/${solution_name}-security.yaml $template_dist_dir/${solution_name}-security.template

echo "cp -f $template_dir/${solution_name}-sample.yaml $template_dist_dir/${solution_name}-sample.template"
cp -f $template_dir/${solution_name}-sample.yaml $template_dist_dir/${solution_name}-sample.template

# Replacing bucket name, solution name, and version in template
for replace in "s/%%BUCKET_NAME%%/${bucket_name}/g" \
        "s/%%SOLUTION_NAME%%/${solution_name}/g" \
        "s/%%VERSION%%/${version}/g"; do

    printf "sed -i -e $replace ${template_dist_dir}/${solution_name}.template\n"
    sed -i -e "${replace}" ${template_dist_dir}/${solution_name}.template
    printf "sed -i -e $replace ${template_dist_dir}/${solution_name}-sample.template\n"
    sed -i -e "${replace}" ${template_dist_dir}/${solution_name}-sample.template
    printf "sed -i -e $replace ${template_dist_dir}/${solution_name}-security.template\n"
    sed -i -e "${replace}" ${template_dist_dir}/${solution_name}-security.template
done

echo "------------------------------------------------------------------------------"
echo "[Rebuild] Core Resource"
echo "------------------------------------------------------------------------------"
cd $source_dir/modules/b2.core
npm ci
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Core Service"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/core
npm ci
zip -q -r9 $build_dist_dir/core.zip *
rm -fR $source_dir/services/core/node_modules
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Custom Resource"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/custom-resource
python3 setup.py install
zip -q -r9 $build_dist_dir/custom-resource.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Polly Service"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/polly-service
npm ci
zip -q -r9 $build_dist_dir/polly-service.zip *
rm -fR $source_dir/services/polly-service/node_modules
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Train Model"
echo "------------------------------------------------------------------------------"
cd $source_dir/services/train-model
npm ci
zip -q -r9 $build_dist_dir/train-model.zip *
rm -fR $source_dir/services/train-model/node_modules
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample Bot Weather Forecast"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/bot-weather-forecast
python3 setup.py install
pip3 install -r requirements.txt --target .
zip -q -r9 $build_dist_dir/sample-bot-weather-forecast.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample Bot Leave Feedback"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/leave-feedback
zip -q -r9 $build_dist_dir/sample-leave-feedback.zip *
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample WebClient"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/webclient
npm ci && npm run build
cd build
zip -q -r9 $build_dist_dir/sample-webclient.zip *
rm -fR  $source_dir/samples/webclient/node_modules
echo ""
echo "------------------------------------------------------------------------------"
echo "[Packing] Sample API To SSM Custom Resource"
echo "------------------------------------------------------------------------------"
cd $source_dir/samples/write-api-to-ssm-custom-resource
python3 setup.py install
pip3 install -r requirements.txt --target .
zip -q -r9 $build_dist_dir/write-api-to-ssm-custom-resource *

echo "------------------------------------------------------------------------------"
echo "[Clean] node_modules folders"
echo "------------------------------------------------------------------------------"
rm -fR $source_dir/modules/b2.core/node_modules
