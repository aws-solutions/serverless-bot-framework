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
from time import sleep
import botocore
from crhelper import CfnResource
from shared.logger import get_logger
from shared.client import get_client
from leave_feedback.intent import create_feedback_intent
from book_appointment.intent import create_appointment_intent
from order_pizza.intent import create_order_pizza_intent
from weather_forecast.intent import create_weather_intent
from other_intents.help_intent import create_help_intent
from other_intents.name_intent import create_name_intent

from shared.helpers import detect_locale, abort_statement

logger = get_logger(__name__)
helper = CfnResource(json_logging=True, log_level="INFO")
client = get_client("lexv2-models")


def wait_for_bot(bot_id):
    response = client.describe_bot(botId=bot_id)
    bot_status = response["botStatus"]
    while bot_status == "Creating":
        sleep(1)
        response = client.describe_bot(botId=bot_id)
        bot_status = response["botStatus"]
    if bot_status != "Available":
        logger.error(response)
        raise RuntimeError("Failed to create Lex bot.")


def wait_for_locale(bot_id, locale_id):
    response = client.describe_bot_locale(
        botId=bot_id, localeId=locale_id, botVersion="DRAFT"
    )
    bot_locale_status = response["botLocaleStatus"]
    while bot_locale_status == "Creating":
        sleep(1)
        response = client.describe_bot_locale(
            botId=bot_id, localeId=locale_id, botVersion="DRAFT"
        )
        bot_locale_status = response["botLocaleStatus"]
    if bot_locale_status == "Failed":
        logger.error(response)
        raise RuntimeError("Failed to create Lex bot locale")


def wait_for_build(bot_id, locale_id):
    response = client.describe_bot_locale(
        botId=bot_id, localeId=locale_id, botVersion="DRAFT"
    )
    bot_locale_status = response["botLocaleStatus"]
    while bot_locale_status == "Building":
        sleep(1)
        response = client.describe_bot_locale(
            botId=bot_id, localeId=locale_id, botVersion="DRAFT"
        )
        bot_locale_status = response["botLocaleStatus"]
    if bot_locale_status == "Failed":
        logger.error(response)
        raise RuntimeError("Failed to create Lex bot locale")

def wait_for_bot_delete(bot_id):
    try:
        response = client.describe_bot(botId=bot_id)
        bot_status = response["botStatus"]
        while bot_status == "Deleting":
            sleep(1)
            response = client.describe_bot(botId=bot_id)
            bot_status = response["botStatus"]
        if bot_status == "Failed":
            logger.error(response)
            raise RuntimeError("Failed to delete Lex bot.")
    except botocore.exceptions.ClientError as error:
        if error.response['Error']['Code'] == 'ResourceNotFoundException':
            logger.info(f"Bot with bot_id {bot_id} successfully deleted.")
        else:
            logger.error(error)
            raise RuntimeError("Failed to delete Lex bot.")

def create_lex_bot_locale(bot_language, bot_id):
    locale_response = client.create_bot_locale(
        botId=bot_id,
        botVersion="DRAFT",
        localeId=detect_locale(bot_language),
        description=f"created {bot_language} from lambda",
        nluIntentConfidenceThreshold=0.4,
    )
    return locale_response


def create_lex_bot(bot_name, bot_role_arn, child_directed):
    bot_response = client.create_bot(
        botName=bot_name,
        description="Created by Serverless Bot Framework",
        roleArn=bot_role_arn,
        dataPrivacy={"childDirected": child_directed == "Yes"},
        idleSessionTTLInSeconds=300,
        botTags={"createdby": "serverless bot framework"},
    )
    return bot_response


def get_bot_alias_id(bot_id):
    alias_response = client.list_bot_aliases(botId=bot_id)
    alias_id = alias_response["botAliasSummaries"][0]["botAliasId"]
    return alias_id

def get_bot_id():
    bot_name = os.environ.get("botName")
    alias_response = client.list_bots(filters=[{
        "name": "BotName",
        "values": [bot_name],
        "operator": "EQ",
    }])
    bot_id = alias_response["botSummaries"][0]["botId"]
    return bot_id


def configure_lex_bot(bot_name, bot_role_arn, child_directed, bot_language):
    # Creating a Lex bot
    bot_response = create_lex_bot(bot_name, bot_role_arn, child_directed)
    logger.info(bot_response)
    bot_id = bot_response["botId"]
    wait_for_bot(bot_id)
    bot_alias_id = get_bot_alias_id(bot_id)

    # Creating a locale for the Lex bot
    locale_response = create_lex_bot_locale(bot_language, bot_id)
    locale_id = locale_response["localeId"]
    wait_for_locale(bot_id, locale_id)
    logger.info(locale_response)

    return bot_id, bot_alias_id, locale_id


def create_bot_intents(bot_id, bot_alias_id, locale_id):
    create_feedback_intent(bot_id, locale_id, bot_alias_id)
    create_appointment_intent(bot_id, locale_id)
    create_order_pizza_intent(bot_id, locale_id)
    create_weather_intent(bot_id, locale_id)
    create_help_intent(bot_id, locale_id)
    create_name_intent(bot_id, locale_id)


def build_lex_bot(bot_id, locale_id):
    # build fully configured bot
    build_response = client.build_bot_locale(
        botId=bot_id, botVersion="DRAFT", localeId=locale_id
    )
    logger.info(build_response)
    # wait for bot to finish building
    wait_for_build(bot_id, locale_id)


@helper.create
def create_resource(event, _):

    # Get environment variables
    bot_language = os.environ.get("botLanguage")
    bot_name = os.environ.get("botName")
    bot_role_arn = os.environ.get("botRole")
    child_directed = os.environ.get("childDirected")

    # Create Lex bot and intents
    bot_id, bot_alias_id, locale_id = configure_lex_bot(
        bot_name, bot_role_arn, child_directed, bot_language
    )
    create_bot_intents(bot_id, bot_alias_id, locale_id)
    build_lex_bot(bot_id, locale_id)

    # Send response to Cloudformation
    helper.Data.update(BotId=bot_id, BotAliasId=bot_alias_id)
    return bot_id


@helper.delete
def delete_resource(event, _):
    try:
        logger.info(event)
        bot_id = get_bot_id()
        response = client.delete_bot(botId=bot_id, skipResourceInUseCheck=True)
        logger.info(response)

    except Exception as e:
        logger.error(e)
        raise RuntimeError("Failed to delete Bot.")

@helper.update
def update_resource(event, _):
    delete_resource(event, _)
    bot_id = get_bot_id()
    wait_for_bot_delete(bot_id)
    create_resource(event, _)

def handler(event, context):
    helper(event, context)
