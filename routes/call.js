import twilio from 'twilio';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone } from '../utilities/encryption';

export function newCall(req, res, next) {	
	console.log('New call', req.body);
	const call = new twilio.TwimlResponse();
	User.findOne({
		where: {
			phone: encryptPhone(req.body.From),
		}
	})
	.then(function(callingUser) {
		if (!callingUser) {
			console.log('Could not find user that is calling.')
			call.say('I\'m sorry - we cannot find your number in our system. Please signup at fifty nifty dot org. Thank you.')
			call.hangup();
		} else {
			console.log('Found the user');
			call.play('static/representative.mp3');
			call.say('Connecting to Ed Markey');
			call.hangup();
		}
		res.status(200);
		res.type('text/xml');
		console.log('tostring', call.toString());
		res.send(call.toString());
	})
	
	// const phoneHash = CryptoJS.AES.encrypt(req.body.phone, process.env.PHONE_KEY).toString();
	// return User.create({
	// 	phone: phoneHash,
	// 	name: req.body.name,
	// 	zipcode: req.body.zipcode,
	// 	parentId: req.body.parentId,
	// })
	// .then(function(result) {
	// 	return User.find({
	// 		where: {
	// 			id: result.id
	// 		},
	// 		attributes: userAttributes
	// 	});
	// })
	// .then(function(userData) {
	// 	return res.status(201).json(userData);
	// })
	// .catch(function(err) {
	// 	console.error('Error in postUser: ', err);
	// 	return res.status(500).json('Phone number already used');
	// });
}
app.post('/newcall', newCall);

export function callStatusChange(req, res, next) {	
	console.log('In call status change ', req.body);
	res.status(200);
	res.type('text/xml');
	res.send('');
}
app.post('/callStatusChange', callStatusChange);
