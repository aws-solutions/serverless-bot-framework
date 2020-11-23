# -*- coding: utf-8 -*-
####################################################################################################################
#  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           
#                                                                                                                    
#  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance     
#  with the License. A copy of the License is located at                                                             
#                                                                                                                    
#      http://www.apache.org/licenses/                                                                               
#                                                                                                                    
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES 
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    
#  and limitations under the License.                                                                                
####################################################################################################################/

# @author Solution Builders

from io import BytesIO
from zipfile import ZipFile
from urllib.parse import urlparse, urlencode
import json
import boto3
import os
import http.client
import mimetypes
import datetime
from os import environ

from urllib.request import Request
from urllib.request import urlopen

#======================================================================================================================
# Constants
#======================================================================================================================
BOT_SPEECH_PARAMS = {
    "Portuguese": {
        "Lang":"pt-BR",
        "SendLabel":"Enviar",
        "Voice": {"Male": "Ricardo", "Female":"Vitoria"},
        "Knowledge": "knowledge-pt-br.json",
        "pizzaMenu": "pizza-menu_pt-br.json"
    },
    "Spanish": {
        "Lang":"es-US",
        "SendLabel":"Enviar",
        "Voice": {"Male": "Miguel", "Female":"Penelope"},
        "Knowledge": "knowledge-es.json",
        "pizzaMenu": "pizza-menu_es-US.json"
    },
    "English": {
        "Lang":"en-US",
        "SendLabel":"Send",
        "Voice": {"Male": "Joey", "Female":"Joanna"},
        "Knowledge": "knowledge-en.json",
        "pizzaMenu": "pizza-menu_en.json"
    },
    "French": {
        "Lang":"fr-FR",
        "SendLabel":"Envoyer",
        "Voice": {"Male": "Mathieu", "Female":"Celine"},
        "Knowledge": "knowledge-fr.json",
        "pizzaMenu": "pizza-menu_fr.json"
    },
    "Italian": {
        "Lang":"it-IT",
        "SendLabel":"Inviare",
        "Voice": {"Male": "Giorgio", "Female":"Carla"},
        "Knowledge": "knowledge-it.json",
        "pizzaMenu": "pizza-menu_it.json"
    },
    "German": {
        "Lang":"de-DE",
        "SendLabel":"Senden",
        "Voice": {"Male": "Hans", "Female":"Vicki"},
        "Knowledge": "knowledge-de.json",
        "pizzaMenu": "pizza-menu_de.json"
    },
    "Russian": {
        "Lang":"ru-RU",
        "SendLabel":"послать",
        "Voice": {"Male": "Maxim", "Female":"Tatyana"},
        "Knowledge": "knowledge-ru.json",
        "pizzaMenu": "pizza-menu_ru.json"
    }
}

#======================================================================================================================
# Auxiliary Functions
#======================================================================================================================
def replace_config_anchors(content, resource_properties):
    content = content.replace('%%AWS_ID%%', resource_properties['AwsId'])
    content = content.replace('%%AWS_REGION%%', resource_properties['AwsRegion'])
    content = content.replace('%%BOT_NAME%%', resource_properties['BotName'])
    content = content.replace('%%API_URI%%', resource_properties['ApiUri'])
    content = content.replace('%%BRAIN_BUCKET_NAME%%', resource_properties['BrainBucket'])
    content = content.replace('%%CONVERSATION_LOGS_TABLE%%', resource_properties['ConversationLogsTable'])
    content = content.replace('%%ENTITIES_TABLE%%', resource_properties['EntitiesTable'])
    content = content.replace('%%CONTEXT_TABLE%%', resource_properties['ContextTable'])
    content = content.replace('%%SAMPLE_LEAVE_FEEDBACK_BOT_ARN%%', resource_properties['SampleLeaveFeedbackBotArn'])
    content = content.replace('%%SAMPLE_WEATHER_FORECAST_BOT_ARN%%', resource_properties['SampleWeatherForecastBotArn'])
    content = content.replace('%%SAMPLE_PIZZA_ORDER_BOT_ARN%%', resource_properties['SampleOrderPizzaBotArn'])
    content = content.replace('%%SEND_LABEL%%', BOT_SPEECH_PARAMS[resource_properties['BotLanguage']]["SendLabel"])
    content = content.replace('%%GENDER%%', resource_properties['BotGender'])
    if 'CognitoIdentityPool' in resource_properties:
        content = content.replace('%%COGNITO_IDENTITY_POOL%%', resource_properties['CognitoIdentityPool'])
    else:
        content = content.replace('%%COGNITO_IDENTITY_POOL%%', '')
    if 'CognitoUserPoolId' in resource_properties:
        content = content.replace('%%COGNITO_USER_POOL_ID%%', resource_properties['CognitoUserPoolId'])
    else:
        content = content.replace('%%COGNITO_USER_POOL_ID%%', '')
    if 'CognitoUserPoolClientId' in resource_properties:
        content = content.replace('%%COGNITO_USER_POOL_CLIENT_ID%%', resource_properties['CognitoUserPoolClientId'])
    else:
        content = content.replace('%%COGNITO_USER_POOL_CLIENT_ID%%', '')
    
    voice = BOT_SPEECH_PARAMS[resource_properties['BotLanguage']]["Voice"][resource_properties['BotGender']]
    content = content.replace('%%BOT_VOICE%%', voice)

    language_tag = BOT_SPEECH_PARAMS[resource_properties['BotLanguage']]["Lang"]
    content = content.replace('%%LANGUAGE_TAG%%', language_tag)

    return content

def create_stack(resource_properties):
    print("[create_stack] Start")
    print("[create_stack] Resource Properties:")
    print(resource_properties)
    print("[create_stack] End Resource Properties")
    s3_client = boto3.client('s3')

    #----------------------------------------------------------------------
    print("[create_stack] Configure Brain Notification to call Train Model")
    #----------------------------------------------------------------------
    bucket_name = resource_properties['BrainBucket']
    lambda_function_arn = resource_properties['TrainModelArn']
    lambda_already_configured = False
    notification_conf = s3_client.get_bucket_notification_configuration(Bucket=bucket_name)
    if 'LambdaFunctionConfigurations' in notification_conf:
        for lfc in notification_conf['LambdaFunctionConfigurations']:
            for e in lfc['Events']:
                if "s3:ObjectCreated:Put" in e:
                    if lfc['LambdaFunctionArn'] == lambda_function_arn:
                        lambda_already_configured = True

    if lambda_already_configured:
        print("[INFO] Skiping bucket event configuration. It is already configured to trigger Train Model function.")
    else:
        new_conf = {}
        new_conf['LambdaFunctionConfigurations'] = []
        if 'TopicConfigurations' in notification_conf:
            new_conf['TopicConfigurations'] = notification_conf['TopicConfigurations']
        if 'QueueConfigurations' in notification_conf:
            new_conf['QueueConfigurations'] = notification_conf['QueueConfigurations']
        if 'LambdaFunctionConfigurations' in notification_conf:
            new_conf['LambdaFunctionConfigurations'] = notification_conf['LambdaFunctionConfigurations']

        new_conf['LambdaFunctionConfigurations'].append({
            'Id': 'Call Log Parser',
            'LambdaFunctionArn': lambda_function_arn,
            'Events': ['s3:ObjectCreated:Put'],
            'Filter': {'Key': {'FilterRules': [{"Name": "prefix","Value": "knowledge"},{"Name": "suffix","Value": "json"}]}}
        })
        response = s3_client.put_bucket_notification_configuration(Bucket=bucket_name, NotificationConfiguration=new_conf)

    #----------------------------------------------------------------------
    print("[create_stack] Process Config File")
    #----------------------------------------------------------------------
    content = ""
    with open('conf/configs.json', 'rb') as f:
        content = f.read().decode("utf-8")
        content = replace_config_anchors(content, resource_properties)

    s3_client.put_object(Body=content, Bucket=resource_properties['BrainBucket'], Key='configs.json')

    #----------------------------------------------------------------------
    print("[create_stack] Process Extensios File")
    #----------------------------------------------------------------------
    content = ""
    with open('conf/extensions.js', 'rb') as f:
        content = f.read().decode("utf-8")
        content = replace_config_anchors(content, resource_properties)
        s3_client.put_object(Body=content, Bucket=resource_properties['BrainBucket'], Key='extensions.js')

    #----------------------------------------------------------------------
    print("[create_stack] Process Knowledge File")
    #----------------------------------------------------------------------
    content = ""
    knowledge_file = BOT_SPEECH_PARAMS[resource_properties['BotLanguage']]["Knowledge"]
    with open('conf/%s'%knowledge_file, 'rb') as f:
        content = f.read().decode("utf-8")
        content = replace_config_anchors(content, resource_properties)
        s3_client.put_object(Body=content, Bucket=resource_properties['BrainBucket'], Key='knowledge.json')

    #----------------------------------------------------------------------
    print("[create_stack] Process PizzaMenu File")
    #----------------------------------------------------------------------
    content = ""
    pizzaMenu_file = BOT_SPEECH_PARAMS[resource_properties['BotLanguage']]["pizzaMenu"]
    with open('conf/%s'%pizzaMenu_file, 'rb') as f:
        content = f.read().decode("utf-8")

        s3_client.put_object(Body=content, Bucket=resource_properties['BrainBucket'], Key='pizza-menus/pizza-menu.json')


    #----------------------------------------------------------------------
    print("[create_stack] Process Webclient Sample Package")
    #----------------------------------------------------------------------
    key_name = resource_properties['SampleWebclientPackage'].split('/')[-1]
    webclient_pack = None
    try:
        webclient_pack = urlopen(resource_properties['SampleWebclientPackage'])
    except Exception as e:
        resource_properties['SampleWebclientPackage'] = resource_properties['SampleWebclientPackage'].replace("https://s3-us-east-1.amazonaws.com", "https://s3.amazonaws.com")
        webclient_pack = urlopen(resource_properties['SampleWebclientPackage'])
    zipfile = ZipFile(BytesIO(webclient_pack.read()))

    for file_name in zipfile.namelist():
        content = zipfile.open(file_name).read()

        if file_name.split('.')[-1] in ['js', 'json', 'html']:
            content = replace_config_anchors(content.decode("utf-8"), resource_properties)

        conten_type = mimetypes.guess_type(file_name)[0]
        if conten_type != None:
            s3_client.put_object(Body=content, Bucket=resource_properties['SampleWebClientBucket'], Key=file_name, ContentType=conten_type)
        else:
            s3_client.put_object(Body=content, Bucket=resource_properties['SampleWebClientBucket'], Key=file_name)

    #----------------------------------------------------------------------
    print("[create_stack] Redeploy the API")
    #----------------------------------------------------------------------
    try:
        api_gateway = boto3.client('apigateway')
        response = api_gateway.create_deployment(restApiId=resource_properties['ApiId'], stageName=resource_properties['ApiStageName'])
    except Exception as e:
        print("Failed to redeploy the API. Please check if you API endpoint is up-to-date. ")

    print("[create_stack] End")

def update_stack(resource_properties):
    print("[update_stack] Start")
    delete_stack(resource_properties)
    create_stack(resource_properties)
    print("[update_stack] End")

def delete_stack(resource_properties):
    print("[delete_stack] Start")

    s3_client = boto3.client('s3')
    #----------------------------------------------------------------------
    print(("[delete_stack] Cleaning %s bucket"%resource_properties['BrainBucket']))
    #----------------------------------------------------------------------
    list_objects = s3_client.list_objects(Bucket=resource_properties['BrainBucket'])
    if "Contents" in list_objects and len(list_objects["Contents"]) > 0:
        for file in list_objects["Contents"]:
            try:
                s3_client.delete_object(Bucket=resource_properties['BrainBucket'], Key=file['Key'])
            except Exception as e:
                print(e)

    #----------------------------------------------------------------------
    print(("[delete_stack] Cleaning %s bucket"%resource_properties['SampleWebClientBucket']))
    #----------------------------------------------------------------------
    list_objects = s3_client.list_objects(Bucket=resource_properties['SampleWebClientBucket'])
    if "Contents" in list_objects and len(list_objects["Contents"]) > 0:
        for file in list_objects["Contents"]:
            try:
                s3_client.delete_object(Bucket=resource_properties['SampleWebClientBucket'], Key=file['Key'])
            except Exception as e:
                print(e)

    print("[delete_stack] End")

def send_response(event, context, responseStatus, responseData):
    responseBody = {'Status': responseStatus,
                    'Reason': 'See the details in CloudWatch Log Stream: ' + context.log_stream_name,
                    'PhysicalResourceId': context.log_stream_name,
                    'StackId': event['StackId'],
                    'RequestId': event['RequestId'],
                    'LogicalResourceId': event['LogicalResourceId'],
                    'Data': responseData}

    o = urlparse(event['ResponseURL'])
    conn = http.client.HTTPConnection(o.netloc)
    conn.request('PUT', event['ResponseURL'], json.dumps(responseBody))
    resp = conn.getresponse()
    content = resp.read()
    print(content)

def send_anonymous_usage_data(action_type, resource_properties):
    if environ['SEND_ANONYMOUS_USAGE_DATA'] != 'Yes':
        return

    try:
        print("[send_anonymous_usage_data] Start")

        time_stamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")[:-5]
        usage_data = {
          "Solution": environ['SOLUTION_ID'],
          "UUID": environ['UUID'],
          "TimeStamp": time_stamp,
          "Data":
          {
              "Version" : environ['VERSION'],
              "DataType" : "custom_resource",
              "Region" : environ['REGION'],
              "Action" : action_type,
              "BotGender" : resource_properties['BotGender'],
              "BotLanguage" : resource_properties['BotLanguage'],
              "BotVoice" : BOT_SPEECH_PARAMS[resource_properties['BotLanguage']]["Voice"][resource_properties['BotGender']]
          }
        }

        url = 'https://metrics.awssolutionsbuilder.com/generic'
        data = usage_data
        headers = {'content-type': 'application/json'}
        print(("[send_anonymous_usage_data] %s"%data))
        f = urlencode(data)
        f = f.encode('utf-8')
        req = Request(url, f, headers)
        rsp = urlopen(req)
        content = rsp.read()
        rspcode = rsp.getcode()
        print(('[send_anonymous_usage_data] Response Code: {}'.format(rspcode)))
        print(('[send_anonymous_usage_data] Response Content: {}'.format(content)))

        print("[send_anonymous_usage_data] End")
    except Exception as e:
        print("[send_anonymous_usage_data] Failed to Send Data. Reason: {}".format(e))

#======================================================================================================================
# Lambda Entry Point
#======================================================================================================================
def lambda_handler(event, context):
    responseStatus = 'SUCCESS'
    responseData = {}

    try:
        print(event)
        event_request_type = event['RequestType'].upper()
        request_type = event_request_type

        #----------------------------------------------------------
        # Extra check for DELETE events
        #----------------------------------------------------------
        cf = boto3.client('cloudformation')
        stack_name = event['ResourceProperties']['StackName']
        cf_desc = cf.describe_stacks(StackName=stack_name)
        stack_status = cf_desc['Stacks'][0]['StackStatus'].upper()

        #----------------------------------------------------------

        print(("EventRequestType: %s - StackStatus: %s - RequestType: %s"%(event_request_type, stack_status, request_type)))

        if 'CREATE' in request_type:
            create_stack(event['ResourceProperties'])
            send_anonymous_usage_data(request_type, event['ResourceProperties'])

        elif 'UPDATE' in request_type:
            update_stack(event['ResourceProperties'])
            send_anonymous_usage_data(request_type, event['ResourceProperties'])

    except Exception as e:
        print(e)
        responseStatus = 'FAILED'

    send_response(event, context, responseStatus, responseData)
