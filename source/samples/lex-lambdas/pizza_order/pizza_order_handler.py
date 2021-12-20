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

import logging
from pizza_order.pizza_responses import (
    get_menu_message,
    get_confirmation_message,
    get_repeat_message,
    get_cancel_message,
)
from pizza_order.pizza_helpers import (
    empty_slots,
    full_slots,
    update_slot_values,
    empty_slot_values,
    generate_order_id,
    calculate_bill,
    respond,
    check_last_order,
    place_order,
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handle_full_slots(intent_request, locale_id, order_id):
    '''
    Handles the dialog where all order pizza slots are filled (end of converstaion).

    :param intent_request: Event object that was sent by Amazon Lex
    :param locale_id: A string containig language locale id received from Amazon Lex with format example: en_US
    :param order_id: A string containing a generated order id
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    '''
    confirmation_state = intent_request['sessionState']['intent']['confirmationState']
    if confirmation_state == 'None':
        # Prompt for confirmation with total bill and order details
        slots = intent_request["sessionState"]["intent"]["slots"]
        return respond(
            intent_request,
            message=get_confirmation_message(locale_id, slots),
            dialog_action_type="ConfirmIntent",
            fulfillment_state="InProgress",
        )
    elif confirmation_state == "Denied":
        session_state = intent_request["sessionState"]
        # If sessionState has active context, user rejected repeating last order.
        # Empty slot values, send menu, ask for pizza type without welcome message.
        if (
            "activeContexts" in session_state
            and len(session_state["activeContexts"]) > 0
        ):
            return respond(
                intent_request,
                message=get_menu_message(locale_id, welcome_message=False),
                fulfillment_state="InProgress",
                dialog_action_type="ElicitSlot",
                slot_to_elicit="type",
                slots=empty_slot_values(),
            )

        # if it does not have active context, it means user rejected new order
        # close the dialog with cancellation message
        else:
            return respond(
                intent_request,
                message=get_cancel_message(locale_id),
                fulfillment_state="Failed",
                dialog_action_type="Close",
            )
    else:
        # order is confirmed, place order
        return place_order(intent_request, order_id, logger)


def handle_empty_slots(intent_request, locale_id):
    '''
    Handles the dialog where all order pizza slots are still empty (beginning of converstaion).

    :param intent_request: Event object that was sent by Amazon Lex
    :param locale_id: A string containig language locale id received from Amazon Lex with format example: en_US
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    '''
    last_order_exists, last_order = check_last_order(intent_request)
    if last_order_exists:
        # User ordered before, prompt for repeat last order
        # Change dialog action type to ConfirmIntent, and put activeContext
        active_context = {
            "name": "repeatOrder",
            "contextAttributes": {"repeatLastOrder": "Pending"},
            "timeToLive": {"turnsToLive": 2, "timeToLiveInSeconds": 300},
        }
        return respond(
            intent_request,
            message=get_repeat_message(locale_id, last_order),
            fulfillment_state="InProgress",
            dialog_action_type="ConfirmIntent",
            slots=update_slot_values(last_order),
            active_context=active_context,
        )
    else:
        # User has not ordered before, prompt for pizza type
        return respond(
            intent_request,
            message=get_menu_message(locale_id),
            fulfillment_state="InProgress",
            dialog_action_type="ElicitSlot",
            slot_to_elicit="type",
        )


def handle_repeat_order(intent_request, order_id):
    '''
    Handles the dialog determining whether user has previously put an order and if they want to repeat their last order.

    :param intent_request: Event object that was sent by Amazon Lex
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    '''
    locale_id = intent_request['bot']['localeId']
    # All slot values are resolved
    if full_slots(intent_request):
        return handle_full_slots(intent_request, locale_id, order_id)
    # All slot values are empty - beginning of dialog
    elif empty_slots(intent_request):
        return handle_empty_slots(intent_request, locale_id)
    # Slot values are neither full nor empty, let Lex handle the response
    else:
        # Respond with template value message so that Lex prompts for slot values
        return respond(
            intent_request,
            message="next slot value",
            fulfillment_state="InProgress",
            dialog_action_type="Delegate",
        )


def handle_pizza_order(intent_request):
    '''
    Handles the dialog with Amazon Lex when the intent is pizza order

    :param intent_request: Event object that was sent by Amazon Lex
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    '''
    order_id = generate_order_id()
    intent_state = intent_request["sessionState"]["intent"]["state"]
    if intent_state == "InProgress":
        return handle_repeat_order(intent_request, order_id)
    elif intent_state == "ReadyForFulfillment":
        return place_order(intent_request, order_id, logger)
    else:
        logger.error(intent_request)
