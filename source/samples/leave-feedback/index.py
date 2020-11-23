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

import json
import os
import uuid
import boto3

dynamodb = boto3.client('dynamodb')
table_name = os.environ.get('DDB_TABLE_NAME', False)

def lambda_handler(event, context):
    result = ""

    if str(type(event)) == "<type 'unicode'>":
        event = json.loads(event)

    if event:
        step = event.get('step')
    else:
        step = None

    if step == None:
        step = 2
        event['step'] = step
        if event['lang'] == "pt-BR":
            result = "Olá, esta é a interação 1. Qual o seu nome?"

        elif event['lang'] == "es-US":
            result = "Hola, esta es la interacción 1. ¿Cuál es su nombre?"

        elif event['lang'] == "en-US":
            result = "Hello, this is the interaction 1. What's your name?"

        elif event['lang'] == "fr-FR":
            result = "Bonjour, ceci est l'interaction 1. Quel est votre nom?"

        elif event['lang'] == "it-IT":
            result = "Ciao, questo è l'interazione 1. Qual è il tuo nome?"

        elif event['lang'] == "de-DE":
            result = "Hallo, dies ist die Interaktion 1. Was ist Ihr Name?"

        elif event['lang'] == "ru-RU":
            result = "Здравствуйте, это взаимодействие 1. Каково ваше имя?"

        return {
            "asyncConversation": {
                "id": "name",
                "ask": {"text": result, "speech": result},
                "payload": event
            }
        }

    if step == 2:
        step = 3
        event['step'] = step
        if event['lang'] == "pt-BR":
            result = event['name']['response'] + ", esta é a interação 2. Qual o seu Sobrenome?"

        elif event['lang'] == "es-US":
            result = event['name']['response'] + ", esta es la interacción 2. ¿Cuál es su Apellido?"

        elif event['lang'] == "en-US":
            result = event['name']['response'] + ", this is the interaction 2. What is your last name?"

        elif event['lang'] == "fr-FR":
            result = event['name']['response'] + " c'est l'interaction 2. Quel est votre nom?"

        elif event['lang'] == "it-IT":
            result = event['name']['response'] + " questo è l'interazione 2. Qual è il tuo cognome?"

        elif event['lang'] == "de-DE":
            result = event['name']['response'] + " dies ist die Interaktion 2. Was ist Ihr Nachname?"

        elif event['lang'] == "ru-RU":
            result = event['name']['response'] + " это взаимодействие 2. Что такое ваша фамилия?"

        return {
            "asyncConversation": {
                "id": "last_name",
                "ask": {"text": result, "speech": result},
                "payload": event
            }
        }

    if step == 3:
        step = 4
        event['step'] = step
        if event['lang'] == "pt-BR":
            result = event['name']['response'] + " " + event['last_name']['response'] + ", esta é a interação 3. Qual a seu feedback?"

        elif event['lang'] == "es-US":
            result = event['name']['response'] + " " + event['last_name']['response'] + ", esta es la interacción 3. ¿Cuál es tu opinión?"

        elif event['lang'] == "en-US":
            result = event['name']['response'] + " " + event['last_name']['response'] + ", this is the interaction 3. What is your feedback?"

        elif event['lang'] == "fr-FR":
            result = event['name']['response'] + " " + event['last_name']['response'] + " c'est l'interaction 3. Quel est votre avis?"

        elif event['lang'] == "it-IT":
            result = event['name']['response'] + " " + event['last_name']['response'] + " questo è l'interazione 3. Qual è il tuo feedback??"

        elif event['lang'] == "de-DE":
            result = event['name']['response'] + " " + event['last_name']['response'] + " dies ist die Interaktion 3. Was ist Ihr Feedback?"

        elif event['lang'] == "ru-RU":
            result = event['name']['response'] + " " + event['last_name']['response'] + " это взаимодействие 3. Каковы ваши отзывы?"

        return {
            "asyncConversation": {
                "id": "pwd",
                "ask": {"text": result, "speech": result},
                "payload": event
            }
        }

    if step == 4:
        if (len(event['pwd']['response']) <= 50):
            
            step = 5
            event['step'] = step
            if event['lang'] == "pt-BR":
                result = "Sucesso! Esta é a interação 4, a conversa se encerra aqui."

            elif event['lang'] == "es-US":
                result = "Éxito! Esta es la interacción 4, la conversación se encierra aquí."

            elif event['lang'] == "en-US":
                result = "Success! This is interaction 4, the conversation ends here."

            elif event['lang'] == "fr-FR":
                result = "Succès! Ceci est l'interaction 4, la conversation se termine ici."

            elif event['lang'] == "it-IT":
                result = "Successo! Questo è l'interazione 4, la conversazione finisce qui."

            elif event['lang'] == "de-DE":
                result = "Erfolg! Dies ist die Interaktion 4, endet das Gespräch hier."

            elif event['lang'] == "ru-RU":
                result = "Успех! Это взаимодействие 4, разговор заканчивается."

            if table_name:
                try:
                    dynamodb.put_item(TableName=table_name, Item={
                        'uuid': {
                            'S': str(uuid.uuid4())
                        },
                        'FirstName' : {
                            'S': event['name']['response']
                        },
                        'LastName': {
                            'S': event['last_name']['response']
                        },
                        'Feedback': {
                            'S': event['pwd']['response']
                        }
                    })
                    print("successfully wrote to table: ", table_name)

                except Exception as e:
                    print(f"Unable to put item in table ${table_name}")
                    print("Error:", e)

            return {
                "asyncConversation": {
                    "id": "confirma",
                    "ask": {"text": result, "speech": result},
                    "payload": event,
                    "endConversation": True
                }
            }

        else:
            count = event.get('count')

            if count == None:
                count = 1
            else:
                count = count + 1

            step = 4
            event['step'] = step
            event['count'] = 1

            if count < 2:
                if event['lang'] == "pt-BR":
                    result = event['name']['response'] + " esta é a interação 4 e seu feedback é muito longo, você tem mais uma chance."

                elif event['lang'] == "es-US":
                    result = event['name']['response'] + " esta es la interacción 4, y sus comentarios son demasiado largos, tiene una oportunidad más."

                elif event['lang'] == "en-US":
                    result = event['name']['response'] + " this is interaction 4 and your feedback is too long, you have one more chance."

                elif event['lang'] == "fr-FR":
                    result = event['name']['response'] + " c'est l'interaction 4 et vos commentaires sont trop longs, vous avez encore une chance.."

                elif event['lang'] == "it-IT":
                    result = event['name']['response'] + " questo è l'interazione 4 e il tuo feedback è troppo lungo, hai un'altra possibilità."

                elif event['lang'] == "de-DE":
                    result = event['name']['response'] + " dies ist die Interaktion 4 und Ihr Feedback ist zu lang, Sie haben noch eine Chance."

                elif event['lang'] == "ru-RU":
                    result = event['name']['response'] + " это взаимодействие 4 и Ваш отзыв слишком длинный, у вас есть еще один шанс."

                return {
                    "asyncConversation": {
                        "id": "pwd",
                        "ask": {"text": result, "speech": result},
                        "payload": event
                    }
                }

            else:
                if event['lang'] == "pt-BR":
                    result = "Esta ainda é a interação 4, como você errou de novo a conversa encerra aqui."

                elif event['lang'] == "es-US":
                    result = "Esta todavía es la interacción 4, como usted erró de nuevo la conversación se cierra aquí."

                elif event['lang'] == "en-US":
                    result = "This is still interaction 4, as you missed again the conversation ends here."

                elif event['lang'] == "fr-FR":
                    result = "Ceci est encore l'interaction 4, que vous avez manqué à nouveau la conversation se termine ici."

                elif event['lang'] == "it-IT":
                    result = "Questo è ancora l'interazione 4, come ti sei perso ancora una volta la conversazione finisce qui."

                elif event['lang'] == "de-DE":
                    result = "Dies ist immer noch die Interaktion 4, wie Sie verpasst erneut das Gespräch endet hier."

                elif event['lang'] == "ru-RU":
                    result = "Это до сих пор взаимодействие 4, как вы пропустили снова разговор заканчивается."

                return {
                    "asyncConversation": {
                        "id": "pwd",
                        "ask": {"text": result, "speech": result},
                        "payload": event,
                        "endConversation": True
                    }
                }
