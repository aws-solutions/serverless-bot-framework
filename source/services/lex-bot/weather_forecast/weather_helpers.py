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


def utterances(language):
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
        "Japanese": [
            {"utterance": "天気予報は？"},
            {"utterance": "天気予報"},
            {"utterance": "天気はどうですか"},
        ],
    }
    return utterance_values[language]


def clarification_prompt(language):
    prompt = {
        "English": "I didn't understand you, what would you like me to do?",
        "French": "Je n'ai pas bien compris votre demande, que puis-je faire pour vous?",
        "Italian": "Non ho capito, cosa preferisci che faccia?",
        "Spanish": "No lo entendí, ¿qué le gustaría que haga?",
        "German": "Ich habe Sie nicht verstanden. Bitte sagen Sie mir, was ich für Sie tun soll.",
        "Japanese": "申し訳ありません、内容を理解できませんでした。何をお手伝いできますでしょうか？",
    }
    return prompt[language]


def slot_message(language, slot_type):
    slot_message_values = {
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
        "Japanese": {
            "city": {"value": "どちらにお住まいですか？"},
        },
    }
    return slot_message_values[language][slot_type]
