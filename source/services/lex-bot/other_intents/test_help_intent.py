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
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}


@patch.dict(os.environ, mock_env_variables)
class BookAppointmentIntentTest(TestCase):
    def test_closing_response(self):
        from other_intents.help_intent import closing_response
        closing_response_value = {
            "English": {"value": "Try 'What is your name', 'Weather Forecast', 'Leave Feedback', 'Order Pizza', or 'Book Appointment'"},
            "French": {"value": "Essayez 'Quel est votre nom', 'Prévisions météo', 'Laisser les commentaires', 'Commander une pizza', ou 'Prendre rendez-vous'."},
            "Italian": {"value": "Provare 'Qual è il tuo nome', 'Previsione del moto', 'lasciare un feedback', 'Ordina la pizza', o 'Fissa un appuntamento'."},
            "Spanish": {"value": "Intentar 'Cual es tu nombre', 'Como esta el clima', 'Dejar un comentario', 'Quiero pizza', o 'Reservar una cita'."},
            "German": {"value": "Versuchen 'Wie heißen Sie', 'Wettervorhersage', 'Hinterlasse ein Feedback', 'Pizza bestellen' oder, 'Einen Termin buchen'."},
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
        from other_intents.help_intent import utterances
        utterance_values = {
            "English": [
                {"utterance": "help"},
                {"utterance": "help me"},
                {"utterance": "what do you know"},
                {"utterance": "answer me something"},
            ],
            "French": [
                {"utterance": "aider"},
                {"utterance": "aidez-moi"},
                {"utterance": "ce que vous savez"},
                {"utterance": "répondez-moi quelque chose"},
            ],
            "Italian": [
                {"utterance": "aiuto"},
                {"utterance": "aiutami"},
                {"utterance": "cosa sai"},
                {"utterance": "rispondami qualcosa"},
            ],
            "Spanish": [
                {"utterance": "ayuda"},
                {"utterance": "me ayuda"},
                {"utterance": "lo que usted sabe"},
                {"utterance": "me responda algo"},
            ],
            "German": [
                {"utterance": "hilfe"},
                {"utterance": "hilf mir"},
                {"utterance": "was weißt du"},
                {"utterance": "antworte mir etwas"},
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
    def test_create_help_intent(self, mock_client):
        from other_intents.help_intent import create_help_intent
        create_help_intent(locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateIntent",
            {
                "intentName": "Help",
                "description": "Help intent created by serverless bot.",
                "sampleUtterances": [
                    {"utterance": "help"},
                    {"utterance": "help me"},
                    {"utterance": "what do you know"},
                    {"utterance": "answer me something"},
                ],
                "dialogCodeHook": {"enabled": False},
                "fulfillmentCodeHook": {"enabled": False},
                "intentClosingSetting": {
                    "closingResponse": {
                        "messageGroups": [{"message": {"plainTextMessage": {"value": "Try 'What is your name', 'Weather Forecast', 'Leave Feedback', 'Order Pizza', or 'Book Appointment'"}}}],
                        "allowInterrupt": True,
                    }
                },
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )
