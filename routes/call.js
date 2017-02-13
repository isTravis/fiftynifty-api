import twilio from 'twilio';
import request from 'request-promise';
import { parse, format } from 'libphonenumber-js';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone, decryptPhone } from '../utilities/encryption';
import { queryForUser } from './user';

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const urldomain = process.env.API_SERVER;

export function callFromServer(req, res) {
	const id = req.body.id;
	const repId = req.body.repId;
	console.log(`Call from frontend - user #${id} to ${repId}`);

	User.findOne({
		where: {
			id: id,
		}
	})
	.then(function(newUser) {
		const userPhone = decryptPhone(newUser.dataValues.phone);
		const urlToCall = `${urldomain}/newcall/${repId}/`;
		client.makeCall({
			to: userPhone,
			from: process.env.TWILIO_NUMBER,
			url: urlToCall,
			StatusCallback: `${urldomain}/callStatusChange`,
		}, function (err, message) {
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
	// console.log('New call', req.body);
	const call = new twilio.TwimlResponse();
	const fromServer = req.body.From === process.env.TWILIO_NUMBER;
	const userPhone = fromServer ? req.body.To : req.body.From;
	const connectingToRep = function(callObj, repData) {
		const repPhone = format(parse(repData.phone, 'US'), 'International_plaintext');
		Call.create({
			twilioId: req.body.CallSid,
			numberDialed: repPhone,
			recipientId: repData.bioguide_id,
			district: (repData.title === 'Sen') ? 0 : repData.district,
			state: repData.state,
			zip: '00000',
			completed: 0,
		});
		const name = repData.first_name + ' ' + repData.last_name;
		callObj.say(`Connecting to ${name}`);
		callObj.dial({ hangupOnStar: true }, repPhone);
		callObj.hangup();
		res.status(200);
		res.type('text/xml');
		res.send(callObj.toString());
	};
	if (fromServer) {
		const repId = req.params.repId;
		return request({
			uri: `https://congress.api.sunlightfoundation.com/legislators?apikey=${process.env.SUNLIGHT_FOUNDATION_KEY}&bioguide_id=${repId}`, 
			json: true,
		})
		.then(function(repData) {
			connectingToRep(call, repData.results[0]);
		});
	} else {
		return queryForUser(userPhone, 'phone')
		.then(function(result) {
			connectingToRep(call, result.reps[0]);
		})
		.catch(function(err) {
			console.error('Error in newcall:' + err.message);
			if (err.message === 'No userData') {
				call.say('I\'m sorry - we cannot find your number in our system. Please signup at fifty nifty dot org. Thank you.');
				call.hangup();
				res.status(200);
				res.type('text/xml');
				res.send(call.toString());
			}
			return res.status(500).json('Error with new call');
		});
	}

}
app.post('/newcall', newCall);
app.post('/newcall/:repId', newCall);

export function callStatusChange(req, res, next) {	
	// console.log('In call status change ', req.body);
	const fromServer = req.body.From === process.env.TWILIO_NUMBER;
	const userPhone = fromServer ? req.body.To : req.body.From;
	if (req.body.CallStatus === 'completed') {
		return User.findOne({
			where: {
				phone: encryptPhone(userPhone),
			}
		})
		.then(function(callingUser) {
			return Call.update({
				duration: req.body.CallDuration,
				callerId: callingUser.id,
				zipcode: callingUser.zipcode,
				completed: 1,
			}, {
				where: {
					twilioId: req.body.CallSid,
				}
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

export function sendVerificationCodeThroughCall(req, res, next) {
	const call = new twilio.TwimlResponse();
	const codeToSayableForm = req.params.code.split('').join('. ');
	call.say(`Hello. Here is your FiftyNifty verification code. ${codeToSayableForm}.`);
	call.say(`I repeat. ${codeToSayableForm}.`);
	call.say('Thanks for using FiftyNifty. Bye.');
	call.hangup();
	res.status(200);
	res.type('text/xml');
	res.send(call.toString());
}
app.post('/callverification/:code', sendVerificationCodeThroughCall);
