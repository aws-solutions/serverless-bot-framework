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
from book_appointment.appointment_helpers import (
    clarification_prompt,
    slot_types,
    utterances,
    confirmation_prompt,
    decline_reponse,
    closing_response,
    slot_message,
)

client = get_client("lexv2-models")
logger = get_logger(__name__)

def create_intent(bot_id, locale_id):
    intent_response = client.create_intent(
        intentName="MakeAppointment",
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    return intent_response


def create_appointment_slot_type(bot_language, bot_id, locale_id):
    slot_type_response = client.create_slot_type(
        slotTypeName="AppointmentTypeValue",
        description="Types of appointment",
        slotTypeValues=slot_types(bot_language),
        valueSelectionSetting={"resolutionStrategy": "OriginalValue"},
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    return slot_type_response


def create_appointment_slot(
    slot_name, slot_type_id, message_id, bot_language, bot_id, locale_id, intent_id
):
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
    return slot_response


def update_appointment_intent(
    bot_language,
    intent_id,
    appointment_slot_id,
    date_slot_id,
    time_slot_id,
    bot_id,
    locale_id,
):
    response = client.update_intent(
        intentId=intent_id,
        intentName="MakeAppointment",
        description="MakeAppointment intent created by serverless bot.",
        sampleUtterances=utterances(bot_language),
        dialogCodeHook={"enabled": False},
        fulfillmentCodeHook={"enabled": False},
        intentConfirmationSetting={
            "promptSpecification": {
                "messageGroups": [
                    {
                        "message": {
                            "plainTextMessage": confirmation_prompt(bot_language)
                        }
                    },
                ],
                "maxRetries": 5,
                "allowInterrupt": True,
            },
            "declinationResponse": {
                "messageGroups": [
                    {"message": {"plainTextMessage": decline_reponse(bot_language)}},
                ],
                "allowInterrupt": True,
            },
        },
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
                "slotId": appointment_slot_id,
            },
            {
                "priority": 2,
                "slotId": date_slot_id,
            },
            {
                "priority": 3,
                "slotId": time_slot_id,
            },
        ],
        botId=bot_id,
        botVersion="DRAFT",
        localeId=locale_id,
    )
    logger.info(response)

def create_appointment_intent(bot_id, locale_id):
    logger = get_logger(__name__)
    bot_language = os.environ.get("botLanguage")

    # create custom slot type (AppointmentType)
    slot_type_response = create_appointment_slot_type(bot_language, bot_id, locale_id)
    logger.info(slot_type_response)
    # extract slot_type_id
    appointment_slot_type_id = slot_type_response["slotTypeId"]
    # create intent
    intent_response = create_intent(bot_id, locale_id)
    logger.info(intent_response)
    # extract intent_id
    intent_id = intent_response["intentId"]
    # create slots time, date and appointment type
    time_slot_repsonse = create_appointment_slot(
        "Time", "AMAZON.Time", "time", bot_language, bot_id, locale_id, intent_id
    )
    date_slot_response = create_appointment_slot(
        "Date", "AMAZON.Date", "date", bot_language, bot_id, locale_id, intent_id
    )
    appointment_slot_response = create_appointment_slot(
        "AppointmentType",
        appointment_slot_type_id,
        "appointmentType",
        bot_language,
        bot_id,
        locale_id,
        intent_id,
    )
    # extract slot id's
    time_slot_id = time_slot_repsonse["slotId"]
    date_slot_id = date_slot_response["slotId"]
    appointment_slot_id = appointment_slot_response["slotId"]
    # update the intent for prioritizing slots in the intent
    update_appointment_intent(
        bot_language,
        intent_id,
        appointment_slot_id,
        date_slot_id,
        time_slot_id,
        bot_id,
        locale_id,
    )
