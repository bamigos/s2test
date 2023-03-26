/**
import dbgp from 'dbgp';

const connection = dbgp.connect('127.0.0.1', 10000);

connection.on('data', () => {
	console.log('data');
})
**/
import DBGPServer from "./DBGPServer";

const dbgpServer = new DBGPServer();

dbgpServer.on('ready', () => {
	console.log('ready!');
	/*
	// Handgout server input:  LuaDBGp: Unknown command received from the IDE - "status"
	dbgpServer.sendCommand('status', { }).then((payload) => {
		console.log('status response', payload);
	});
	 */
	dbgpServer.sendCommand('run', { }).then((payload) => {
		console.log('eval response', JSON.stringify(payload, null, '  '));



	});

	/*
	*/
});

dbgpServer.on('stdout', (data) => {
	console.log('out:', data);
});