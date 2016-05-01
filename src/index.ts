import * as dgram from "dgram";
import * as Rx from "rx";

export function observableFromSocket<T>(
    map: (message: Buffer, remoteInfo?: dgram.RemoteInfo) => T,
    socket: dgram.Socket) {
    return Rx.Observable.create<T>(observer => {
        // we could use compose here, but it is not simple with types. this is preferable
        socket.on("message", (message: Buffer, remoteInfo: dgram.RemoteInfo) => {
            observer.onNext(map(message, remoteInfo));
        });
        socket.on("error", err => {
            observer.onError(err);
        });
        socket.on("close", () => {
            observer.onCompleted();
        });
    });
};

export function observerForSocket<T>(map: (t: T) => Buffer,
    port: number,
    address: string,
    socket: dgram.Socket) {
        return Rx.Observer.create<T>(
            t => {
                const buffer = map(t);
                socket.send(buffer, 0, buffer.byteLength, port, address);
            },
            () => socket.close(),
            () => socket.close());
}