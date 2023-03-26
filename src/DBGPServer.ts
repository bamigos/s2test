import { EventEmitter } from "node:events";
import { xml2js } from "xml-js";

import DBGPRawServer from './DBGPRawServer';
import {TDBGPCommandName, TDBGPDataName} from "./types";
import PromiseWrapper from "./utils/PromiseWrapper";

class DBGPServer extends EventEmitter {
	private rawServer: DBGPRawServer;
	private initPacket: any = null;
	private transactionCounter: number = 0;
	private transactionPromises: Record<string, PromiseWrapper<any>> = {};

	constructor() {
		super();

		this.rawServer = new DBGPRawServer();

		this.rawServer.addListener('packet', this.onRawPacket);
		this.rawServer.addListener('error', this.onRawError);
	}

	private onRawPacket = (data) => {
		const payload = xml2js(data).elements;
		//console.log('packet received', payload);

		if (payload.length > 1) {
			throw new Error('There can be more than one element?');
		}

		this.onPacket(payload[0]);
	}

	private onRawError = (data) => {
		console.log('error received', data);
	}

	private onPacket(payload: any) {
		const { name }: {
			name: TDBGPDataName
		} = payload;

		switch(name) {
			case 'init': {
				this.initPacket = payload.attributes;
				this.emit('ready');
				break;
			}
			case 'response': {
				const transaction = this.transactionPromises[payload.attributes.transaction_id];

				if (!transaction) {
					throw new Error(`Received response for unknown transaction. ${name} ${JSON.stringify(payload)}`);
				}

				transaction.resolve(payload);
				break;
			}
			case 'notify': {
				console.log('receive notyify', payload);
				break;
			}
			case 'stream': {
				let _payload = payload as {
					name: 'stream',
					attributes: { type: 'stdout' | 'stdin' },
					elements: [
						{ type: 'text', text: string /* base64 */ }
					]
				};

				//console.log('receive stream', _payload.attributes.type, atob(_payload.elements[0].text));
				console.log('emit', _payload.attributes.type);
				this.emit(_payload.attributes.type, Buffer.from(_payload.elements[0].text, 'base64').toString());
				break;
			}
			default: {
				throw new Error('Received unknown data name: ' + name);
			}
		}
	}

	public sendCommand(command: TDBGPCommandName, args: Record<string, string | number> = {}, data?: any) {
		args = {
			...args,
			i: ++this.transactionCounter,
		};

		const promiseWrapper = new PromiseWrapper<any>();
		this.transactionPromises[args.i] = promiseWrapper;

		this.rawServer?.write(command, args, data);

		return promiseWrapper.promise;
	}
}

export default DBGPServer;