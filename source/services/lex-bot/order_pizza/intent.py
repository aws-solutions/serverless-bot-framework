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
from order_pizza.order_helpers import slot_types, slot_messages, order_utterances

client = get_client("lexv2-models")
logger = get_logger(__name__)


def create_intent(bot_id, locale_id):
    intent_response = client.create_intent(
        intentName="PizzaOrder", botId=bot_id, botVersion="DRAFT", localeId=locale_id
    )
    return intent_response


def create_pizza_slot_type(slot_type_name, bot_language, bot_id, locale_id):
    slot_type_description = {
        "PizzaType": "Type of pizza. Possible values are: [Greek, New York, Vegetarian]",
        "PizzaSize": "Size of pizza. Possible values are: [small, medium, large, extra-large]",
        "PizzaCrust": "Crust of the pizza. Possible values are: [thin, thick]",
    }
    slot_type_response = client.create_slot_type(
        slotTypeName=slot_type_name,
        description=slot_type_description[slot_type_name],
        slotTypeValues=slot_types(slot_type_name, bot_language),
        valueSelectionSetting={"resolutionStrategy": "TopResolution"},
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    return slot_type_response["slotTypeId"]


def create_slot(slot_name, slot_type_id, bot_id, locale_id, intent_id):
    bot_language = os.environ.get("botLanguage")
    slot_response = client.create_slot(
        slotName=slot_name,
        description=f"{slot_name} information.",
        slotTypeId=slot_type_id,
        valueElicitationSetting={
            "slotConstraint": "Required",
            "promptSpecification": {
                "messageGroups": [
                    {
                        "message": {
                            "plainTextMessage": slot_messages(bot_language, slot_name)
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
    logger.info(slot_response)
    return slot_response["slotId"]


def update_order_intent(intent_id, bot_id, locale_id, slot_ids):
    bot_language = os.environ.get("botLanguage")
    response = client.update_intent(
        intentId=intent_id,
        intentName="PizzaOrder",
        description="PizzaOrder intent created by serverless bot.",
        sampleUtterances=order_utterances(bot_language),
        dialogCodeHook={"enabled": True},
        fulfillmentCodeHook={"enabled": True},
        intentConfirmationSetting={
            "promptSpecification": {
                "messageGroups": [
                    {"message": {"plainTextMessage": {"value": "confirmed"}}},
                ],
                "maxRetries": 5,
                "allowInterrupt": True,
            },
            "declinationResponse": {
                "messageGroups": [
                    {"message": {"plainTextMessage": {"value": "declined"}}},
                ],
                "allowInterrupt": True,
            },
        },
        slotPriorities=[
            {
                "priority": 1,
                "slotId": slot_ids[0],
            },
            {
                "priority": 2,
                "slotId": slot_ids[1],
            },
            {
                "priority": 3,
                "slotId": slot_ids[2],
            },
            {
                "priority": 4,
                "slotId": slot_ids[3],
            },
        ],
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    logger.info(response)


def create_order_pizza_intent(bot_id, locale_id):
    bot_language = os.environ.get("botLanguage")
    intent_response = create_intent(bot_id, locale_id)
    logger.info(intent_response)
    # Extract intent_id
    intent_id = intent_response["intentId"]
    # Create custom slot types (pizzaType, pizzaSize, and pizzaCrust)
    slot_type_id_pizza_type = create_pizza_slot_type(
        "PizzaType", bot_language, bot_id, locale_id
    )
    slot_type_id_pizza_size = create_pizza_slot_type(
        "PizzaSize", bot_language, bot_id, locale_id
    )
    slot_type_id_pizza_crust = create_pizza_slot_type(
        "PizzaCrust", bot_language, bot_id, locale_id
    )

    # Create slots pizza type, size, crust and count
    pizza_type_slot_id = create_slot(
        "type", slot_type_id_pizza_type, bot_id, locale_id, intent_id
    )
    pizza_size_slot_id = create_slot(
        "size", slot_type_id_pizza_size, bot_id, locale_id, intent_id
    )
    pizza_crust_slot_id = create_slot(
        "crust", slot_type_id_pizza_crust, bot_id, locale_id, intent_id
    )
    pizza_count_slot_id = create_slot(
        "count", "AMAZON.Number", bot_id, locale_id, intent_id
    )

    slot_ids = [
        pizza_type_slot_id,
        pizza_size_slot_id,
        pizza_crust_slot_id,
        pizza_count_slot_id,
    ]
    # Update intent to prioritize order of slots in which they get asked in the conversation flow
    update_order_intent(intent_id, bot_id, locale_id, slot_ids)
