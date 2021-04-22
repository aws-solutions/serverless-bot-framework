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
from botocore.stub import Stubber

mock_env_variables = {
    "FEEDBACK_TABLE": "testtable",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
    "childDirected": "No",
}

@mock.patch.dict(os.environ, mock_env_variables)
class FeedbackTests(TestCase):
    def test_get_slot(self):
        from leave_feedback.leave_feedback_handler import get_slot
        intent_request = {
            "sessionState": {
                "intent": {
                    "slots": {
                        "firstName": {"value": {"interpretedValue": "testname"}},
                        "lastName": {"value": {"interpretedValue": "testlastname"}},
                        "feedback": {"value": {"interpretedValue": "testfeedback"}},
                    }
                }
            }
        }
        # Happy path
        response = get_slot(intent_request, "firstName")
        self.assertEqual(response, "testname")
        response = get_slot(intent_request, "lastName")
        self.assertEqual(response, "testlastname")
        response = get_slot(intent_request, "feedback")
        self.assertEqual(response, "testfeedback")
        # Slot key doesn't exist
        response = get_slot(intent_request, "nonExistentSlotKey")
        self.assertEqual(response, None)
        # intent_request object has incorrect format
        intent_request = {"testKey": {"testKey2": "test value"}}
        self.assertRaises(KeyError, get_slot, intent_request, "firstName")

    def test_get_session_attributes(self):
        from leave_feedback.leave_feedback_handler import get_session_attributes
        intent_request = {"sessionState": {"sessionAttributes": "testvalue"}}
        # Happy path
        response = get_session_attributes(intent_request)
        self.assertEqual(response, "testvalue")

        intent_request["sessionState"] = {}
        response = get_session_attributes(intent_request)
        self.assertEqual(response, {})
        # intent_request object doesn't have sessionState
        intent_request = {"testKey": "testvalue"}
        self.assertRaises(KeyError, get_session_attributes, intent_request)

    def test_close(self):
        from leave_feedback.leave_feedback_handler import close
        intent_request = {
            "sessionState": {"intent": {"state": ""}, "sessionAttributes": "testvalue"},
            "sessionId": "testvalue",
            "requestAttributes": "testvalue",
        }

        # Happy path
        response = close(intent_request, "Fulfilled")
        expected_response = {
            "sessionState": {
                "sessionAttributes": "testvalue",
                "dialogAction": {"type": "Close"},
                "intent": {"state": "Fulfilled"},
            },
            "messages": None,
            "sessionId": "testvalue",
            "requestAttributes": "testvalue",
        }
        self.assertEqual(response, expected_response)

    @mock.patch("uuid.uuid4", return_value=1234)
    @mock.patch("leave_feedback.leave_feedback_handler.close", return_value="testvalue")
    def test_save_feedback(self, mocked_close, mocked_uuid):
        from shared.client import get_client
        from leave_feedback.leave_feedback_handler import save_feedback
        intent_request = {
            "sessionState": {
                "intent": {
                    "slots": {
                        "firstName": {"value": {"interpretedValue": "testname"}},
                        "lastName": {"value": {"interpretedValue": "testlastname"}},
                        "feedback": {"value": {"interpretedValue": "testfeedback"}},
                    }
                }
            }
        }

        # Setting up boto3 client stubber
        dynamo_client = get_client("dynamodb")
        stubber = Stubber(dynamo_client)
        dynamo_expected_params = {
            "TableName": "testtable",
            "Item": {
                "uuid": {"S": "1234"},
                "FirstName": {"S": "testname"},
                "LastName": {"S": "testlastname"},
                "Feedback": {"S": "testfeedback"},
            },
        }

        dynamo_response = {
            "Attributes": {
                "uuid": {"S": "1234"},
                "FirstName": {"S": "testname"},
                "LastName": {"S": "testlastname"},
                "Feedback": {"S": "testfeedback"},
            },
        }
        stubber.add_response("put_item", dynamo_response, dynamo_expected_params)

        # Calling function and assertions
        with stubber:
            save_feedback(intent_request)
            mocked_close.assert_called_with(intent_request, "Fulfilled")
            mocked_uuid.assert_called()
            stubber.assert_no_pending_responses()

        stubber.add_client_error(
            "put_item", "ResourceNotFoundException", "Specified Table does not exist"
        )
        with stubber:
            save_feedback(intent_request)
            mocked_close.assert_called_with(intent_request, "Failed")
