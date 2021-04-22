# -*- coding: utf-8 -*-
####################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
#  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance
#  with the License. A copy of the License is located at
#
#      http://www.apache.org/licenses/
#
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
#  and limitations under the License.
####################################################################################################################/

# @author Solution Builders

from crhelper import CfnResource
import boto3

helper = CfnResource()

ssm = boto3.client("ssm")


@helper.create
def create_ssm(event, _):
    ssm_key_name = str(event["ResourceProperties"]["SSMKeyNameAPI"])
    api_key = str(event["ResourceProperties"]["APIKey"])
    ssm.put_parameter(Name=ssm_key_name, Value=api_key, Type="SecureString")
    helper.Data.update({"APIKey": api_key})
    helper.Data.update({"SSMKeyNameAPI": ssm_key_name})


@helper.update
def update_ssm(event, _):
    ssm_key_name = str(event["ResourceProperties"]["SSMKeyNameAPI"])
    api_key = str(event["ResourceProperties"]["APIKey"])
    ssm.put_parameter(Name=ssm_key_name, Value=api_key, Type="SecureString", Overwrite=True)
    helper.Data.update({"APIKey": api_key})
    helper.Data.update({"SSMKeyNameAPI": ssm_key_name})


@helper.delete
def delete_ssm(event, _):
    ssm_key_name = str(event["ResourceProperties"]["SSMKeyNameAPI"])
    ssm.delete_parameter(Name=ssm_key_name)


def lambda_handler(event, context):
    helper(event, context)
