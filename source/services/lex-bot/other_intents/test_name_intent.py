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
    "botName": "testbot",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0"}',
}

@patch.dict(os.environ, mock_env_variables)
class BookAppointmentIntentTest(TestCase):
    def test_closing_response(self):
        from other_intents.name_intent import closing_response
        closing_response_value = {
            "English": {"value": "My name is testbot, how can I help you?"},
            "French": {"value": "Mon nom est testbot, comment puis-je vous aider?"},
            "Italian": {"value": "Mi chiamo testbot, come posso aiutarti?"},
            "Spanish": {"value": "Mi nombre es testbot, en qué puedo ayudarte?"},
            "German": {"value": "Mein Name ist testbot, wie kann ich Ihnen helfen?"},
        }
        response = closing_response("English")
        self.assertEqual(response, closing_response_value["English"])
        response = closing_response("French")
        self.assertEqual(response, closing_response_value["French"])
        response = closing_response("Spanish")
        self.assertEqual(response, closing_response_value["Spanish"])
        response = closing_response("Italian")
        self.assertEqual(response, closing_response_value["Italian"])
        response = closing_response("German")
        self.assertEqual(response, closing_response_value["German"])

        self.assertRaises(KeyError, closing_response, "invalidLanguage")

    def test_utterances(self):
        from other_intents.name_intent import utterances
        utterance_values = {
            "English": [
                {"utterance": "what is your name"},
                {"utterance": "who are you"},
            ],
            "French": [
                {"utterance": "quel est votre nom"},
                {"utterance": "qui êtes-vous"},
                {"utterance": "exemple de réponse simple"},
            ],
            "Italian": [
                {"utterance": "come ti chiami"},
                {"utterance": "qual è il tuo nome"},
                {"utterance": "tu chi sei"},
            ],
            "Spanish": [
                {"utterance": "cual es tu nombre"},
                {"utterance": "Quien eres tu"},
            ],
            "German": [
                {"utterance": "wie heißen Sie"},
                {"utterance": "wer bist du"},
            ],
        }
        response = utterances("English")
        self.assertEqual(response, utterance_values["English"])
        response = utterances("French")
        self.assertEqual(response, utterance_values["French"])
        response = utterances("Spanish")
        self.assertEqual(response, utterance_values["Spanish"])
        response = utterances("Italian")
        self.assertEqual(response, utterance_values["Italian"])
        response = utterances("German")
        self.assertEqual(response, utterance_values["German"])

        self.assertRaises(KeyError, utterances, "invalidLanguage")

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_name_intent(self, mock_client):
        from other_intents.name_intent import create_name_intent
        create_name_intent(locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateIntent",
            {
                "intentName": "Name",
                "description": "Name intent created by serverless bot.",
                "sampleUtterances": [
                    {"utterance": "what is your name"},
                    {"utterance": "who are you"},
                ],
                "dialogCodeHook": {"enabled": False},
                "fulfillmentCodeHook": {"enabled": False},
                "intentClosingSetting": {
                    "closingResponse": {
                        "messageGroups": [{"message": {"plainTextMessage": {"value": "My name is testbot, how can I help you?"}}}],
                        "allowInterrupt": True,
                    }
                },
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )
