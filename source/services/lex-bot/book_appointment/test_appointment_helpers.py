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
from book_appointment.appointment_helpers import (
    slot_types,
    utterances,
    clarification_prompt,
    confirmation_prompt,
    decline_reponse,
    closing_response,
    slot_message,
)


class BookAppointmentHelpersTest(TestCase):
    def test_slot_types(self):
        slot_type_values = {
            "English": [
                {"sampleValue": {"value": "cleaning"}},
                {"sampleValue": {"value": "root canal"}},
                {"sampleValue": {"value": "whitening"}},
            ],
            "French": [
                {"sampleValue": {"value": "nettoyage"}},
                {"sampleValue": {"value": "traitement du canal radiculaire"}},
                {"sampleValue": {"value": "blanchiment"}},
            ],
            "Italian": [
                {"sampleValue": {"value": "pulizia"}},
                {"sampleValue": {"value": "devitalizzazione"}},
                {"sampleValue": {"value": "blanchiment"}},
            ],
            "Spanish": [
                {"sampleValue": {"value": "limpieza"}},
                {"sampleValue": {"value": "endodoncia"}},
                {"sampleValue": {"value": "blanqueamiento"}},
            ],
            "German": [
                {"sampleValue": {"value": "Reinigung"}},
                {"sampleValue": {"value": "Wurzelbehandlung"}},
                {"sampleValue": {"value": "Weißen"}},
            ],
        }
        response = slot_types("English")
        self.assertEqual(response, slot_type_values["English"])
        response = slot_types("French")
        self.assertEqual(response, slot_type_values["French"])
        response = slot_types("Spanish")
        self.assertEqual(response, slot_type_values["Spanish"])
        response = slot_types("Italian")
        self.assertEqual(response, slot_type_values["Italian"])
        response = slot_types("German")
        self.assertEqual(response, slot_type_values["German"])

        self.assertRaises(KeyError, slot_types, "invalidLanguage")

    def test_utterances(self):
        utterance_values = {
            "English": [
                {"utterance": "I would like to book an appointment"},
                {"utterance": "Book an appointment"},
                {"utterance": "Book a {AppointmentType}"},
            ],
            "French": [
                {"utterance": "Je souhaiterais prendre rendez-vous"},
                {"utterance": "Prendre rendez-vous"},
                {"utterance": "Réserver un {AppointmentType}"},
            ],
            "Italian": [
                {"utterance": "Vorrei fissare un appuntamento"},
                {"utterance": "Fissa un appuntamento"},
                {"utterance": "Prenota un'operazione di {AppointmentType}"},
            ],
            "Spanish": [
                {"utterance": "Querría pedir una cita"},
                {"utterance": "Reservar una cita"},
                {"utterance": "Pedir cita para {AppointmentType}"},
            ],
            "German": [
                {"utterance": "Ich möchte einen Termin buchen."},
                {"utterance": "Einen Termin buchen"},
                {"utterance": "Einen Termin des Typs {AppointmentType} buchen"},
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

    def test_confirmation_prompt(self):
        confirmation_prompt_value = {
            "English": {"value": "{Time} is available, should I go ahead and book your appointment?"},
            "French": {"value": "Je peux prendre rendez-vous à {Time}, est-ce que je peux confirmer cette horaire ?"},
            "Italian": {"value": "L'orario {Time} è disponibile. Procedo con la prenotazione dell'appuntamento?"},
            "Spanish": {"value": "A las {Time} están libres, ¿quieres que pida la cita para esa hora?"},
            "German": {"value": "{Time} ist verfügbar. Soll ich den Termin für Sie buchen?"},
        }
        response = confirmation_prompt("English")
        self.assertEqual(response, confirmation_prompt_value["English"])
        response = confirmation_prompt("French")
        self.assertEqual(response, confirmation_prompt_value["French"])
        response = confirmation_prompt("Spanish")
        self.assertEqual(response, confirmation_prompt_value["Spanish"])
        response = confirmation_prompt("Italian")
        self.assertEqual(response, confirmation_prompt_value["Italian"])
        response = confirmation_prompt("German")
        self.assertEqual(response, confirmation_prompt_value["German"])

        self.assertRaises(KeyError, confirmation_prompt, "invalidLanguage")

    def test_decline_reponse(self):
        decline_response_value = {
            "English": {"value": "Okay, I will not schedule an appointment."},
            "French": {"value": "D'accord, je ne confirmerai pas ce rendez-vous."},
            "Italian": {"value": "OK. Non programmerò un appuntamento."},
            "Spanish": {"value": "Vale, no pediré la cita."},
            "German": {"value": "OK, ich werde keinen Termin planen."},
        }
        response = decline_reponse("English")
        self.assertEqual(response, decline_response_value["English"])
        response = decline_reponse("French")
        self.assertEqual(response, decline_response_value["French"])
        response = decline_reponse("Spanish")
        self.assertEqual(response, decline_response_value["Spanish"])
        response = decline_reponse("Italian")
        self.assertEqual(response, decline_response_value["Italian"])
        response = decline_reponse("German")
        self.assertEqual(response, decline_response_value["German"])

        self.assertRaises(KeyError, decline_reponse, "invalidLanguage")

    def test_closing_response(self):
        closing_response_value = {
            "English": {"value": "Done."},
            "French": {"value": "Fini."},
            "Italian": {"value": "Finito."},
            "Spanish": {"value": "Terminado."},
            "German": {"value": "Fertig."},
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

    def test_slot_message(self):
        slot_message_value = {
            "English": {
                "appointmentType": {"value": "What type of appointment would you like to schedule?"},
                "date": {"value": "When should I schedule your appointment?"},
                "time": {"value": "At what time should I schedule your appointment?"},
            },
            "French": {
                "appointmentType": {"value": "Quel type de rendez-vous souhaitez-vous prendre ?"},
                "date": {"value": "Quand souhaitez-vous prendre rendez-vous ?"},
                "time": {"value": "À quelle heure souhaitez-vous prendre rendez-vous ?"},
            },
            "Italian": {
                "appointmentType": {"value": "Quale tipo di appuntamento vorresti programmare?"},
                "date": {"value": "Quando devo programmare il tuo appuntamento?"},
                "time": {"value": "A che ora devo programmare il tuo appuntamento?"},
            },
            "Spanish": {
                "appointmentType": {"value": "¿Qué tipo de cita quieres pedir?"},
                "date": {"value": "¿Para cuándo quieres la cita?"},
                "time": {"value": "¿Para qué hora te pido la cita?"},
            },
            "German": {
                "appointmentType": {"value": "Welchen Typ von Termin möchten Sie planen?"},
                "date": {"value": "Für welches Datum soll ich den Termin planen?"},
                "time": {"value": "Für welche Uhrzeit soll ich den Termin planen?"},
            },
        }
        response = slot_message("English", "appointmentType")
        self.assertEqual(response, slot_message_value["English"]["appointmentType"])
        response = slot_message("English", "date")
        self.assertEqual(response, slot_message_value["English"]["date"])
        response = slot_message("English", "time")
        self.assertEqual(response, slot_message_value["English"]["time"])

        response = slot_message("French", "appointmentType")
        self.assertEqual(response, slot_message_value["French"]["appointmentType"])
        response = slot_message("French", "date")
        self.assertEqual(response, slot_message_value["French"]["date"])
        response = slot_message("French", "time")
        self.assertEqual(response, slot_message_value["French"]["time"])

        response = slot_message("Spanish", "appointmentType")
        self.assertEqual(response, slot_message_value["Spanish"]["appointmentType"])
        response = slot_message("Spanish", "date")
        self.assertEqual(response, slot_message_value["Spanish"]["date"])
        response = slot_message("Spanish", "time")
        self.assertEqual(response, slot_message_value["Spanish"]["time"])

        response = slot_message("Italian", "appointmentType")
        self.assertEqual(response, slot_message_value["Italian"]["appointmentType"])
        response = slot_message("Italian", "date")
        self.assertEqual(response, slot_message_value["Italian"]["date"])
        response = slot_message("Italian", "time")
        self.assertEqual(response, slot_message_value["Italian"]["time"])

        response = slot_message("German", "appointmentType")
        self.assertEqual(response, slot_message_value["German"]["appointmentType"])
        response = slot_message("German", "date")
        self.assertEqual(response, slot_message_value["German"]["date"])
        response = slot_message("German", "time")
        self.assertEqual(response, slot_message_value["German"]["time"])

        self.assertRaises(KeyError, slot_message, "invalidLanguage", "time")
        self.assertRaises(KeyError, slot_message, "English", "invalidSlotType")
