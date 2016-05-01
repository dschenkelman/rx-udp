const RxNode = require("rx-node");
const dgram = require("dgram");
const rxUdp = require("../");

const SERVER_PORT = 9999;
const SERVER_HOST = "localhost";

// setup server
const server = dgram.createSocket("udp4");
const serverObservable = rxUdp.observableFromSocket(buf => buf.toString("utf8"), server);
server.bind(SERVER_PORT, SERVER_HOST);

// setup client
const client = dgram.createSocket("udp4");
const clientObserver = rxUdp.observerForSocket(
    (str) => new Buffer(str), SERVER_PORT, SERVER_HOST, client);

// pipe stdin to client
const subscription = RxNode.fromReadableStream(process.stdin).subscribe(clientObserver);

// pipe stdout to server
RxNode.writeToStream(serverObservable, process.stdout, "utf8");