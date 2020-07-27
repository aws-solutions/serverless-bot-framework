---
name: Bug report
about: Create a report to help us improve
labels: bug

---
<!-- Required -->
### Describe the bug ###
A clear and concise description of what the bug is.

### To Reproduce ###
Steps to reproduce the behavior

1. Step One:
2. Step Two:
3. [...]

### Expected Result ###
A clear and concise description of what you expected to happen.

### Actual Result ###
A description of what is the result and/or error messages you got when you faced this issue.

<!-- Optional to fill out unless if you have launched the solution. In that case Region and Version are required. -->
### Other information: ###
1. Version of the Solution (e.g., v1.1.0):

    To get the version of the solution, you can look at the description of the created CloudFormation stack. For example, "_(SO0027) AWS Serverless Bot Framework v1.2.0 - This AWS CloudFormation template helps you provision the AWS Serverless Bot Framework stack without worrying about creating and configuring the underlying AWS infrastructure_". If the description does not contain the version information, you can look at the mappings section of the template:

```yaml
Mappings:
  Solution:
    Data:
      ID: SO0027
      Version: 'v1.2.0'
```

2. Region where CloudFormation template is deployed (e.g., us-east-1):
3. Did you make any change in the source code? If yes, what are the relevant changes (if publicly available)?:
4. Troubleshooting steps attempted:
5. Were there any errors in the Cloudwatch logs?:
6. Screenshots (please **DO NOT include sensitive information**):
7. Did you use the Sample Weather Service (please DO NOT include API KEY) ? Yes / No

### Stack Parameters ###
Cloudformation Stack Parameters (please **DO NOT include sensitive information** like S3 bucket name, IP address, credentials, etc):
1. Bot Name:
2. Bot Language:
3. Bot Gender:
<!-- Add more stack paramters if needed-->

### Additional context ###
Add any other context about the problem here.
