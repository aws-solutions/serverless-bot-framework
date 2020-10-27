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
const DynamoDBHelper = require('./dynamodb-helper');
const S3Helper = require('./s3-helper');

const pizzaOrdersTable = process.env.PIZZA_ORDERS_TABLE;

/**
 * Construct a message to the customer to ask for a valid input
 * @param {string} lang - language of the Bot
 * @param {array<string>} validInputs - an array of valid inputs, baded on the order's step.
 * @returns {string} - a message asking to choose one of the valid options
 */
const askForValidInput = (lang, validInputs) => {
  switch (lang) {
    case 'en-US':
      return `Please provide one of these options: ${JSON.stringify(
        validInputs
      )}`;

    case 'pt-BR':
      return `Forneça uma dessas opções: ${JSON.stringify(validInputs)}`;

    case 'es-US':
      return `Proporcione una de estas opciones: ${JSON.stringify(
        validInputs
      )}`;

    case 'fr-FR':
      return `Veuillez fournir l une de ces options: ${JSON.stringify(
        validInputs
      )}`;

    case 'it-IT':
      return `Fornisci una di queste opzioni: ${JSON.stringify(validInputs)}`;

    case 'de-DE':
      return `Bitte geben Sie eine dieser Optionen an: ${JSON.stringify(
        validInputs
      )}`;

    case 'ru-RU':
      return `Пожалуйста, укажите один из этих вариантов: ${JSON.stringify(
        validInputs
      )}`;

    default:
      throw new Error('pizza-responses.askForValidInput: Language Unknown...');
  }
};

/**
 * Calculate total bill of the customer's order
 * @param {number} pizzaPrice -  Price of the pizza (based on size) retrieved from the pizza menu
 * @param {string} numberOfPizzas - Response from the customer for the quesion: how many pizzas would you like?.
 * @param {number} tax - Tax, default 0.13
 * @returns {number} totalBill - a float number representing the total bill of the order
 */
const calculateTotalBill = (pizzaPrice, numberOfPizzas, tax = 0.13) => {
  try {
    const totalBill = pizzaPrice * parseInt(numberOfPizzas) * (1 + tax);
    return totalBill.toFixed(2);
  } catch (error) {
    console.error(
      `pizza-responses.calculateTotalPrice: error parsing ${numberOfPizzas}: ${error.message}`
    );
    /* Rethrow the error to the calling function */
    throw error;
  }
};

/**
 * Extract order's details from the raw event passed by the Core lambda
 * @param {object} event - raw event passed by the Core Lambda
 */
const extractOrderAttributes = (event) => {
  try {
    const orderAttributes = {
      customerId: event.userInfo.email,
      pizzaType: event.pizzaType.response.trim().toLowerCase(),
      pizzaSize: event.pizzaSize.response.trim().toLowerCase(),
      pizzaCount: event.pizzaCount.response.trim(),
      pizzaCrust: event.pizzaCrust.response.trim().toLowerCase(),
    };
    return orderAttributes;
  } catch (error) {
    console.error(
      `pizza-responses.extractOrderAttributes: error extracting order's attributes from: ${JSON.stringify(
        event
      )}: ${error.message}`
    );
    console.error(error.stack);
    /* Rethrow the error to the calling function */
    throw error;
  }
};

/**
 *  Get the pizza menus initailization file from S3 bucket
 * @param {string} menuBucket - S3 bucket name containing the menus json file
 * @param {string} menuFile - S3 file key of the menus json file
 * @returns {Object} - An obect containg the pizza menus
 */
const readPizzaMenusFileFromS3 = async (menuBucket, menuFile) => {
  const menus = await S3Helper.get(menuBucket, menuFile);
  return menus;
};

/**
 * Initialize the pizza-menus DynamoDB Table
 * @param {string} tableKey - The partition key of the DynamoDB table
 * @param {Object} menusData - The Object containing the menus to be stored in the tavle
 * @param {string} menusTable - Name of the DynamoDB Table used for pizza menus
 * @returns {Object} - response from the wrire operation to the DynamoDB table
 */
const initializeMenusTable = async (tableKey, menusData, menusTable) => {
  const res = await DynamoDBHelper.write(tableKey, menusData, menusTable);
  return res;
};

/**
 * Test if a value is empty
 * @param {*} value
 * @returns {boolean} - true if empty, false otherwise
 */
const isEmpty = (value) =>
  typeof value === 'undefined' ||
  value === null ||
  value === false ||
  !value.trim();

/**
 * Test if a string contains a valid number
 * @param {string} numberString - string to be tested
 * @returns {boolean} - true if string contains a valid number, false otherwise
 */
const isValidNumber = (numberString) =>
  !isEmpty(numberString) && !Number.isNaN(Number(numberString));

/**
 * Get pizza menus from a DynamoDB table. When the solution is deployed, the menus DynamoDB table will be empty.
 * The solution uses this function to populate the table in the first time the order-pizza service is used,
 * or when a re0initialization with a new menus file is required.
 * @param {string} tableKey - partition key's name of the DynamoDB table
 * @param {string} menuId - The menuId to be retrieved from the Table
 * @param {string} tableName - DynamoDB table name containing the pizza menus
 * @param {string} reInitialize - 'true' to force re-intializing the table, 'false' do not re-initialize
 * @param {string} menuBucket - S3 bukcet name containing the initialization json file
 * @param {string} menuFile - S3 file key - menus json file
 * @returns {Object} menu - Object containing the pizza menu data to be used
 */
const getPizzaMenuFromDynamoDB = async (
  tableKey,
  menuId,
  tableName,
  reInitialize,
  menuBucket,
  menuFile
) => {
  let menu;
  menu = await DynamoDBHelper.get(tableKey, menuId, tableName);
  if (reInitialize === 'true' || menu === undefined) {
    console.log(
      `Initializing pizzaMenusTable: ${tableName} with file ${menuFile} from Bucket: ${menuBucket}`
    );
    const menus = await readPizzaMenusFileFromS3(menuBucket, menuFile);
    const res = await initializeMenusTable(tableKey, menus, tableName);
    console.debug(`Response from initializeMenusTable: ${JSON.stringify(res)}`);
    menu = await DynamoDBHelper.get(tableKey, menuId, tableName);
  }

  return menu;
};

/**
 * Get the customer's order history from the orders DynamoDB table, using the global index
 * @param {string} customerId - customerId (i.e. email)
 * @param {string} globalIndexName - DynamoDB global index name
 * @returns {array<Object>} - an array of objects representing order history. If the customer has no order history, an empty array is returned
 */
const getCustomerOrderHistory = async (customerId, globalIndexName) => {
  const params = {
    tableName: pizzaOrdersTable,
    index: globalIndexName,
    queryKey: 'customerId',
    queryValue: customerId,
  };
  const customerOrders = await DynamoDBHelper.query(params);
  return customerOrders;
};

/**
 * Checks if the response given by the customet is to interrupt the ordder flow and cancel without placing an order.
 * @param {string} lang - Bot current language
 * @param {string} response - response given by the customer
 * @param {string} validCancelWord - valid cancel work for the Bot's language
 * @returns {boolean} - true -> cancel the flow, false -> continue
 */
const isEndOrderFlow = (response, validCancelWord) =>
  response.trim().toLowerCase() === validCancelWord;

module.exports = {
  askForValidInput,
  calculateTotalBill,
  extractOrderAttributes,
  isValidNumber,
  getPizzaMenuFromDynamoDB,
  getCustomerOrderHistory,
  isEndOrderFlow,
};
