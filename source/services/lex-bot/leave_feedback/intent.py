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
from leave_feedback.feedback_helpers import (
    feedback_utterances,
    feedback_slot_messages,
    closing_response,
)

client = get_client("lexv2-models")
logger = get_logger(__name__)


# create intent
def create_intent(bot_id, locale_id):
    intent_response = client.create_intent(
        intentName="LeaveFeedback", botId=bot_id, botVersion="DRAFT", localeId=locale_id
    )
    logger.info(intent_response)
    return intent_response["intentId"]


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
                            "plainTextMessage": feedback_slot_messages(
                                bot_language, slot_name
                            )
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
    return slot_response["slotId"]


def update_feedback_intent(
    intent_id, bot_id, locale_id, firstname_slot_id, lastname_slot_id, feedback_slot_id
):
    bot_language = os.environ.get("botLanguage")
    response = client.update_intent(
        intentId=intent_id,
        intentName="LeaveFeedback",
        description="LeaveFeedback intent created by serverless bot.",
        sampleUtterances=feedback_utterances(bot_language),
        dialogCodeHook={"enabled": False},
        fulfillmentCodeHook={"enabled": True},
        intentClosingSetting={
            "closingResponse": {
                "messageGroups": [
                    {"message": {"plainTextMessage": closing_response(bot_language)}},
                ],
                "allowInterrupt": True,
            }
        },
        slotPriorities=[
            {
                "priority": 1,
                "slotId": firstname_slot_id,
            },
            {
                "priority": 2,
                "slotId": lastname_slot_id,
            },
            {
                "priority": 3,
                "slotId": feedback_slot_id,
            },
        ],
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    logger.info(response)


def update_bot_alias(bot_id, bot_alias_id):
    lex_lambda_arn = os.environ.get("lexLambdaARN")
    bot_language = os.environ.get("botLanguage")
    locale_string = detect_locale(bot_language)
    response = client.update_bot_alias(
        botAliasId=bot_alias_id,
        botAliasName="TestBotAlias",
        description="Created By Serverless Bot Framework",
        botVersion="DRAFT",
        botAliasLocaleSettings={
            locale_string: {
                "enabled": True,
                "codeHookSpecification": {
                    "lambdaCodeHook": {
                        "lambdaARN": lex_lambda_arn,
                        "codeHookInterfaceVersion": "1.0",
                    }
                },
            }
        },
        botId=bot_id,
    )
    logger.info(response)


def create_feedback_intent(bot_id, locale_id, bot_alias_id):
    intent_id = create_intent(bot_id, locale_id)

    # create slots
    firstname_slot_id = create_slot(
        "firstName", "AMAZON.FirstName", bot_id, locale_id, intent_id
    )
    lastname_slot_id = create_slot(
        "lastName", "AMAZON.LastName", bot_id, locale_id, intent_id
    )
    feedback_slot_id = create_slot(
        "feedback", "AMAZON.AlphaNumeric", bot_id, locale_id, intent_id
    )
    # update the intent for prioritizing slots in the intent
    update_feedback_intent(
        intent_id,
        bot_id,
        locale_id,
        firstname_slot_id,
        lastname_slot_id,
        feedback_slot_id,
    )
    # update bot alias to connect the intent to the lex lambda
    update_bot_alias(bot_id, bot_alias_id)
