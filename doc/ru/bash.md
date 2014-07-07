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

# Поддержки оболочки bash

Кордова CLI поставляется в комплекте с помощью скрипта, который обеспечивает командной строки завершения по клавише tab для Bash. Если вы работаете достаточно Unix-y операционной системы (Linux, BSD, OS X) вы можете установить это для упрощения ввода cordova командные строки.

## Установка

### Linux

Для установки в системе Linux или BSD, скопируйте `scripts/cordova.completion` файла для вашего `/etc/bash_completion.d` каталог. Это будет прочитать в следующий раз при запуске новой оболочки.

### OS X

На OS X, положить `scripts/cordova.completion` файла нигде для чтения и добавьте следующую строку в конец вашего `~/.bashrc` файл:

    source <path to>/cordova.completion
    

Это будет прочитать в следующий раз при запуске новой оболочки.

## Использование

Это очень просто! До тех пор, как Командная строка начинается с исполняемый файл под названием «Кордова», просто ударил `<TAB>` в любой момент, чтобы просмотреть список допустимых вариантов.

Примеры:

    $ cordova <TAB>
    build     compile   create    emulate   platform  plugin    prepare   serve
    
    $ cordova pla<TAB>
    
    $ cordova platform <TAB>
    add ls remove rm
    
    $ cordova platform a<TAB>
    
    $ cordova platform add <TAB>
    android     blackberry  ios         wp8         www
    
    $ cordova plugin rm <TAB>
    
    $ cordova plugin rm org.apache.cordova.<TAB>
    org.apache.cordova.file    org.apache.cordova.inappbrowser