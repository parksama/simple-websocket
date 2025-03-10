import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.options('*', cors()); // enable CORS for all routes

const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*"
	}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
	// res.sendFile(join(__dirname, 'index.html'));
	res.send('Server is ready to use.');
});

app.get('/notify', (req, res) => {
	var user_id = req.query.user_id;
	var message = req.query.message;
	var from = req.query.from;

	var result = io.to(user_id).emit('message', {
		message,
		from
	});

	res.send(result ? 'sent' : 'failed');
});

io.on('connection', (socket) => {
	var user_id = socket.handshake.auth.user_id || 'anon';
	console.log('user connected', { user_id });

	if (user_id) {
		socket.join(user_id);
	}

	socket.on('disconnect', () => {
		console.log('user disconnected', { user_id });
	});

	socket.on('message', ({ message, target }) => {
		console.log('message', { user_id, message, target });

		io.to(target).emit('message', {
			message,
			from: user_id
		});
	});
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log(`server running at http://localhost:${port}`);
});
