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
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}

@patch.dict(os.environ, mock_env_variables)
class BookAppointmentIntentTest(TestCase):
    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_intent(self, mock_client):
        from book_appointment.intent import create_intent
        create_intent(locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateIntent",
            {
                "intentName": "MakeAppointment",
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_appointment_slot_type(self, mock_client):
        from book_appointment.intent import create_appointment_slot_type
        create_appointment_slot_type(bot_language="English", locale_id="en_US", bot_id="testid1234")
        mock_client.assert_called_with(
            "CreateSlotType",
            {
                "slotTypeName": "AppointmentTypeValue",
                "description": "Types of appointment",
                "slotTypeValues": [
                    {"sampleValue": {"value": "cleaning"}},
                    {"sampleValue": {"value": "root canal"}},
                    {"sampleValue": {"value": "whitening"}},
                ],
                "valueSelectionSetting": {"resolutionStrategy": "OriginalValue"},
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch("botocore.client.BaseClient._make_api_call")
    def test_create_appointment_slot(self, mock_client):
        from book_appointment.intent import create_appointment_slot
        create_appointment_slot(
            slot_name="testName",
            slot_type_id="testid1234",
            message_id="appointmentType",
            intent_id="testid1234",
            bot_language="English",
            locale_id="en_US",
            bot_id="testid1234",
        )
        mock_client.assert_called_with(
            "CreateSlot",
            {
                "slotName": "testName",
                "description": "testName information.",
                "slotTypeId": "testid1234",
                "valueElicitationSetting": {
                    "slotConstraint": "Required",
                    "promptSpecification": {
                        "messageGroups": [
                            {
                                "message": {
                                    "plainTextMessage": {
                                        "value": "What type of appointment would you like to schedule?"
                                    }
                                }
                            }
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
    def test_update_appointment_intent(self, mock_client):
        from book_appointment.intent import update_appointment_intent
        update_appointment_intent(
            bot_language="English",
            intent_id="testid1234",
            appointment_slot_id="testName",
            date_slot_id="testid1234",
            time_slot_id="appointmentType",
            bot_id="testid1234",
            locale_id="en_US",
        )
        mock_client.assert_called_with(
            "UpdateIntent",
            {
                "intentId": "testid1234",
                "intentName": "MakeAppointment",
                "description": "MakeAppointment intent created by serverless bot.",
                "sampleUtterances": [
                    {"utterance": "I would like to book an appointment"},
                    {"utterance": "Book an appointment"},
                    {"utterance": "Book a {AppointmentType}"},
                ],
                "dialogCodeHook": {"enabled": False},
                "fulfillmentCodeHook": {"enabled": False},
                "intentConfirmationSetting": {
                    "promptSpecification": {
                        "messageGroups": [
                            {
                                "message": {
                                    "plainTextMessage": {
                                        "value": "{Time} is available, should I go ahead and book your appointment?"
                                    }
                                }
                            }
                        ],
                        "maxRetries": 5,
                        "allowInterrupt": True,
                    },
                    "declinationResponse": {
                        "messageGroups": [
                            {"message": {"plainTextMessage": {"value": "Okay, I will not schedule an appointment."}}}
                        ],
                        "allowInterrupt": True,
                    },
                },
                "intentClosingSetting": {
                    "closingResponse": {
                        "messageGroups": [{"message": {"plainTextMessage": {"value": "Done."}}}],
                        "allowInterrupt": True,
                    }
                },
                "slotPriorities": [
                    {"priority": 1, "slotId": "testName"},
                    {"priority": 2, "slotId": "testid1234"},
                    {"priority": 3, "slotId": "appointmentType"},
                ],
                "botId": "testid1234",
                "botVersion": "DRAFT",
                "localeId": "en_US",
            },
        )

    @patch.dict(os.environ, mock_env_variables)
    @patch("book_appointment.intent.create_appointment_slot_type", return_value={"slotTypeId": "testid1234"})
    @patch("book_appointment.intent.create_appointment_slot", return_value={"slotId": "testid1234"})
    @patch("book_appointment.intent.update_appointment_intent")
    @patch("book_appointment.intent.create_intent", return_value={"intentId": "testid1234"})
    def test_create_appointment_intent(
        self,
        mock_create_intent,
        mock_update_appointment_intent,
        mock_create_appointment_slot,
        mock_create_appointment_slot_type,
    ):
        from book_appointment.intent import create_appointment_intent
        create_appointment_intent(bot_id="testid1234", locale_id="en_US")
        mock_create_appointment_slot_type.assert_called_with("English", "testid1234", "en_US")
        mock_create_intent.assert_called_with("testid1234", "en_US")
        mock_create_appointment_slot.assert_has_calls(
            [
                mock.call("Time", "AMAZON.Time", "time", "English", "testid1234", "en_US", "testid1234"),
                mock.call("Date", "AMAZON.Date", "date", "English", "testid1234", "en_US", "testid1234"),
                mock.call(
                    "AppointmentType", "testid1234", "appointmentType", "English", "testid1234", "en_US", "testid1234"
                ),
            ]
        )
        mock_update_appointment_intent.assert_called_with(
            "English",
            "testid1234",
            "testid1234",
            "testid1234",
            "testid1234",
            "testid1234",
            "en_US",
        )
