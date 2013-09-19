<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
# Cordova-cli changelog

## 3.0.9

### Features

- `platform ls` now shows both installed and available-to-install platforms. [CB-3904](https://issues.apache.org/jira/browse/CB-3904)

### Bugfixes

- Plugins are now installed serially across all installed platforms, rather than in parallel. This avoids race conditions in dependency installation. [CB-4184](https://issues.apache.org/jira/browse/CB-4184)
- (WP8) All files from project www dir are now copied into the binary, not the top-level www. This means merges and plugin assets are correctly handled.
