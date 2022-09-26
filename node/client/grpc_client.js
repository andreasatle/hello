
const PROTO_PATH = __dirname + '/../../proto/greeter.proto';
const parseArgs = require('minimist');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

opt = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};
const packageDefinition = protoLoader.loadSync(PROTO_PATH, opt);
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

const argv = parseArgs(process.argv.slice(2), { string: 'target' });
let target;
if (argv.target) {
    target = argv.target;
} else {
    target = '[::]:50051';
}
const client = new hello_proto.Greeter(target, grpc.credentials.createInsecure());

module.exports = client;
