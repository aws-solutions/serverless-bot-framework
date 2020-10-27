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

/**
 * Format the pizza menu for display to the customer by the bot, based on the language and menu
 * @param {string} lang - language of the Bot. This is set by the solution and passed with the event by the core lambda function
 * @param {array<Object>} menuItems - an array of object representing pizza menu items
 * @param {boolean} hasOrdersAnsNo - a flag to indecate the customer has order history, and answered "no" to the question "would you like to order the same order as the last one?".
 * @returns {string} response - response to be displayed
 */
const formatPizzaMenu = (lang, menuItems, hasOrdersAnsNo) => {
  let response;
  switch (lang) {
    case 'en-US':
      response = hasOrdersAnsNo
        ? `Our Pizza menu includes: `
        : `Welcome to our Pizza Ordering Service. Our Pizza menu includes: `;

      for (const item of menuItems) {
        response += `${item.T} Pizza (${item.D}). Price (Small: $${item.P[0]}, Medium: $${item.P[1]}, Large: $${item.P[2]}, Extra-large: $${item.P[3]}). `;
      }
      response += 'What type of pizza would you like?';
      return response;

    case 'pt-BR':
      response = hasOrdersAnsNo
        ? `Nosso menu de pizza inclui: `
        : `Bem-vindo ao nosso serviço de pedidos de pizza. Nosso menu de pizza inclui: `;

      for (const item of menuItems) {
        response += `${item.T} Pizza (${item.D}). Preço (Mini: $${item.P[0]}, Média: $${item.P[1]}, grande: $${item.P[2]}, Extra-grande: $${item.P[3]}). `;
      }
      response += 'Que tipo de pizze você gostaria?';
      return response;

    case 'es-US':
      response = hasOrdersAnsNo
        ? `Nuestro menú de Pizza incluye: `
        : `Bienvenido a nuestro servicio de pedidos de pizza. Nuestro menú de Pizza incluye: `;

      for (const item of menuItems) {
        response += `${item.T} Pizza (${item.D}). Precio (Pequeña: ${item.P[0]} $, Mediana: ${item.P[1]} $, Grande: ${item.P[2]} $, Extra-grande: ${item.P[3]} $). `;
      }
      response += 'Que tipo de pizza te gustaria?';
      return response;

    case 'fr-FR':
      response = hasOrdersAnsNo
        ? `Notre menu Pizza comprend: `
        : `Bienvenue dans notre service de commande de pizza. Notre menu Pizza comprend: `;

      for (const item of menuItems) {
        response += `Pizza ${item.T} (${item.D}). Prix (Petit: ${item.P[0]}$, Moyen: ${item.P[1]}$, Grand: ${item.P[2]}$, Très grand: ${item.P[3]}$). `;
      }
      response += 'Quel type de pizza souhaitez-vous?';
      return response;

    case 'it-IT':
      response = hasOrdersAnsNo
        ? `Il nostro menù Pizza comprende: `
        : `Benvenuti nel nostro servizio di ordinazione di pizze. Il nostro menù Pizza comprende: `;

      for (const item of menuItems) {
        response += `${item.T} Pizza (${item.D}). Prezzo (Piccola: $${item.P[0]}, Media: $${item.P[1]}, Grande: $${item.P[2]}, Extra-grande: $${item.P[3]}). `;
      }
      response += 'Che tipo di pizze vorresti?';
      return response;

    case 'de-DE':
      response = hasOrdersAnsNo
        ? `Unsere Pizza-Speisekarte beinhaltet: `
        : `Willkommen bei unserem Pizza-Bestellservice. Unsere Pizza-Speisekarte beinhaltet: `;

      for (const item of menuItems) {
        response += `${item.T} Pizza (${item.D}). Preis (Kleine: $${item.P[0]}, Mittlere: $${item.P[1]}, Große: $${item.P[2]}, Extra-große: $${item.P[3]}). `;
      }
      response += 'Welche Art von Pizze möchten Sie?';
      return response;

    case 'ru-RU':
      response = hasOrdersAnsNo
        ? `В нашем меню пиццы: `
        : `Добро пожаловать в нашу службу заказа пиццы. В нашем меню пиццы: `;

      for (const item of menuItems) {
        response += `${item.T} Пицца (${item.D}). Цена (Маленькая: $${item.P[0]}, Средняя: $${item.P[1]}, Большая: $${item.P[2]}, Очень-большая: $${item.P[3]}). `;
      }
      response += 'Какую пиццу вы хотите?';
      return response;

    default:
      throw new Error('menu-formatter.formatMenu: unspported language...');
  }
};

module.exports = formatPizzaMenu;
