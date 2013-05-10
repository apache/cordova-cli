@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION
SET root=%~dp0
CD /D %root%
ECHO.
goto check_help

:usage
ECHO This tool can be used for running platofrm spacific tests :
ECHO Example:
ECHO   $ test
ECHO         - Just runs the core cli-tests
ECHO   $ test android
ECHO         - Runs the platform specific test for android along with the core tests
ECHO   $ test blackberry android only
ECHO         - Just runs the platform specific test for android and blackberry
ECHO   $ test android
ECHO         - Runs the platform specific test for android along with the core tests
GOTO EOF



:parse_args
SET arg=%1
SHIFT
IF NOT "%arg%"=="" (
    IF "%arg%"=="only" (
        GOTO:EOF
    ) ELSE IF EXIST "%root%spec\platform-script\%arg%" (
        ECHO Platform Test for %arg% :
        node node_modules\jasmine-node\bin\jasmine-node spec\platform-script\%arg%\ --color
    ) ELSE (
        ECHO Tests for platform %arg% do not exist, feel free to make them if you's like.
        ECHO Test for %args% would go into %root%spec\platform-script\%arg%
        EXIT /B 1
    )
    IF NOT "%1"=="" (
        goto parse_args
    )
) ELSE (
    node node_modules\jasmine-node\bin\jasmine-node spec\cordova-cli\ --color
    GOTO EOF
)

:check_help
IF "%1"=="--help" (
    goto usage
) ELSE IF "%1"=="-help" (
    goto usage
) ELSE IF "%1"=="help" (
    goto usage
) ELSE IF "%1"=="/help" (
    goto usage
) ELSE IF "%1"=="-help" (
    goto usage
) ELSE IF "%1"=="/?" (
    goto usage
) ELSE (
    goto parse_args
)

:EOF