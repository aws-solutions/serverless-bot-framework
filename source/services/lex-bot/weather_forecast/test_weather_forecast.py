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
from unittest import TestCase
from weather_forecast.weather_helpers import (
    utterances,
    clarification_prompt,
    slot_message,
)

class TestWeatherHelpers(TestCase):

    def test_utterances(self):
        utterance_values = {
            "English": [
                {"utterance": "what is the weather forecast"},
                {"utterance": "weather forecast"},
                {"utterance": "how is the weather"},
            ],
            "French": [
                {"utterance": "quelles sont les prévisions météo"},
                {"utterance": "prévisions météo"},
                {"utterance": "comment est la météo"},
            ],
            "Italian": [
                {"utterance": "com'è il meteo"},
                {"utterance": "previsione del moto"},
                {"utterance": "previsioni del tempo"},
            ],
            "Spanish": [
                {"utterance": "que la prevision del tiempo"},
                {"utterance": "pronostico del tiempo"},
                {"utterance": "como esta el clima"},
            ],
            "German": [
                {"utterance": "wie ist die wettervorhersage"},
                {"utterance": "wettervorhersage"},
                {"utterance": "wie ist das wetter"},
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

    def test_clarification_prompt(self):
        prompt = {
            "English": "I didn't understand you, what would you like me to do?",
            "French": "Je n'ai pas bien compris votre demande, que puis-je faire pour vous?",
            "Italian": "Non ho capito, cosa preferisci che faccia?",
            "Spanish": "No lo entendí, ¿qué le gustaría que haga?",
            "German": "Ich habe Sie nicht verstanden. Bitte sagen Sie mir, was ich für Sie tun soll.",
        }
        response = clarification_prompt("English")
        self.assertEqual(response, prompt["English"])
        response = clarification_prompt("French")
        self.assertEqual(response, prompt["French"])
        response = clarification_prompt("Spanish")
        self.assertEqual(response, prompt["Spanish"])
        response = clarification_prompt("Italian")
        self.assertEqual(response, prompt["Italian"])
        response = clarification_prompt("German")
        self.assertEqual(response, prompt["German"])

        self.assertRaises(KeyError, clarification_prompt, "invalidLanguage")

    def test_slot_message(self):
        slot_message_value = {
            "English": {
                "city": {"value": "Which city?"},
            },
            "French": {
                "city": {"value": "De quelle ville?"},
            },
            "Italian": {
                "city": {"value": "Quale città?"},
            },
            "Spanish": {
                "city": {"value": "Cual ciudad?"},
            },
            "German": {
                "city": {"value": "Welche Stadt?"},
            },
        }
        response = slot_message("English", "city")
        self.assertEqual(response, slot_message_value["English"]["city"])
        response = slot_message("French", "city")
        self.assertEqual(response, slot_message_value["French"]["city"])
        response = slot_message("Spanish", "city")
        self.assertEqual(response, slot_message_value["Spanish"]["city"])
        response = slot_message("Italian", "city")
        self.assertEqual(response, slot_message_value["Italian"]["city"])
        response = slot_message("German", "city")
        self.assertEqual(response, slot_message_value["German"]["city"])
        self.assertRaises(KeyError, slot_message, "invalidLanguage", "city")
        self.assertRaises(KeyError, slot_message, "English", "invalidSlotType")