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
import os
import logging
from unittest import TestCase
from unittest.mock import Mock, patch


logger = logging.getLogger()
logger.setLevel(logging.INFO)
mock_env_variables = {
    "PIZZA_ORDERS_TABLE": "test_table",
    "PIZZA_ORDERS_INDEX": "test_index",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}

@patch.dict(os.environ, mock_env_variables)
class PizzaOrderHandlerTests(TestCase):
    @patch("pizza_order.pizza_order_handler.place_order")
    @patch(
        "pizza_order.pizza_order_handler.get_cancel_message",
        return_value="mock cancel message",
    )
    @patch(
        "pizza_order.pizza_order_handler.empty_slot_values",
        return_value="mock slot values",
    )
    @patch(
        "pizza_order.pizza_order_handler.get_menu_message",
        return_value="mock menu message",
    )
    @patch(
        "pizza_order.pizza_order_handler.get_confirmation_message",
        return_value="mock confirmation",
    )
    @patch("pizza_order.pizza_order_handler.respond")
    def test_handle_full_slots(
        self,
        mock_respond,
        mock_get_confirmation_message,
        mock_get_menu_message,
        mock_empty_slot_values,
        mock_get_cancel_message,
        mock_place_order,
    ):
        from pizza_order.pizza_order_handler import handle_full_slots
        intent_request = {
            "sessionState": {
                "intent": {
                    "confirmationState": "None",
                    "slots": {
                        "type": {"value": {"resolvedValues": ["testtype"]}},
                        "size": {"value": {"resolvedValues": ["testsize"]}},
                        "crust": {"value": {"resolvedValues": ["testcrust"]}},
                        "count": {"value": {"resolvedValues": ["testcount"]}},
                    },
                }
            },
            "sessionId": "testid",
        }
        locale_id = "en_US"
        order_id = "1234-1234-1234-1234"

        # when confirmation_state is None
        handle_full_slots(intent_request, locale_id, order_id)
        mock_respond.assert_called_with(
            intent_request,
            message="mock confirmation",
            dialog_action_type="ConfirmIntent",
            fulfillment_state="InProgress",
        )

        # when confirmation_state is Denied with active context
        intent_request["sessionState"]["intent"]["confirmationState"] = "Denied"
        intent_request["sessionState"]["activeContexts"] = ["testContext"]
        handle_full_slots(intent_request, locale_id, order_id)
        mock_respond.assert_called_with(
            intent_request,
            message="mock menu message",
            fulfillment_state="InProgress",
            dialog_action_type="ElicitSlot",
            slot_to_elicit="type",
            slots="mock slot values",
        )
        # confirmation_state = Denied without active context
        intent_request["sessionState"]["activeContexts"] = []
        handle_full_slots(intent_request, locale_id, order_id)
        mock_respond.assert_called_with(
            intent_request,
            message="mock cancel message",
            fulfillment_state="Failed",
            dialog_action_type="Close",
        )

        # confirmation_state = Confirmed
        intent_request["sessionState"]["intent"]["confirmationState"] = "Confirmed"
        handle_full_slots(intent_request, locale_id, order_id)
        mock_place_order.assert_called_with(intent_request, order_id, logger)

    @patch(
        "pizza_order.pizza_order_handler.get_menu_message",
        return_value="mock menu message",
    )
    @patch(
        "pizza_order.pizza_order_handler.update_slot_values",
        return_value="mock slot values",
    )
    @patch(
        "pizza_order.pizza_order_handler.get_repeat_message",
        return_value="mock repeat message",
    )
    @patch("pizza_order.pizza_order_handler.check_last_order")
    @patch("pizza_order.pizza_order_handler.respond")
    def test_handle_emtpy_slots(
        self,
        mock_respond,
        mock_check_last_order,
        mock_get_repeat_message,
        mock_update_slot_values,
        mock_get_menu_message,
    ):
        from pizza_order.pizza_order_handler import handle_empty_slots
        intent_request = {}
        locale_id = "en_US"
        active_context = {
            "name": "repeatOrder",
            "contextAttributes": {"repeatLastOrder": "Pending"},
            "timeToLive": {"turnsToLive": 2, "timeToLiveInSeconds": 300},
        }
        # last order exists
        mock_check_last_order.return_value = (True, 'mock last order')
        handle_empty_slots(intent_request, locale_id)
        mock_respond.assert_called_with(
            intent_request,
            message="mock repeat message",
            fulfillment_state="InProgress",
            dialog_action_type="ConfirmIntent",
            slots="mock slot values",
            active_context=active_context,
        )

        # last order does not exist
        mock_check_last_order.return_value = (False, 'mock last order')
        handle_empty_slots(intent_request, locale_id)
        mock_respond.assert_called_with(
            intent_request,
            message="mock menu message",
            fulfillment_state="InProgress",
            dialog_action_type="ElicitSlot",
            slot_to_elicit="type",
        )

    @patch("pizza_order.pizza_order_handler.handle_empty_slots")
    @patch("pizza_order.pizza_order_handler.empty_slots")
    @patch("pizza_order.pizza_order_handler.handle_full_slots")
    @patch("pizza_order.pizza_order_handler.full_slots")
    @patch("pizza_order.pizza_order_handler.respond")
    def test_handle_repeat_order(
        self,
        mock_respond,
        mock_full_slots,
        mock_handle_full_slots,
        mock_empty_slots,
        mock_handle_empty_slots,
    ):
        from pizza_order.pizza_order_handler import handle_repeat_order
        intent_request = {"bot": {"localeId": "en_US"}}
        order_id = "1234"
        # All slot values are resolved
        mock_full_slots.return_value = True
        handle_repeat_order(intent_request, order_id)
        mock_handle_full_slots.assert_called_with(intent_request, 'en_US', order_id)
        # All slot values are empty - beginning of dialog
        mock_full_slots.return_value = False
        mock_empty_slots.return_value = True
        handle_repeat_order(intent_request, order_id)
        mock_handle_empty_slots.assert_called_with(intent_request, 'en_US')
        # Slot values are neither full nor empty
        mock_full_slots.return_value = False
        mock_empty_slots.return_value = False
        handle_repeat_order(intent_request, order_id)
        mock_respond.assert_called_with(
            intent_request,
            message="next slot value",
            fulfillment_state="InProgress",
            dialog_action_type="Delegate",
        )

    @patch("pizza_order.pizza_order_handler.place_order")
    @patch("pizza_order.pizza_order_handler.handle_repeat_order")
    @patch("pizza_order.pizza_order_handler.generate_order_id", return_value="1234")
    @patch("pizza_order.pizza_order_handler.logger")
    def test_handle_pizza_order(
        self,
        mock_logger,
        mock_generate_order_id,
        mock_handle_repeat_order,
        mock_place_order,
    ):
        from pizza_order.pizza_order_handler import handle_pizza_order
        intent_request = {"sessionState": {"intent": {"state": "InProgress"}}}

        handle_pizza_order(intent_request)
        mock_generate_order_id.assert_called()
        # intent state is InProgress
        mock_handle_repeat_order.assert_called_with(intent_request, "1234")

        # intent state is ReadyForFulfillment
        intent_request["sessionState"]["intent"]["state"] = "ReadyForFulfillment"
        handle_pizza_order(intent_request)
        mock_place_order.assert_called_with(intent_request, "1234", mock_logger)

        # intent state is neither of the above cases
        intent_request["sessionState"]["intent"]["state"] = "Failed"
        handle_pizza_order(intent_request)
        mock_logger.error.assert_called_with(intent_request)
