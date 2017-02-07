import twilio from 'twilio';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone, decryptPhone } from '../utilities/encryption';

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const urldomain = process.env.API_SERVER;

export function callFromServer(req, res) {
	const userId = req.body.userId;
	const congressNumber = req.body.congressNumber;

	User.findOne({
		where: {
			id: userId,
		}
	})
	.then(function(newUser) {
		const userPhone = decryptPhone(newUser.dataValues.phone);
		console.log(urldomain + '/newcall/' + congressNumber);	
		client.makeCall({
			to: userPhone,
			from: process.env.TWILIO_NUMBER,
			url: urldomain + '/newcall/' + congressNumber,
		}, function (err, message) {
			console.log(err);
			if (err) {
				res.status(500).send(err);
			} else {
				res.send({
					message: 'Thank you! We will be calling you shortly.',
				});
			}
		});
	});
}
app.post('/callfromserver', callFromServer);

export function newCall(req, res, next) {	
	console.log('New call', req.body);
	const call = new twilio.TwimlResponse();
	const userPhone = req.body.From === process.env.TWILIO_NUMBER ? req.body.To : req.body.From;

	User.findOne({
		where: {
			phone: encryptPhone(userPhone),
		}
	})
	.then(function(callingUser) {
		if (!callingUser) {
			call.say('I\'m sorry - we cannot find your number in our system. Please signup at fifty nifty dot org. Thank you.');
			call.hangup();
		} else {
			call.say('Connecting to Ed Markey');
			call.dial({ hangupOnStar: true }, req.params.phoneNumber);
			call.hangup();
		}
		res.status(200);
		res.type('text/xml');
		res.send(call.toString());
	})
	.catch(function(err) {
		console.error('Error in newcall: ', err);
		return res.status(500).json('Error with new call');
	});
}
app.post('/newcall/:phoneNumber', newCall);


export function callStatusChange(req, res, next) {	
	console.log('In call status change ', req.body);
	if (req.body.CallStatus === 'completed') {
		return User.findOne({
			where: {
				phone: encryptPhone(req.body.From),
			}
		})
		.then(function(callingUser) {
			return Call.create({
				numberDialed: req.body.To,
				state: req.body.ToState, // This is not the real state value we want, we want the reps state and district.
				duration: req.body.CallDuration,
				callerId: callingUser.id,
			});
		})
		.then(function() {
			res.status(200);
			res.type('text/xml');
			res.send('');
		})
		.catch(function(err) {
			console.error('Error in callStatusChange: ', err);
			return res.status(500).json('Error with callStatusChange');
		});
	}

	return res.status(201).json('');
	
}
app.post('/callStatusChange', callStatusChange);
