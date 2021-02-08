######################################################################################################################
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
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
from time import sleep
import boto3
from crhelper import CfnResource
from shared.logger import get_logger
from shared.client import get_client
from helpers import (
    detect_locale, clarification_prompt, slot_types, abort_statement,
    utterances, confirmation_prompt, decline_reponse, closing_response,
    slot_message
)

logger = get_logger(__name__)
helper = CfnResource(json_logging=True, log_level="INFO")
client = get_client('lexv2-models')
global_bot_id = ''
def wait_for_bot(bot_id):
    response = client.describe_bot(botId=bot_id)
    bot_status = response['botStatus']
    while (bot_status == 'Creating'):
        sleep(1)
        response = client.describe_bot(botId=bot_id)
        bot_status = response['botStatus']
    if bot_status != 'Available':
        logger.error(response)
        raise RuntimeError("Failed to create Lex bot.")

def wait_for_locale(bot_id, locale_id):
    response = client.describe_bot_locale(botId=bot_id, localeId=locale_id, botVersion='DRAFT')
    bot_locale_status = response['botLocaleStatus']
    while (bot_locale_status == 'Creating'):
        sleep(1)
        response = client.describe_bot_locale(botId=bot_id, localeId=locale_id, botVersion='DRAFT')
        bot_locale_status = response['botLocaleStatus']
    if bot_locale_status == 'Failed':
        logger.error(response)
        raise RuntimeError("Failed to create Lex bot locale")


def wait_for_build(bot_id, locale_id):
    response = client.describe_bot_locale(botId=bot_id, localeId=locale_id, botVersion='DRAFT')
    bot_locale_status = response['botLocaleStatus']
    while (bot_locale_status == 'Building'):
        sleep(1)
        response = client.describe_bot_locale(botId=bot_id, localeId=locale_id, botVersion='DRAFT')
        bot_locale_status = response['botLocaleStatus']
    if bot_locale_status == 'Failed':
        logger.error(response)
        raise RuntimeError("Failed to create Lex bot locale")

def create_appointment_slot(slot_name, slot_type_id, message_id, bot_language, bot_id, locale_id, intent_id):
    slot_response = client.create_slot(
        slotName=slot_name,
        description=f'{slot_name} information.',
        slotTypeId=slot_type_id,
        valueElicitationSetting={
            'slotConstraint': 'Required',
            'promptSpecification': {
                'messageGroups': [
                    {
                        'message': {
                            'plainTextMessage': slot_message(bot_language, message_id)
                        }
                    },
                ],
                'maxRetries': 5,
                'allowInterrupt': True
            },
        },
        obfuscationSetting={
            'obfuscationSettingType': 'None'
        },
        botId=bot_id,
        botVersion='DRAFT',
        localeId=locale_id,
        intentId=intent_id
    )
    return slot_response

def create_appointment_intent(bot_language, bot_id, locale_id):
    intent_response = client.create_intent(
        intentName='MakeAppointment',
        botId=bot_id,
        botVersion='DRAFT',
        localeId=locale_id
    )
    return intent_response

def create_appointment_slot_type(bot_language, bot_id, locale_id):
    slot_type_response = client.create_slot_type(
        slotTypeName='AppointmentTypeValue',
        description='Types of appointment',
        slotTypeValues=slot_types(bot_language),
        valueSelectionSetting={
            'resolutionStrategy': 'OriginalValue'
        },
        botId=bot_id,
        botVersion='DRAFT',
        localeId=locale_id
    )
    return slot_type_response

def create_appointment_bot_locale(bot_language, bot_id):
    locale_response = client.create_bot_locale(
        botId=bot_id,
        botVersion='DRAFT',
        localeId=detect_locale(bot_language),
        description=f'created {bot_language} from lambda',
        nluIntentConfidenceThreshold=0.4
    )
    return locale_response

def create_appointment_bot(bot_name, bot_role_arn, child_directed):
    bot_response = client.create_bot(
        botName=bot_name,
        description='Created by Serverless Bot Framework',
        roleArn=bot_role_arn,
        dataPrivacy={
            'childDirected': child_directed == 'Yes'
        },
        idleSessionTTLInSeconds=300,
        botTags={
            'createdby': 'serverless bot framework'
        },
    )
    return bot_response

def update_appointment_intent(bot_language, intent_id, appointment_slot_id, date_slot_id, time_slot_id, bot_id, locale_id):
    response = client.update_intent(
    intentId=intent_id,
    intentName='MakeAppointment',
    description='MakeAppointment intent created by serverless bot.',
    sampleUtterances=utterances(bot_language),
    dialogCodeHook={
        'enabled': False
    },
    fulfillmentCodeHook={
        'enabled': False
    },
    intentConfirmationSetting={
        'promptSpecification': {
            'messageGroups': [
                {
                    'message': {
                        'plainTextMessage': confirmation_prompt(bot_language)
                    }
                },
            ],
            'maxRetries': 5,
            'allowInterrupt': True
        },
        'declinationResponse': {
            'messageGroups': [
                {
                    'message': {
                        'plainTextMessage': decline_reponse(bot_language)
                    }
                },
            ],
            'allowInterrupt': True
        }
    },
    intentClosingSetting={
        'closingResponse': {
            'messageGroups': [
                {
                    'message': {
                        'plainTextMessage': closing_response(bot_language)
                    }
                },
            ],
            'allowInterrupt': True
        }
    },
    slotPriorities=[
        {
            'priority': 1,
            'slotId': appointment_slot_id,
        },
        {
            'priority': 2,
            'slotId': date_slot_id,
        },
        {
            'priority': 3,
            'slotId': time_slot_id,
        },
    ],
    botId=bot_id,
    botVersion='DRAFT',
    localeId=locale_id
)

def get_bot_alias_id(bot_id):
    alias_response = client.list_bot_aliases(botId=bot_id)
    alias_id = alias_response['botAliasSummaries'][0]['botAliasId']
    return alias_id


@helper.create
def custom_resource(event, _):
    bot_brain = os.environ.get('botBrain')
    if(bot_brain == "Amazon Lex"):
        bot_language = os.environ.get('botLanguage')
        bot_name = os.environ.get('botName')
        bot_role_arn = os.environ.get('botRole')
        child_directed = os.environ.get('childDirected')

        # create lex bot version
        bot_response = create_appointment_bot(bot_name, bot_role_arn, child_directed)

        # extract bot_id
        bot_id = bot_response['botId']
        # update global bot id
        os.environ['botId'] = bot_id
        # wait for bot to finish creating
        wait_for_bot(bot_id)
        # create bot locale
        locale_response = create_appointment_bot_locale(bot_language, bot_id)
        # extract locale_id
        locale_id = locale_response['localeId']
        # wait for locale to finish creating
        wait_for_locale(bot_id, locale_id)
        logger.info(locale_response)
        # create custom slot type (AppointmentType)
        slot_type_response = create_appointment_slot_type(bot_language, bot_id, locale_id)
        logger.info(slot_type_response)
        # extract slot_type_id
        appointment_slot_type_id = slot_type_response['slotTypeId']
        # create intent
        intent_response = create_appointment_intent(bot_language, bot_id, locale_id)
        logger.info(intent_response)
        # extract intent_id
        intent_id = intent_response['intentId']
        # create slots time, date and appointment type
        time_slot_repsonse = create_appointment_slot('Time', 'AMAZON.Time', 'time', bot_language, bot_id, locale_id, intent_id)
        date_slot_response = create_appointment_slot('Date', 'AMAZON.Date', 'date', bot_language, bot_id, locale_id, intent_id)
        appointment_slot_response = create_appointment_slot(
            'AppointmentType', appointment_slot_type_id, 'appointmentType',
            bot_language, bot_id, locale_id, intent_id
        )
        # extract slot id's
        time_slot_id = time_slot_repsonse['slotId']
        date_slot_id = date_slot_response['slotId']
        appointment_slot_id = appointment_slot_response['slotId']
        # update the intent for prioritizing slots in the intent
        update_appointment_intent(bot_language, intent_id, appointment_slot_id, date_slot_id, time_slot_id, bot_id, locale_id)
        # build fully configured bot
        build_response = client.build_bot_locale(
            botId=bot_id,
            botVersion='DRAFT',
            localeId=locale_id
        )
        # wait for bot to finish building
        wait_for_build(bot_id, locale_id)
        bot_alias_id = get_bot_alias_id(bot_id)

        helper.Data.update(BotId=bot_id, BotAliasId=bot_alias_id)
        return bot_id
    else:
        helper.Data.update(BotId='', BotAliasId='')


@helper.delete
def delete_resource(event, _):
    try:
        logger.info(event)
        if(os.environ.get('botBrain') == "Amazon Lex"):
            bot_id = event['PhysicalResourceId']
            response = client.delete_bot(
                botId=bot_id,
                skipResourceInUseCheck=True
            )
            logger.info(response)
        else:
            logger.info('No bot to delete, skipped deleting.')
    except Exception as e:
        logger.error(e)
        raise RuntimeError('Failed to delete Bot.')

def handler(event, context):
    helper(event, context)