# rx-udp ![](https://travis-ci.org/dschenkelman/rx-udp.svg?branch=master)
Use observers and observables to read and write from udp sockets

## Install
```
npm i -S rx-udp
```

## Reading from a socket
Use the following snippet to create an `Observable<string>` to read messages from a socket:
```javascript
const rxUdp = require("rx-udp");
const dgram = require("dgram");
const server = dgram.createSocket("udp4");
const observable = rxUdp.observableFromSocket(buf => buf.toString("utf8"), server);
server.bind(SERVER_PORT, SERVER_HOST);
```

## Writing to a socket
Use the following snippet to create an `Observer<string>` to send messages to a specific server:
```javascript
const rxUdp = require("rx-udp");
const dgram = require("dgram");
const client = dgram.createSocket("udp4");
const observer = rxUdp.observerForSocket((str) => new Buffer(str), SERVER_PORT, SERVER_HOST, client);
```

## Echo program
You can create an (overly complicated) [echo application](samples/echo.js):
```javascript
const RxNode = require("rx-node");
const dgram = require("dgram");
const rxUdp = require("rx-udp");

const SERVER_PORT = 9999;
const SERVER_HOST = "localhost";

// setup server
const server = dgram.createSocket("udp4");
const serverObservable = rxUdp.observableFromSocket(buf => buf.toString("utf8"), server);
server.bind(SERVER_PORT, SERVER_HOST);

// setup client
const client = dgram.createSocket("udp4");
const clientObserver = rxUdp.observerForSocket((str) => new Buffer(str), SERVER_PORT, SERVER_HOST, client);

// pipe stdin to client
const subscription = RxNode.fromReadableStream(process.stdin).subscribe(clientObserver);

// pipe stdout to server
RxNode.writeToStream(serverObservable, process.stdout, "utf8");
```

## Contributing
Feel free to open issues with questions/bugs/features. PRs are also welcome.

## License
MIT