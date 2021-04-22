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
from shared.helpers import detect_locale
from weather_forecast.weather_helpers import (
    clarification_prompt,
    utterances,
    slot_message,
)

logger = get_logger(__name__)
client = get_client("lexv2-models")


def create_intent(bot_language, bot_id, locale_id):
    intent_response = client.create_intent(
        intentName="WeatherForecast",
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    logger.debug(intent_response)
    return intent_response["intentId"]


def create_city_slot(
    slot_type_id, message_id, bot_language, bot_id, locale_id, intent_id
):
    slot_response = client.create_slot(
        slotName="City",
        description="City information.",
        slotTypeId=slot_type_id,
        valueElicitationSetting={
            "slotConstraint": "Required",
            "promptSpecification": {
                "messageGroups": [
                    {
                        "message": {
                            "plainTextMessage": slot_message(bot_language, message_id)
                        }
                    },
                ],
                "maxRetries": 5,
                "allowInterrupt": True,
            },
        },
        obfuscationSetting={"obfuscationSettingType": "None"},
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
        intentId=intent_id,
    )
    logger.debug(slot_response)
    return slot_response["slotId"]


def update_weather_intent(bot_language, intent_id, city_slot_id, bot_id, locale_id):
    response = client.update_intent(
        intentId=intent_id,
        intentName="WeatherForecast",
        description="WeatherForecast intent created by serverless bot.",
        sampleUtterances=utterances(bot_language),
        dialogCodeHook={"enabled": False},
        fulfillmentCodeHook={"enabled": True},
        slotPriorities=[
            {
                "priority": 1,
                "slotId": city_slot_id,
            }
        ],
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    logger.debug(response)


def create_weather_intent(bot_id, locale_id):
    bot_language = os.environ.get("botLanguage")
    # create intent
    intent_id = create_intent(bot_language, bot_id, locale_id)
    # create slot
    city_slot_id = create_city_slot("AMAZON.City", "city", bot_language, bot_id, locale_id, intent_id)
    # update the intent for prioritizing slots in the intent
    update_weather_intent(bot_language, intent_id, city_slot_id, bot_id, locale_id)
