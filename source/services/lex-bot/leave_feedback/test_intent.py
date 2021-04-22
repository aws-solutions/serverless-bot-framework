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
from unittest import TestCase, mock
from mock import patch
import botocore

mock_env_variables = {
    "botLanguage": "English",
    "lexLambdaARN": "testARN",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}


@patch.dict(os.environ, mock_env_variables)
class LeaveFeedbackIntentTest(TestCase):
    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_intent(self, mock_client):
        from leave_feedback.intent import create_intent
        create_intent(locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateIntent",
            {
                "intentName": "LeaveFeedback",
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_slot(self, mock_client):
        from leave_feedback.intent import create_slot
        create_slot(
            slot_name="firstName",
            slot_type_id="testid1234",
            intent_id="testid1234",
            locale_id="en_US",
            bot_id="testid1234",
        )
        mock_client.assert_called_with(
            "CreateSlot",
            {
                "slotName": "firstName",
                "description": "firstName information.",
                "slotTypeId": "testid1234",
                "valueElicitationSetting": {
                    "slotConstraint": "Required",
                    "promptSpecification": {
                        "messageGroups": [
                            {
                                "message": {
                                    "plainTextMessage": {"value": "Hello, this is the interaction 1. What's your name?"}
                                }
                            }
                        ],
                        "maxRetries": 5,
                        "allowInterrupt": True,
                    },
                },
                "obfuscationSetting": {"obfuscationSettingType": "None"},
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
                "intentId": "testid1234",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_update_feedback_intent(self, mock_client):
        from leave_feedback.intent import update_feedback_intent
        update_feedback_intent(
            intent_id="testid1234",
            bot_id="testid1234",
            locale_id="en_US",
            firstname_slot_id="testid1234",
            lastname_slot_id="testid1234",
            feedback_slot_id="testid1234",
        )
        mock_client.assert_called_with(
            "UpdateIntent",
            {
                "intentId": "testid1234",
                "intentName": "LeaveFeedback",
                "description": "LeaveFeedback intent created by serverless bot.",
                "sampleUtterances": [
                    {"utterance": "leave feedback"},
                    {"utterance": "I want to leave feedback"},
                    {"utterance": "leave a feedback message"},
                    {"utterance": "feedback"},
                ],
                "dialogCodeHook": {"enabled": False},
                "fulfillmentCodeHook": {"enabled": True},
                "intentClosingSetting": {
                    "closingResponse": {
                        "messageGroups": [
                            {
                                "message": {
                                    "plainTextMessage": {
                                        "value": "Success! This is interaction 4, the conversation ends here."
                                    }
                                }
                            }
                        ],
                        "allowInterrupt": True,
                    }
                },
                "slotPriorities": [
                    {"priority": 1, "slotId": "testid1234"},
                    {"priority": 2, "slotId": "testid1234"},
                    {"priority": 3, "slotId": "testid1234"},
                ],
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_update_bot_alias(self, mock_client):
        from leave_feedback.intent import update_bot_alias
        update_bot_alias(
            bot_id="testid1234",
            bot_alias_id="testid1234",
        )
        mock_client.assert_called_with(
            "UpdateBotAlias",
            {
                "botAliasId": "testid1234",
                "botAliasName": "TestBotAlias",
                "description": "Created By Serverless Bot Framework",
                "botVersion": "DRAFT",
                "botAliasLocaleSettings": {
                    "en_US": {
                        "enabled": True,
                        "codeHookSpecification": {
                            "lambdaCodeHook": {"lambdaARN": "testARN", "codeHookInterfaceVersion": "1.0"}
                        },
                    }
                },
                "botId": "testid1234",
            },
        )

    @patch("leave_feedback.intent.update_bot_alias")
    @patch("leave_feedback.intent.update_feedback_intent")
    @patch("leave_feedback.intent.create_slot", return_value="testid1234")
    @patch("leave_feedback.intent.create_intent", return_value="testid1234")
    def test_create_feedback_intent(
        self,
        mock_create_intent,
        mock_create_slot,
        mock_update_feedback_intent,
        mock_update_bot_alias,
    ):
        from leave_feedback.intent import create_feedback_intent
        create_feedback_intent(bot_id="testid1234", locale_id="en_US", bot_alias_id="testid1234")
        mock_create_intent.assert_called_with("testid1234", "en_US")
        mock_create_slot.assert_has_calls(
            [
                mock.call("firstName", "AMAZON.FirstName", "testid1234", "en_US", "testid1234"),
                mock.call("lastName", "AMAZON.LastName", "testid1234", "en_US", "testid1234"),
                mock.call("feedback", "AMAZON.AlphaNumeric", "testid1234", "en_US", "testid1234"),
            ]
        )
        mock_update_feedback_intent.assert_called_with(
            "testid1234", "testid1234", "en_US", "testid1234", "testid1234", "testid1234"
        )
        mock_update_bot_alias.assert_called_with("testid1234", "testid1234")
