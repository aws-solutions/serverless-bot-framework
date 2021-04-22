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
from unittest import TestCase
from unittest.mock import Mock, patch


mock_env_variables = {
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}

@patch.dict(os.environ, mock_env_variables)
class DispatcherTests(TestCase):
    @patch("dispatcher.save_feedback")
    @patch("dispatcher.handle_weather")
    @patch("dispatcher.handle_pizza_order")
    def test_empty_slots(
        self, mock_handle_pizza_order, mock_handle_weather, mock_save_feedback
    ):
        from dispatcher import lambda_handler
        event = {"sessionState": {"intent": {"name": "LeaveFeedback"}}}
        context = {}
        lambda_handler(event, context)
        mock_save_feedback.assert_called_with(event)

        event["sessionState"]["intent"]["name"] = "PizzaOrder"
        lambda_handler(event, context)
        mock_handle_pizza_order.assert_called_with(event)

        event["sessionState"]["intent"]["name"] = "WeatherForecast"
        lambda_handler(event, context)
        mock_handle_weather.assert_called_with(event)

        event["sessionState"]["intent"]["name"] = "InvalidIntentName"
        self.assertRaises(Exception, lambda_handler, event, context)
