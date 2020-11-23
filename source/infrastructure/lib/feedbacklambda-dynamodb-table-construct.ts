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
  AttributeType,
  BillingMode,
} from '@aws-cdk/aws-dynamodb';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';

export interface LeaveFeedbackLambdaDynamoDBTableProps {
  readonly leaveFeedbackLambdaProps: FunctionProps;
}

export class LeaveFeedbackLambdaDynamoDBTable extends Construct {
  private readonly _leaveFeedbackLambda: Function;
  private readonly _leaveFeedbackDBTable: Table;

  constructor(
    scope: Construct,
    id: string,
    props: LeaveFeedbackLambdaDynamoDBTableProps
  ) {
    super(scope, id);

    /** build leaveFeedbackLambda Function */
    this._leaveFeedbackLambda = buildLambdaFunction(this, {
      lambdaFunctionProps: props.leaveFeedbackLambdaProps,
    });

    /** leaveFeedbackLambda LeaveFeedback DynamoDBTable integration */
    const leaveFeedbackDBTableProbs: TableProps = {
      partitionKey: {
        name: 'uuid',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const leaveFeedbackLambdaDBTable = new LambdaToDynamoDB(
      this,
      'LeaveFeedbackLambdaDBTable',
      {
        existingLambdaObj: this._leaveFeedbackLambda,
        dynamoTableProps: leaveFeedbackDBTableProbs,
      }
    );

    /** Get dynamoDB Table */
    this._leaveFeedbackDBTable = leaveFeedbackLambdaDBTable.dynamoTable;
  }

  public get leaveFeedbackLambda(): Function {
    return this._leaveFeedbackLambda;
  }

  public get leaveFeedbackDBTable(): Table {
    return this._leaveFeedbackDBTable;
  }
}
