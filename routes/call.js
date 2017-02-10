import twilio from 'twilio';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone, decryptPhone } from '../utilities/encryption';
import { queryForUser } from './user';
import request from 'request-promise';

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const urldomain = process.env.API_SERVER;

export function callFromServer(req, res) {
	const userId = req.body.userId;
	const repId = req.body.repId;
	console.log(`Call from frontend - user #${userId} to ${repId}`);

	User.findOne({
		where: {
			id: userId,
		}
	})
	.then(function(newUser) {
		const userPhone = decryptPhone(newUser.dataValues.phone);
		console.log(`Call from frontend - phone ${userPhone} to ${repId}`);
		const urlToCall = `${urldomain}/newcall/${repId}/`;
		console.log(urlToCall);
		client.makeCall({
			to: userPhone,
			from: process.env.TWILIO_NUMBER,
			url: urlToCall,
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
	const fromServer = req.body.From === process.env.TWILIO_NUMBER ? true : false;
	const userPhone = fromServer ? req.body.To : req.body.From;
	const connectingToRep  = function(call, repData){
		const name = repData.first_name + ' ' + repData.last_name;
		call.say(`Connecting to ${name}`);
		call.dial({ hangupOnStar: true }, process.env.ANDY_NUMBER);
		call.hangup();
		res.status(200);
		res.type('text/xml');
		res.send(call.toString());
	};
	if (fromServer) {
		const repId = req.params.repId;
		console.log('hello');
		return request({
			uri: `https://congress.api.sunlightfoundation.com/legislators?apikey=${process.env.SUNLIGHT_FOUNDATION_KEY}&bioguide_id=${repId}`, 
			json: true,
		})
		.then(function(repData) {
			console.log(repData);
			connectingToRep(call, repData.results[0]);
		});
	} else {
		return queryForUser(userPhone)
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
			};
			return res.status(500).json('Error with new call');
		});
	}

}
app.post('/newcall', newCall);
app.post('/newcall/:repId', newCall);

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

export function sendVerificationCodeThroughCall(req, res, next) {
	const call = new twilio.TwimlResponse();
	const codeToSayableForm = req.params.code.split('').join('. ');
	call.say(`Hello. Here is your FiftyNifty verification code. ${codeToSayableForm}.`);
	call.say(`I repeat. ${codeToSayableForm}.`);
	call.say(`Thanks for using FiftyNifty. Bye.`);
	call.hangup();
	res.status(200);
	res.type('text/xml');
	res.send(call.toString());
}
app.post('/callverification/:code', sendVerificationCodeThroughCall);
