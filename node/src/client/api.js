require('log-timestamp');
const random = ub => Math.floor(ub * Math.random());
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const grpcClient = require('./grpc_client');

async function pingPongName(req, res) {
    await sleep(random(1000));

    grpcClient.sayHello({ name: req.params.name }, function (err, response) {
        if (err) {
            res.send('rpc sayHello, error: ' + err.details + ', Error code: ' + err.code)
            return
        }
        console.log('Client rpc sayHello(', req.params, ')')
        res.send(response.message + '\n');
    });
}

module.exports = { pingPongName };