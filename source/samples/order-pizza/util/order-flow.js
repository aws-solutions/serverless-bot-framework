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

const {
  validPizzaSizes,
  validPizzaCrust,
  validConfirmationResponse,
  validPizzaCountResponse,
  validEndOrderFlowSignal,
} = require('./valid-inputs');
const {
  askForValidInput,
  calculateTotalBill,
  extractOrderAttributes,
  isValidNumber,
  getPizzaMenuFromDynamoDB,
  getCustomerOrderHistory,
  isEndOrderFlow,
} = require('./order-helpers');
const { pizzaBotResponses, createResponse } = require('./pizza-responses');
const formatPizzaMenu = require('./menu-formatter');
const generateOrderId = require('./orderId-generator');
const DynamoDBHelper = require('./dynamodb-helper');

console.debug('Loading order-flow module....');

const pizzaOrdersTable = process.env.PIZZA_ORDERS_TABLE;
const pizzaOrdersGIndexName = process.env.PIZZA_ORDERS_GLOBAL_INDEX_NAME;

/** Get the pizza menu (with pizzaMenuId) from the pizzaMenusTable */
const pizzaMenusTable = process.env.PIZZA_MENUS_TABLE;
const pizzaMenuId = process.env.PIZZA_MENU_ID;
const reInitializeMenusTable = process.env.RE_INITIALIZE_MENUS_TABLE || 'false';
const pizzaMenuInitializationBUCKET =
  process.env.PIZZA_MENUS_INITIALIZATION_BUCKET;
const pizzaMenuInitializationFile = process.env.PIZZA_MENUS_INITIALIZATION_FILE;

/**
 * Generates the order-pizza responses based of the order's flow
 * @param {Object} event -  Raw event passed by the order-pizza lambda function.
 * @returns {Object} - object containing the bot response as expected by the core lambda function
 */
const orderFlow = async (event) => {
  const { lang } = event;
  const step = event.orderStep || 'STEP_0';
  const maxNumberOfPizzaPerOrder = 100;
  let response;
  let orderSelection;
  let confirmation;
  let finalOrder;
  let orderId;
  let totalBill;
  let pizzaSizePrice;
  let pizzaFromMenu;

  const menu = await getPizzaMenuFromDynamoDB(
    'menuId',
    pizzaMenuId,
    pizzaMenusTable,
    reInitializeMenusTable,
    pizzaMenuInitializationBUCKET,
    pizzaMenuInitializationFile
  );
  console.debug(`Pizza Menus: ${JSON.stringify(menu)}`);
  /** Get the types of pizza from the menu Object */
  const pizzaTypes = menu.menuItems.map((pizza) => pizza.T.toLowerCase());
  console.log(`Pizza types: ${JSON.stringify(pizzaTypes)}`);

  /** Format the Menu for display */
  const formattedMenu = formatPizzaMenu(lang, menu.menuItems);
  console.debug(`Formatted Menus: ${JSON.stringify(formattedMenu)}`);

  /** Get customer order history */
  const customerId = event.userInfo.email;
  const customerOrderHistory = await getCustomerOrderHistory(
    customerId,
    pizzaOrdersGIndexName
  );

  /**
   * Since the customerOrderHistory is an array of orders in a descending order (by orderTimestamp),
   * the last order is at index 0. If the cusomer has no previous orders. The returned array will be empty,
   * and customerOrderHistory[0] will be undefined.
   */
  const customerLastOrder = customerOrderHistory[0];
  console.debug(
    `The last order by ${customerId} was: ${JSON.stringify(customerLastOrder)}`
  );

  switch (step) {
    case 'STEP_0':
      console.log(
        'STEP_0: Greeting, asking weather the customer wants the same order as the last one, or displaying menu.'
      );
      response = pizzaBotResponses.STEP_0(
        lang,
        menu.menuItems,
        customerLastOrder
      );

      if (customerLastOrder !== undefined) {
        event.orderStep = 'STEP_1';

        return createResponse('orderLastPizza', response, response, event);
      }
      event.orderStep = 'STEP_2';
      return createResponse('pizzaType', response, response, event);

    case 'STEP_1':
      console.log(
        'STEP_1: Checking if the customer wants the same order as the last one.'
      );
      confirmation = event.orderLastPizza.response.trim().toLowerCase();

      /** Check if the customer wants to cancel the order flow */
      if (isEndOrderFlow(confirmation, validEndOrderFlowSignal[lang])) {
        response = pizzaBotResponses.CANCEL[lang];
        return createResponse(
          'cancelOrderFlow',
          response,
          response,
          event,
          true
        );
      }
      /** Check the response of previous step is valid */
      if (!validConfirmationResponse[lang].includes(confirmation)) {
        response = askForValidInput(lang, validConfirmationResponse[lang]);
        return createResponse('orderLastPizza', response, response, event);
      }
      if (confirmation === validConfirmationResponse[lang][0]) {
        orderId = `${generateOrderId()}`;
        [pizzaFromMenu] = menu.menuItems.filter(
          (pizza) =>
            pizza.T.trim().toLowerCase() ===
            customerLastOrder.pizzaType.trim().toLowerCase()
        );
        pizzaSizePrice =
          pizzaFromMenu.P[
            validPizzaSizes[lang].indexOf(
              customerLastOrder.pizzaSize.trim().toLowerCase()
            )
          ];
        totalBill = calculateTotalBill(
          pizzaSizePrice,
          customerLastOrder.pizzaCount
        );
        finalOrder = {
          orderId,
          orderTimestamp: Date.now(),
          customerId: customerLastOrder.customerId,
          pizzaType: customerLastOrder.pizzaType.trim().toLowerCase(),
          pizzaSize: customerLastOrder.pizzaSize.trim().toLowerCase(),
          pizzaCount: customerLastOrder.pizzaCount.trim().toLowerCase(),
          pizzaCrust: customerLastOrder.pizzaCrust.trim().toLowerCase(),
          OrderTotalBill: totalBill,
          botLanguage: lang,
        };

        const res = await DynamoDBHelper.write(
          'orderId',
          finalOrder,
          pizzaOrdersTable
        );
        console.log(
          `STEP_1: response returned by DynamoDBHelper.write ${JSON.stringify(
            res
          )}`
        );
        response = pizzaBotResponses.STEP_6({
          lang,
          orderId,
          totalBill,
          confirmation,
        });
        return createResponse('finalStep', response, response, event, true);
      }

      event.orderStep = 'STEP_2';
      response = pizzaBotResponses.STEP_0(
        lang,
        menu.menuItems,
        undefined,
        true
      );
      return createResponse('pizzaType', response, response, event);

    case 'STEP_2':
      console.log('STEP_2: Checking if pizzaSize');
      /** Check if the customer wants to cancel the order flow */
      if (
        isEndOrderFlow(
          event.pizzaType.response.trim().toLowerCase(),
          validEndOrderFlowSignal[lang]
        )
      ) {
        response = pizzaBotResponses.CANCEL[lang];
        return createResponse(
          'cancelOrderFlow',
          response,
          response,
          event,
          true
        );
      }

      /** Check the response of previous step is valid */
      if (!pizzaTypes.includes(event.pizzaType.response.trim().toLowerCase())) {
        response = askForValidInput(lang, pizzaTypes);
        return createResponse('pizzaType', response, response, event);
      }
      console.log('STEP_2: asking what size of pizza.');
      event.orderStep = 'STEP_3';
      response = pizzaBotResponses.STEP_2[lang];
      return createResponse('pizzaSize', response, response, event);

    case 'STEP_3':
      /** Check if the customer wants to cancel the order flow */
      if (
        isEndOrderFlow(
          event.pizzaSize.response.trim().toLowerCase(),
          validEndOrderFlowSignal[lang]
        )
      ) {
        response = pizzaBotResponses.CANCEL[lang];
        return createResponse(
          'cancelOrderFlow',
          response,
          response,
          event,
          true
        );
      }

      /** Check the response of previous step is valid */
      if (
        !validPizzaSizes[lang].includes(
          event.pizzaSize.response.trim().toLowerCase()
        )
      ) {
        response = askForValidInput(lang, validPizzaSizes[lang]);
        return createResponse('pizzaSize', response, response, event);
      }
      console.log('STEP_3: asking how many pizzas.');
      event.orderStep = 'STEP_4';
      response = pizzaBotResponses.STEP_3[lang];
      return createResponse('pizzaCount', response, response, event);

    case 'STEP_4':
      /** Check if the customer wants to cancel the order flow */
      if (
        isEndOrderFlow(
          event.pizzaCount.response.trim().toLowerCase(),
          validEndOrderFlowSignal[lang]
        )
      ) {
        response = pizzaBotResponses.CANCEL[lang];
        return createResponse(
          'cancelOrderFlow',
          response,
          response,
          event,
          true
        );
      }

      /** Check the response of previous step is valid */
      if (
        !isValidNumber(event.pizzaCount.response.trim()) ||
        parseInt(event.pizzaCount.response.trim()) < 0 ||
        parseInt(event.pizzaCount.response.trim()) > maxNumberOfPizzaPerOrder
      ) {
        response = validPizzaCountResponse[lang];
        return createResponse('pizzaCount', response, response, event);
      }
      console.log('STEP_4: asking what crust of pizza.');
      event.orderStep = 'STEP_5';
      response = pizzaBotResponses.STEP_4[lang];
      return createResponse('pizzaCrust', response, response, event);

    case 'STEP_5':
      /** Check if the customer wants to cancel the order flow */
      if (
        isEndOrderFlow(
          event.pizzaCrust.response.trim().toLowerCase(),
          validEndOrderFlowSignal[lang]
        )
      ) {
        response = pizzaBotResponses.CANCEL[lang];
        return createResponse(
          'cancelOrderFlow',
          response,
          response,
          event,
          true
        );
      }

      /** Check the response of previous step is valid */
      if (
        !validPizzaCrust[lang].includes(
          event.pizzaCrust.response.trim().toLowerCase()
        )
      ) {
        response = askForValidInput(lang, validPizzaCrust[lang]);
        return createResponse('pizzaCrust', response, response, event);
      }
      console.log(
        'STEP_5: order summary and asking for confirmation to place the order.'
      );
      event.orderStep = 'STEP_6';
      orderSelection = extractOrderAttributes(event);
      response = pizzaBotResponses.STEP_5(lang, orderSelection);
      return createResponse('confirmation', response, response, event);

    case 'STEP_6':
      /** Check if the customer wants to cancel the order flow */
      if (
        isEndOrderFlow(
          event.confirmation.response.trim().toLowerCase(),
          validEndOrderFlowSignal[lang]
        )
      ) {
        response = pizzaBotResponses.CANCEL[lang];
        return createResponse(
          'cancelOrderFlow',
          response,
          response,
          event,
          true
        );
      }

      /** Check the response of previous step is valid */
      confirmation = event.confirmation.response.trim().toLowerCase();
      if (!validConfirmationResponse[lang].includes(confirmation)) {
        response = askForValidInput(lang, validConfirmationResponse[lang]);
        return createResponse('confirmation', response, response, event);
      }
      console.log('STEP_6: order placement and status confirmation.');
      event.orderStep = 'FINAL_STEP';
      if (confirmation === validConfirmationResponse[lang][0]) {
        orderId = `${generateOrderId()}`;
        finalOrder = {
          orderId,
          orderTimestamp: Date.now(),
          botLanguage: lang,
          ...extractOrderAttributes(event),
        };
        [pizzaFromMenu] = menu.menuItems.filter(
          (pizza) =>
            pizza.T.trim().toLowerCase() ===
            finalOrder.pizzaType.trim().toLowerCase()
        );
        pizzaSizePrice =
          pizzaFromMenu.P[
            validPizzaSizes[lang].indexOf(
              finalOrder.pizzaSize.trim().toLowerCase()
            )
          ];
        totalBill = calculateTotalBill(pizzaSizePrice, finalOrder.pizzaCount);
        finalOrder.OrderTotalBill = totalBill;

        const res = await DynamoDBHelper.write(
          'orderId',
          finalOrder,
          pizzaOrdersTable
        );
        console.log(
          `STEP_6: response returned by DynamoDBHelper.write ${JSON.stringify(
            res
          )}`
        );
      }
      response = pizzaBotResponses.STEP_6({
        lang,
        orderId,
        totalBill,
        confirmation,
      });
      return createResponse('finalStep', response, response, event, true);

    default:
      throw new Error('orderFlow - No valid step was provided!...');
  }
};

module.exports = orderFlow;
