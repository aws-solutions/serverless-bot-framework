# -*- coding: utf-8 -*-
####################################################################################################################
#  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           
#                                                                                                                    
#  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance     
#  with the License. A copy of the License is located at                                                             
#                                                                                                                    
#      http://www.apache.org/licenses/                                                                               
#                                                                                                                    
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES 
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    
#  and limitations under the License.                                                                                
####################################################################################################################/

# @author Solution Builders

import boto3
from moto import mock_ssm

import json
import os
from importlib import reload
import unittest
from unittest import mock
from unittest.mock import patch, Mock
import index

# OpenWeather cases
with open("tests/openweather_weather_query_toronto.json") as json_file:
    openweather_weather_query_valid = json.load(json_file)

with open("tests/openweather_weather_query_invalid.json") as json_file:
    openweather_weather_query_invalid = json.load(json_file)

openweather_valid_mock = [Mock()]
openweather_valid_mock[0].json.return_value = openweather_weather_query_valid

openweather_invalid_mock = [Mock()]
openweather_invalid_mock[0].json.return_value = openweather_weather_query_invalid

# AccuWeather cases
with open("tests/accuweather_city_query_toronto.json") as json_file:
    accuweather_city_query_valid = json.load(json_file)

with open("tests/accuweather_weather_query_toronto.json") as json_file:
    accuweather_weather_query_valid = json.load(json_file)

with open("tests/accuweather_city_query_invalid.json") as json_file:
    accuweather_city_query_invalid = json.load(json_file)

accuweather_valid_mock = [Mock(), Mock()]
accuweather_valid_mock[0].json.return_value = accuweather_city_query_valid
accuweather_valid_mock[1].json.return_value = accuweather_weather_query_valid

accuweather_invalid_mock = [Mock(), Mock()]
accuweather_invalid_mock[0].json.return_value = accuweather_city_query_invalid
accuweather_invalid_mock[1].json.return_value = []

class TestEnvVariablesUsedForAPISettings(unittest.TestCase):

    def test_no_api_provider(self):

        reload(index)

        self.assertEqual(index.api_provider, False)
        self.assertEqual(index.ssm_key, "")
        self.assertEqual(index.api_key, "")            

    @mock_ssm
    def test_ssm_key_provided_not_in_ssm(self):
        
        ssm_testing_param = "testing_parameter"
        
        with patch.dict('os.environ', {'API_PROVIDER': 'provider', 'SSM_REFERENCE_TO_API_KEY': ssm_testing_param}): 
            ssm = boto3.client('ssm')
            reload(index)
            self.assertEqual(index.api_provider, 'provider')
            self.assertEqual(index.ssm_key, ssm_testing_param)
            self.assertEqual(index.api_key, "")
    
    @mock_ssm
    def test_ssm_key_provided_is_in_ssm(self):
        
        ssm_testing_param = "testing_parameter"
        
        with patch.dict('os.environ', {'API_PROVIDER': 'provider', 'SSM_REFERENCE_TO_API_KEY': ssm_testing_param}): 
            ssm = boto3.client('ssm')
            ssm.put_parameter(
                Name = ssm_testing_param ,
                Value = "TESTING",
                Type = "SecureString"
            )

            reload(index)

            self.assertEqual(index.api_provider, 'provider')
            self.assertEqual(index.ssm_key, ssm_testing_param)
            self.assertEqual(index.api_key, "TESTING")

class TestGetWeatherForecast(unittest.TestCase):

    @mock_ssm
    def test_invalid_api_provider(self):
        reload(index)
        index.api_provider = 'invalid_provider'

        with self.assertRaises(Exception):
            index.get_weather_forecast("Toronto")

    @mock_ssm
    def test_no_provider(self):
        
        reload(index)
        
        result = {'temp_max': 99, 'temp_min': 2}
        mocked_request = mock.patch('index.random_weather', return_value=result)
        
        mocked_request.start()
        
        city = "Toronto"
        response = index.get_weather_forecast(city)
        
        mocked_request.stop()
        
        self.assertIsInstance(response, dict, "Invalid response type")
        self.assertIn("temp_max", response)
        self.assertEqual(response["temp_max"], 99)
        self.assertIn("temp_min", response)
        self.assertEqual(response["temp_min"], 2)
    
    @mock_ssm
    def test_openweather_called(self):
        
        reload(index)
        
        index.api_provider = 'OpenWeather'
        index.api_key = 'somekey'
            
        result = {'temp_max': 10, 'temp_min': 1}
        mocked_request = mock.patch('index.openweather_api_forecast', return_value=result)

        mocked_request.start()
        
        city = "Toronto"
        response = index.get_weather_forecast(city)
        
        mocked_request.stop()
        
        self.assertIsInstance(response, dict, "Invalid response type")
        self.assertIn("temp_max", response)
        self.assertEqual(response["temp_max"], 10)
        self.assertIn("temp_min", response)
        self.assertEqual(response["temp_min"], 1)
    
    @mock_ssm
    def test_accuweather_called(self):
        
        reload(index)
        
        index.api_provider = 'AccuWeather'
        index.api_key = 'somekey'
            
        result = {'temp_max': 50, 'temp_min': 20}
        mocked_request = mock.patch('index.accuweather_api_forecast', return_value=result)

        mocked_request.start()
        
        city = "Toronto"
        response = index.get_weather_forecast(city)
        
        mocked_request.stop()
        
        self.assertIsInstance(response, dict, "Invalid response type")
        self.assertIn("temp_max", response)
        self.assertEqual(response["temp_max"], 50)
        self.assertIn("temp_min", response)
        self.assertEqual(response["temp_min"], 20)

class TestAccuWeatherAPIForecast(unittest.TestCase):

    @mock.patch('requests.get')
    def test_valid_city_valid_api_key(self, fake_get):

        fake_get.side_effect = accuweather_valid_mock
        index.api_key = "somekey"

        city = "Toronto"
        response = index.accuweather_api_forecast(city)
        self.assertIsInstance(response, dict, "Invalid response type")
        self.assertIn("temp_max", response)
        self.assertEqual(response["temp_max"], 81)
        self.assertIn("temp_min", response)
        self.assertEqual(response["temp_min"], 67)

    @mock.patch('requests.get')
    def test_invalid_api_key(self, fake_get):

        fake_get.side_effect = accuweather_invalid_mock
        index.api_key = "invalidkey"
        
        with self.assertRaises(Exception):
            city = "Toronto"
            index.accuweather_api_forecast(city)

    @mock.patch('requests.get')
    def test_invalid_city_valid_api_key(self, fake_get):

        fake_get.side_effect = accuweather_invalid_mock
        index.api_key = "somekey"

        with self.assertRaises(Exception):
            city = "Hogwarts"
            index.accuweather_api_forecast(city)

class TestOpenWeatherAPIForecast(unittest.TestCase):

    @mock.patch('requests.get')
    def test_valid_city_valid_api_key(self, fake_get):

        fake_get.side_effect = openweather_valid_mock
        index.api_key = "somekey"

        city = "Toronto"
        response = index.openweather_api_forecast(city)
        self.assertIsInstance(response, dict, "Invalid response type")
        self.assertIn("temp_max", response)
        self.assertEqual(response["temp_max"], 30)
        self.assertIn("temp_min", response)
        self.assertEqual(response["temp_min"], 25)

    @mock.patch('requests.get')
    def test_invalid_api_key(self, fake_get):

        fake_get.side_effect = openweather_invalid_mock
        index.api_key = "invalidkey"
        
        with self.assertRaises(Exception):
            city = "Toronto"
            index.openweather_api_forecast(city)

    @mock.patch('requests.get')
    def test_invalid_city_valid_api_key(self, fake_get):

        fake_get.side_effect = openweather_invalid_mock
        index.api_key = "somekey"

        with self.assertRaises(Exception):
            city = "Hogwarts"
            index.openweather_api_forecast(city)

class TestLamdaHandler(unittest.TestCase):

    def test_invalid_event(self):

        event = "Invalid Event object"
        response = index.lambda_handler(event, None)
        self.assertEqual("Oops! Error!", response["text"])

        event = {"lang": "en-US"}
        response = index.lambda_handler(event, None)
        self.assertEqual("I could not find the desired data.", response["text"])
    
    def test_valid_event(self):

        result = {'temp_max': 50, 'temp_min': 20}
        mocked_request = mock.patch('index.get_weather_forecast', return_value=result)

        mocked_request.start()
        
        event = {"city" : "Toronto", "lang": "fr-FR"}
        response = index.lambda_handler(event, None)
        
        mocked_request.stop()
                
        self.assertIn("Les prévisions météo pour aujourd'hui dans la ville de Toronto est le maximum", response["text"])


if __name__ == "__main__":
    unittest.main()
