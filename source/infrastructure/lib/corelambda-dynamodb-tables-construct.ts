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

import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { Function } from '@aws-cdk/aws-lambda';
import {
  TableProps,
  Table,
  GlobalSecondaryIndexProps,
  AttributeType,
  BillingMode,
  ProjectionType,
} from '@aws-cdk/aws-dynamodb';
import { CfnPolicy } from '@aws-cdk/aws-iam';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';

export interface CoreLambdaDynamoDBTablesProps {
  readonly coreLambdaFunction: Function;
}

export class CoreLambdaDynamoDBTables extends Construct {
  private readonly _contextDBTable: Table;
  private readonly _conversationLogsDBTable: Table;
  private readonly _entityResolverDBTabl: Table;

  constructor(
    scope: Construct,
    id: string,
    props: CoreLambdaDynamoDBTablesProps
  ) {
    super(scope, id);

    /** CoreLambda Context DynamoDB integration */
    const contextDBTableProbs: TableProps = {
      partitionKey: {
        name: 'uid',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const contextDBTableGSI: GlobalSecondaryIndexProps = {
      indexName: 'sessionID-timestamp-index',
      partitionKey: {
        name: 'sessionID',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: AttributeType.NUMBER,
      },
      projectionType: ProjectionType.ALL,
    };

    const coreContextDBTable = new LambdaToDynamoDB(
      this,
      'CoreContextDBTable',
      {
        existingLambdaObj: props.coreLambdaFunction,
        dynamoTableProps: contextDBTableProbs,
      }
    );

    coreContextDBTable.dynamoTable.addGlobalSecondaryIndex(contextDBTableGSI);

    /** CoreLambda Conversation DynamoDB integration */
    const conversationLogsDBTableProbs: TableProps = {
      partitionKey: {
        name: 'uid',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: AttributeType.NUMBER,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const coreConversationDBTable = new LambdaToDynamoDB(
      this,
      'CoreConversationDBTable',
      {
        existingLambdaObj: props.coreLambdaFunction,
        dynamoTableProps: conversationLogsDBTableProbs,
      }
    );

    /** CoreLambda EntityResolver DynamoDB integration */
    const entityResolverDBTableProps: TableProps = {
      partitionKey: {
        name: 'uid',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const entityResolverDBTableGSI: GlobalSecondaryIndexProps = {
      indexName: 'entity-value-index',
      partitionKey: {
        name: 'entity-value',
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    };

    const coreEntityResolverDBTable = new LambdaToDynamoDB(
      this,
      'CoreEntityResolverDBTable',
      {
        existingLambdaObj: props.coreLambdaFunction,
        dynamoTableProps: entityResolverDBTableProps,
      }
    );

    coreEntityResolverDBTable.dynamoTable.addGlobalSecondaryIndex(
      entityResolverDBTableGSI
    );

    /** Because CoreLambda needs access to several resources, the lambda's role
     *  has several permissions which makes it complex */
    (props.coreLambdaFunction.role?.node.findChild('DefaultPolicy').node.defaultChild as CfnPolicy).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'W12',
            reason:
              'Polly allows specifying lexicon ARNs only. There is no specific lexicon required for this policy',
          },
          {
            id: 'W76',
            reason:
              'The CoreLambda needs access to several resources (3 DynamoDB Tables, 1 bucket, X-ray, logs, and Polly), which make it a complex role',
          },
        ],
      },
    };

    /** Get dynamoDB Tables */
    this._contextDBTable = coreContextDBTable.dynamoTable;
    this._conversationLogsDBTable = coreConversationDBTable.dynamoTable;
    this._entityResolverDBTabl = coreEntityResolverDBTable.dynamoTable;
  }

  public get contextDBTable(): Table {
    return this._contextDBTable;
  }

  public get conversationLogsDBTable(): Table {
    return this._conversationLogsDBTable;
  }

  public get entityResolverDBTabl(): Table {
    return this._entityResolverDBTabl;
  }
}
