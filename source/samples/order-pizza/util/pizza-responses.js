/** ********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICNSE-2.0                                                                     *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 ******************************************************************************************************************** */
/**
 * @author Solution Builders
 */

const formatPizzaMenu = require('./menu-formatter');
const {
  validPizzaSizes,
  validPizzaCountResponse,
  validPizzaCrust,
  validConfirmationResponse,
} = require('./valid-inputs');

console.debug('Loading pizza-responses module....');

/**
 * Contains valid responses, for the supported languages by the Bot, based on the order flow
 * @type {object}
 */
const pizzaBotResponses = {
  /**
   * Generates resounse for the supported languages if the customer has order history
   * @param {string} lang - Langugae of the Bot
   * @param {array<object>} menuItems - array of objects representing pizza menu items
   * @param {object} customerLastOrder - an object of the customer's last order
   * @param {boolean} hasOrdersAnsNo -  flag used to indecate the customer has order history but answred no to the quesion: would you like to order the same order as the last one?
   * @returns {string} response - response to be displayed
   */
  STEP_0: (lang, menuItems, customerLastOrder, hasOrdersAnsNo = false) => {
    let response;
    if (customerLastOrder !== undefined) {
      const languageMessage = {
        'en-US': `Welcome back to our Pizza Ordering Service. Would you like to order the same order as your last one?. Type: ${customerLastOrder.pizzaType}, Size: ${customerLastOrder.pizzaSize}, Number of Pizzas: ${customerLastOrder.pizzaCount}, and Crust: ${customerLastOrder.pizzaCrust}, (yes or no)?`,
        'pt-BR': `Bem-vindo de volta ao nosso serviço de pedidos de pizza. Você gostaria de pedir o mesmo pedido do último?. Tipo: ${customerLastOrder.pizzaType}, Tamanho: ${customerLastOrder.pizzaSize}, Quantidade de Pizzas: ${customerLastOrder.pizzaCount}, e Borda: ${customerLastOrder.pizzaCrust}, (sim ou não)?`,
        'es-US': `Bienvenido de nuevo a nuestro servicio de pedidos de pizza. ¿Le gustaría hacer el mismo pedido que el último?. Tipo: ${customerLastOrder.pizzaType}, Size: ${customerLastOrder.pizzaSize}, Number of Pizzas: ${customerLastOrder.pizzaCount}, and Crust: ${customerLastOrder.pizzaCrust}, (si o no)?`,
        'fr-FR': `Bienvenue à notre service de commande de pizza. Souhaitez-vous commander la même commande que votre dernière?. Type: ${customerLastOrder.pizzaType}, Size: ${customerLastOrder.pizzaSize}, Number of Pizzas: ${customerLastOrder.pizzaCount}, and Crust: ${customerLastOrder.pizzaCrust}, (Oui ou non)?`,
        'it-IT': `Bentornati al nostro servizio di ordinazione di pizze. Vorresti ordinare lo stesso ordine del tuo ultimo?. Tipo: ${customerLastOrder.pizzaType}, Size: ${customerLastOrder.pizzaSize}, Number of Pizzas: ${customerLastOrder.pizzaCount}, and Crust: ${customerLastOrder.pizzaCrust}, (sì o no)?`,
        'de-DE': `Willkommen zurück bei unserem Pizza-Bestellservice. Möchten Sie die gleiche Bestellung wie Ihre letzte bestellen?. Art: ${customerLastOrder.pizzaType}, Size: ${customerLastOrder.pizzaSize}, Number of Pizzas: ${customerLastOrder.pizzaCount}, and Crust: ${customerLastOrder.pizzaCrust}, (ja oder Nein)?`,
        'ru-RU': `Добро пожаловать в нашу Службу заказа пиццы. Вы хотите заказать тот же заказ, что и ваш последний?. Тип: ${customerLastOrder.pizzaType}, Размер: ${customerLastOrder.pizzaSize}, Количество пицц: ${customerLastOrder.pizzaCount}, а также Корочка: ${customerLastOrder.pizzaCrust}, (да или нет)?`,
      };

      response = languageMessage[lang];
      return response;
    }
    return formatPizzaMenu(lang, menuItems, hasOrdersAnsNo);
  },

  /**
   * Contains STEP 2 responses of the order flow for the supported languages by the Bot
   * @type {object}
   */
  STEP_2: {
    'en-US':
      'What size would you like, (small, medium, large, or extra-large)?',
    'pt-BR':
      'Qual tamanho você gostaria, (pequeno, médio, grande ou extra-grande)?',
    'es-US':
      '¿Qué tamaño le gustaría (pequeño, mediano, grande o extra-grande)?',
    'fr-FR':
      'Quelle taille aimeriez-vous (petit, moyen, grand, ou très-grand)?',
    'it-IT': 'Che taglia vorresti, (piccola, media, grande o extra-grande)?',
    'de-DE': 'Welche Größe möchten Sie (klein, mittel, groß oder extra-groß)?',
    'ru-RU':
      'Какой размер вам нужен (маленький, средний, большой или очень-большой)?',
  },

  /**
   * Contains STEP 3 responses of the order flow for the supported languages by the Bot
   * @type {object}
   */
  STEP_3: {
    'en-US': 'How many pizzas would you like?',
    'pt-BR': 'Quantas pizzas você gostaria?',
    'es-US': '¿Cuántas pizzas te gustaría?',
    'fr-FR': 'Combien de pizzas souhaitez-vous?',
    'it-IT': 'Quante pizze vorresti?',
    'de-DE': 'Wie viele Pizzen möchten Sie?',
    'ru-RU': 'Сколько пиццы вы хотите?',
  },

  /**
   * Contains STEP 4 responses of the order flow for the supported languages by the Bot
   * @type {object}
   */
  STEP_4: {
    'en-US': 'What crust would you like, (thin or thick)?',
    'pt-BR': 'Que crosta você gostaria, (fina ou grossa)?',
    'es-US': '¿Qué corteza te gustaría, (fina o gruesa)?',
    'fr-FR': 'Quelle croûte aimeriez-vous (mince ou épaisse)?',
    'it-IT': 'Quale crosta vorresti, (sottile o spessa)?',
    'de-DE': 'Welche Kruste möchten Sie (dünn oder dick)?',
    'ru-RU': 'Какую корочку вы хотите (тонкий или толстую)?',
  },

  /**
   * Generates STEP 5 (order's summary) response for the supported languages by the Bot
   * @param {string} lang - Language of the Bot
   * @param {string} pizzaType - type of pizza requested by customer
   * @param {string} pizzaSize - size of pizza requested by customer
   * @param {string} pizzaCount - number of pizzas requested by customer
   * @param {string} pizzaCrust - crust of pizza requested by customer
   * @returns {string} - order's summary response
   */
  STEP_5: (lang, { pizzaType, pizzaSize, pizzaCount, pizzaCrust }) => {
    const languageMessage = {
      'en-US': `Here is a summary of your order. Type: ${pizzaType}, Size: ${pizzaSize}, Number of Pizzas: ${pizzaCount}, and Crust: ${pizzaCrust}. Would you like to place your order, (yes or no)?`,
      'pt-BR': `Aqui está um resumo do seu pedido. Tipo: ${pizzaType}, Tamanho: ${pizzaSize}, Quantidade de Pizzas: ${pizzaCount}, e Borda: ${pizzaCrust}. Você gostaria de fazer seu pedido, (sim ou não)?`,
      'es-US': `A continuación se muestra un resumen de su pedido. Tipo: ${pizzaType}, Tamaño: ${pizzaSize}, Numero de pizzas: ${pizzaCount}, y Corteza: ${pizzaCrust}. ¿Le gustaría realizar su pedido (si o no)?`,
      'fr-FR': `Voici un récapitulatif de votre commande. Type: ${pizzaType}, Taille: ${pizzaSize}, Nombre de pizzas: ${pizzaCount}, et croûte: ${pizzaCrust}. Souhaitez-vous passer votre commande (oui ou non)?`,
      'it-IT': `Ecco un riepilogo del tuo ordine. Tipo: ${pizzaType}, Taglia: ${pizzaSize}, Numero di pizze: ${pizzaCount}, e Crosta: ${pizzaCrust}. Vorresti effettuare l'ordine, (sì o no)?`,
      'de-DE': `Hier ist eine Zusammenfassung Ihrer Bestellung. Art: ${pizzaType}, Größe: ${pizzaSize}, Anzahl der Pizzen: ${pizzaCount}, und Kruste: ${pizzaCrust}. Möchten Sie Ihre Bestellung aufgeben (ja oder nein)?`,
      'ru-RU': `Вот краткое изложение вашего заказа. Тип: ${pizzaType}, Размер: ${pizzaSize}, Количество пицц: ${pizzaCount}, а также Корочка: ${pizzaCrust}. Вы бы хотели разместить заказ (да или нет)?`,
    };

    return languageMessage[lang];
  },

  /**
   * Generates STEP 6 (order confirmation) response for the supported languages by the Bot
   * @param {string} lang - Language of the Bot
   * @param {string} orderId - order's id generated by the Bot
   * @param {number} totalBill - order's total bill
   * @param {string} confirmation - order's confirmation response provided by customer to place the order (e.g. yes/no)
   * @returns {string} - order's confirmation response
   */
  STEP_6: ({ lang, orderId, totalBill, confirmation }) => {
    const languageYesRespones = {
      'en-US': `Your order has been placed. Here is the order's number: ${orderId}. Your total bill, including tax, is $${totalBill}. Thank you for using our service!`,
      'pt-BR': `Seu pedido foi feito. Aqui está o número do pedido: ${orderId}. Sua fatura total incluindo impostos é $${totalBill}. Obrigado por usar o nosso serviço!`,
      'es-US': `Su orden ha sido puesta. Aquí está el número de pedido: ${orderId}. Su factura total, incluidos los impuestos, es $${totalBill}. ¡Gracias por usar nuestro servicio!`,
      'fr-FR': `Votre commande a bien été reçue. Voici le numéro de commande: ${orderId}. Votre facture totale, taxes comprises, est $${totalBill}. Merci d'utiliser notre service!`,
      'it-IT': `Il tuo ordine è stato inoltrato. Ecco il numero dell'ordine: ${orderId}. Il conto totale comprensivo di tasse è $${totalBill}. Grazie per aver utilizzato il nostro servizio!`,
      'de-DE': `Deine Bestellung wurde aufgenommen. Hier ist die Bestellnummer: ${orderId}. Ihre Gesamtrechnung einschließlich Steuern beträgt $${totalBill}. Vielen Dank, dass Sie unseren Service nutzen!`,
      'ru-RU': `Ваш заказ был размещен. Вот номер заказа: ${orderId}. Ваш общий счет, включая налоги, составляет $${totalBill}. Спасибо, что воспользовались нашим сервисом!`,
    };

    const languageNoRespones = {
      'en-US': 'Your order has been cancelled. Thank you!',
      'pt-BR': 'Seu pedido foi cancelado. Obrigado!',
      'es-US': 'Tu pedido ha sido cancelado. ¡Gracias!',
      'fr-FR': 'Votre commande a été annulée. Je vous remercie!',
      'it-IT': 'Il tuo ordine è stato annullato. Grazie!',
      'de-DE': 'Ihre Bestellung wurde storniert. Dankeschön!',
      'ru-RU': 'Ваш заказ был отменен. Спасибо!',
    };

    const confirmationMessage = confirmation.trim().toLowerCase();
    /** If confirmation is yes */
    if (confirmationMessage === validConfirmationResponse[lang][0]) {
      return languageYesRespones[lang];
    }
    /** If confirmation is no */
    if (confirmationMessage === validConfirmationResponse[lang][1]) {
      return languageNoRespones[lang];
    }
    throw new Error(
      `pizza-responses.STEP_6: Unknown confirmationMessage: ${confirmationMessage}`
    );
  },
  /**
   * Contains Cancel responses of the order flow for the supported languages by the Bot, where the customer requested to cancel and end the order flow
   * @type {object}
   */
  CANCEL: {
    'en-US': 'The order flow has been canceled as requested. Thank you!',
    'pt-BR': 'O fluxo do pedido foi cancelado conforme solicitado. Obrigado!',
    'es-US':
      'El flujo de pedidos se ha cancelado según lo solicitado. ¡Gracias!',
    'fr-FR':
      'Le flux de commande a été annulé comme demandé. Je vous remercie!',
    'it-IT': 'Il flusso dell ordine è stato annullato come richiesto. Grazie!',
    'de-DE': 'Der Auftragsfluss wurde wie gewünscht storniert. Dankeschön!',
    'ru-RU': 'Поток заказов был отменен по запросу. Спасибо!',
  },
};

/**
 *
 * @param {string} id - id of the order's floe step, used by the Bot to collect the response from the customer
 * @param {string} text - message to be displayed by the Bot to the customer to request order's details or ask for valid inputs
 * @param {string} speech - message to be spoked by Polly to request order's details or ask for valid inputs (mostly same as text)
 * @param {object} payload - the modified event based by the Core lambda function
 * @param {boolean} endConversation - a flag used to inform the Core lambda that the pizza order flow is complete (true ends the flow)
 * @returns {object} - object based back to the Core lambda, containing order's context and other information as expected by the Core lambda
 */
const createResponse = (
  id,
  text,
  speech,
  payload,
  endConversation = false
) => ({
  asyncConversation: {
    id,
    payload,
    endConversation,
    ask: { text, speech },
  },
});

module.exports = {
  pizzaBotResponses,
  createResponse,
  validPizzaSizes,
  validPizzaCrust,
  validConfirmationResponse,
  validPizzaCountResponse,
};
