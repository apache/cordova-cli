@ECHO OFF
ECHO this is script 1 in %~dp0
ECHO a >> hooks_order.txt
ECHO %1 > hooks_params.txt
node -e "console.log(JSON.stringify(process.env, null, 2))" > hooks_env.json
