import { expect } from "chai";
import * as Rx from "rx";
import * as dgram from "dgram";

import * as rxUdp from "../src";

const SERVER_PORT = 9999;
const SERVER_HOST = "localhost";

describe("rx udp", () => {
    describe("observable udp socket tests", () => {
        it("should apply map function to messages and forward to observable", (done) => {
            const server = dgram.createSocket("udp4");
            const client = dgram.createSocket("udp4");
            server.bind(SERVER_PORT, SERVER_HOST);
            const observable = rxUdp.observableFromSocket<string>(
                b => b.toString("utf8"), server);

            const valuesSent = [ "hello", "world", "!" ];
            const valuesReceived = [];

            Rx.Observable.from(valuesSent).flatMap(value => {
                return Rx.Observable.fromNodeCallback<string, number>(
                    (message: string, callback: (err: Error, result: number) => void) => {
                    const buffer = new Buffer(message, "utf8");
                    client.send(buffer, 0, buffer.byteLength, SERVER_PORT, SERVER_HOST, callback);
                })(value);
            }).subscribeOnCompleted(() => {
                setTimeout(() => {
                    server.close();
                }, 20);
            });

            observable.forEach(s => valuesReceived.push(s));

            observable.subscribeOnCompleted(() => {
                // order is not important, reception is
                expect(valuesReceived).to.have.length(3);
                expect(valuesSent).to.include.members(valuesReceived);
                done();
            });
        });

        it("should error observable if socket errors", (done) => {
            const server = dgram.createSocket("udp4");
            const observable = rxUdp.observableFromSocket<string>(
                b => b.toString("utf8"), server);

            observable.subscribeOnError(err => {
                expect(err).to.be.an("Error");
                expect(err.errno).to.equal("ENOTFOUND");
                expect(err.code).to.equal("ENOTFOUND");
                expect(err.syscall).to.equal("getaddrinfo");
                expect(err.hostname).to.equal("INEXISTENT_HOST");
                done();
            });

            // should result in error ENOTFOUND being emitted 
            server.bind(SERVER_PORT, "INEXISTENT_HOST");
        });
    });

    describe("observer udp socket tests", () => {
        it("should close socket when observer completes", (done) => {
            const client = dgram.createSocket("udp4");
            const observer = rxUdp.observerForSocket(
                (t: string) => new Buffer(t), SERVER_PORT, SERVER_HOST, client);

            client.on("close", () => {
                done();
            });

            observer.onCompleted();
        });

        it("should close socket when observer errors", (done) => {
            const client = dgram.createSocket("udp4");
            const observer = rxUdp.observerForSocket(
                (t: string) => new Buffer(t), SERVER_PORT, SERVER_HOST, client);

            client.on("close", () => {
                done();
            });

            observer.onError(new Error("Something failed"));
        });

        it("should send data through socket when observer gets next value", (done) => {
            const valuesReceived = [];
            const server = dgram.createSocket("udp4", (message) => {
                valuesReceived.push(message.toString("utf8"));
            });
            server.bind(SERVER_PORT, SERVER_HOST);

            const client = dgram.createSocket("udp4");
            const observer = rxUdp.observerForSocket(
                (t: string) => new Buffer(t), SERVER_PORT, SERVER_HOST, client);

            const valuesSent = [ "hello", "world", "!" ];

            valuesSent.forEach(v => observer.onNext(v));

            client.on("close", () => {
                // order is not important, reception is
                expect(valuesReceived).to.have.length(3);
                expect(valuesSent).to.include.members(valuesReceived);
                done();
            });

            setTimeout(() => {
                observer.onCompleted();
            }, 20);
        });
    });
});
