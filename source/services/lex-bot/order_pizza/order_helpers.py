######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the 'License'). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
def order_utterances(language):
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
        "Japanese": [
            {"utterance": "ピザを注文したいです"},
            {"utterance": "ピザを注文する"},
            {"utterance": "ピザの注文"},
            {"utterance": "ピザ"},
        ],
    }
    return utterance_values[language]


def slot_types(slot_type_name, language):
    slot_type_values = {
        "PizzaType": {
            "English": [
                {"sampleValue": {"value": "Greek"}},
                {"sampleValue": {"value": "New York"}}, # NOSONAR this is a language specific word
                {"sampleValue": {"value": "Vegetarian"}},
            ],
            "French": [
                {"sampleValue": {"value": "Grecque"}},
                {"sampleValue": {"value": "New York"}}, # NOSONAR this is a language specific word
                {"sampleValue": {"value": "végétarienne"}},
            ],
            "Italian": [
                {"sampleValue": {"value": "Greca"}},
                {"sampleValue": {"value": "New York"}}, # NOSONAR this is a language specific word
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
            "Japanese": [
                {"sampleValue": {"value": "ギリシャピザ"}},
                {"sampleValue": {"value": "ニューヨークピザ"}},
                {"sampleValue": {"value": "ベジタリアンピザ"}},
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
            "Japanese": [
                {"sampleValue": {"value": "S"}},
                {"sampleValue": {"value": "M"}},
                {"sampleValue": {"value": "L"}},
                {"sampleValue": {"value": "XL"}},
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
            "Japanese": [
                {"sampleValue": {"value": "ハンドトス"}},
                {"sampleValue": {"value": "クリスピー"}},
            ],
        },
    }
    return slot_type_values[slot_type_name][language]


def slot_messages(language, slot_type_name):
    slot_message_values = {
        "type": {
            "English": {"value": "What type of pizza would you like?"},
            "French": {"value": "Quel type de pizza souhaitez-vous?"},
            "Italian": {"value": "Che tipo di pizze vorresti?"},
            "Spanish": {"value": "Que tipo de pizza te gustaria?"},
            "German": {"value": "Welche Art von Pizze möchten Sie?"},
            "Japanese": {"value": "どのピザを注文されますか？"},
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
            "Japanese": {
                "value": "どのサイズ（S、M、L、XL）を注文されますか？"
            },
        },
        "crust": {
            "English": {"value": "What crust would you like, (thin or thick)?"},
            "French": {"value": "Quelle croûte aimeriez-vous (mince ou épaisse)?"},
            "Italian": {"value": "Quale crosta vorresti, (sottile o spessa)?"},
            "Spanish": {"value": "¿Qué corteza te gustaría, (fina o gruesa)?"},
            "German": {"value": "Welche Kruste möchten Sie (dünn oder dick)?"},
            "Japanese": {"value": "どの生地（ハンドトス、クリスピー）を注文されますか？"},
        },
        "count": {
            "English": {"value": "How many pizzas would you like?"},
            "French": {"value": "Combien de pizzas souhaitez-vous?"},
            "Italian": {"value": "Quante pizze vorresti?"},
            "Spanish": {"value": "¿Cuántas pizzas te gustaría?"},
            "German": {"value": "Wie viele Pizzen möchten Sie?"},
            "Japanese": {"value": "いくつ注文されますか？"},
        },
    }
    return slot_message_values[slot_type_name][language]
