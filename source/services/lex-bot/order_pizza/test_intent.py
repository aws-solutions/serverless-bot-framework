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
from unittest import TestCase, mock
from mock import patch
import botocore

mock_env_variables = {
    "botLanguage": "English",
    "orderPizzaLambdaARN": "testARN",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}

@patch.dict(os.environ, mock_env_variables)
class OrderPizzaIntentTest(TestCase):
    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_intent(self, mock_client):
        from order_pizza.intent import create_intent
        create_intent(locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateIntent",
            {
                "intentName": "PizzaOrder",
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_pizza_slot_type(self, mock_client):
        from order_pizza.intent import create_pizza_slot_type
        create_pizza_slot_type(
            slot_type_name="PizzaType", bot_language="English", locale_id="en_US", bot_id="testid1234"
        )
        mock_client.assert_called_with(
            "CreateSlotType",
            {
                "slotTypeName": "PizzaType",
                "description": "Type of pizza. Possible values are: [Greek, New York, Vegetarian]",
                "slotTypeValues": [
                    {"sampleValue": {"value": "Greek"}},
                    {"sampleValue": {"value": "New York"}},
                    {"sampleValue": {"value": "Vegetarian"}},
                ],
                "valueSelectionSetting": {"resolutionStrategy": "TopResolution"},
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_slot(self, mock_client):
        from order_pizza.intent import create_slot
        create_slot(
            slot_name="crust",
            slot_type_id="testid1234",
            intent_id="testid1234",
            locale_id="en_US",
            bot_id="testid1234",
        )
        mock_client.assert_called_with(
            "CreateSlot",
            {
                "slotName": "crust",
                "description": "crust information.",
                "slotTypeId": "testid1234",
                "valueElicitationSetting": {
                    "slotConstraint": "Required",
                    "promptSpecification": {
                        "messageGroups": [
                            {"message": {"plainTextMessage": {"value": "What crust would you like, (thin or thick)?"}}}
                        ],
                        "maxRetries": 5,
                        "allowInterrupt": True,
                    },
                },
                "obfuscationSetting": {"obfuscationSettingType": "None"},
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
                "intentId": "testid1234",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_update_order_intent(self, mock_client):
        from order_pizza.intent import update_order_intent
        update_order_intent(
            intent_id="testid1234",
            bot_id="testid1234",
            locale_id="en_US",
            slot_ids=["testid1234", "testid1234", "testid1234", "testid1234"],
        )
        mock_client.assert_called_with(
            "UpdateIntent",
            {
                "intentId": "testid1234",
                "intentName": "PizzaOrder",
                "description": "PizzaOrder intent created by serverless bot.",
                "sampleUtterances": [
                    {"utterance": "I would like tp order pizza"},
                    {"utterance": "order pizza"},
                    {"utterance": "pizza ordering"},
                    {"utterance": "pizza"},
                ],
                "dialogCodeHook": {"enabled": True},
                "fulfillmentCodeHook": {"enabled": True},
                "intentConfirmationSetting": {
                    "promptSpecification": {
                        "messageGroups": [{"message": {"plainTextMessage": {"value": "confirmed"}}}],
                        "maxRetries": 5,
                        "allowInterrupt": True,
                    },
                    "declinationResponse": {
                        "messageGroups": [{"message": {"plainTextMessage": {"value": "declined"}}}],
                        "allowInterrupt": True,
                    },
                },
                "slotPriorities": [
                    {"priority": 1, "slotId": "testid1234"},
                    {"priority": 2, "slotId": "testid1234"},
                    {"priority": 3, "slotId": "testid1234"},
                    {"priority": 4, "slotId": "testid1234"},
                ],
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("order_pizza.intent.update_order_intent")
    @patch("order_pizza.intent.create_pizza_slot_type", return_value="testid1234")
    @patch("order_pizza.intent.create_slot", return_value="testid1234")
    @patch("order_pizza.intent.create_intent", return_value={"intentId": "testid1234"})
    def test_create_appointment_intent(
        self,
        mock_create_intent,
        mock_create_slot,
        mock_create_pizza_slot_type,
        mock_update_order_intent,
    ):
        from order_pizza.intent import create_order_pizza_intent
        create_order_pizza_intent(bot_id="testid1234", locale_id="en_US")

        mock_create_intent.assert_called_with("testid1234", "en_US")
        mock_create_pizza_slot_type.assert_has_calls(
            [
                mock.call("PizzaType", "English", "testid1234", "en_US"),
                mock.call("PizzaSize", "English", "testid1234", "en_US"),
                mock.call("PizzaCrust", "English", "testid1234", "en_US"),
            ]
        )

        mock_create_slot.assert_has_calls(
            [
                mock.call("type", "testid1234", "testid1234", "en_US", "testid1234"),
                mock.call("size", "testid1234", "testid1234", "en_US", "testid1234"),
                mock.call("crust", "testid1234", "testid1234", "en_US", "testid1234"),
                mock.call("count", "AMAZON.Number", "testid1234", "en_US", "testid1234"),
            ]
        )

        mock_update_order_intent.assert_called_with(
            "testid1234", "testid1234", "en_US", ["testid1234", "testid1234", "testid1234", "testid1234"]
        )
