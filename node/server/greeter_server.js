/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


const PROTO_PATH = __dirname + '/../../proto/greeter.proto';
console.log('PROTO_PATH: ' + PROTO_PATH);
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const greeterAPI = require('./greeter_api');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH, greeterAPI.opt);
const proto = grpc.loadPackageDefinition(packageDefinition).helloworld;


/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
console.log(greeterAPI)
const server = new grpc.Server();
server.addService(proto.Greeter.service, greeterAPI);
server.bindAsync('[::]:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});
