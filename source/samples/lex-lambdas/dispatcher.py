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
import logging
from leave_feedback.leave_feedback_handler import save_feedback
from pizza_order.pizza_order_handler import handle_pizza_order
from weather_forecast.weather_forecast_handler import handle_weather

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    '''
    Main handler function for the Lambda function that is integrated with Amazon Lex. Calls proper handler function based on detected intent from Amazon Lex.

    :param event: Event object that was sent by Amazon Lex
    :param context: Context object constructed by AWS Lambda service
    :returns: Constructed response object with compatible format to send to Amazon Lex.
    '''
    intent_name = event["sessionState"]["intent"]["name"]
    logger.info(f"Lex event with Intent Name: {intent_name}")
    if intent_name == "LeaveFeedback":
        return save_feedback(event)
    elif intent_name == "PizzaOrder":
        return handle_pizza_order(event)
    elif intent_name == "WeatherForecast":
        return handle_weather(event)

    raise Exception(f"Intent with name {intent_name} not supported")
