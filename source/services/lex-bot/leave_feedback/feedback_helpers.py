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
def feedback_utterances(language):
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
        "Japanese": [
            {"utterance": "フィードバックする"},
            {"utterance": "フィードバックをしたい"},
            {"utterance": "フィードバックコメントをする"},
            {"utterance": "フィードバック"},
        ],
    }
    return utterance_values[language]


def feedback_slot_messages(language, slot_type):
    slot_message_values = {
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
        "Japanese": {
            "firstName": {
                "value": "こんにちは、これは1つ目のインタラクションです。下の名前を教えてください。"
            },
            "lastName": {
                "value": "{firstName}さん、これは2つ目のインタラクションです。苗字を教えてください。"
            },
            "feedback": {
                "value": "{lastName} {firstName} さん、これは3つ目のインタラクションです。フィードバックを教えてください。"
            },
        },
    }
    return slot_message_values[language][slot_type]


def closing_response(language):
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
        "Japanese": {
            "value": "ありがとうございます！これは4つ目のインタラクションです。会話はこれで終了です。"
        },
    }
    return closing_response_value[language]
