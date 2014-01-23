echo "this is script 1 in `pwd`";
echo a >> hooks_order.txt
echo $1 > hooks_params.txt
node -e "console.log(JSON.stringify(process.env, null, 2))" > hooks_env.json
