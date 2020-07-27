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
from random import randint
import os
import requests

ssm = boto3.client('ssm')


api_provider = os.environ.get("API_PROVIDER", False)
ssm_key = os.environ.get("SSM_REFERENCE_TO_API_KEY", "")
api_key = ""

if api_provider:
    try:
        api_key = ssm.get_parameter(
            Name = ssm_key,
            WithDecryption = True
        )["Parameter"]["Value"]
    except Exception as e:
        print("Parameter not found in SSM")
        print("Error:", e)
        api_key = ""

def random_weather():
    
    min = randint(15, 38)
    max = min + randint(1, 5)

    return {"temp_min": min, "temp_max": max}

def accuweather_api_forecast(city):
    base = "http://dataservice.accuweather.com/"
    try:
        
        city_query = f"locations/v1/cities/search?apikey={api_key}&q={city}"
        response = requests.get(f"{base}{city_query}")
        response.raise_for_status()

        response_json = response.json()

        if len(response_json) == 0 or "Key" not in response_json[0]:
            raise Exception("No data for that city.")
        
        city_id = response_json[0]["Key"]
        
        forecast_query = f"forecasts/v1/daily/1day/{city_id}?apikey={api_key}&metric=true"
        
        response = requests.get(f"{base}{forecast_query}")
        response.raise_for_status()

        current_weather = response.json()["DailyForecasts"][0]["Temperature"]

        temp_max = current_weather["Maximum"]["Value"]
        temp_min = current_weather["Minimum"]["Value"]

        return {"temp_min": temp_min, "temp_max": temp_max}

    except Exception as e:
        print("ERROR:", e)
        raise Exception("API_ERROR")

def openweather_api_forecast(city):
    try:
        
        forecast_query = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
        response = requests.get(forecast_query)
        response.raise_for_status()

        response_json = response.json()

        if response_json["cod"] == 404:
            raise Exception("No data for that city.")

        current_weather = response_json["main"]

        temp_max = current_weather["temp_max"]
        temp_min = current_weather["temp_min"]

        return {"temp_min": temp_min, "temp_max": temp_max}

    except Exception as e:
        print("ERROR:", e)
        raise Exception("API_ERROR")

def get_weather_forecast(city):

    if api_provider:

        if api_provider == "OpenWeather":
            return openweather_api_forecast(city)
        elif api_provider == "AccuWeather":
            return accuweather_api_forecast(city)
        else:
            print('Invalid API_PROVIDER')
            raise Exception("Invalid API_PROVIDER")
    else:
        return random_weather()

def lambda_handler(event, context):
    result = ""

    try:
        city = event['city']
        forecast = get_weather_forecast(city)
        
        # Use imperial system
        if (event['lang'] in ["en-US", "es-US"]):
            forecast["temp_min"] = (int(forecast["temp_min"]) * 9/5) + 32
            forecast["temp_max"] = (int(forecast["temp_max"]) * 9/5) + 32
        
        forecast["temp_min"], forecast["temp_max"] = int(forecast["temp_min"]), int(forecast["temp_max"])

        if event['lang'] == "pt-BR":
            result = "A previsão do tempo para hoje na cidade de %s é de máxima de %s e mínima de %s."%(city, forecast['temp_max'], forecast['temp_min'])

        elif event['lang'] == "es-US":
            result = "La previsión del tiempo para hoy en la ciudad de %s es de máxima de %s y mínima de %s."%(city, forecast['temp_max'], forecast['temp_min'])

        elif event['lang'] == "en-US":
            result = "The weather forecast for today in the city of %s is maximum of %s and minimum of %s."%(city, forecast['temp_max'], forecast['temp_min'])

        elif event['lang'] == "fr-FR":
            result = "Les prévisions météo pour aujourd'hui dans la ville de %s est le maximum %s et un minimum %s."%(city, forecast['temp_max'], forecast['temp_min'])

        elif event['lang'] == "it-IT":
            result = "Le forecasti meteo per oggi nella città di %s è il massimo: %s e minimo di %s."%(city, forecast['temp_max'], forecast['temp_min'])

        elif event['lang'] == "de-DE":
            result = "Die Wettervorhersage für heute in der Stadt %s ist das Maximum von %s und mindestens %s."%(city, forecast['temp_max'], forecast['temp_min'])

        elif event['lang'] == "ru-RU":
            result = "Прогноз погоды на сегодня в городе %s есть максимум %s и минимум %s."%(city, forecast['temp_max'], forecast['temp_min'])

    except Exception as e:
        if isinstance(event, dict) and "lang" in event:
            if event['lang'] == "pt-BR":
                result = "Não econtrei o dado desejado."

            elif event['lang'] == "es-US":
                result = "No encontré el dado deseado."

            elif event['lang'] == "fr-FR":
                result = "Je ne trouve pas les données souhaitées."

            elif event['lang'] == "it-IT":
                result = "Non ho trovato i dati desiderati."

            elif event['lang'] == "de-DE":
                result = "ch habe nicht die gewünschten Daten finden."

            elif event['lang'] == "ru-RU":
                result = "Я не нашел нужные данные"

            else:
                result = "I could not find the desired data."
        else:
            result = "Oops! Error!"

    return {"text": result, "speech": result, "persistEntities": True}