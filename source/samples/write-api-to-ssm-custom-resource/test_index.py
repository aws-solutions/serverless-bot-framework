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
import unittest
from unittest import TestCase, mock
from mock import patch


class TestSSMCustomResource(TestCase):
    @patch("index.CfnResource")
    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_ssm(self, mock_client, mock_helper):
        from index import create_ssm
        event = {
            "ResourceProperties":{
                "SSMKeyNameAPI": "testSSMKeyName",
                "APIKey": "testAPIKey"
            }
        }
        create_ssm(event, {})
        mock_client.assert_called_with(
            "PutParameter",
            {
                "Name": "testSSMKeyName",
                "Value":"testAPIKey",
                "Type":"SecureString"
            },
        )
        mock_helper.Data.update.assert_has_calls = [
            mock.call({"APIKey": "testAPIKey"}),
            mock.call({"SSMKeyNameAPI": "testSSMKeyName"})
        ]

    @patch("index.CfnResource")
    @patch("botocore.client.BaseClient._make_api_call")
    def test_update_ssm(self, mock_client, mock_helper):
        from index import update_ssm
        event = {
            "ResourceProperties":{
                "SSMKeyNameAPI": "testSSMKeyName",
                "APIKey": "testAPIKey",
            }
        }
        update_ssm(event, {})
        mock_client.assert_called_with(
            "PutParameter",
            {
                "Name": "testSSMKeyName",
                "Value":"testAPIKey",
                "Type":"SecureString",
                "Overwrite": True,
            },
        )
        mock_helper.Data.update.assert_has_calls = [
            mock.call({"APIKey": "testAPIKey"}),
            mock.call({"SSMKeyNameAPI": "testSSMKeyName"})
        ]

    @patch("botocore.client.BaseClient._make_api_call")
    def test_delete_ssm(self, mock_client):
        from index import delete_ssm
        event = {
            "ResourceProperties":{
                "SSMKeyNameAPI": "testSSMKeyName",
                "APIKey": "testAPIKey",
            }
        }
        delete_ssm(event, {})
        mock_client.assert_called_with(
            "DeleteParameter",
            {
                "Name": "testSSMKeyName",
            },
        )