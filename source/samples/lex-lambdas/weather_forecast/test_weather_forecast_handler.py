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
from unittest import mock, TestCase
from unittest.mock import patch, Mock


mock_env_variables = {
    "SSM_REFERENCE_TO_API_KEY": "testSSMKey",
    "AWS_SDK_USER_AGENT": '{ "user_agent_extra": "AwsSolution/1234/1.6.0" }',
}

class TestWeatherForecast(TestCase):

    @patch("weather_forecast.weather_forecast_handler.randint", side_effect=[10, 20])
    def test_random_weather(self, mock_randint):
        from weather_forecast.weather_forecast_handler import random_weather
        response = random_weather()
        mock_randint.assert_has_calls([mock.call(15, 38), mock.call(1, 5)])
        self.assertEqual(response, {"temp_min": 10, "temp_max": 30})

    @patch.dict("os.environ", mock_env_variables)
    @patch("requests.get")
    @patch("botocore.client.BaseClient._make_api_call")
    def test_accuweather_api_forecast(self, mock_client, mock_get):
        from weather_forecast.weather_forecast_handler import accuweather_api_forecast
        weather_mock_object = [Mock(), Mock()]
        # constructing response for first request.get call
        weather_mock_object[0].json.return_value = [{"Key": "testCityKey"}]
        # constructing response for second request.get call
        weather_mock_object[1].json.return_value = {
            "Key": "testCityKey",
            "DailyForecasts": [{
                "Temperature": {
                    "Maximum": {"Value": 20},
                    "Minimum": {"Value": 10},
                }
            }]
        }
        mock_get.side_effect = weather_mock_object

        response = accuweather_api_forecast("testCity")
        expected_city_url = "https://dataservice.accuweather.com/locations/v1/cities/search?apikey=&q=testCity"
        expected_weather_url = "https://dataservice.accuweather.com/forecasts/v1/daily/1day/testCityKey?apikey=&metric=true"
        mock_get.assert_has_calls([
            mock.call(expected_city_url),
            mock.call(expected_weather_url),
        ])
        self.assertEqual(response, {"temp_min": 10, "temp_max": 20})

    @patch.dict("os.environ", mock_env_variables)
    @patch("requests.get")
    def test_openweather_api_forecast(self, mock_get):
        from weather_forecast.weather_forecast_handler import openweather_api_forecast
        weather_mock_object = [Mock()]
        weather_mock_object[0].json.return_value = {
            "cod": 200,
            "main": {
                "temp_max": 20,
                "temp_min": 10,
            }
        }
        mock_get.side_effect = weather_mock_object

        response = openweather_api_forecast("testCity")
        mock_get.assert_called_with(
            "https://api.openweathermap.org/data/2.5/weather?q=testCity&appid=&units=metric"
        )
        self.assertEqual(response, {"temp_min": 10, "temp_max": 20})


    @patch("weather_forecast.weather_forecast_handler.random_weather")
    @patch("weather_forecast.weather_forecast_handler.accuweather_api_forecast")
    @patch("weather_forecast.weather_forecast_handler.openweather_api_forecast")
    def test_get_weather_forecast(
        self,
        mock_openweather_api_forecast,
        mock_accuweather_api_forecast,
        mock_random_weather,
    ):
        from weather_forecast.weather_forecast_handler import get_weather_forecast
        get_weather_forecast("testCity", "OpenWeather")
        mock_openweather_api_forecast.assert_called_with("testCity")

        get_weather_forecast("testCity", "AccuWeather")
        mock_accuweather_api_forecast.assert_called_with("testCity")

        self.assertRaises(Exception, get_weather_forecast, "testCity", "Invalid")

        get_weather_forecast("testCity", False)
        mock_random_weather.assert_called()


    @patch("weather_forecast.weather_forecast_handler.get_weather_forecast", return_value={
        "temp_max": 20, "temp_min": 10
    })
    def test_handle_weather(self, mock_get_weather):
        from weather_forecast.weather_forecast_handler import handle_weather
        intent_request = {
            "sessionState": {
                "intent": {
                    "slots": {
                        "City": {
                            "value": {
                                "resolvedValues": ["testCity"]
                            }
                        }
                    }
                }
            },
            "bot": {
                "localeId": "en_US"
            },
            "sessionId": "testId"
        }
        expected_response = {
            "sessionState": {
                "dialogAction": {"type": "Close"},
                "intent": {
                    "slots": {
                        "City": {
                            "value": {
                                "resolvedValues": ["testCity"]
                            }
                        }
                    },
                    "state": "Fulfilled",
                }
            },
            "messages": [
                {
                    "contentType": "PlainText",
                    "content": "The weather forecast for today in the city of testCity is maximum of 68 and minimum of 50.",
                }
            ],
            "sessionId": "testId",
            "requestAttributes": None
        }
        response = handle_weather(intent_request)
        mock_get_weather.assert_called_with("testCity", False)
        self.assertEqual(response, expected_response)

        intent_request["bot"]["localeId"] = "es_US"
        expected_response["messages"][0]["content"] = "La previsión del tiempo para hoy en la ciudad de testCity es de máxima de 68 y mínima de 50."
        response = handle_weather(intent_request)
        self.assertEqual(response, expected_response)

        intent_request["bot"]["localeId"] = "fr_FR"
        expected_response["messages"][0]["content"] = "Les prévisions météo pour aujourd'hui dans la ville de testCity est le maximum 20 et un minimum 10."
        response = handle_weather(intent_request)
        self.assertEqual(response, expected_response)

        intent_request["bot"]["localeId"] = "it_IT"
        expected_response["messages"][0]["content"] = "Le forecasti meteo per oggi nella città di testCity è il massimo: 20 e minimo di 10."
        response = handle_weather(intent_request)
        self.assertEqual(response, expected_response)

        intent_request["bot"]["localeId"] = "de_DE"
        expected_response["messages"][0]["content"] = "Die Wettervorhersage für heute in der Stadt testCity ist das Maximum von 20 und mindestens 10."
        response = handle_weather(intent_request)
        self.assertEqual(response, expected_response)
