<<<<<<< HEAD:lib/cordova-android/bin/templates/cordova/cordova.bat
:: Licensed to the Apache Software Foundation (ASF) under one
:: or more contributor license agreements.  See the NOTICE file
:: distributed with this work for additional information
:: regarding copyright ownership.  The ASF licenses this file
:: to you under the Apache License, Version 2.0 (the
:: "License"); you may not use this file except in compliance
:: with the License.  You may obtain a copy of the License at
:: 
:: http://www.apache.org/licenses/LICENSE-2.0
:: 
:: Unless required by applicable law or agreed to in writing,
:: software distributed under the License is distributed on an
:: "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
:: KIND, either express or implied.  See the License for the
:: specific language governing permissions and limitations
:: under the License.

@ECHO OFF
IF NOT DEFINED JAVA_HOME GOTO MISSING
FOR %%X in (java.exe ant.bat android.bat) do (
    SET FOUND=%%~$PATH:X
    IF NOT DEFINED FOUND GOTO MISSING
)
cscript %~dp0\cordova.js %*
GOTO END
:MISSING
ECHO Missing one of the following:
ECHO JDK: http://java.oracle.com
ECHO Android SDK: http://developer.android.com
ECHO Apache ant: http://ant.apache.org
EXIT /B 1
:END
=======
@echo off
cscript "%~dp0\buildjs.js" %* //nologo
>>>>>>> [CB-2078] Wp7 + wp8 support and future branch update:lib/cordova-wp7/tooling/scripts/buildjs.bat
