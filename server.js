import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import { sequelize, User } from './models';

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

/* -------- */
/* Configure app session */
/* -------- */
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
app.use(session({
	secret: 'sessionsecret',
	resave: false,
	saveUninitialized: false,
	store: new SequelizeStore({
		db: sequelize
	}),
	cookie: {
		path: '/',
		httpOnly: false,
		secure: false,
		maxAge: 365 * 24 * 60 * 60 * 1000// = 365 days.
	},
}));

/* ------------------- */
/* Configure app login */
/* ------------------- */
const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser()); // use static serialize and deserialize of model for passport session support
passport.deserializeUser(User.deserializeUser()); // use static serialize and deserialize of model for passport session support
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
