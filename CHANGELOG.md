# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2021-10-30
### Added
- Support for Japanese language

### Updated
- Outdated dependencies with regards to `npm audit` and Dependabot

## [1.6.0] - 2021-4-8

### Updated

- Updated `aws-amplify` version to 3.3.17
- Updated `aws-cdk` version to 1.96.0

### Added

- Custom resource to configure weather forecast, order pizza, book appointment, and leave feedback functionalities in [Amazon Lex](https://aws.amazon.com/lexv2/).
- Lambda function to integrate with Amazon Lex which allows for validation and data exchange with [DynamoDB](https://aws.amazon.com/dynamodb/)

### Changed
- Architecture diagram depicting the structure of AWS services and their interactions with Amazon Lex.
- Implementation Guide document to provide context of different usecases for customers on using Amazon Lex.

### Removed
- Legacy module (B2.core) that built a custom machine learning model to function as the brain of the chatbot.
## [1.5.0] - 2021-2-8

### Added

- Implementation to use [Amazon Lex](https://aws.amazon.com/lexv2/) as the processing module of the chatbot.
- Parameter to choose between the existing custom ML model or Amazon Lex as the processing module of the chatbot.
- Sample interaction for the chatbot application when Amazon Lex is chosen.

### Changed

- Architecture diagram depicting the structure of AWS services to include Amazon Lex.
- Implementation Guide document to provide context for customers on using Amazon Lex.

## [1.4.0] - 2020-11-23

### Added

- Implementation to use [AWS Cloud Development Kit (AWS CDK)](https://aws.amazon.com/cdk/) and architecture patterns from [AWS Solutions Constructs](https://aws.amazon.com/solutions/constructs/) to create AWS CloudFormation template.
  - aws-cognito-apigateway-lambda.
  - aws-lambda-dynamodb.
  - aws-cloudfront-s3
  - aws-s3-lambda
  - aws-lambda-s3.

## [1.3.0] - 2020-10-27

### Added

- A dynamic chatbot that demonstrates how to integrate a chatbot with a back-end database, such as Amazon DynamoDB, to build an automated order taking service (in this example, a pizza ordering service).
- When the customer starts their order, the chatbot retrieves the pizza menu from the back-end database, and displays it to the customer.
- The chatbot interacts with the customer to extract order details (for example, type and size of the pizza) and confirms the order.
- The order history is stored in a DynamoDB table, which helps facilitate a personalized customer experience.
- Functionality to automatically extract user's email, used by Amazon Cognito to authenticate the user with Amazon API Gateway, to use it as customerId.

## [1.2.0] - 2020-6-30

### Added

- Support for using API keys to get weather data.
- Functionality to write customer feedback to DynamoDB.

### Changed

- Synchronized audio and text response in sample web client.

## [1.1.0] - 2020-3-30

### Added

- Cognito with Amplify javascript framework to have sign-in/register in place for secure access to the web application.
- Encryption to all S3 and logging S3 buckets.
- Cloudfront to the web app hosted in S3. Restricted access to the web app S3 bucket to Cloudfront only.

### Changed

- Re-implemented the user interface in ReactJS (previously implemented with vanilla Javascript) to make it easier to add or modify components for later updates.
- Syntax for lambda functions in node8 to node12
- Syntax for lambda functions in python2 to python3
- The Solution Helper package to the newest version compatible with python3
- Integrated Cognito user pool authentication with API Gateway and removed authorization with stored API Keys.
- License changed to Apache License 2.0
