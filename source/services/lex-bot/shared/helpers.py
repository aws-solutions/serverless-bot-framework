######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
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


def detect_locale(language):
    language_locale = {
        "English": "en_US",
        "French": "fr_FR",
        "Italian": "it_IT",
        "Spanish": "es_US",
        "German": "de_DE",
        "Japanese": "ja_JP"
    }
    return language_locale[language]


def abort_statement(language):
    statement = {
        "English": "Sorry, I am not able to assist at this time",
        "French": "Je vous prie de m'excuser, mais je ne suis pas en mesure de vous aider pour le moment",
        "Italian": "Mi dispiace, ma non posso aiutarti al momento",
        "Spanish": "Disculpe, no puedo ayudarlo en este momento",
        "German": "Entschuldigung! Leider kann ich Ihnen dieses Mal nicht helfen.",
        "Japanese": "申し訳ありませんが、現時点ではサポートできません "
    }
    return statement[language]
