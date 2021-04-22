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
from datetime import datetime
from unittest import TestCase, mock
from mock import patch
import pytest

mock_env_variables = {
    "botName": "testbot",
    "botRole": "testARN",
    "childDirected": "no",
    "botLanguage": "English",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}


@patch.dict(os.environ, mock_env_variables)
class LambdaTest(TestCase):

    def test_repalce_config_anchors(self):
        from lambda_function import replace_config_anchors
        content = """
            {
                Auth: {
                    userPoolId: "%%COGNITO_USER_POOL_ID%%",
                    userPoolWebClientId: "%%COGNITO_USER_POOL_CLIENT_ID%%",
                    region: "%%AWS_REGION%%",
                },
                API: {
                    endpoints: [
                        {
                            name: "%%BOT_NAME%%",
                            endpoint: "%%API_URI%%"
                        }
                    ]
                },
                language: "%%LANGUAGE_TAG%%",
                botVoice: "%%BOT_VOICE%%",
                cognitoIdentityPool: "%%COGNITO_IDENTITY_POOL%%",
            }
        """
        resource_properties = {
            "AwsRegion": "us-east-1",
            "BotName": "testbot",
            "ApiUri": "https://example.com/api",
            "CognitoIdentityPool": "TestIdentityPool",
            "CognitoUserPoolId": "TestUserPoolId",
            "CognitoUserPoolClientId": "TestUserPoolClientId",
            "BotLanguage": "English",
            "BotGender": "Female",
        }
        expected_content = """
            {
                Auth: {
                    userPoolId: "TestUserPoolId",
                    userPoolWebClientId: "TestUserPoolClientId",
                    region: "us-east-1",
                },
                API: {
                    endpoints: [
                        {
                            name: "testbot",
                            endpoint: "https://example.com/api"
                        }
                    ]
                },
                language: "en-US",
                botVoice: "Joanna",
                cognitoIdentityPool: "TestIdentityPool",
            }
        """
        response = replace_config_anchors(content, resource_properties)
        self.assertEqual(response, expected_content)


    @patch("lambda_function.delete_resource")
    @patch("lambda_function.create_resource")
    def test_update_resource(self, mock_create, mock_delete):
        from lambda_function import update_resource
        event = {}
        context = {}
        update_resource(event, context)
        mock_delete.assert_called_with(event, context)
        mock_create.assert_called_with(event, context)

    @patch("lambda_function.delete_resource")
    @patch("lambda_function.create_resource")
    def test_delete(self, mock_create, mock_delete):
        from lambda_function import no_op
        event = {}
        context = {}
        response = no_op(event, context)
        self.assertIsNone(response)
        mock_create.assert_not_called()
        mock_delete.assert_not_called()


