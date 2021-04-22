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
from order_pizza.order_helpers import (
    order_utterances,
    slot_types,
    slot_messages,
)

class TestOrderPizzaHelpers(TestCase):

    def test_order_utterances(self):
        utterance_values = {
            "English": [
                {"utterance": "I would like tp order pizza"},
                {"utterance": "order pizza"},
                {"utterance": "pizza ordering"},
                {"utterance": "pizza"},
            ],
            "French": [
                {"utterance": "Je voudrais commander une pizza"},
                {"utterance": "commander une pizza"},
                {"utterance": "commande de pizza"},
                {"utterance": "je veux de la pizza"},
                {"utterance": "pizza"},
            ],
            "Italian": [
                {"utterance": "Vorrei ordinare una pizza"},
                {"utterance": "ordina la pizza"},
                {"utterance": "ordinare la pizza"},
                {"utterance": "Voglio la pizza"},
                {"utterance": "pizza"},
            ],
            "Spanish": [
                {"utterance": "Me gustaría pedir pizza"},
                {"utterance": "order pizza"},
                {"utterance": "pedir pizza"},
                {"utterance": "Quiero pizza"},
                {"utterance": "pizza"},
            ],
            "German": [
                {"utterance": "Ich möchte Pizza bestellen"},
                {"utterance": "Pizza bestellen"},
                {"utterance": "Ich will Pizza"},
                {"utterance": "pizza"},
            ],
        }
        response = order_utterances("English")
        self.assertEqual(response, utterance_values["English"])
        response = order_utterances("French")
        self.assertEqual(response, utterance_values["French"])
        response = order_utterances("Spanish")
        self.assertEqual(response, utterance_values["Spanish"])
        response = order_utterances("Italian")
        self.assertEqual(response, utterance_values["Italian"])
        response = order_utterances("German")
        self.assertEqual(response, utterance_values["German"])

        self.assertRaises(KeyError, order_utterances, "invalidLanguage")

    def test_slot_types(self):
        slot_type_value = {
            "PizzaType": {
                "English": [
                    {"sampleValue": {"value": "Greek"}},
                    {"sampleValue": {"value": "New York"}},
                    {"sampleValue": {"value": "Vegetarian"}},
                ],
                "French": [
                    {"sampleValue": {"value": "Grecque"}},
                    {"sampleValue": {"value": "New York"}},
                    {"sampleValue": {"value": "végétarienne"}},
                ],
                "Italian": [
                    {"sampleValue": {"value": "Greca"}},
                    {"sampleValue": {"value": "New York"}},
                    {"sampleValue": {"value": "vegetariana"}},
                ],
                "Spanish": [
                    {"sampleValue": {"value": "Griega"}},
                    {"sampleValue": {"value": "Nueva York"}},
                    {"sampleValue": {"value": "vegetariana"}},
                ],
                "German": [
                    {"sampleValue": {"value": "Griechische"}},
                    {"sampleValue": {"value": "New Yorker"}},
                    {"sampleValue": {"value": "Vegetarische"}},
                ],
            },
            "PizzaSize": {
                "English": [
                    {"sampleValue": {"value": "small"}},
                    {"sampleValue": {"value": "medium"}},
                    {"sampleValue": {"value": "large"}},
                    {"sampleValue": {"value": "extra-large"}},
                ],
                "French": [
                    {"sampleValue": {"value": "petit"}},
                    {"sampleValue": {"value": "moyen"}},
                    {"sampleValue": {"value": "grand"}},
                    {"sampleValue": {"value": "très-grand"}},
                ],
                "Italian": [
                    {"sampleValue": {"value": "piccola"}},
                    {"sampleValue": {"value": "media"}},
                    {"sampleValue": {"value": "grande"}},
                    {"sampleValue": {"value": "extra-grande"}},
                ],
                "Spanish": [
                    {"sampleValue": {"value": "pequeño"}},
                    {"sampleValue": {"value": "mediano"}},
                    {"sampleValue": {"value": "grande"}},
                    {"sampleValue": {"value": "extra-grande"}},
                ],
                "German": [
                    {"sampleValue": {"value": "klein"}},
                    {"sampleValue": {"value": "mittel"}},
                    {"sampleValue": {"value": "groß"}},
                    {"sampleValue": {"value": "extra-groß"}},
                ],
            },
            "PizzaCrust": {
                "English": [
                    {"sampleValue": {"value": "thin"}},
                    {"sampleValue": {"value": "thick"}},
                ],
                "French": [
                    {"sampleValue": {"value": "mince"}},
                    {"sampleValue": {"value": "épaisse"}},
                ],
                "Italian": [
                    {"sampleValue": {"value": "sottile"}},
                    {"sampleValue": {"value": "spessa"}},
                ],
                "Spanish": [
                    {"sampleValue": {"value": "fina"}},
                    {"sampleValue": {"value": "gruesa"}},
                ],
                "German": [
                    {"sampleValue": {"value": "dünn"}},
                    {"sampleValue": {"value": "dick"}},
                ],
            },
        }
        response = slot_types("PizzaType", "English")
        self.assertEqual(response, slot_type_value["PizzaType"]["English"])
        response = slot_types("PizzaSize", "English")
        self.assertEqual(response, slot_type_value["PizzaSize"]["English"])
        response = slot_types("PizzaCrust", "English")
        self.assertEqual(response, slot_type_value["PizzaCrust"]["English"])

        response = slot_types("PizzaType", "French")
        self.assertEqual(response, slot_type_value["PizzaType"]["French"])
        response = slot_types("PizzaSize", "French")
        self.assertEqual(response, slot_type_value["PizzaSize"]["French"])
        response = slot_types("PizzaCrust", "French")
        self.assertEqual(response, slot_type_value["PizzaCrust"]["French"])

        response = slot_types("PizzaType", "Spanish")
        self.assertEqual(response, slot_type_value["PizzaType"]["Spanish"])
        response = slot_types("PizzaSize", "Spanish")
        self.assertEqual(response, slot_type_value["PizzaSize"]["Spanish"])
        response = slot_types("PizzaCrust", "Spanish")
        self.assertEqual(response, slot_type_value["PizzaCrust"]["Spanish"])

        response = slot_types("PizzaType", "Italian")
        self.assertEqual(response, slot_type_value["PizzaType"]["Italian"])
        response = slot_types("PizzaSize", "Italian")
        self.assertEqual(response, slot_type_value["PizzaSize"]["Italian"])
        response = slot_types("PizzaCrust", "Italian")
        self.assertEqual(response, slot_type_value["PizzaCrust"]["Italian"])

        response = slot_types("PizzaType", "German")
        self.assertEqual(response, slot_type_value["PizzaType"]["German"])
        response = slot_types("PizzaSize", "German")
        self.assertEqual(response, slot_type_value["PizzaSize"]["German"])
        response = slot_types("PizzaCrust", "German")
        self.assertEqual(response, slot_type_value["PizzaCrust"]["German"])

        self.assertRaises(KeyError, slot_types, "invalidSlotType", "English")
        self.assertRaises(KeyError, slot_types, "PizzaSize", "invalidLanguage")

    def test_slot_messages(self):
        slot_message_value = {
            "type": {
                "English": {"value": "What type of pizza would you like?"},
                "French": {"value": "Quel type de pizza souhaitez-vous?"},
                "Italian": {"value": "Che tipo di pizze vorresti?"},
                "Spanish": {"value": "Que tipo de pizza te gustaria?"},
                "German": {"value": "Welche Art von Pizze möchten Sie?"},
            },
            "size": {
                "English": {
                    "value": "What size would you like, (small, medium, large, or extra-large)?"
                },
                "French": {
                    "value": "Quelle taille aimeriez-vous (petit, moyen, grand, ou très-grand)?"
                },
                "Italian": {
                    "value": "Che taglia vorresti, (piccola, media, grande o extra-grande)?"
                },
                "Spanish": {
                    "value": "¿Qué tamaño le gustaría (pequeño, mediano, grande o extra-grande)?"
                },
                "German": {
                    "value": "Welche Größe möchten Sie (klein, mittel, groß oder extra-groß)?"
                },
            },
            "crust": {
                "English": {"value": "What crust would you like, (thin or thick)?"},
                "French": {"value": "Quelle croûte aimeriez-vous (mince ou épaisse)?"},
                "Italian": {"value": "Quale crosta vorresti, (sottile o spessa)?"},
                "Spanish": {"value": "¿Qué corteza te gustaría, (fina o gruesa)?"},
                "German": {"value": "Welche Kruste möchten Sie (dünn oder dick)?"},
            },
            "count": {
                "English": {"value": "How many pizzas would you like?"},
                "French": {"value": "Combien de pizzas souhaitez-vous?"},
                "Italian": {"value": "Quante pizze vorresti?"},
                "Spanish": {"value": "¿Cuántas pizzas te gustaría?"},
                "German": {"value": "Wie viele Pizzen möchten Sie?"},
            },
        }
        response = slot_messages("English", "type")
        self.assertEqual(response, slot_message_value["type"]["English"])
        response = slot_messages("English", "size")
        self.assertEqual(response, slot_message_value["size"]["English"])
        response = slot_messages("English", "crust")
        self.assertEqual(response, slot_message_value["crust"]["English"])
        response = slot_messages("English", "count")
        self.assertEqual(response, slot_message_value["count"]["English"])

        response = slot_messages("French", "type")
        self.assertEqual(response, slot_message_value["type"]["French"])
        response = slot_messages("French", "size")
        self.assertEqual(response, slot_message_value["size"]["French"])
        response = slot_messages("French", "crust")
        self.assertEqual(response, slot_message_value["crust"]["French"])
        response = slot_messages("French", "count")
        self.assertEqual(response, slot_message_value["count"]["French"])

        response = slot_messages("Spanish", "type")
        self.assertEqual(response, slot_message_value["type"]["Spanish"])
        response = slot_messages("Spanish", "size")
        self.assertEqual(response, slot_message_value["size"]["Spanish"])
        response = slot_messages("Spanish", "crust")
        self.assertEqual(response, slot_message_value["crust"]["Spanish"])
        response = slot_messages("Spanish", "count")
        self.assertEqual(response, slot_message_value["count"]["Spanish"])

        response = slot_messages("Italian", "type")
        self.assertEqual(response, slot_message_value["type"]["Italian"])
        response = slot_messages("Italian", "size")
        self.assertEqual(response, slot_message_value["size"]["Italian"])
        response = slot_messages("Italian", "crust")
        self.assertEqual(response, slot_message_value["crust"]["Italian"])
        response = slot_messages("Italian", "count")
        self.assertEqual(response, slot_message_value["count"]["Italian"])

        response = slot_messages("German", "type")
        self.assertEqual(response, slot_message_value["type"]["German"])
        response = slot_messages("German", "size")
        self.assertEqual(response, slot_message_value["size"]["German"])
        response = slot_messages("German", "crust")
        self.assertEqual(response, slot_message_value["crust"]["German"])
        response = slot_messages("German", "count")
        self.assertEqual(response, slot_message_value["count"]["German"])

        self.assertRaises(KeyError, slot_messages, "English", "invalidSlotType")
        self.assertRaises(KeyError, slot_messages, "invalidLanguage", "size")