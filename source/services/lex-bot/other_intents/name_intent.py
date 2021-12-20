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
    bot_name = os.environ.get("botName")
    closing_response_value = {
        "English": {"value": f"My name is {bot_name}, how can I help you?"},
        "French": {"value": f"Mon nom est {bot_name}, comment puis-je vous aider?"},
        "Italian": {"value": f"Mi chiamo {bot_name}, come posso aiutarti?"},
        "Spanish": {"value": f"Mi nombre es {bot_name}, en qué puedo ayudarte?"},
        "German": {"value": f"Mein Name ist {bot_name}, wie kann ich Ihnen helfen?"},
        "Japanese": {"value": f"私は{bot_name}です。どんな御用でしょうか"},
    }
    return closing_response_value[language]

def utterances(language):
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
        "Japanese": [
            {"utterance": "名前"},
            {"utterance": "名前はなんですか"},
            {"utterance": "あなたのことを教えて"},
        ],
    }
    return utterance_values[language]

def create_name_intent(bot_id, locale_id):
    bot_language = os.environ.get("botLanguage")
    intent_response = client.create_intent(
        intentName="Name",
        description="Name intent created by serverless bot.",
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

