import CryptoJS from 'crypto-js';
import twilio from 'twilio';
import app from '../server';
import { User, Call } from '../models';


export function newCall(req, res, next) {	
	console.log('New call', req.body);
	const call = new twilio.TwimlResponse();
	call.play('static/representative.mp3');
	call.say('Howdy fella. This is Andy Lipmann speaking.')
	call.hangup();
	res.status(200);
	res.type('text/xml');
	console.log('tostring', call.toString());
	res.send(call.toString());
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
