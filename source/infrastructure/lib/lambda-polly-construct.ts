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

import { Construct } from '@aws-cdk/core';
import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, Policy, CfnPolicy } from '@aws-cdk/aws-iam';
import { buildLambdaFunction } from '@aws-solutions-constructs/core';

export interface LambdaToPollyProps {
  readonly existingLambdaObj?: Function;
  readonly lambdaFunctionProps?: FunctionProps;
}

export class LambdaToPolly extends Construct {
  private readonly _pollyLambda: Function;

  constructor(scope: Construct, id: string, props: LambdaToPollyProps) {
    super(scope, id);

    this._pollyLambda = buildLambdaFunction(this, {
      existingLambdaObj: props.existingLambdaObj,
      lambdaFunctionProps: props.lambdaFunctionProps,
    });

    const pollyPolicy = new Policy(this, 'PollyPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['polly:SynthesizeSpeech'],
          resources: ['*'],
        }),
      ],
    });

    /** Add policy metadata to explain why resources: ['*'] is needed */
    (pollyPolicy.node.defaultChild as CfnPolicy).cfnOptions.metadata = {
      cfn_nag: {
        rules_to_suppress: [
          {
            id: 'W12',
            reason:
              'Polly allows specifying lexicon ARNs only. There is no specific lexicon required for this policy',
          },
        ],
      },
    };

    /** Add the pollyPolicy to the pollyLambda's role */
    this._pollyLambda.role?.attachInlinePolicy(pollyPolicy);
  }

  public get pollyLambda(): Function {
    return this._pollyLambda;
  }
}
