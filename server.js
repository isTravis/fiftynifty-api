import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

/* -------------------------------- */
/* Initialize development variables */
/* -------------------------------- */
if (process.env.NODE_ENV !== 'production') {
	require('./config.js');
	console.debug = function() {};
}
// console.debug = console.info;
console.debug = function() {};
/* -------------------------------- */
/* -------------------------------- */

const app = express();
export default app;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

/* -------------------- */
/* -------------------- */

if (process.env.WORKER !== 'true') {

	// Catch the browser's favicon request. You can still
	// specify one as long as it doesn't have this exact name and path.
	app.get('/favicon.ico', function(req, res) {
		res.writeHead(200, { 'Content-Type': 'image/x-icon' });
		res.end();
	});

	app.all('/*', function(req, res, next) {
		res.header('Access-Control-Allow-Origin', req.headers.origin);
		res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
		res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
		res.header('Access-Control-Allow-Credentials', true);
		next();
	});

	app.use(function (err, req, res, next) {
		// Handle errors.
		// console.log('Error! ' + err + ', ' + next);
		console.log('Error! ' + err);
		next();
	});

	/* ------------------- */
	/* API Endpoints */
	/* ------------------- */
	require('./routes/user.js');

	/* ------------------- */
	/* ------------------- */

	const port = process.env.PORT || 9876;
	app.listen(port, (err) => {
		if (err) { console.error(err); }
		console.info('----\n==> 🌎  API is running on port %s', port);
		console.info('==> 💻  Send requests to http://localhost:%s', port);
	});
}
