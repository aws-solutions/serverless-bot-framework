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
import logging
from random import randint
import requests
from shared.client import get_client

logger = logging.getLogger(__name__)
ssm = get_client("ssm")


api_provider = os.environ.get("API_PROVIDER", False)
ssm_key = os.environ.get("SSM_REFERENCE_TO_API_KEY", "")
api_key = ""

if api_provider:
    try:
        api_key = ssm.get_parameter(Name=ssm_key, WithDecryption=True)["Parameter"][
            "Value"
        ]
    except Exception as e:
        logger.error("Parameter not found in SSM")
        logger.error(e)
        api_key = ""


def random_weather():

    min = randint(15, 38) # NOSONAR using random generator is safe here
    max = min + randint(1, 5) # NOSONAR using random generator is safe here

    return {"temp_min": min, "temp_max": max}


def accuweather_api_forecast(city):
    base = "https://dataservice.accuweather.com/"
    try:
        city_query = f"locations/v1/cities/search?apikey={api_key}&q={city}"
        response = requests.get(f"{base}{city_query}")
        response.raise_for_status()

        response_json = response.json()

        if len(response_json) == 0 or "Key" not in response_json[0]:
            raise Exception("No data for that city.")

        city_id = response_json[0]["Key"]

        forecast_query = (
            f"forecasts/v1/daily/1day/{city_id}?apikey={api_key}&metric=true"
        )

        response = requests.get(f"{base}{forecast_query}")
        response.raise_for_status()

        current_weather = response.json()["DailyForecasts"][0]["Temperature"]

        temp_max = current_weather["Maximum"]["Value"]
        temp_min = current_weather["Minimum"]["Value"]

        return {"temp_min": temp_min, "temp_max": temp_max}

    except Exception as e:
        logger.error(e)
        raise Exception("API_ERROR")


def openweather_api_forecast(city):
    try:

        forecast_query = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
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
        logger.error(e)
        raise Exception("API_ERROR")


def get_weather_forecast(city, api_provider):
    if api_provider == "OpenWeather":
        return openweather_api_forecast(city)
    elif api_provider == "AccuWeather":
        return accuweather_api_forecast(city)
    elif api_provider == False:
        return random_weather()
    else:
        logger.error("Invalid API_PROVIDER")
        raise Exception("Invalid API_PROVIDER")


def handle_weather(intent_request):
    intent = intent_request["sessionState"]["intent"]
    lang = intent_request["bot"]["localeId"]
    result = ""
    forecast = {}

    try:
        city = intent["slots"]["City"]["value"]["resolvedValues"][0]
        forecast = get_weather_forecast(city, api_provider)
        intent["state"] = "Fulfilled"

        temp_min = forecast["temp_min"]
        temp_max = forecast["temp_max"]
        # Use imperial system
        if lang in ["en_US", "es_US"]:
            temp_min = int(int(forecast["temp_min"]) * 9 / 5) + 32
            temp_max = int(int(forecast["temp_max"]) * 9 / 5) + 32


        if lang == "es_US":
            result = "La previsión del tiempo para hoy en la ciudad de %s es de máxima de %s y mínima de %s." % (
                city,
                temp_max,
                temp_min,
            )

        elif lang == "en_US":
            result = "The weather forecast for today in the city of %s is maximum of %s and minimum of %s." % (
                city,
                temp_max,
                temp_min,
            )

        elif lang == "fr_FR":
            result = "Les prévisions météo pour aujourd'hui dans la ville de %s est le maximum %s et un minimum %s." % (
                city,
                temp_max,
                temp_min,
            )

        elif lang == "it_IT":
            result = "Le forecasti meteo per oggi nella città di %s è il massimo: %s e minimo di %s." % (
                city,
                temp_max,
                temp_min,
            )

        elif lang == "de_DE":
            result = "Die Wettervorhersage für heute in der Stadt %s ist das Maximum von %s und mindestens %s." % (
                city,
                temp_max,
                temp_min,
            )

        elif lang == "ja_JP":
            result = "今日の%sの予報は、最高気温が%s度、最低気温が%s度です。" %(
                city,
                temp_max,
                temp_min,
            )
        else:
            raise ValueError(f"Unsupported language. Parameter `lang: {lang}` is not supported.")

    except Exception as e:
        logger.error(e)
        intent["state"] = "Failed"
        if lang == "es_US":
            result = "No encontré el dado deseado."

        elif lang == "fr_FR":
            result = "Je ne trouve pas les données souhaitées."

        elif lang == "it_IT":
            result = "Non ho trovato i dati desiderati."

        elif lang == "de_DE":
            result = "Ich habe nicht die gewünschten Daten finden."

        elif lang == "en_US":
            result = "I could not find the desired data."

        else:
            result = "Oops! Error!"

    return {
        "sessionState": {
            "dialogAction": {"type": "Close"},
            "intent": intent,
        },
        "messages": [
            {
                "contentType": "PlainText",
                "content": result,
            }
        ],
        "sessionId": intent_request["sessionId"],
        "requestAttributes": intent_request["requestAttributes"]
        if "requestAttributes" in intent_request
        else None,
    }
