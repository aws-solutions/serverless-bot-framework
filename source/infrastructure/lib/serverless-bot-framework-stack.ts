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

import {
  CfnParameter,
  Construct,
  StackProps,
  Stack,
  Duration,
  CfnCondition,
  Fn,
  CfnMapping,
  CfnOutput,
  Aws,
} from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { Asset } from '@aws-cdk/aws-s3-assets';
import { SolutionHelper } from './solution-helper-construct';
import { CoreLambda } from './corelambda-construct';
import { LambdaToPolly } from './lambda-polly-construct';
import { CognitoApiLambda } from './cognito-api-lambdas-construct';
import { OrderPizzaLambdaDynamoDBTables } from './orderpizza-dynampdb-tables-construct';
import { CloudfrontStaticWebsite } from './cloudfront-static-website-construct';
import { LexLambdaDynamoDBTable } from './lexlambda-dynamodb-table-construct';
import { WriteApiKeyCustomResource } from './write-apikey-custom-resource-construct';
import { WeatherForecastToSSM } from './weather-forecast-lambda-ssm-construct';
import { WebClientCustomResource } from './web-client-custom-resource-construct';
import { LexCustomResource } from './custom-resource-lex-bot';


export interface ServerlessBotFrameworkStackProps extends StackProps {
  readonly solutionID: string;
  readonly solutionName: string;
}

export class ServerlessBotFrameworkStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ServerlessBotFrameworkStackProps
  ) {
    super(scope, id, props);

    const botName = new CfnParameter(this, 'BotName', {
      type: 'String',
      description:
        "Define the bot name. Allows a minimum 1 character and maximum of 20. This value is used when it will answer about it's name, for example Jao.",
      default: 'Joe',
      minLength: 1,
      maxLength: 20,
    });

    const botLanguage = new CfnParameter(this, 'BotLanguage', {
      type: 'String',
      description:
        'Choose the language that this bot will understand and comunicate.',
      default: 'English',
      allowedValues: [
        'English',
        'Spanish',
        'French',
        'Italian',
        'German',
      ],
    });

    const botGender = new CfnParameter(this, 'BotGender', {
      type: 'String',
      description: 'Choose the bot voice gender.',
      allowedValues: ['Male', 'Female'],
    });

    const adminUserName = new CfnParameter(this, 'AdminUserName', {
      type: 'String',
      description: 'The admin username to access the Serverless Bot Framework.',
      minLength: 4,
      maxLength: 20,
      allowedPattern: '[a-zA-Z0-9-]+',
      constraintDescription:
        'The username must be a minimum of 4 characters, maximum of 20 and cannot include spaces.',
    });

    const adminEmail = new CfnParameter(this, 'AdminEmail', {
      type: 'String',
      description:
        'Admin user email address to access the Serverless Bot Framework.',
      minLength: 5,
      maxLength: 50,
      allowedPattern: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$',
      constraintDescription: 'Admin email must be a valid email address.',
    });

    const childDirected = new CfnParameter(this, 'ChildDirected', {
      type: 'String',
      description:
        "Is use of your bot subject to the Children's Online Privacy Protection Act (COPPA)",
      allowedValues: ['No', 'Yes'],
    });

    const weatherAPIProvider = new CfnParameter(this, 'WeatherAPIProvider', {
      type: 'String',
      description:
        'Choice of weather api source or a random weather generator.',
      default: 'Random Weather Generator',
      allowedValues: ['Random Weather Generator', 'AccuWeather', 'OpenWeather'],
    });

    const weatherAPIKey = new CfnParameter(this, 'WeatherAPIKey', {
      type: 'String',
      description:
        'API key for weather API (Optional). Not required for Random Weather Generator.',
      default: '',
      minLength: 0,
      maxLength: 64,
      allowedPattern: '[a-zA-Z0-9]*',
      noEcho: true,
      constraintDescription:
        'The weather API Key must be a maximum of 64 characters (letters/numbers) and cannot include spaces.',
    });

    /** Create Solution Mapping */
    const solutionMapping = new CfnMapping(this, 'Solution', {
      mapping: {
        Data: {
          ID: 'SO0027',
          Version: '%%VERSION%%',
          SendAnonymousUsageData: 'Yes',
        },
      },
    });

    /** Create Condition for WeatherAPIChosen*/
    const weatherAPIChosen = new CfnCondition(this, 'WeatherAPIChosen', {
      expression: Fn.conditionNot(
        Fn.conditionEquals(
          weatherAPIProvider.valueAsString,
          'Random Weather Generator'
        )
      ),
    });

    /** Create AnonymousDatatoAWS Condition */
    const metricsCondition = new CfnCondition(this, 'AnonymousDatatoAWS', {
      expression: Fn.conditionEquals(
        solutionMapping.findInMap('Data', 'SendAnonymousUsageData'),
        'Yes'
      ),
    });

    /** Generate assethash for the WebClinetPackage used to deploy the static website */
    const webPackageAsset = new Asset(this, 'WebPackage', {
      path: '../samples/webclient/build',
    });

    /** Create a location for the Webclient package */
    const webClientPackageLocation = {
      S3Bucket: `%%BUCKET_NAME%%-${Aws.REGION}`,
      S3Key: `%%SOLUTION_NAME%%/%%VERSION%%/asset${webPackageAsset.assetHash}.zip`,
    };

    /** Create SolutionHelper */
    new SolutionHelper(this, 'SolutionHelper', {
      solutionId: solutionMapping.findInMap('Data', 'ID'),
      solutionVersion: solutionMapping.findInMap('Data', 'Version'),
      sendAnonymousDataCondition: metricsCondition,
      botName: botName.valueAsString,
      botGender: botGender.valueAsString,
      botLanguage: botLanguage.valueAsString,
    });

    /** Create LexLambda => DynamoDB Table Integrations */
    const lexLambdaDynamoDBTables = new LexLambdaDynamoDBTable(
      this,
      'LexLambdaDynamoDB',
      {
        lexLambdaProps: {
          description: 'Serverless-bot-framework Sample lambda-lex integration functionalities',
          runtime: Runtime.PYTHON_3_8,
          code: Code.fromAsset('../samples/lex-lambdas'),
          handler: 'dispatcher.lambda_handler',
          timeout: Duration.minutes(5),
          environment: {
            childDirected: childDirected.valueAsString,
          }
        },
      }
    );

    /** Pass in lexLambda as OrderPizzaLambda and create OrderPizza DynamoDB Tables */
    new OrderPizzaLambdaDynamoDBTables(this, 'OrderPizzaLambdaDynamoDB', {
      orderPizzaLambda: lexLambdaDynamoDBTables.lexLambda
    });

    /** Lex Custom Resource */
    const lexCustomResource = new LexCustomResource(this, 'LexCustomResrouce', {
      botName: botName.valueAsString,
      botLanguage: botLanguage.valueAsString,
      childDirected: childDirected.valueAsString,
      lexLambdaARN: lexLambdaDynamoDBTables.lexLambda.functionArn,
    });

    /** Create CoreLambda */
    const coreLambdaConstruct = new CoreLambda(
      this,
      'coreLambda',
      {
        lambdaFunctionProps: {
          description: 'Serverless-bot-framework Core lambda',
          runtime: Runtime.NODEJS_12_X,
          code: Code.fromAsset('../services/core'),
          handler: 'index.handler',
          timeout: Duration.minutes(5),
          memorySize: 1024,
          environment: {
            botName: botName.valueAsString,
            botId: lexCustomResource.BotId,
            botAliasId: lexCustomResource.BotAliasId,
            botGender: botGender.valueAsString,
            botLanguage: botLanguage.valueAsString,
            forceCacheUpdate: 'false',
          },
        },
      }
    );

    /** Create PollyLambda to Polly Service Integartion */
    const lambdaToPolly = new LambdaToPolly(this, 'PollyLambdaToPolly', {
      lambdaFunctionProps: {
        description: 'Serverless-bot-framework Polly lambda',
        runtime: Runtime.NODEJS_12_X,
        code: Code.fromAsset('../services/polly-service'),
        handler: 'index.handler',
        timeout: Duration.minutes(5),
        memorySize: 128,
      },
    });

    /** Create CloudFront => StaticWebsite Integration */
    const cloudfrontStaticWebsite = new CloudfrontStaticWebsite(
      this,
      'CloudfrontStaticWebsite'
    );

    /** Create Cognito=>ApiGateway=>CoreLambda/PollyLambda Integrations */
    const cognitoApiCorePollyLambdas = new CognitoApiLambda(this, 'BotApi', {
      coreLambda: coreLambdaConstruct.coreLambda,
      pollyLambda: lambdaToPolly.pollyLambda,
      adminUserName: adminUserName.valueAsString,
      adminEmail: adminEmail.valueAsString,
      webClientDomainName: cloudfrontStaticWebsite.domainName,
    });

    /** Create Weather Forecast's WriteAPIKey CustomResource => SSM Integration */
    new WriteApiKeyCustomResource(this, 'WriteAPIKey', {
      weatherAPIKey: weatherAPIKey.valueAsString,
      weatherAPIChosen: weatherAPIChosen,
    });

    /** Pass in lexLambda as weather forecast lambda and Create WeatherForecast => SSM Integration */
    new WeatherForecastToSSM(this, 'WeatherForecastLambda', {
      weatherAPIProvider: weatherAPIProvider.valueAsString,
      weatherAPIChosen: weatherAPIChosen,
      weatherForecastLambda: lexLambdaDynamoDBTables.lexLambda
    });

    const botApi = cognitoApiCorePollyLambdas.botApi;

    /** Create webClientPackageUrl */
    const webClientPackageUrl = `https://s3.${Aws.REGION}.amazonaws.com/${webClientPackageLocation.S3Bucket}/${webClientPackageLocation.S3Key}`;

    /** Create CustomResource */
    new WebClientCustomResource(this, 'WebClientCustomResource', {
      botApiUrl: `https://${botApi.restApiId}.execute-api.${Aws.REGION}.amazonaws.com/${botApi.deploymentStage.stageName}/`,
      botApiStageName: botApi.deploymentStage.stageName,
      botApiId: botApi.restApiId,
      botName: botName.valueAsString,
      botGender: botGender.valueAsString,
      botLanguage: botLanguage.valueAsString,
      cognitoIdentityPool:
        cognitoApiCorePollyLambdas.botCognitoIdentityPool.ref,
      cognitoUserPoolId:
        cognitoApiCorePollyLambdas.botCognitoUserPool.userPoolId,
      cognitoUserPoolClientId:
        cognitoApiCorePollyLambdas.botCognitoUserPoolClient.userPoolClientId,
      sampleWebClientBucketName: cloudfrontStaticWebsite.bucketName,
      sampleWebclientPackage: webClientPackageUrl,
    });

    /** Create Template Interface */
    this.templateOptions.metadata = {
      'AWS::CloudFormation::Interface': {
        ParameterGroups: [
          {
            Label: { default: 'Bot Settings' },
            Parameters: [
              botName.logicalId,
              botLanguage.logicalId,
              botGender.logicalId,
            ],
          },
          {
            Label: { default: 'Sample web app' },
            Parameters: [adminUserName.logicalId, adminEmail.logicalId],
          },
          {
            Label: { default: 'Amazon Lex related parameters' },
            Parameters: [childDirected.logicalId],
          },
          {
            Label: { default: 'Weather API parameters' },
            Parameters: [weatherAPIProvider.logicalId, weatherAPIKey.logicalId],
          },
        ],
        ParameterLabels: {
          [botName.logicalId]: { default: 'Name' },
          [botLanguage.logicalId]: { default: 'Language' },
          [botGender.logicalId]: { default: 'Gender' },
          [weatherAPIProvider.logicalId]: { default: 'Weather API provider' },
          [weatherAPIKey.logicalId]: {
            default: 'Weather API Key (Empty if no API provider)',
          },
        },
      },
    };

    /** Stack Outputs */
    new CfnOutput(this, 'ApiEndpoint', {
      exportName: 'ApiEndpoint',
      value: `https://${botApi.restApiId}.execute-api.${Aws.REGION}.amazonaws.com/${botApi.deploymentStage.stageName}/`,
      description: 'API URL for customers build their own clients consumers.',
    });

    new CfnOutput(this, 'WebClientDomainName', {
      exportName: 'WebClientDomainName',
      value: cloudfrontStaticWebsite.domainName,
      description: 'Sample web client domain name.',
    });

    new CfnOutput(this, 'WebClientBucket', {
      exportName: 'WebClientBucket',
      value: cloudfrontStaticWebsite.bucketName,
      description: 'Sample web client bucket name.',
    });

    new CfnOutput(this, 'CognitoUserPoolId', {
      exportName: 'CognitoUserPoolId',
      value: cognitoApiCorePollyLambdas.botCognitoUserPool.userPoolId,
      description: 'Cognito User Pool ID.',
    });

    new CfnOutput(this, 'CognitoUserPoolClientId', {
      exportName: 'CognitoUserPoolClientId',
      value:
        cognitoApiCorePollyLambdas.botCognitoUserPoolClient.userPoolClientId,
      description: 'Client ID for Cognito User Pool.',
    });

    new CfnOutput(this, 'CognitoIdentityPool', {
      exportName: 'CognitoIdentityPool',
      value: cognitoApiCorePollyLambdas.botCognitoIdentityPool.ref,
      description: 'Cognito Identity Pool ID.',
    });
  }
}
