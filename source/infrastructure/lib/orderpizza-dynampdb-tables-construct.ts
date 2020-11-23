/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

import { Construct, Aws, RemovalPolicy } from '@aws-cdk/core';
import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import {
  TableProps,
  Table,
  GlobalSecondaryIndexProps,
  AttributeType,
  BillingMode,
  ProjectionType,
} from '@aws-cdk/aws-dynamodb';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';

export interface OrderPizzaLambdaDynamoDBTablesProps {
  readonly orderPizzaLambdaProps: FunctionProps;
}

export class OrderPizzaLambdaDynamoDBTables extends Construct {
  private readonly _orderPizzaLambda: Function;
  private readonly _ordersDBTable: Table;
  private readonly _menusDBTable: Table;

  constructor(
    scope: Construct,
    id: string,
    props: OrderPizzaLambdaDynamoDBTablesProps
  ) {
    super(scope, id);

    /** build orderPizzaLambda Function */
    this._orderPizzaLambda = buildLambdaFunction(this, {
      lambdaFunctionProps: props.orderPizzaLambdaProps,
    });

    /** OrderPizzaLambda Orders DynamoDBTable integration */
    const ordersDBTableProbs: TableProps = {
      partitionKey: {
        name: 'orderId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const ordersDBTableGSI: GlobalSecondaryIndexProps = {
      indexName: 'customerId-orderTimestamp-index',
      partitionKey: {
        name: 'customerId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'orderTimestamp',
        type: AttributeType.NUMBER,
      },
      projectionType: ProjectionType.ALL,
    };

    const orderPizzaOrdersDBTable = new LambdaToDynamoDB(
      this,
      'OrderPizzaOrderstDBTable',
      {
        existingLambdaObj: this._orderPizzaLambda,
        dynamoTableProps: ordersDBTableProbs,
      }
    );

    orderPizzaOrdersDBTable.dynamoTable.addGlobalSecondaryIndex(
      ordersDBTableGSI
    );

    /** OrderPizzaLambda Menus DynamoDBTable integration */
    const menusDBTableProbs: TableProps = {
      partitionKey: {
        name: 'menuId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const orderPizzaMenusDBTable = new LambdaToDynamoDB(
      this,
      'CoreConversationDBTable',
      {
        existingLambdaObj: this._orderPizzaLambda,
        dynamoTableProps: menusDBTableProbs,
      }
    );

    /** Get dynamoDB Tables */
    this._ordersDBTable = orderPizzaOrdersDBTable.dynamoTable;
    this._menusDBTable = orderPizzaMenusDBTable.dynamoTable;

    /** Add DynamoDB Tables to OrderPizza Lambda's enviroment */
    this._orderPizzaLambda.addEnvironment(
      'PIZZA_ORDERS_TABLE',
      this._ordersDBTable.tableName
    );
    this._orderPizzaLambda.addEnvironment(
      'PIZZA_MENUS_TABLE',
      this._menusDBTable.tableName
    );
  }

  public get orderPizzaLambda(): Function {
    return this._orderPizzaLambda;
  }

  public get ordersDBTable(): Table {
    return this._ordersDBTable;
  }

  public get menusDBTable(): Table {
    return this._menusDBTable;
  }
}
