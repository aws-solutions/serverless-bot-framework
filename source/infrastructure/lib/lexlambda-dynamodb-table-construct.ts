/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
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
import { Function, FunctionProps, CfnFunction } from '@aws-cdk/aws-lambda';
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import {
  TableProps,
  Table,
  AttributeType,
  BillingMode,
} from '@aws-cdk/aws-dynamodb';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import { CfnNagHelper } from './cfn-nag-helper';


export interface LexLambdaDynamoDBTableProps {
  readonly lexLambdaProps: FunctionProps;
}

export class LexLambdaDynamoDBTable extends Construct {
  private readonly _lexLambda: Function;
  private readonly _lexDBTable: Table;

  constructor(
    scope: Construct,
    id: string,
    props: LexLambdaDynamoDBTableProps
  ) {
    super(scope, id);

    /** build lexLambda Function */
    this._lexLambda = buildLambdaFunction(this, {
      lambdaFunctionProps: props.lexLambdaProps,
    });

    /** add resource policy to allow lexv2 bot invoke this function */
    this._lexLambda.addPermission(
      'lexv2permission',
      {
        action: 'lambda:InvokeFunction',
        principal: new ServicePrincipal('lexv2.amazonaws.com'),
        sourceArn: `arn:${Aws.PARTITION}:lex:${Aws.REGION}:${Aws.ACCOUNT_ID}:bot-alias/*`,
      });

    /** lexLambda lex DynamoDBTable integration */
    const lexDBTableProbs: TableProps = {
      partitionKey: {
        name: 'uuid',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const lexLambdaDBTable = new LambdaToDynamoDB(
      this,
      'LexLambdaDBTable',
      {
        existingLambdaObj: this._lexLambda,
        dynamoTableProps: lexDBTableProbs,
      }
    );

    /** Get dynamoDB Table */
    this._lexDBTable = lexLambdaDBTable.dynamoTable;
    this._lexLambda.addEnvironment('FEEDBACK_TABLE',
      this._lexDBTable.tableName
    );

    /** Suppression for cfn nag W92 */
    const cfnFunction = this._lexLambda.node.defaultChild as CfnFunction;
    CfnNagHelper.addSuppressions(cfnFunction, {
        Id: 'W92',
        Reason: 'This function does not need to have specified reserved concurrent executions'
    });
  }

  public get lexLambda(): Function {
    return this._lexLambda;
  }

  public get lexDBTable(): Table {
    return this._lexDBTable;
  }
}
