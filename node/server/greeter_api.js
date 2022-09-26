require('log-timestamp');

const random = ub => Math.floor(ub * Math.random());
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Options set for the type conversions etc to the protocol buffer.
 */
opt = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};


/**
 * Implements the sayHello RPC method.
 */
async function sayHello(call, callback) {
    await sleep(random(1000));
    console.log('Node Server rpc sayHello(', call.request, ')');
    callback(null, { message: 'Hello ' + call.request.name });
}

module.exports = { sayHello, opt };