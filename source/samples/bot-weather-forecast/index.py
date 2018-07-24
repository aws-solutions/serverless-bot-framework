# -*- coding: utf-8 -*-
from __future__ import print_function

import boto3
from random import randint

def get_weather_forecast(city, units):
    try:
        min = randint(15, 38)
        max = min + randint(1, 5)
        if units == "imperial":
            min = randint(20, 90)
            max = min + randint(1, 8)

        return {"temp_min": str(min), "temp_max": str(max)}

    except Exception as e:
        print(e)
        raise Exception("API_ERROR")

def lambda_handler(event, context):
    result = ""

    try:
        city = event['city']
        units = 'imperial' if (event['lang'] == "en-US") else 'metric'
        forecast = get_weather_forecast(city, units)

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
        print(e)
        if event['lang'] == "pt-BR":
            result = "Não econtrei o dado desejado."

        elif event['lang'] == "es-US":
            result = "No encontré el dado deseado."

        elif event['lang'] == "en-US":
            result = "I could not find the desired data."

        elif event['lang'] == "fr-FR":
            result = "Je ne trouve pas les données souhaitées."

        elif event['lang'] == "it-IT":
            result = "Non ho trovato i dati desiderati."

        elif event['lang'] == "de-DE":
            result = "ch habe nicht die gewünschten Daten finden."

        elif event['lang'] == "ru-RU":
            result = "Я не нашел нужные данные"

    return {"text": result, "speech": result, "persistEntities": True}
