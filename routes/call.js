import twilio from 'twilio';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone } from '../utilities/encryption';

export function newCall(req, res, next) {	
	console.log('New call', req.body);
	const call = new twilio.TwimlResponse();
	console.log(encryptPhone(req.body.From));
	User.findOne({
		where: {
			phone: encryptPhone(req.body.From),
		}
	})
	.then(function(callingUser) {
		if (!callingUser) {
			call.say('I\'m sorry - we cannot find your number in our system. Please signup at fifty nifty dot org. Thank you.')
			call.hangup();
		} else {
			call.play('static/representative.mp3');
			call.say('Connecting to Ed Markey');
			call.hangup();
		}
		res.status(200);
		res.type('text/xml');
		console.log('tostring', call.toString());
		res.send(call.toString());
	})
	.catch(function(err) {
		console.error('Error in newcall: ', err);
		return res.status(500).json('Error with new call');
	});
}
app.post('/newcall', newCall);

export function callStatusChange(req, res, next) {	
	console.log('In call status change ', req.body);
	res.status(200);
	res.type('text/xml');
	res.send('');
}
app.post('/callStatusChange', callStatusChange);
