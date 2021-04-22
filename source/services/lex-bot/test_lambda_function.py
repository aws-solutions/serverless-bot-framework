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
    @patch(
        "botocore.client.BaseClient._make_api_call", side_effect=[{"botStatus": "Creating"}, {"botStatus": "Failed"}]
    )
    def test_wait_for_bot(self, mock_client):
        from lambda_function import wait_for_bot
        with pytest.raises(RuntimeError):
            wait_for_bot(bot_id="testid1234")

    @patch(
        "botocore.client.BaseClient._make_api_call",
        side_effect=[{"botLocaleStatus": "Creating"}, {"botLocaleStatus": "Failed"}],
    )
    def test_wait_for_locale(self, mock_client):
        from lambda_function import wait_for_locale
        with pytest.raises(RuntimeError):
            wait_for_locale(bot_id="testid1234", locale_id="testid1234")

    @patch(
        "botocore.client.BaseClient._make_api_call",
        side_effect=[{"botLocaleStatus": "Building"}, {"botLocaleStatus": "Failed"}],
    )
    def test_wait_for_build(self, mock_client):
        from lambda_function import wait_for_build
        with pytest.raises(RuntimeError):
            wait_for_build(bot_id="testid1234", locale_id="testid1234")

    @patch(
        "botocore.client.BaseClient._make_api_call", side_effect=[{"botStatus": "Deleting"}, {"botStatus": "Failed"}]
    )
    def test_wait_for_bot_delete(self, mock_client):
        from lambda_function import wait_for_bot_delete
        with pytest.raises(RuntimeError):
            wait_for_bot_delete(bot_id="testid1234")

    @patch("botocore.client.BaseClient._make_api_call", return_value="test locale response")
    def test_create_lex_bot_locale(self, mock_client):
        from lambda_function import create_lex_bot_locale
        response = create_lex_bot_locale(bot_language="English", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateBotLocale",
            {
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
                "description": "created English from lambda",
                "nluIntentConfidenceThreshold": 0.4,
            },
        )
        self.assertEqual(response, "test locale response")

    @patch("botocore.client.BaseClient._make_api_call", return_value="test response")
    def test_create_lex_bot(self, mock_client):
        from lambda_function import create_lex_bot
        response = create_lex_bot(bot_name="test", bot_role_arn="testARN", child_directed="no")
        mock_client.assert_called_with(
            "CreateBot",
            {
                "botName": "test",
                "description": "Created by Serverless Bot Framework",
                "roleArn": "testARN",
                "dataPrivacy": {"childDirected": False},
                "idleSessionTTLInSeconds": 300,
                "botTags": {"createdby": "serverless bot framework"},
            },
        )
        self.assertEqual(response, "test response")

    @patch(
        "botocore.client.BaseClient._make_api_call", return_value={"botAliasSummaries": [{"botAliasId": "testid1234"}]}
    )
    def test_get_bot_alias_id(self, mock_client):
        from lambda_function import get_bot_alias_id
        response = get_bot_alias_id(bot_id="testid1234")
        mock_client.assert_called_with("ListBotAliases", {"botId": "testid1234"})
        self.assertEqual(response, "testid1234")

    @patch(
        "botocore.client.BaseClient._make_api_call", return_value={"botSummaries": [{"botId": "testid1234"}]}
    )
    def test_get_bot_id(self, mock_client):
        from lambda_function import get_bot_id
        response = get_bot_id()
        mock_client.assert_called_with("ListBots", {
            "filters":[{
                "name": "BotName",
                "values": ["testbot"],
                "operator": "EQ",
            }]
        })
        self.assertEqual(response, "testid1234")

    @patch("lambda_function.wait_for_locale")
    @patch("lambda_function.create_lex_bot_locale", return_value={"localeId": "testid1234"})
    @patch("lambda_function.get_bot_alias_id", return_value="testid1234")
    @patch("lambda_function.wait_for_bot")
    @patch("lambda_function.create_lex_bot", return_value={"botId": "testid1234"})
    def test_configure_lex_bot(
        self,
        mock_create_lex_bot,
        mock_wait_for_bot,
        mock_get_bot_alias_id,
        mock_create_lex_bot_locale,
        mock_wait_for_locale,
    ):
        from lambda_function import configure_lex_bot
        bot_id, bot_alias_id, locale_id = configure_lex_bot(
            bot_name="testname", bot_role_arn="testARN", child_directed="no", bot_language="English"
        )
        mock_create_lex_bot.assert_called_with("testname", "testARN", "no")
        mock_wait_for_bot.assert_called_with("testid1234")
        mock_get_bot_alias_id.assert_called_with("testid1234")
        mock_create_lex_bot_locale.assert_called_with("English", "testid1234")
        mock_wait_for_locale.assert_called_with("testid1234", "testid1234")

        self.assertEqual(bot_id, "testid1234")
        self.assertEqual(bot_alias_id, "testid1234")
        self.assertEqual(locale_id, "testid1234")

    @patch("lambda_function.create_name_intent")
    @patch("lambda_function.create_help_intent")
    @patch("lambda_function.create_weather_intent")
    @patch("lambda_function.create_order_pizza_intent")
    @patch("lambda_function.create_appointment_intent")
    @patch("lambda_function.create_feedback_intent")
    def test_create_bot_intents(
        self,
        mock_create_feedback_intent,
        mock_create_appointment_intent,
        mock_create_order_pizza_intent,
        mock_create_weather_intent,
        mock_create_help_intent,
        mock_create_name_intent,
    ):
        from lambda_function import create_bot_intents
        create_bot_intents(bot_id="testbotid", bot_alias_id="testaliasid", locale_id="testlocaleid")
        mock_create_feedback_intent.assert_called_with("testbotid", "testlocaleid", "testaliasid")
        mock_create_appointment_intent.assert_called_with("testbotid", "testlocaleid")
        mock_create_order_pizza_intent.assert_called_with("testbotid", "testlocaleid")
        mock_create_weather_intent.assert_called_with("testbotid", "testlocaleid")
        mock_create_help_intent.assert_called_with("testbotid", "testlocaleid")
        mock_create_name_intent.assert_called_with("testbotid", "testlocaleid")

    @patch("lambda_function.wait_for_build")
    @patch("botocore.client.BaseClient._make_api_call", return_value="test locale response")
    def test_build_lex_bot(self, mock_client, mock_wait_for_build):
        from lambda_function import build_lex_bot
        build_lex_bot(bot_id="testbotid", locale_id="testlocaleid")
        mock_client.assert_called_with(
            "BuildBotLocale", {"botId": "testbotid", "botVersion": "DRAFT", "localeId": "testlocaleid"}
        )
        mock_wait_for_build.assert_called_with("testbotid", "testlocaleid")

    @patch("lambda_function.build_lex_bot")
    @patch("lambda_function.create_bot_intents")
    @patch("lambda_function.configure_lex_bot", return_value=("testbotid", "testaliasid", "testlocaleid"))
    def test_create_resource(self, mock_configure_lex_bot, mock_create_bot_intents, mock_build_lex_bot):
        from lambda_function import create_resource
        event = {}
        context = {}
        response = create_resource(event, context)
        mock_configure_lex_bot.assert_called_with("testbot", "testARN", "no", "English")
        mock_create_bot_intents.assert_called_with("testbotid", "testaliasid", "testlocaleid")
        mock_build_lex_bot.assert_called_with("testbotid", "testlocaleid")
        self.assertEqual(response, "testbotid")

    @patch("lambda_function.get_bot_id", return_value="testbotid")
    @patch("botocore.client.BaseClient._make_api_call")
    def test_delete_resource(self, mock_client, mock_get_bot_id):
        from lambda_function import delete_resource
        event = {}
        context = {}
        delete_resource(event, context)
        mock_get_bot_id.assert_called()
        mock_client.assert_called_with("DeleteBot", {'botId': 'testbotid', 'skipResourceInUseCheck': True})


    @patch("lambda_function.delete_resource")
    @patch("lambda_function.wait_for_bot_delete")
    @patch("lambda_function.get_bot_id", return_value="testbotid1234")
    @patch("lambda_function.create_resource")
    def test_update_resource(self, mock_create, mock_get_bot_id, mock_wait, mock_delete):
        from lambda_function import update_resource
        event = {}
        context = {}
        update_resource(event, context)
        mock_delete.assert_called_with(event, context)
        mock_get_bot_id.assert_called()
        mock_wait.assert_called_with("testbotid1234")
        mock_create.assert_called_with(event, context)