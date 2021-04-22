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

# @author Solution Builders

import os
import logging
import uuid
import boto3
from shared.client import get_client

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = get_client("dynamodb")


def get_slot(intent_request, slot_name):
    slots = intent_request["sessionState"]["intent"]["slots"]
    if slots is not None and slot_name in slots and slots[slot_name] is not None:
        return slots[slot_name]["value"]["interpretedValue"]
    return None


def get_session_attributes(intent_request):
    session_state = intent_request["sessionState"]
    if "sessionAttributes" in session_state:
        return session_state["sessionAttributes"]
    return {}


def close(intent_request, fulfillment_state):
    intent_request["sessionState"]["intent"]["state"] = fulfillment_state
    return {
        "sessionState": {
            "sessionAttributes": get_session_attributes(intent_request),
            "dialogAction": {"type": "Close"},
            "intent": intent_request["sessionState"]["intent"],
        },
        "messages": None,  # Intent closing response is configured in the Lex bot. No need to specify here
        "sessionId": intent_request["sessionId"],
        "requestAttributes": intent_request["requestAttributes"]
        if "requestAttributes" in intent_request
        else None,
    }


def save_feedback(intent_request):
    table_name = os.environ.get("FEEDBACK_TABLE", False)
    slot_values = {
        "firstName": get_slot(intent_request, "firstName"),
        "lastName": get_slot(intent_request, "lastName"),
        "feedback": get_slot(intent_request, "feedback"),
    }
    try:
        unique_id = str(uuid.uuid4())
        response = dynamodb.put_item(
            TableName=table_name,
            Item={
                "uuid": {"S": unique_id},
                "FirstName": {"S": slot_values["firstName"]},
                "LastName": {"S": slot_values["lastName"]},
                "Feedback": {"S": slot_values["feedback"]},
            },
        )
        # Only log response when child directed is selected as No
        if os.environ.get("childDirected") == "No":
            logger.info(response)
        return close(intent_request, "Fulfilled")
    except Exception as e:
        logger.error(f"Unable to put item in table {table_name}")
        logger.error(e)
        return close(intent_request, "Failed")
