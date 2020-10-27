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
const orderFlow = require('./util/order-flow');

/**
 * The main Lambda function for the order-pizza microservice
 * @param {Object} event - The event passed by the Core Lambda function of the Serverless-Bot-Framework
 * @returns {Object} botReply - Response by the order-pizza function bassed on the orderFlow
 */
exports.handler = async (event) => {
  console.debug(
    `Raw event passed by the Core Lambda: ${JSON.stringify(event)}`
  );

  try {
    const botReply = await orderFlow(event);
    return botReply;
  } catch (error) {
    console.error(
      `PizzaOrdering Lambda: somthing went wrong: ${error.message}`
    );
    console.error(error.stack);
    /* Rethrow the error to the calling Core Lambda */
    throw error;
  }
};
