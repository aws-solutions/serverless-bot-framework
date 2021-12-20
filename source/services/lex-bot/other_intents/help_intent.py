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
from shared.client import get_client
from shared.logger import get_logger

client = get_client("lexv2-models")
logger = get_logger(__name__)


def closing_response(language):
    closing_response_value = {
        "English": {"value": "Try 'What is your name', 'Weather Forecast', 'Leave Feedback', 'Order Pizza', or 'Book Appointment'"},
        "French": {"value": "Essayez 'Quel est votre nom', 'Prévisions météo', 'Laisser les commentaires', 'Commander une pizza', ou 'Prendre rendez-vous'."},
        "Italian": {"value": "Provare 'Qual è il tuo nome', 'Previsione del moto', 'lasciare un feedback', 'Ordina la pizza', o 'Fissa un appuntamento'."},
        "Spanish": {"value": "Intentar 'Cual es tu nombre', 'Como esta el clima', 'Dejar un comentario', 'Quiero pizza', o 'Reservar una cita'."},
        "German": {"value": "Versuchen 'Wie heißen Sie', 'Wettervorhersage', 'Hinterlasse ein Feedback', 'Pizza bestellen' oder, 'Einen Termin buchen'."},
        "Japanese": {"value": "次のいずれかを試してみてください：「名前はなんですか」「天気予報」「フィードバックする」「ピザを注文する」「予約をする」"},
    }
    return closing_response_value[language]

def utterances(language):
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
        "Japanese": [
            {"utterance": "help"},
            {"utterance": "助けて"},
            {"utterance": "何ができますか"},
            {"utterance": "教えて"},
        ],
    }
    return utterance_values[language]

def create_help_intent(bot_id, locale_id):
    bot_language = os.environ.get("botLanguage")
    intent_response = client.create_intent(
        intentName="Help",
        description="Help intent created by serverless bot.",
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
        sampleUtterances=utterances(bot_language),
        dialogCodeHook={"enabled": False},
        fulfillmentCodeHook={"enabled": False},
        intentClosingSetting={
            "closingResponse": {
                "messageGroups": [
                    {"message": {"plainTextMessage": closing_response(bot_language)}},
                ],
                "allowInterrupt": True,
            }
        },
    )
    logger.info(intent_response)

