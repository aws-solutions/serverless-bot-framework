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

# @author Solution Builders
import os
import time
import json
import random
import logging
import datetime
from shared.client import get_client
from pizza_order.pizza_responses import get_fulfilled_message

dynamodb = get_client("dynamodb")
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def empty_slots(intent_request):
    '''
    Checks if all intent slots values are empty.

    :param intent_request: Event object that was sent by Amazon Lex
    :returns: True if all slots are empty and False if not.
    '''
    slots = intent_request['sessionState']['intent']['slots']
    for slot_name in slots:
        if slots[slot_name] != None:
            return False
    return True


def full_slots(intent_request):
    '''
    Checks if all intent slots values are set.

    :param intent_request: Event object that was sent by Amazon Lex
    :returns: True if all slots are set and False if not.
    '''
    slots = intent_request['sessionState']['intent']['slots']
    for slot_name in slots:
        if slots[slot_name] == None:
            return False
    return True


def update_slot_values(last_order):
    '''
    Updates slot values based on last record of a user in database.

    :param intent_request: Event object that was sent by Amazon Lex
    :param last_order: 'Items' object received from DynamoDB query
    :returns: Slots object that can be inserted into intent as a compatible response object for Amazon Lex.
    '''
    slots = {
        "type": {
            "value": {
                "interpretedValue": last_order["pizzaType"]["S"],
                "originalValue": last_order["pizzaType"]["S"],
                "resolvedValues": [last_order["pizzaType"]["S"]],
            }
        },
        "size": {
            "value": {
                "interpretedValue": last_order["pizzaSize"]["S"],
                "originalValue": last_order["pizzaSize"]["S"],
                "resolvedValues": [last_order["pizzaSize"]["S"]],
            }
        },
        "crust": {
            "value": {
                "interpretedValue": last_order["pizzaCrust"]["S"],
                "originalValue": last_order["pizzaCrust"]["S"],
                "resolvedValues": [last_order["pizzaCrust"]["S"]],
            }
        },
        "count": {
            "value": {
                "interpretedValue": last_order["pizzaCount"]["N"],
                "originalValue": last_order["pizzaCount"]["N"],
                "resolvedValues": [last_order["pizzaCount"]["N"]],
            }
        },
    }
    return slots


def empty_slot_values():
    '''
    Creates an empty slot object for pizza order with keys: type, size, crust, count.

    :returns: Slots object that can be inserted into intent as response to Amazon Lex.
    '''
    return {
        "type": {"value": {}},
        "size": {"value": {}},
        "crust": {"value": {}},
        "count": {"value": {}},
    }


def generate_order_id():
    '''
    Generates an order id from current timestamp.

    :returns: Unique 16 digit order id with format: xxxx-xxxx-xxxx-xxxxx
    '''
    timestamp = str(time.time()).replace('.', '')
    random_number = random.randint(1000, 9999) # NOSONAR using random generator is safe here
    orderid = f"{random_number}-{timestamp[4:8]}-{timestamp[8:12]}-{timestamp[12:16]}"
    return orderid


def calculate_bill(locale_id, slots):
    '''
    Calculates the total bill for a pizza order.

    :param locale_id: language locale id received from Amazon Lex with format example: en_US
    :param slots: slots object received from Amazon Lex
    :returns: Calculated bill based on pizza order and tax rate rounded to 2 decimal and converted into string.
    '''
    tax_rate = 1.13
    pizza_type = slots["type"]["value"]["resolvedValues"][0]
    pizza_size = slots["size"]["value"]["resolvedValues"][0]
    pizza_count = slots["count"]["value"]["resolvedValues"][0]
    menu_file = open("pizza_order/pizza_menu.json")
    menu_data = json.load(menu_file)
    menu_file.close()
    try:
        for item in menu_data[locale_id]["menuItems"]:
            if item["T"] == pizza_type:
                total_price = item["P"][pizza_size] * float(pizza_count) * tax_rate
                return str(round(total_price, 2))
        # If we can not find item["T"] or item["P"] from menu, menu file is misconfigured
        raise Exception("Could not find menu properties from pizza menu file.")
    except Exception as e:
        logger.error(e)
        raise Exception("Error calculating order's total bill.")


def respond(
    intent_request, # NOSONAR this function needs to have 8 parameters
    message,
    fulfillment_state,
    dialog_action_type,
    confirmation_state=None,
    slots=None,
    slot_to_elicit=None,
    active_context=None,
):
    """
    Constructs a response object and sends response back to Amazon Lex.

    :param intent_request: Event object that was sent by Amazon Lex
    :param message: A string containing the custom message that you want Amazon Lex to show to the user
    :param fulfillment_state: A string indicating the intent's state in Amazon Lex. Acceptable values: Failed | Fulfilled | InProgress | ReadyForFulfillment
    :param dialog_action_type: A string indicating state of the dialog between user and Amazon Lex. Acceptable values: Close | ConfirmIntent | Delegate | ElicitIntent | ElicitSlot
    :param confirmation_state: (optional) A string indicating the intent's confirmation state in Amazon Lex. Acceptable values: Confirmed | Denied | None
    :param slots: (optional) slots object to include in the intent that is being sent to Amazon Lex.
    :param slot_to_elicit: (optional - required only when dialog_action_type=ElicitSlot) A string indicating the name of a slot that you want Amazon Lex to inquire from the user
    :param active_context: an object representing an active_context that you want Amazon Lex to remember during the dialog
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    """
    intent = intent_request["sessionState"]["intent"]
    intent["state"] = fulfillment_state
    if confirmation_state != None:
        intent["confirmationState"] = confirmation_state
    if slots != None:
        intent["slots"] = slots
    response = {
        "sessionState": {
            "activeContexts": [active_context],
            "dialogAction": {
                "slotToElicit": slot_to_elicit,
                "type": dialog_action_type,
            },
            "intent": intent,
        },
        "messages": [
            {
                "contentType": "PlainText",
                "content": message,
            }
        ],
        "sessionId": intent_request["sessionId"],
        "requestAttributes": intent_request["requestAttributes"]
        if "requestAttributes" in intent_request
        else None,
    }
    if active_context == None:
        del response["sessionState"]["activeContexts"]
    return response


# Dynamo DB functions
def check_last_order(intent_request):
    '''
    Checks if user has previously placed a pizza order.

    :param intent_request: Event object that was sent by Amazon Lex
    :returns: (True, ordered item object) if user has previously placed a pizza order, (False, None) if not.
    '''
    user_email = intent_request['requestAttributes']['email']
    table_name = os.environ.get('PIZZA_ORDERS_TABLE')
    index_name = os.environ.get('PIZZA_ORDERS_INDEX')
    response = dynamodb.query(
        TableName=table_name,
        IndexName=index_name,
        KeyConditionExpression='customerId = :email',
        ExpressionAttributeValues={':email':{'S':user_email}},
        ScanIndexForward = False
    )
    items = response["Items"]
    if len(items) > 0:
        del response["Items"][0]["customerId"]
        logger.info(response)
        return True, items[0]
    logger.info(response)
    return False, None


def place_order(intent_request, order_id, logger):
    '''
    Writes the user's pizza order details in the database.

    :param intent_request: Event object that was sent by Amazon Lex
    :param order_id: Generated order id to use as partition key for writing in database
    :param logger: Logging.logger object to allow this function to log database's repsonse without importing logging module.
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    '''
    table_name = os.environ.get('PIZZA_ORDERS_TABLE')
    user_email = intent_request['requestAttributes']['email']
    slots = intent_request['sessionState']['intent']['slots']
    locale_id = intent_request['bot']['localeId']
    total_bill = calculate_bill(locale_id, slots)
    response = dynamodb.put_item(
        TableName=table_name,
        Item={
            "orderId": {"S": order_id},
            "orderTimestamp": {"N": str(time.time())},
            "customerId": {"S": user_email},
            "pizzaType": {"S": slots["type"]["value"]["resolvedValues"][0]},
            "pizzaSize": {"S": slots["size"]["value"]["resolvedValues"][0]},
            "pizzaCrust": {"S": slots["crust"]["value"]["resolvedValues"][0]},
            "pizzaCount": {"N": slots["count"]["value"]["resolvedValues"][0]},
            "botLanguage": {"S": intent_request["bot"]["localeId"]},
            "orderTotalBill": {"N": total_bill},
        },
    )
    # Logging response only when childDirected is selected as No
    if os.environ.get("childDirected") == "No":
        logger.info(response)
    logger.info(f"Placed order with order ID: {order_id}")
    return respond(
        intent_request,
        message=get_fulfilled_message(locale_id, order_id, total_bill),
        fulfillment_state="Fulfilled",
        dialog_action_type="Close",
    )
