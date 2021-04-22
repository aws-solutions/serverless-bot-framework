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
class WeatherIntentTest(TestCase):
    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_intent(self, mock_client):
        from weather_forecast.intent import create_intent
        create_intent(bot_language="English", locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateIntent",
            {
                "intentName": "WeatherForecast",
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_city_slot(self, mock_client):
        from weather_forecast.intent import create_city_slot
        create_city_slot(
            slot_type_id="testid1234",
            message_id="city",
            bot_language="English",
            bot_id="testid1234",
            locale_id="en_US",
            intent_id="testid1234",
        )
        mock_client.assert_called_with(
            "CreateSlot",
            {
                "slotName": "City",
                "description": "City information.",
                "slotTypeId": "testid1234",
                "valueElicitationSetting": {
                    "slotConstraint": "Required",
                    "promptSpecification": {
                        "messageGroups": [{"message": {"plainTextMessage": {"value": "Which city?"}}}],
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
    def test_update_weather_intent(self, mock_client):
        from weather_forecast.intent import update_weather_intent
        update_weather_intent(
            bot_language="English",
            intent_id="testid1234",
            city_slot_id="testid1234",
            bot_id="testid1234",
            locale_id="en_US",
        )
        mock_client.assert_called_with(
            "UpdateIntent",
            {
                "intentId": "testid1234",
                "intentName": "WeatherForecast",
                "description": "WeatherForecast intent created by serverless bot.",
                "sampleUtterances": [
                    {"utterance": "what is the weather forecast"},
                    {"utterance": "weather forecast"},
                    {"utterance": "how is the weather"},
                ],
                "dialogCodeHook": {"enabled": False},
                "fulfillmentCodeHook": {"enabled": True},
                "slotPriorities": [{"priority": 1, "slotId": "testid1234"}],
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch.dict(os.environ, mock_env_variables)
    @patch("weather_forecast.intent.update_weather_intent")
    @patch("weather_forecast.intent.create_city_slot", return_value="testid1234")
    @patch("weather_forecast.intent.create_intent", return_value="testid1234")
    def test_create_weather_intent(
        self,
        mock_create_intent,
        mock_create_city_slot,
        mock_update_weather_intent,
    ):
        from weather_forecast.intent import create_weather_intent
        create_weather_intent(bot_id="testid1234", locale_id="en_US")

        mock_create_intent.assert_called_with("English", "testid1234", "en_US")
        mock_create_city_slot.assert_called_with("AMAZON.City", "city", "English", "testid1234", "en_US", "testid1234")
        mock_update_weather_intent.assert_called_with("English", "testid1234", "testid1234", "testid1234", "en_US")
