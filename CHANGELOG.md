# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

