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
const AWS = require('aws-sdk');

console.debug('Loading DynamoDBHelper class....');

/**
 * A Class to provide easy to use interface to the AWS DynamoDB DocumentClient
 */
class DynamoDBHelper {
  /**
   * Initializing AWS DynamoDB DocumentClient as a static class memebr to be used by the class's static methods
   */
  static documentClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION,
  });

  /**
   * Retrieves data from a DynamoDB table using he table's partition key
   * @param {string} primaryKey - the name of the partition key of the table
   * @param {string} primaryKeyValue -  the value of the partition key to be rerieved
   * @param {string} TableName - name of the DynamoDB table
   * @returns {object} - object containing the data, empty object if no match
   */
  static async get(primaryKey, primaryKeyValue, TableName) {
    const params = {
      TableName,
      Key: { [primaryKey]: primaryKeyValue },
    };

    try {
      const data = await this.documentClient.get(params).promise();
      console.debug(
        `DynamoDBHelper.get - get result of ${JSON.stringify(
          params
        )}: ${JSON.stringify(data)}`
      );

      return data.Item;
    } catch (error) {
      console.error(
        `DynamoDBHelper.get: error with getting item: ${JSON.stringify(
          params
        )}: ${error.message}`
      );
      console.error(error.stack);
      /* Rethrow the error to the calling function */
      throw error;
    }
  }

  /**
   * Query DynamoDB Index
   * @param {string} tableName - name of the DynamoDB table
   * @param {string} index - name of the DynamoDB table's index
   * @param {string} queryKey - name of partition key to be used in the query
   * @param {string} queryValue - value of partition key to be used in the query
   * @param {boolean} ScanIndexForward - the defaul value in DynamoDB is true, which returns the query result in an ascending order based on the sort key.
   * @returns {array<object>} data.Items - an array of object matching the query, If no match found, an empty array is returned
   */
  static async query(
    { tableName, index, queryKey, queryValue },
    ScanIndexForward = false
  ) {
    const params = {
      ScanIndexForward,
      TableName: tableName,
      IndexName: index,
      KeyConditionExpression: `${queryKey} = :hkey`,
      ExpressionAttributeValues: {
        ':hkey': queryValue,
      },
    };

    try {
      const data = await this.documentClient.query(params).promise();
      console.debug(
        `DynamoDBHelper.query - query result of ${JSON.stringify(
          params
        )}: ${JSON.stringify(data)}`
      );
      return data.Items || [];
    } catch (error) {
      console.error(
        `DynamoDBHelper.query: error quering index: ${JSON.stringify(
          params
        )}: ${error.message}`
      );
      console.error(error.stack);
      /* Rethrow the error to the calling function */
      throw error;
    }
  }

  /**
   * Write data to a DynamoDB table
   * @param {string} primaryKey - partition key of the DynamoDB table
   * @param {object} data - data to be written to the DynamoDB table
   * @param {string} TableName - name of the DynamoDB table
   * @returns {object} data - the data is reruned back to the calling function in case it's needed after the write operation
   */
  static async write(primaryKey, data, TableName) {
    const params = {
      TableName,
      Item: data,
    };

    try {
      if (!data[primaryKey]) {
        throw Error('no primary key in the data');
      }

      const res = await this.documentClient.put(params).promise();
      console.debug(
        `DynamoDBHelper.write - write response of ${JSON.stringify(
          params
        )}: ${JSON.stringify(res)}`
      );
      return data;
    } catch (error) {
      console.error(
        `DynamoDBHelper.write: error writing item: ${JSON.stringify(params)}: ${
          error.message
        }`
      );
      console.error(error.stack);
      /* Rethrow the error to the calling function */
      throw error;
    }
  }

  /**
   * Update an item in a DynamoDB table
   * @param {string} tableName - name of the DynamoDB table
   * @param {string} primaryKey - name of the table's partition key
   * @param {string} primaryKeyValue - value of the table's partition key to be updated
   * @param {string} updateKey - name of key to be updated
   * @param {string} updateValue - new value of key to be inserted
   * @returns {object} res - response from the update operation
   */
  static async update({
    tableName,
    primaryKey,
    primaryKeyValue,
    updateKey,
    updateValue,
  }) {
    const params = {
      TableName: tableName,
      Key: { [primaryKey]: primaryKeyValue },
      UpdateExpression: `set ${updateKey} = :updateValue`,
      ExpressionAttributeValues: {
        ':updateValue': updateValue,
      },
    };

    try {
      const res = this.documentClient.update(params).promise();
      console.debug(
        `DynamoDBHelper.update - response of updating item ${JSON.stringify(
          params
        )}: ${JSON.stringify(res)}`
      );
      return res;
    } catch (error) {
      console.error(
        `DynamoDBHelper.update: error updating item: ${JSON.stringify(
          params
        )}: ${error.message}`
      );
      console.error(error.stack);
      /* Rethrow the error to the calling function */
      throw error;
    }
  }
}

module.exports = DynamoDBHelper;
