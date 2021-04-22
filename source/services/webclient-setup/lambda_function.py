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

import os
import json
import logging
import urllib
import mimetypes
import boto3
from botocore.config import Config
from io import BytesIO
from zipfile import ZipFile
from crhelper import CfnResource
from urllib.request import urlopen


logger = logging.getLogger(__name__)
helper = CfnResource(json_logging=True, log_level="INFO")

CLIENT_CONFIG = Config(retries = {"mode": "standard"}, **json.loads(os.environ["AWS_SDK_USER_AGENT"]))

s3_client = boto3.client("s3", config=CLIENT_CONFIG)




BOT_SPEECH_PARAMS = {
    "Spanish": {
        "Lang": "es-US",
        "SendLabel": "Enviar",
        "Voice": {"Male": "Miguel", "Female": "Penelope"},
    },
    "English": {
        "Lang": "en-US",
        "SendLabel": "Send",
        "Voice": {"Male": "Joey", "Female": "Joanna"},
    },
    "French": {
        "Lang": "fr-FR",
        "SendLabel": "Envoyer",
        "Voice": {"Male": "Mathieu", "Female": "Celine"},
    },
    "Italian": {
        "Lang": "it-IT",
        "SendLabel": "Inviare",
        "Voice": {"Male": "Giorgio", "Female": "Carla"},
    },
    "German": {
        "Lang": "de-DE",
        "SendLabel": "Senden",
        "Voice": {"Male": "Hans", "Female": "Vicki"},
    },
}


def replace_config_anchors(content, resource_properties):
    content = content.replace("%%AWS_REGION%%", resource_properties["AwsRegion"])
    content = content.replace("%%BOT_NAME%%", resource_properties["BotName"])
    content = content.replace("%%API_URI%%", resource_properties["ApiUri"])
    if "CognitoIdentityPool" in resource_properties:
        content = content.replace("%%COGNITO_IDENTITY_POOL%%", resource_properties["CognitoIdentityPool"])
    else:
        content = content.replace("%%COGNITO_IDENTITY_POOL%%", "")
    if "CognitoUserPoolId" in resource_properties:
        content = content.replace("%%COGNITO_USER_POOL_ID%%", resource_properties["CognitoUserPoolId"])
    else:
        content = content.replace("%%COGNITO_USER_POOL_ID%%", "")
    if "CognitoUserPoolClientId" in resource_properties:
        content = content.replace("%%COGNITO_USER_POOL_CLIENT_ID%%", resource_properties["CognitoUserPoolClientId"])
    else:
        content = content.replace("%%COGNITO_USER_POOL_CLIENT_ID%%", "")

    voice = BOT_SPEECH_PARAMS[resource_properties["BotLanguage"]]["Voice"][resource_properties["BotGender"]]
    content = content.replace("%%BOT_VOICE%%", voice)

    language_tag = BOT_SPEECH_PARAMS[resource_properties["BotLanguage"]]["Lang"]
    content = content.replace("%%LANGUAGE_TAG%%", language_tag)

    return content

@helper.create
def create_resource(event, _):
    resource_properties = event["ResourceProperties"]
    logger.info("Process Webclient Sample Package")
    logger.info(resource_properties)
    webclient_pack = urlopen(resource_properties["SampleWebclientPackage"])
    zipfile = ZipFile(BytesIO(webclient_pack.read()))

    for file_name in zipfile.namelist():
        content = zipfile.open(file_name).read()

        if file_name.split(".")[-1] in ["js", "json", "html"]:
            content = replace_config_anchors(content.decode("utf-8"), resource_properties)

        conten_type = mimetypes.guess_type(file_name)[0]
        if conten_type != None:
            s3_client.put_object(
                Body=content,
                Bucket=resource_properties["SampleWebClientBucket"],
                Key=file_name,
                ContentType=conten_type,
            )
        else:
            s3_client.put_object(Body=content, Bucket=resource_properties["SampleWebClientBucket"], Key=file_name)


def delete_resource(event, _):
    resource_properties = event["ResourceProperties"]
    list_objects = s3_client.list_objects(Bucket=resource_properties['SampleWebClientBucket'])
    if "Contents" in list_objects and len(list_objects["Contents"]) > 0:
        for file in list_objects["Contents"]:
            try:
                s3_client.delete_object(Bucket=resource_properties['SampleWebClientBucket'], Key=file['Key'])
            except Exception as e:
                logger.info(e)

@helper.update
def update_resource(event, _):
    delete_resource(event, _)
    create_resource(event, _)

@helper.delete
def no_op(_, __):
    pass  # No action is required when stack is deleted


def handler(event, context):
    helper(event, context)
