# Hello (Greeter) using gRPC
## Protocol buffers
Protocol buffers are Google's language-neutral, platform-neutral, extensible mechanism for serializing structured data – think XML, but smaller, faster, and simpler. You define how you want your data to be structured once, then you can use special generated source code to easily write and read your structured data to and from a variety of data streams and using a variety of languages. An example *proto*-file (stripped of comments):
```
syntax = "proto3";

package helloworld;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```
[Read more about protocol buffers](https://developers.google.com/protocol-buffers/docs/overview)

## Node implementation
First step (as always) is to create a new project, and install dependencies:
```
npm init -y
npm install @grpc/grpc-js @grpc/proto-loader minimist
```
* Module *@grpc/grpc-js* is necessary for gRPC.
* Module *@grpc/proto-loader* is used to dynamically create the necessary routines when the program starts. An alternative is to use *protoc*, which is a protocol buffer compiler. This has to be invoked every time the proto-file is changed.
* Module *minimist* is used to read command line arguments, and is not necessary for gRPC.

The code for the *node-server*:
```
const PROTO_PATH = __dirname + '../../../proto/greeter.proto';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

function sayHello(call, callback) {
    console.log('rpc SayHello, request:', call.request);
    callback(null, { message: 'Hello ' + call.request.name });
}

function main() {
    const server = new grpc.Server();
    server.addService(hello_proto.Greeter.service, { sayHello: sayHello });
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        server.start();
    });
}

main();
```
The code for the *node-client*:
```
const PROTO_PATH = __dirname + '../../../proto/greeter.proto';

const parseArgs = require('minimist');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

function main() {
    const argv = parseArgs(process.argv.slice(2), {
        string: 'target'
    });
    let target;
    if (argv.target) {
        target = argv.target;
    } else {
        target = 'localhost:50051';
    }
    const client = new hello_proto.Greeter(target,
        grpc.credentials.createInsecure());
    let user;
    if (argv._.length > 0) {
        user = argv._[0];
    } else {
        user = 'world';
    }
    client.sayHello({ name: user }, function (err, response) {
        console.log('rpc sayHello, response:', response);
    });
}

main();
```
[Read more about gRPC using node.js](https://grpc.io/docs/languages/node/)

## Python implementation
In python we can create a new virtual environment where we install grpc.
```
conda create -n grpc
conda install -n grpc grpcio grpcio-tools
conda activate grpc
```
We nned to compile the protocol buffer into python,
```
python -m grpc_tools.protoc -I../proto --python_out=. --grpc_python_out=. ../proto/greeter.proto
```
This creates two python files
```
greeter_pb2.py
greeter_pb2_grpc.py
```
These file are not to be touched (except when the protocol buffer is changed).
The python server:
```
from concurrent import futures
import logging

import grpc
import greeter_pb2
import greeter_pb2_grpc


class Greeter(greeter_pb2_grpc.GreeterServicer):

    def SayHello(self, request, context):
        print(request)
        return greeter_pb2.HelloReply(message='Hello, %s!' % request.name)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    greeter_pb2_grpc.add_GreeterServicer_to_server(Greeter(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    server.wait_for_termination()


if __name__ == '__main__':
    logging.basicConfig()
    serve()
```
The code for the client:
```
import sys
import logging

import grpc
import greeter_pb2
import greeter_pb2_grpc


def run():
    with grpc.insecure_channel('localhost:50051') as channel:
        stub = greeter_pb2_grpc.GreeterStub(channel)
        if len(sys.argv) > 1:
            name = sys.argv[1]
        else:
            name = 'world'
        response = stub.SayHello(greeter_pb2.HelloRequest(name=name))
    print("rpc SayHello, response: " + response.message)


if __name__ == '__main__':
    logging.basicConfig()
    run()
```
[Read more about gRPC using python](https://grpc.io/docs/languages/python/)
