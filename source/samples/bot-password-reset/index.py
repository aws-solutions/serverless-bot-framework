# -*- coding: utf-8 -*-
from __future__ import print_function

import json

print('Loading function')

def lambda_handler(event, context):
    result = ""

    if str(type(event)) == "<type 'unicode'>":
        event = json.loads(event)

    if event:
        step = event.get('step')
    else:
        step = None

    if step == None:
        step = 2;
        event['step'] = step;
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
        step = 3;
        event['step'] = step;
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
        step = 4;
        event['step'] = step;
        if event['lang'] == "pt-BR":
            result = event['name']['response'] + " " + event['last_name']['response'] + ", esta é a interação 3. Qual a sua senha?"

        elif event['lang'] == "es-US":
            result = event['name']['response'] + " " + event['last_name']['response'] + ", esta es la interacción 3. ¿Cuál es su contraseña?"

        elif event['lang'] == "en-US":
            result = event['name']['response'] + " " + event['last_name']['response'] + ", this is the interaction 3. What is your password?"

        elif event['lang'] == "fr-FR":
            result = event['name']['response'] + " " + event['last_name']['response'] + " c'est l'interaction 3. Quel est votre mot de passe?"

        elif event['lang'] == "it-IT":
            result = event['name']['response'] + " " + event['last_name']['response'] + " questo è l'interazione 3. Qual è la vostra password?"

        elif event['lang'] == "de-DE":
            result = event['name']['response'] + " " + event['last_name']['response'] + " dies ist die Interaktion 3. Was ist Ihr Passwort?"

        elif event['lang'] == "ru-RU":
            result = event['name']['response'] + " " + event['last_name']['response'] + " это взаимодействие 3. Что такое пароль?"

        return {
            "asyncConversation": {
                "id": "pwd",
                "ask": {"text": result, "speech": result},
                "payload": event
            }
        }

    if step == 4:
        if ((event['pwd']['response'] == "1 2 3") or
            (event['lang'] == "pt-BR" and (event['pwd']['response'] == "um dois tres" or event['pwd']['response'] == "um dois três")) or
            (event['lang'] == "es-US" and event['pwd']['response'] == "uno dos tres") or
            (event['lang'] == "en-US" and event['pwd']['response'] == "one two three") or
            (event['lang'] == "fr-FR" and event['pwd']['response'] == "un deux trois") or
            (event['lang'] == "it-IT" and event['pwd']['response'] == "uno due tre") or
            (event['lang'] == "de-DE" and event['pwd']['response'] == "eins zwei drei") or
            (event['lang'] == "ru-RU" and event['pwd']['response'] == "один два три")):

            step = 5;
            event['step'] = step;
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

            step = 4;
            event['step'] = step;
            event['count'] = 1;

            if count < 2:
                if event['lang'] == "pt-BR":
                    result = event['name']['response'] + " esta é a interação 4 e a sua senha está inválida, você tem mais uma chance."

                elif event['lang'] == "es-US":
                    result = event['name']['response'] + " esta es la interacción 4, y su contraseña está invalida usted tiene otra oportunidad."

                elif event['lang'] == "en-US":
                    result = event['name']['response'] + " this is interaction 4 and your password is invalid, you have one more chance."

                elif event['lang'] == "fr-FR":
                    result = event['name']['response'] + " c'est l'interaction 4 et votre mot de passe est invalide, vous avez une chance de plus."

                elif event['lang'] == "it-IT":
                    result = event['name']['response'] + " questo è l'interazione 4 e la tua password non è valida, si ha una possibilità in più."

                elif event['lang'] == "de-DE":
                    result = event['name']['response'] + " dies ist die Interaktion 4 und Ihr Kennwort ist ungültig, Sie haben noch eine"

                elif event['lang'] == "ru-RU":
                    result = event['name']['response'] + " это взаимодействие 4 и ваш пароль неверен, у вас есть еще один шанс."

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
