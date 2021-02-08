######################################################################################################################
#  Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################
import os
from datetime import datetime
from unittest import TestCase, mock
import botocore.session
from botocore.stub import Stubber
from shared.client import get_client
import lambda_function

mock_env_variables = {
    "botName": "testbot",
    "botRole": "arn:aws:iam::123456789012:role/testrole",
    "childDirected": "No",
    "botLanguage": "English"
}

@mock.patch.dict(os.environ, mock_env_variables)
class LambdaTest(TestCase):

    def test_custom_resource(self):

        client = get_client("lexv2-models")
        stubber = Stubber(client)

        # Create Appointment Bot
        create_bot_expected_params = {
            "botName": mock_env_variables['botName'],
            "description": "Created by Serverless Bot Framework",
            "roleArn": mock_env_variables['botRole'],
            "dataPrivacy": {"childDirected": False},
            "idleSessionTTLInSeconds": 300,
            "botTags": {
                "createdby": "serverless bot framework"
            }
        }
        create_bot_response = {
            'botId': 'testid1234',
            'botName': 'testbot',
            'description': 'Created by Serverless Bot Framework',
            'roleArn': 'arn:aws:iam::123456789012:role/testrole',
            'dataPrivacy': {
                'childDirected': False
            },
            'idleSessionTTLInSeconds': 300,
            'botStatus': 'Available',
            'creationDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("create_bot", create_bot_response, create_bot_expected_params)
        # Wait for Bot
        describe_bot_response = {
            'botId': 'testid1234',
            'botName': 'testbot',
            'description': 'Created by Serverless Bot Framework',
            'roleArn': 'arn:aws:iam::123456789012:role/testrole',
            'dataPrivacy': {
                'childDirected': False
            },
            'idleSessionTTLInSeconds': 300,
            'botStatus': 'Available',
            'creationDateTime': datetime(2015, 1, 1),
            'lastUpdatedDateTime': datetime(2015, 1, 1)
        }
        describe_bot_expected_params = {
            "botId": "testid1234"
        }
        stubber.add_response("describe_bot", describe_bot_response, describe_bot_expected_params)
        # Create Appointment Bot Locale
        create_locale_expected_params = {
            "botId": 'testid1234',
            "botVersion": 'DRAFT',
            "localeId": 'en_US',
            "description": 'created English from lambda',
            "nluIntentConfidenceThreshold": 0.4
        }
        create_locale_response = {
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeName': 'en_US',
            'localeId': 'en_US',
            'description': 'created English from lambda',
            'nluIntentConfidenceThreshold': 0.4,
            'voiceSettings': {'voiceId': 'string'},
            'botLocaleStatus': 'NotBuilt',
            'creationDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("create_bot_locale", create_locale_response, create_locale_expected_params)

        # Wait for Locale
        describe_locale_expected_params = {
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US"
        }
        describe_locale_response = {
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeId': 'en_US',
            'localeName': 'en_US',
            'description': 'created English from lambda',
            'nluIntentConfidenceThreshold': 0.4,
            'voiceSettings': {'voiceId': 'string'},
            'intentsCount': 1,
            'slotTypesCount': 1,
            'botLocaleStatus': 'NotBuilt',
            'failureReasons': [],
            'creationDateTime': datetime(2015, 1, 1),
            'lastUpdatedDateTime': datetime(2015, 1, 1),
            'lastBuildSubmittedDateTime': datetime(2015, 1, 1),
            'botLocaleHistoryEvents': [
                {
                    'event': 'string',
                    'eventDate': datetime(2015, 1, 1)
                },
            ]
        }
        stubber.add_response("describe_bot_locale", describe_locale_response, describe_locale_expected_params)

        # Create Appointment Bot Slot Type
        create_slot_type_expected_params = {
            "slotTypeName": 'AppointmentTypeValue',
            "description": 'Types of appointment',
            "slotTypeValues": [{'sampleValue': {'value': 'cleaning'}}, {'sampleValue': {'value': 'root canal'}}, {'sampleValue': {'value': 'whitening'}}],
            "valueSelectionSetting": {
                'resolutionStrategy': 'OriginalValue'
            },
            "botId": "testid1234",
            "botVersion":'DRAFT',
            "localeId": "en_US"
        }
        create_slot_type_response = {
            'slotTypeId': 'AppointmentType',
            'slotTypeName': 'AppointmentTypeValue',
            'description': 'Types of appointment',
            'slotTypeValues': [{'sampleValue': {'value': 'cleaning'}}, {'sampleValue': {'value': 'root canal'}}, {'sampleValue': {'value': 'whitening'}}],
            'valueSelectionSetting': {
                'resolutionStrategy': 'OriginalValue'
            },
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeId': 'en_us',
            'creationDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("create_slot_type", create_slot_type_response, create_slot_type_expected_params)
        # Create Appointment Intent
        create_intent_expected_params = {
            "intentName": 'MakeAppointment',
            "botId": 'testid1234',
            "botVersion": 'DRAFT',
            "localeId": 'en_US'
        }
        create_intent_response = {
            'intentId': 'testintentid',
            'intentName': 'MakeAppointment',
            'description': '',
            'parentIntentSignature': '',
            'sampleUtterances': [],
            'dialogCodeHook': {
                'enabled': False
            },
            'fulfillmentCodeHook': {
                'enabled': False
            },
            'inputContexts': [],
            'outputContexts': [],
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeId': 'en_us',
            'creationDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("create_intent", create_intent_response, create_intent_expected_params)

        # Create Appointment Slot
        create_slot_time_expected_params = {
            "slotName": "Time",
            "description": "Time information.",
            "slotTypeId": "AMAZON.Time",
            "valueElicitationSetting": {
                'slotConstraint': 'Required',
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {
                                    "value": "At what time should I schedule your appointment?",
                                },
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
            },
            "obfuscationSetting": {
                'obfuscationSettingType': 'None'
            },
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US",
            "intentId": "testintentid"
        }
        create_slot_time_response = {
            'slotId': 'timeslotid',
            "slotName": "Time",
            "description": "Time information.",
            "slotTypeId": "AMAZON.Time",
            "valueElicitationSetting": {
                'slotConstraint': 'Required',
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {
                                    "value": "At what time should I schedule your appointment?",
                                },
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
            },
            "obfuscationSetting": {
                'obfuscationSettingType': 'None'
            },
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US",
            "intentId": "testintentid",
            'creationDateTime': datetime(2015, 1, 1)
        }
        create_slot_date_expected_params = {
            "slotName": "Date",
            "description": "Date information.",
            "slotTypeId": "AMAZON.Date",
            "valueElicitationSetting": {
                'slotConstraint': 'Required',
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {
                                    "value": "When should I schedule your appointment?"
                                },
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
            },
            "obfuscationSetting": {
                'obfuscationSettingType': 'None'
            },
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US",
            "intentId": "testintentid"
        }
        create_slot_date_response = {
            'slotId': 'dateslotid',
            "slotName": "Date",
            "description": "Date information.",
            "slotTypeId": "AMAZON.Date",
            "valueElicitationSetting": {
                'slotConstraint': 'Required',
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {
                                    "value": "When should I schedule your appointment?"
                                },
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
            },
            "obfuscationSetting": {
                'obfuscationSettingType': 'None'
            },
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US",
            "intentId": "testintentid",
            'creationDateTime': datetime(2015, 1, 1)
        }
        create_slot_appointment_type_expected_params = {
            "slotName": "AppointmentType",
            "description": "AppointmentType information.",
            "slotTypeId": "AppointmentType",
            "valueElicitationSetting": {
                'slotConstraint': 'Required',
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {
                                    "value": "What type of appointment would you like to schedule?"
                                },
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
            },
            "obfuscationSetting": {
                'obfuscationSettingType': 'None'
            },
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US",
            "intentId": "testintentid"
        }
        create_slot_appointment_type_response = {
            'slotId': 'AppointmentTypeslotid',
            "slotName": "AppointmentType",
            "description": "AppointmentType slot information.",
            "slotTypeId": "AppointmentType",
            "valueElicitationSetting": {
                'slotConstraint': 'Required',
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {
                                    "value": "What type of appointment would you like to schedule?"
                                },
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
            },
            "obfuscationSetting": {
                'obfuscationSettingType': 'None'
            },
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US",
            "intentId": "testintentid",
            'creationDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("create_slot", create_slot_time_response, create_slot_time_expected_params)
        stubber.add_response("create_slot", create_slot_date_response, create_slot_date_expected_params)
        stubber.add_response("create_slot", create_slot_appointment_type_response, create_slot_appointment_type_expected_params)

        # Update Appointment Intent
        update_intent_expected_params = {
            "intentId":"testintentid",
            "intentName":'MakeAppointment',
            "description":'MakeAppointment intent created by serverless bot.',
            "sampleUtterances":[{'utterance': 'I would like to book an appointment'}, {'utterance': 'Book an appointment'}, {'utterance': 'Book a {AppointmentType}'}],
            "dialogCodeHook":{
                'enabled': False
            },
            "fulfillmentCodeHook":{
                'enabled': False
            },
            "intentConfirmationSetting":{
                'promptSpecification': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {"value": "{Time} is available, should I go ahead and book your appointment?"},
                            }
                        },
                    ],
                    'maxRetries': 5,
                    'allowInterrupt': True
                },
                'declinationResponse': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {"value": "Okay, I will not schedule an appointment."}
                            }
                        },
                    ],
                    'allowInterrupt': True
                }
            },
            "intentClosingSetting":{
                'closingResponse': {
                    'messageGroups': [
                        {
                            'message': {
                                'plainTextMessage': {"value": "Done."}
                            }
                        },
                    ],
                    'allowInterrupt': True
                }
            },
            "slotPriorities":[
                {
                    'priority': 1,
                    'slotId': "AppointmentTypeslotid",
                },
                {
                    'priority': 2,
                    'slotId': "dateslotid",
                },
                {
                    'priority': 3,
                    'slotId': "timeslotid",
                },
            ],
            "botId":"testid1234",
            "botVersion":'DRAFT',
            "localeId":"en_US"
        }
        update_intent_response = {
            'intentId': 'testintentid',
            'intentName': 'MakeAppointment',
            'description': 'MakeAppointment intent created by serverless bot.',
            "sampleUtterances":[{'utterance': 'I would like to book an appointment'}, {'utterance': 'Book an appointment'}, {'utterance': 'Book a {AppointmentType}'}],

            'dialogCodeHook': {
                'enabled': False
            },
            'fulfillmentCodeHook': {
                'enabled':False
            },
            "slotPriorities":[
                {
                    'priority': 1,
                    'slotId': "AppointmentTypeslotid",
                },
                {
                    'priority': 2,
                    'slotId': "dateslotid",
                },
                {
                    'priority': 3,
                    'slotId': "timeslotid",
                },
            ],
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeId': 'en_US',
            'creationDateTime': datetime(2015, 1, 1),
            'lastUpdatedDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("update_intent", update_intent_response, update_intent_expected_params)

        # Build Bot Locale
        build_locale_expected_params = {
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US"
        }
        build_locale_response = {
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeId': 'en_US',
            'botLocaleStatus': 'Built',
            'lastBuildSubmittedDateTime': datetime(2015, 1, 1)
        }
        stubber.add_response("build_bot_locale", build_locale_response, build_locale_expected_params)

        # Wait for Build
        describe_bot_locale_expected_params = {
            "botId": "testid1234",
            "botVersion": "DRAFT",
            "localeId": "en_US"
        }
        describe_bot_locale_response = {
            'botId': 'testid1234',
            'botVersion': 'DRAFT',
            'localeId': 'en_US',
            'localeName': 'en_US',
            'description': 'created English from lambda',
            'nluIntentConfidenceThreshold': 0.4,
            'intentsCount': 1,
            'slotTypesCount': 1,
            'botLocaleStatus': 'Built',
            'failureReasons': [],
            'creationDateTime': datetime(2015, 1, 1),
            'lastUpdatedDateTime': datetime(2015, 1, 1),
            'lastBuildSubmittedDateTime': datetime(2015, 1, 1),
            'botLocaleHistoryEvents': [
                {
                    'event': 'string',
                    'eventDate': datetime(2015, 1, 1)
                },
            ]
        }
        stubber.add_response("describe_bot_locale", describe_bot_locale_response, describe_bot_locale_expected_params)

        # Get Bot Alias
        bot_alias_expected_params = {
            "botId": "testid1234"
        }
        bot_alias_response = {
            'botAliasSummaries': [
                {
                    'botAliasId': 'testaliasid',
                    'botAliasName': 'testalias',
                    'description': 'string',
                    'botVersion': 'DRAFT',
                    'botAliasStatus': 'Available',
                    'creationDateTime': datetime(2015, 1, 1),
                    'lastUpdatedDateTime': datetime(2015, 1, 1)
                },
            ],
            'nextToken': 'string',
            'botId': 'testid1234'
        }
        stubber.add_response("list_bot_aliases", bot_alias_response, bot_alias_expected_params)

        stubber.activate()
        lambda_function.custom_resource({}, {})
        stubber.assert_no_pending_responses()