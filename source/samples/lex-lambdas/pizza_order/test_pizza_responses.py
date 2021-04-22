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
from unittest import TestCase
from unittest.mock import Mock, patch
from pizza_order.pizza_responses import (
    get_menu_message,
    get_repeat_message,
    get_confirmation_message,
    get_fulfilled_message,
    get_cancel_message,
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class PizzaResponsesTests(TestCase):
    def test_get_menu_message(self):
        # English
        expected_response = "Our Pizza menu includes: Greek Pizza (Toppings: feta, spinach, and olives). Price (Small: 10, Medium: 13, Large: 16, Extra-large: 19). New York Pizza (Toppings: tomato sauce, and mozzarella cheese). Price (Small: 11, Medium: 13, Large: 17, Extra-large: 20). Vegetarian Pizza (Toppings: black olives, bell pepper, tomatoes, and mushrooms). Price (Small: 9, Medium: 12, Large: 15, Extra-large: 18). What type of pizza would you like?"
        response = get_menu_message("en_US", False)
        self.assertEqual(expected_response, response)

        expected_response = (
            "Welcome to our Pizza Ordering Service. " + expected_response
        )
        response = get_menu_message("en_US", True)
        self.assertEqual(expected_response, response)

        # French
        expected_response = "Notre menu Pizza comprend: Grecque Pizza (Garnitures: feta, épinards et olives). Prix (Petit: 10, Moyen: 13, Grand: 16, Très grand: 19). New York Pizza (Garnitures: sauce tomate et fromage mozzarella). Prix (Petit: 11, Moyen: 13, Grand: 17, Très grand: 20). végétarienne Pizza (Garnitures: olives noires, poivrons, tomates et champignons). Prix (Petit: 9, Moyen: 12, Grand: 15, Très grand: 18). Quel type de pizza souhaitez-vous?"
        response = get_menu_message("fr_FR", False)
        self.assertEqual(expected_response, response)
        expected_response = (
            "Bienvenue dans notre service de commande de pizza. " + expected_response
        )
        response = get_menu_message("fr_FR", True)
        self.assertEqual(expected_response, response)

        # Spanish
        expected_response = "Nuestro menú de Pizza incluye: Griega Pizza (Ingredientes: queso feta, espinacas y aceitunas pizza griega). Precio (Pequeña: 10, Mediana: 13, Grande: 16, Extra-grande: 19). Nueva York Pizza (Ingredientes: salsa de tomate y queso mozzarella). Precio (Pequeña: 11, Mediana: 13, Grande: 17, Extra-grande: 20). vegetariana Pizza (Ingredientes: aceitunas negras, pimiento morrón, tomates y champiñones). Precio (Pequeña: 9, Mediana: 12, Grande: 15, Extra-grande: 18). Que tipo de pizza te gustaria?"
        response = get_menu_message("es_US", False)
        self.assertEqual(expected_response, response)
        expected_response = (
            "Bienvenido a nuestro servicio de pedidos de pizza. " + expected_response
        )
        response = get_menu_message("es_US", True)
        self.assertEqual(expected_response, response)

        # Italian
        expected_response = "Il nostro menù Pizza comprende: Greca Pizza (Condimenti: feta, spinaci e olive). Prezzo (Piccola: 10, Media: 13, Grande: 16, Extra-grande: 19). New York Pizza (Condimenti: salsa di pomodoro e mozzarella). Prezzo (Piccola: 11, Media: 13, Grande: 17, Extra-grande: 20). vegetariana Pizza (Condimenti: olive nere, peperone, pomodori e funghi). Prezzo (Piccola: 9, Media: 12, Grande: 15, Extra-grande: 18). Che tipo di pizze vorresti?"
        response = get_menu_message("it_IT", False)
        self.assertEqual(expected_response, response)

        expected_response = (
            "Benvenuti nel nostro servizio di ordinazione di pizze. "
            + expected_response
        )
        response = get_menu_message("it_IT", True)
        self.assertEqual(expected_response, response)

        # German
        expected_response = "Unsere Pizza-Speisekarte beinhaltet: Griechische Pizza (Belag: Feta, Spinat und Oliven). Preis (Kleine: 10, Mittlere: 13, Große: 16, Extra-große: 19). New Yorker Pizza (Belag: Tomatensauce und Mozzarella). Preis (Kleine: 11, Mittlere: 13, Große: 17, Extra-große: 20). Vegetarische Pizza (Belag: schwarze Oliven, Paprika, Tomaten und Pilze). Preis (Kleine: 9, Mittlere: 12, Große: 15, Extra-große: 18). Welche Art von Pizze möchten Sie?"
        response = get_menu_message("de_DE", False)
        self.assertEqual(expected_response, response)

        expected_response = (
            "Willkommen bei unserem Pizza-Bestellservice. " + expected_response
        )
        response = get_menu_message("de_DE", True)
        self.assertEqual(expected_response, response)

    def test_get_repeat_message(self):
        last_order = {
            "pizzaType": {"S": "testType"},
            "pizzaSize": {"S": "testSize"},
            "pizzaCrust": {"S": "testCrust"},
            "pizzaCount": {"N": "1234"},
        }
        # English
        expected_response = "Welcome back to our Pizza Ordering Service. Would you like to order the same order as your last one?. Type: testType, Size: testSize, Number of Pizzas: 1234, and Crust: testCrust, (yes or no)?"
        response = get_repeat_message("en_US", last_order)
        self.assertEqual(expected_response, response)

        # Spanish
        expected_response = "Bienvenido de nuevo a nuestro servicio de pedidos de pizza. ¿Le gustaría hacer el mismo pedido que el último?. Tipo: testType, Size: testSize, Number of Pizzas: 1234, and Crust: testCrust, (si o no)?"
        response = get_repeat_message("es_US", last_order)
        self.assertEqual(expected_response, response)

        # French
        expected_response = "Bienvenue à notre service de commande de pizza. Souhaitez-vous commander la même commande que votre dernière?. Type: testType, Size: testSize, Number of Pizzas: 1234, and Crust: testCrust, (Oui ou non)?"
        response = get_repeat_message("fr_FR", last_order)
        self.assertEqual(expected_response, response)

        # Italian
        expected_response = "Bentornati al nostro servizio di ordinazione di pizze. Vorresti ordinare lo stesso ordine del tuo ultimo?. Tipo: testType, Size: testSize, Number of Pizzas: 1234, and Crust: testCrust, (sì o no)?"
        response = get_repeat_message("it_IT", last_order)
        self.assertEqual(expected_response, response)

        # German
        expected_response = "Willkommen zurück bei unserem Pizza-Bestellservice. Möchten Sie die gleiche Bestellung wie Ihre letzte bestellen?. Art: testType, Size: testSize, Number of Pizzas: 1234, and Crust: testCrust, (ja oder Nein)?"
        response = get_repeat_message("de_DE", last_order)
        self.assertEqual(expected_response, response)

    def test_get_confirmation_message(self):
        slots = {
            "type": {"value": {"resolvedValues": ["testType"]}},
            "size": {"value": {"resolvedValues": ["testSize"]}},
            "crust": {"value": {"resolvedValues": ["testCrust"]}},
            "count": {"value": {"resolvedValues": ["1234"]}},
        }
        # English
        expected_response = "Here is a summary of your order. Type: testType, Size: testSize, Number of Pizzas: 1234, and Crust: testCrust. Would you like to place your order, (yes or no)?"
        response = get_confirmation_message("en_US", slots)
        self.assertEqual(expected_response, response)

        # Spanish
        expected_response = "A continuación se muestra un resumen de su pedido. Tipo: testType, Tamaño: testSize, Numero de pizzas: 1234, y Corteza: testCrust. ¿Le gustaría realizar su pedido (si o no)?"
        response = get_confirmation_message("es_US", slots)
        self.assertEqual(expected_response, response)

        # French
        expected_response = "Voici un récapitulatif de votre commande. Type: testType, Taille: testSize, Nombre de pizzas: 1234, et croûte: testCrust. Souhaitez-vous passer votre commande (oui ou non)?"
        response = get_confirmation_message("fr_FR", slots)
        self.assertEqual(expected_response, response)

        # Italian
        expected_response = "Ecco un riepilogo del tuo ordine. Tipo: testType, Taglia: testSize, Numero di pizze: 1234, e Crosta: testCrust. Vorresti effettuare l'ordine, (sì o no)?"
        response = get_confirmation_message("it_IT", slots)
        self.assertEqual(expected_response, response)

        # German
        expected_response = "Hier ist eine Zusammenfassung Ihrer Bestellung. Art: testType, Größe: testSize, Anzahl der Pizzen: 1234, und Kruste: testCrust. Möchten Sie Ihre Bestellung aufgeben (ja oder nein)?"
        response = get_confirmation_message("de_DE", slots)
        self.assertEqual(expected_response, response)

    def test_get_fulfilled_message(self):
        order_id = "1234-1234"
        total_bill = "1234"

        # English
        expected_response = "Your order has been placed. Here is the order's number: 1234-1234. Your total bill, including tax, is $1234. Thank you for using our service!"
        response = get_fulfilled_message("en_US", order_id, total_bill)
        self.assertEqual(expected_response, response)

        # Spanish
        expected_response = "Su orden ha sido puesta. Aquí está el número de pedido: 1234-1234. Su factura total, incluidos los impuestos, es $1234. ¡Gracias por usar nuestro servicio!"
        response = get_fulfilled_message("es_US", order_id, total_bill)
        self.assertEqual(expected_response, response)

        # French
        expected_response = "Votre commande a bien été reçue. Voici le numéro de commande: 1234-1234. Votre facture totale, taxes comprises, est $1234. Merci d'utiliser notre service!"
        response = get_fulfilled_message("fr_FR", order_id, total_bill)
        self.assertEqual(expected_response, response)

        # Italian
        expected_response = "Il tuo ordine è stato inoltrato. Ecco il numero dell'ordine: 1234-1234. Il conto totale comprensivo di tasse è $1234. Grazie per aver utilizzato il nostro servizio!"
        response = get_fulfilled_message("it_IT", order_id, total_bill)
        self.assertEqual(expected_response, response)

        # German
        expected_response = "Deine Bestellung wurde aufgenommen. Hier ist die Bestellnummer: 1234-1234. Ihre Gesamtrechnung einschließlich Steuern beträgt $1234. Vielen Dank, dass Sie unseren Service nutzen!"
        response = get_fulfilled_message("de_DE", order_id, total_bill)
        self.assertEqual(expected_response, response)

    def test_get_cancel_message(self):

        # English
        expected_response = "Your order has been cancelled. Thank you!"
        response = get_cancel_message("en_US")
        self.assertEqual(expected_response, response)

        # Spanish
        expected_response = "Tu pedido ha sido cancelado. ¡Gracias!"
        response = get_cancel_message("es_US")
        self.assertEqual(expected_response, response)

        # French
        expected_response = "Votre commande a été annulée. Je vous remercie!"
        response = get_cancel_message("fr_FR")
        self.assertEqual(expected_response, response)

        # Italian
        expected_response = "Il tuo ordine è stato annullato. Grazie!"
        response = get_cancel_message("it_IT")
        self.assertEqual(expected_response, response)

        # German
        expected_response = "Ihre Bestellung wurde storniert. Dankeschön!"
        response = get_cancel_message("de_DE")
        self.assertEqual(expected_response, response)
