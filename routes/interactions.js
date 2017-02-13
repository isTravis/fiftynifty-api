import app from '../server';
import { User } from '../models';
import { encryptPhone } from '../utilities/encryption';
import { userAttributes } from './user';
import { generateTextCode } from '../utilities/generateHash';
const urldomain = process.env.API_SERVER;
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export function sendTwoFactorCode(req, res, next) {
	// Check this is legit
	const phoneHash = encryptPhone(req.params.number);
	User.findOne({
		where: { phone: phoneHash },
		attributes: userAttributes,
	})
	.then(function(userData) { 
		if (!userData) { throw new Error('Phone number not found'); }
		const firstGenerationAttempt = new Date(userData.firstGenerationAttempt);
		const now = new Date();
		const diff = now - firstGenerationAttempt;
		if (userData.codeGenerationAttempts > 10 && diff > (10 * 60 * 1000)) { // Not legit
			throw new Error('Too many code generation attempts. Try again in 10 minutes.');
		} 
		// It's legit
		// Generate random in range
		const verificationCode = generateTextCode();
		const isItFirstAttempt = (userData.codeGenerationAttempts === 0);
		const nowInUTC = now.toUTCString();
		const updateUser = User.update({
			verificationCode: verificationCode,
			verificationExpiration: nowInUTC,
			codeGenerationAttempts: userData.codeGenerationAttempts + 1,
			firstGenerationAttempt: isItFirstAttempt ? nowInUTC : userData.firstGenerationAttempt,
		}, {
			where: { phone: encryptPhone(req.params.number) },
		});
		return Promise.all([verificationCode, updateUser]);
	})
	.spread(function(verificationCode, updatedUser) {
		if (updatedUser[0] === 0) {
			console.log(`${req.params.number} - Phone not in the database`);
			throw new Error('Phone not in the database');
		}

		if (req.params.mode === 'text') {
			return client.messages.create({
				to: req.params.number,
				from: process.env.TWILIO_NUMBER,
				body: `The verification code is ${verificationCode}`,
			});
		} else {
			console.log(`${urldomain}/callverification/${verificationCode}`);
			return client.calls.create({
				to: req.params.number,
				from: process.env.TWILIO_NUMBER,
				url: `${urldomain}/callverification/${verificationCode}`,
			})
			.catch(function(err) {
				console.log(err);
				throw new Error('Error in retreving the code - ' + err);
			});
		};
	})
	.then(function() {
		res.send('"Code created"');
		return res.status(201).end();
	})
	.catch(function(err) {
		console.log(err);
		return res.status(500).json(err.message);
	});

}
app.get('/twofactor/:number/:mode', sendTwoFactorCode);

export function checkTwoFactorCode(req, res, next) {
	const phoneHash = encryptPhone(req.body.phone);
	User.findOne({
		where: {
			phone: phoneHash
		},
		attributes: ['id', 'verificationExpiration', 'verificationAttempts', 'verificationCode'],
	})
	.then(function(userData) {
		const expirationDate = new Date(userData.verificationExpiration);
		const now = new Date();

		if (userData.verificationCode !== req.body.code) {
			return User.update({ verificationAttempts: (userData.verificationAttempts + 1) }, {
				where: { phone: phoneHash },
			})
			.then(function(result) {
				return res.status(500).json('Wrong code');
			});			 
		}

		const hasExpired = (now - expirationDate) > (10 * 60 * 1000);
		if (hasExpired) {
			throw new Error('Code has expired. Please enter your phone number again.');
		}

		if (userData.verificationAttempts > 10) {
			throw new Error('Too many attemps. Please wait for 10 minutes and try again.');
		}

		return User.update({ verificationAttempts: 0 }, {
			where: { phone: phoneHash },
		})
		.then(function(result) {
			// res.send('"Correct code"');
			// return res.status(200).end();
			return User.findOne({
				where: {
					phone: phoneHash
				},
				attributes: userAttributes
			})
			.then(function(userResult) {
				return res.status(201).json(userResult);
			});
		});
	})
	.catch((err) => {
		console.log(err);
		return res.status(500).json(err.message);
	});
}
app.post('/twofactor', checkTwoFactorCode);