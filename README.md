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

# Output from Kubernetes
I'm running k8s with 3 replicas of the server, and 2 replicas for the worker. The state of k8s is as follows:
```
(base) ➜  python git:(main) kubectl get all
NAME                                READY   STATUS    RESTARTS   AGE
pod/hello-server-6df98cd744-dp6vx   1/1     Running   0          33s
pod/hello-server-6df98cd744-h4vj6   1/1     Running   0          33s
pod/hello-server-6df98cd744-hrhgk   1/1     Running   0          33s
pod/hello-worker-d99d64547-c6sjs    1/1     Running   0          33s
pod/hello-worker-d99d64547-mtx7w    1/1     Running   0          33s

NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/hello-server   NodePort    10.100.146.5    <none>        8080:30000/TCP   33s
service/hello-worker   ClusterIP   10.106.45.195   <none>        50051/TCP        33s
service/kubernetes     ClusterIP   10.96.0.1       <none>        443/TCP          34s

NAME                           READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/hello-server   3/3     3            3           33s
deployment.apps/hello-worker   2/2     2            2           33s

NAME                                      DESIRED   CURRENT   READY   AGE
replicaset.apps/hello-server-6df98cd744   3         3         3       33s
replicaset.apps/hello-worker-d99d64547    2         2         2       33s

I run a test with 10 different curls, and the output from the server:
```
(base) ➜  python git:(main) kubectl logs hello-server-6df98cd744-dp6vx
[2022-09-26T18:23:55.465Z] Node Server rpc sayHello( { name: '10-JarJar' } )
[2022-09-26T18:23:55.998Z] Node Server rpc sayHello( { name: '05-Eric' } )

(base) ➜  python git:(main) kubectl logs hello-server-6df98cd744-h4vj6
[2022-09-26T18:23:54.804Z] Node Server rpc sayHello( { name: '01-Andy' } )
[2022-09-26T18:23:55.482Z] Node Server rpc sayHello( { name: '04-David' } )
[2022-09-26T18:23:55.537Z] Node Server rpc sayHello( { name: '02-Brett' } )
[2022-09-26T18:23:55.845Z] Node Server rpc sayHello( { name: '08-Hardy' } )

(base) ➜  python git:(main) kubectl logs hello-server-6df98cd744-hrhgk
[2022-09-26T18:23:44.361Z] Example app listening on port 3000
[2022-09-26T18:23:54.992Z] Node Server rpc sayHello( { name: '07-Greg' } )
[2022-09-26T18:23:55.328Z] Node Server rpc sayHello( { name: '03-Cesar' } )
[2022-09-26T18:23:55.817Z] Node Server rpc sayHello( { name: '09-Indy' } )
[2022-09-26T18:23:55.885Z] Node Server rpc sayHello( { name: '06-Felix' } )
```
The output from the workers:
```
(base) ➜  python git:(main) kubectl logs hello-worker-d99d64547-c6sjs
Python Worker rpc sayHello("01-Andy")
Python Worker rpc sayHello("08-Hardy")
Python Worker rpc sayHello("04-David")
Python Worker rpc sayHello("02-Brett")

(base) ➜  python git:(main) kubectl logs hello-worker-d99d64547-mtx7w
Python Worker rpc sayHello("07-Greg")
Python Worker rpc sayHello("06-Felix")
Python Worker rpc sayHello("03-Cesar")
Python Worker rpc sayHello("09-Indy")
Python Worker rpc sayHello("10-JarJar")
Python Worker rpc sayHello("05-Eric")
```