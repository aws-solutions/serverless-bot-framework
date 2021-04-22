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
from leave_feedback.feedback_helpers import (
    feedback_utterances,
    feedback_slot_messages,
    closing_response,
)


class BookAppointmentHelpersTest(TestCase):

    def test_feedback_utterances(self):
        utterance_values = {
            "English": [
                {"utterance": "leave feedback"},
                {"utterance": "I want to leave feedback"},
                {"utterance": "leave a feedback message"},
                {"utterance": "feedback"},
            ],
            "French": [
                {"utterance": "laisser les commentaires"},
                {"utterance": "laisser un commentaires"},
                {"utterance": "Je veux laisser un commentaire"},
                {"utterance": "retour d'information"},
            ],
            "Italian": [
                {"utterance": "lasciare un feedback"},
                {"utterance": "Voglio lasciare un feedback"},
                {"utterance": "risposta"},
            ],
            "Spanish": [
                {"utterance": "dejar un comentario"},
                {"utterance": "Quiero dejar un comentario"},
                {"utterance": "Yo quiero dejar un comentario"},
                {"utterance": "realimentación"},
            ],
            "German": [
                {"utterance": "Hinterlasse ein Feedback"},
                {"utterance": "Ich möchte ein Feedback hinterlassen"},
                {"utterance": "Feedback"},
            ],
        }
        response = feedback_utterances("English")
        self.assertEqual(response, utterance_values["English"])
        response = feedback_utterances("French")
        self.assertEqual(response, utterance_values["French"])
        response = feedback_utterances("Spanish")
        self.assertEqual(response, utterance_values["Spanish"])
        response = feedback_utterances("Italian")
        self.assertEqual(response, utterance_values["Italian"])
        response = feedback_utterances("German")
        self.assertEqual(response, utterance_values["German"])

        self.assertRaises(KeyError, feedback_utterances, "invalidLanguage")

    def test_slot_message(self):
        slot_message_value = {
        "English": {
            "firstName": {
                "value": "Hello, this is the interaction 1. What's your name?"
            },
            "lastName": {
                "value": "{firstName}, this is the interaction 2. What is your last name?"
            },
            "feedback": {
                "value": "{firstName} {lastName}, this is the interaction 3. What is your feedback?"
            },
        },
        "French": {
            "firstName": {
                "value": "Bonjour, ceci est l'interaction 1. Quel est votre nom?"
            },
            "lastName": {
                "value": "{firstName} c'est l'interaction 2. Quel est votre nom?"
            },
            "feedback": {
                "value": "{firstName} {lastName} c'est l'interaction 3. Quel est votre avis?"
            },
        },
        "Italian": {
            "firstName": {
                "value": "Ciao, questo è l'interazione 1. Qual è il tuo nome?"
            },
            "lastName": {
                "value": "{firstName} questo è l'interazione 2. Qual è il tuo cognome?"
            },
            "feedback": {
                "value": "{firstName} {lastName} questo è l'interazione 3. Qual è il tuo feedback?"
            },
        },
        "Spanish": {
            "firstName": {
                "value": "Hola, esta es la interacción 1. ¿Cuál es su nombre?"
            },
            "lastName": {
                "value": "{firstName}, esta es la interacción 2. ¿Cuál es su Apellido?"
            },
            "feedback": {
                "value": "{firstName} {lastName}, esta es la interacción 3. ¿Cuál es tu opinión?"
            },
        },
        "German": {
            "firstName": {
                "value": "Hallo, dies ist die Interaktion 1. Was ist Ihr Name?"
            },
            "lastName": {
                "value": "{firstName} dies ist die Interaktion 2. Was ist Ihr Nachname?"
            },
            "feedback": {
                "value": "{firstName} {lastName} dies ist die Interaktion 3. Was ist Ihr Feedback?"
            },
        },
    }
        response = feedback_slot_messages("English", "firstName")
        self.assertEqual(response, slot_message_value["English"]["firstName"])
        response = feedback_slot_messages("English", "lastName")
        self.assertEqual(response, slot_message_value["English"]["lastName"])
        response = feedback_slot_messages("English", "feedback")
        self.assertEqual(response, slot_message_value["English"]["feedback"])

        response = feedback_slot_messages("French", "firstName")
        self.assertEqual(response, slot_message_value["French"]["firstName"])
        response = feedback_slot_messages("French", "lastName")
        self.assertEqual(response, slot_message_value["French"]["lastName"])
        response = feedback_slot_messages("French", "feedback")
        self.assertEqual(response, slot_message_value["French"]["feedback"])

        response = feedback_slot_messages("Spanish", "firstName")
        self.assertEqual(response, slot_message_value["Spanish"]["firstName"])
        response = feedback_slot_messages("Spanish", "lastName")
        self.assertEqual(response, slot_message_value["Spanish"]["lastName"])
        response = feedback_slot_messages("Spanish", "feedback")
        self.assertEqual(response, slot_message_value["Spanish"]["feedback"])

        response = feedback_slot_messages("Italian", "firstName")
        self.assertEqual(response, slot_message_value["Italian"]["firstName"])
        response = feedback_slot_messages("Italian", "lastName")
        self.assertEqual(response, slot_message_value["Italian"]["lastName"])
        response = feedback_slot_messages("Italian", "feedback")
        self.assertEqual(response, slot_message_value["Italian"]["feedback"])

        response = feedback_slot_messages("German", "firstName")
        self.assertEqual(response, slot_message_value["German"]["firstName"])
        response = feedback_slot_messages("German", "lastName")
        self.assertEqual(response, slot_message_value["German"]["lastName"])
        response = feedback_slot_messages("German", "feedback")
        self.assertEqual(response, slot_message_value["German"]["feedback"])

        self.assertRaises(KeyError, feedback_slot_messages, "invalidLanguage", "feedback")
        self.assertRaises(KeyError, feedback_slot_messages, "English", "invalidSlotType")

    def test_closing_response(self):
        closing_response_value = {
            "English": {
                "value": "Success! This is interaction 4, the conversation ends here."
            },
            "French": {
                "value": "Succès! Ceci est l'interaction 4, la conversation se termine ici."
            },
            "Italian": {
                "value": "Successo! Questo è l'interazione 4, la conversazione finisce qui."
            },
            "Spanish": {
                "value": "Éxito! Esta es la interacción 4, la conversación se encierra aquí."
            },
            "German": {
                "value": "Erfolg! Dies ist die Interaktion 4, endet das Gespräch hier."
            },
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