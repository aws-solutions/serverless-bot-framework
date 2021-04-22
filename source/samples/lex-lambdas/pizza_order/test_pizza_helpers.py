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
import time
import random
from unittest import TestCase
from unittest.mock import Mock, patch
from botocore.stub import Stubber

logger = logging.getLogger()
logger.setLevel(logging.INFO)

mock_env_variables = {
    "PIZZA_ORDERS_TABLE": "test_table",
    "PIZZA_ORDERS_INDEX": "test_index",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
    "childDirected": "No",
}


@patch.dict(os.environ, mock_env_variables)
class PizzahelpersTests(TestCase):
    def test_empty_slots(self):
        from pizza_order.pizza_helpers import empty_slots
        intent_request = {
            "sessionState": {
                "intent": {
                    "slots": {"type": None, "size": None, "crust": None, "count": None}
                }
            }
        }
        # empty slots
        self.assertTrue(empty_slots(intent_request))
        # non empty slots
        intent_request["sessionState"]["intent"]["slots"]["count"] = {"value": "1234"}
        self.assertFalse(empty_slots(intent_request))

    def test_full_slots(self):
        from pizza_order.pizza_helpers import full_slots
        intent_request = {
            "sessionState": {
                "intent": {
                    "slots": {
                        "type": {"value": "test"},
                        "size": {"value": "test"},
                        "crust": {"value": "test"},
                        "count": {"value": "test"},
                    }
                }
            }
        }
        # full slots
        self.assertTrue(full_slots(intent_request))
        # non full slots
        intent_request["sessionState"]["intent"]["slots"]["count"] = None
        self.assertFalse(full_slots(intent_request))

    def test_update_slot_values(self):
        from pizza_order.pizza_helpers import update_slot_values
        last_order = {
            "pizzaType": {"S": "testType"},
            "pizzaSize": {"S": "testSize"},
            "pizzaCrust": {"S": "testCrust"},
            "pizzaCount": {"N": "1234"},
        }
        expected_response = {
            "type": {
                "value": {
                    "interpretedValue": "testType",
                    "originalValue": "testType",
                    "resolvedValues": ["testType"],
                }
            },
            "size": {
                "value": {
                    "interpretedValue": "testSize",
                    "originalValue": "testSize",
                    "resolvedValues": ["testSize"],
                }
            },
            "crust": {
                "value": {
                    "interpretedValue": "testCrust",
                    "originalValue": "testCrust",
                    "resolvedValues": ["testCrust"],
                }
            },
            "count": {
                "value": {
                    "interpretedValue": "1234",
                    "originalValue": "1234",
                    "resolvedValues": ["1234"],
                }
            },
        }
        response = update_slot_values(last_order)
        self.assertEqual(expected_response, response)

    def test_empty_slot_values(self):
        from pizza_order.pizza_helpers import empty_slot_values
        expected_response = {
            "type": {"value": {}},
            "size": {"value": {}},
            "crust": {"value": {}},
            "count": {"value": {}},
        }
        response = empty_slot_values()
        self.assertEqual(expected_response, response)

    @patch("pizza_order.pizza_helpers.time.time", return_value=123412341234.1234)
    @patch("pizza_order.pizza_helpers.random.randint", return_value=1234)
    def test_generate_order_id(self, mock_random, mock_time):
        from pizza_order.pizza_helpers import generate_order_id
        expected_response = "1234-1234-1234-1234"
        response = generate_order_id()
        self.assertEqual(expected_response, response)

    def test_calculate_bill(self):
        from pizza_order.pizza_helpers import calculate_bill
        slots = {
            "type": {"value": {"resolvedValues": ["Greek"]}},
            "size": {"value": {"resolvedValues": ["small"]}},
            "crust": {"value": {"resolvedValues": ["thin"]}},
            "count": {"value": {"resolvedValues": ["2"]}},
        }
        expected_response = "22.6"
        response = calculate_bill("en_US", slots)
        self.assertEqual(expected_response, response)

    def test_respond(self):
        from pizza_order.pizza_helpers import respond
        intent_request = {
            "sessionState": {"intent": {"state": {}, "confirmationState": ""}},
            "sessionId": "test id",
            "requestAttributes": "test attribute",
        }

        expected_response = {
            "sessionState": {
                "dialogAction": {
                    "slotToElicit": "test slot to elicit",
                    "type": "test action type",
                },
                "intent": {
                    "state": "test state",
                    "confirmationState": "test state",
                    "slots": "test slots",
                },
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "test message",
                }
            ],
            "sessionId": "test id",
            "requestAttributes": "test attribute",
        }

        response = respond(
            intent_request,
            message="test message",
            fulfillment_state="test state",
            dialog_action_type="test action type",
            confirmation_state="test state",
            slots="test slots",
            slot_to_elicit="test slot to elicit",
            active_context=None,
        )
        self.assertEqual(expected_response, response)

    @patch.dict("os.environ", mock_env_variables)
    def test_check_last_order(self):
        from pizza_order.pizza_helpers import check_last_order
        from shared.client import get_client
        intent_request = {"requestAttributes": {"email": "test@example.com"}}
        dynamo_client = get_client("dynamodb")
        stubber = Stubber(dynamo_client)
        dynamo_expected_params = {
            "TableName": "test_table",
            "IndexName": "test_index",
            "KeyConditionExpression": "customerId = :email",
            "ExpressionAttributeValues": {":email": {"S": "test@example.com"}},
            "ScanIndexForward": False,
        }

        # last order exists
        dynamo_response = {
            "Items": [
                {
                    "customerId": {"S": "testValue"},
                    "testKey": {"S": "testValue"}
                }
            ]
        }
        stubber.add_response("query", dynamo_response, dynamo_expected_params)
        with stubber:
            has_order, response = check_last_order(intent_request)
            self.assertTrue(has_order)
            self.assertEqual(response, {"testKey": {"S": "testValue"}})
            stubber.assert_no_pending_responses()

        # last order doesn't exist
        dynamo_response = {"Items": []}
        stubber.add_response("query", dynamo_response, dynamo_expected_params)
        with stubber:
            has_order, response = check_last_order(intent_request)
            self.assertFalse(has_order)
            self.assertEqual(response, None)
            stubber.assert_no_pending_responses()

    @patch.dict("os.environ", mock_env_variables)
    @patch("pizza_order.pizza_helpers.time.time", return_value=1234)
    @patch(
        "pizza_order.pizza_helpers.get_fulfilled_message", return_value="test message"
    )
    @patch("pizza_order.pizza_helpers.respond")
    @patch("pizza_order.pizza_helpers.calculate_bill", return_value="1234")
    def test_place_order(
        self,
        mock_calculate_bill,
        mock_respond,
        mock_get_fulfilled_message,
        mock_time,
    ):
        from pizza_order.pizza_helpers import place_order
        from shared.client import get_client
        intent_request = {
            "requestAttributes": {"email": "test@example.com"},
            "sessionState": {
                "intent": {
                    "slots": {
                        "type": {"value": {"resolvedValues": ["testType"]}},
                        "size": {"value": {"resolvedValues": ["testSize"]}},
                        "crust": {"value": {"resolvedValues": ["testCrust"]}},
                        "count": {"value": {"resolvedValues": ["1234"]}},
                    }
                }
            },
            "bot": {"localeId": "en_US"},
        }
        dynamo_client = get_client("dynamodb")
        stubber = Stubber(dynamo_client)
        mock_logger = Mock()

        dynamo_expected_params = {
            "TableName": "test_table",
            "Item": {
                "orderId": {"S": "1234"},
                "orderTimestamp": {"N": "1234"},
                "customerId": {"S": "test@example.com"},
                "pizzaType": {"S": "testType"},
                "pizzaSize": {"S": "testSize"},
                "pizzaCrust": {"S": "testCrust"},
                "pizzaCount": {"N": "1234"},
                "botLanguage": {"S": "en_US"},
                "orderTotalBill": {"N": "1234"},
            },
        }
        dynamo_response = {
            "Attributes": {
                "orderId": {"S": "1234"},
                "orderTimestamp": {"N": "1234"},
                "customerId": {"S": "test@example.com"},
                "pizzaType": {"S": "testType"},
                "pizzaSize": {"S": "testSize"},
                "pizzaCrust": {"S": "testCrust"},
                "pizzaCount": {"N": "1234"},
                "botLanguage": {"S": "en_US"},
                "orderTotalBill": {"N": "1234.56"},
            },
        }
        stubber.add_response("put_item", dynamo_response, dynamo_expected_params)
        with stubber:
            place_order(intent_request, "1234", mock_logger)
            mock_respond.assert_called_with(
                intent_request,
                message="test message",
                fulfillment_state="Fulfilled",
                dialog_action_type="Close",
            )
            mock_logger.info.assert_called_with('Placed order with order ID: 1234')
            stubber.assert_no_pending_responses()
