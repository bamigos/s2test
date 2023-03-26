

import net from 'node:net';
import { EventEmitter } from 'node:events';

class DBGPRawServer extends EventEmitter {
	private server: net.Server | null = null;
	private socket: net.Socket | null = null;

	private packetLength: number = 0;
	private packetPayload: string = '';

	constructor(host = '127.0.0.1', port = 10000) {
		super();
		this.createServer(host, port);
	}

	private createServer(host, port) {
		this.server = net.createServer((socket) => {
			this.socket = socket;
			this.initSocket();
		});

		this.server.listen(10000, '127.0.0.1');
	}

	private initSocket() {
		const { socket } = this;

		if (!socket) {
			return;
		}

		socket.on('data', (data) => {
			console.log('data', ` \x1b[100m${data.toString()}\x1b[0m`);

			const receiveData = data.toString().split('\0');

			if (receiveData.pop() !== '') {
				throw new Error('Not valid packet (not null terminated)');
			}

			if (this.packetLength === 0) {
				this.packetLength = parseInt(receiveData.shift() ?? '');

				if (Number.isNaN(this.packetLength)) {
					throw new Error('Not valid packet (no packet length prepended)');
				}
			}

			this.packetPayload += receiveData.join();
			this.packetLength -= this.packetPayload.length;

			if (this.packetLength < 0) {
				throw new Error(`Not valid packet (received more chars then expected: ${this.packetLength})`);
			} else if (this.packetLength === 0) {
				//console.log('Full packet receided', this.packetPayload, xml2js(this.packetPayload).elements);

				this.emit('packet', this.packetPayload);
				//setTimeout(() => socket.write(`eval -i transaction_id -- ${btoa('print("a")')}\0`), 100);

				this.packetPayload = '';
				this.packetLength = 0;
			}

			// Продолжаем слушать пакеты, чтобы получить полную команду
		});

		socket.on('error', (error) => {
			//console.log('erorr', error.toString());
			this.emit('error', error.toString());
		});
	}

	public write(command: string, args: Record<string, string | number>, data?: string) {
		if (!this.socket) {
			throw new Error('Trying to write to non existing socket');
		}

		let str = command;

		if (Object.keys(args).length) {
			for (const [key, value] of Object.entries(args)) {
				str += ` -${key} ${value}`;
			}
		}

		if (data) {
			str += ` -- ${btoa(data)}`
		}

		str += '\0';

		console.log(`>>> ${str}`);

		this.socket.write(str)
	}
}

export default DBGPRawServer;