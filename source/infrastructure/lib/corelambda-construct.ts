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

import { Aws, Construct } from '@aws-cdk/core';
import { Function, FunctionProps, CfnFunction } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, Policy } from '@aws-cdk/aws-iam';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';
import { CfnNagHelper } from './cfn-nag-helper';


export interface CoreLambdaProps {
  readonly existingLambdaObj?: Function;
  readonly lambdaFunctionProps?: FunctionProps;
}

export class CoreLambda extends Construct {
  private readonly _coreLambda: Function;

  constructor(scope: Construct, id: string, props: CoreLambdaProps) {
    super(scope, id);

    const coreLambda = buildLambdaFunction(
      this,
      {
        existingLambdaObj: props.existingLambdaObj,
        lambdaFunctionProps: props.lambdaFunctionProps,
      }
    );

    const lexPolicy = new Policy(this, 'LexPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['lex:RecognizeText'],
          resources: [`arn:${Aws.PARTITION}:lex:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`],
        }),
      ],
    });

    /** Grant CoreLambda Lex permissions */
    coreLambda.role?.attachInlinePolicy(lexPolicy); //NOSONAR it is a valid expression
    /** Get the CoreLambda created by the LambdaToS3 construct */
    this._coreLambda = coreLambda;
    /** Suppression for cfn nag */
    const cfnFunction = this._coreLambda.node.defaultChild as CfnFunction;
    CfnNagHelper.addSuppressions(cfnFunction, [
      {
        Id: 'W92',
        Reason: 'This function does not need to have specified reserved concurrent executions'
      }
    ]);

  }

  public get coreLambda(): Function {
    return this._coreLambda;
  }

}
