import Promise from 'bluebird';
import request from 'request-promise';
import app from '../server';
import { sequelize, User, Call } from '../models';
import { encryptPhone } from '../utilities/encryption';
import { generateTextCode } from '../utilities/generateHash';
// import { parse, format } from 'libphonenumber-js';

export const userAttributes = ['id', 'name', 'zipcode', 'parentId', 'hierarchyLevel', 'lat', 'lon', 'createdAt', 'state', 'district', 'variant'];
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const urldomain = process.env.API_SERVER;

const getStateDistrict = function (locData) {
	const lookupQuery = locData.lat ? `latitude=${locData.lat}&longitude=${locData.lon}` : `zip=${locData.zipcode}`;
	const apiRequestUrl = `https://congress.api.sunlightfoundation.com/districts/locate?apikey=${process.env.SUNLIGHT_FOUNDATION_KEY}&${lookupQuery}`;
	return request({ uri: apiRequestUrl, json: true })
	.then((response) => {
		return (response.results && response.results[0]) || { state: null, district: null };
	})
	.catch((err) => {
		console.log(err);
		return { state: null, district: null };
	});
};

export function queryForUser(userId, mode) {
	const whereParams = (mode === 'id') ? {
		id: userId,
		signupCompleted: true,
	} : {
		phone: encryptPhone(userId),
		signupCompleted: true,
	};
	return User.findOne({
		where: whereParams,
		include: [
			{ model: User, as: 'descendents', hierarchy: true, attributes: userAttributes, include: { model: Call, as: 'calls' } },
			{ model: User, as: 'ancestors', attributes: userAttributes },
			{ model: Call, as: 'calls' },
		],
		attributes: userAttributes,
	})
	.then(function(userData) {
		if (!userData) { throw new Error('No userData'); }
		const lookupQuery = userData.lat ? `latitude=${userData.lat}&longitude=${userData.lon}` : `zip=${userData.zipcode}`;
		const findReps = request({ 
			uri: `https://congress.api.sunlightfoundation.com/legislators/locate?apikey=${process.env.SUNLIGHT_FOUNDATION_KEY}&${lookupQuery}`, 
			json: true 
		});
		return Promise.all([userData, findReps]);
	})
	.spread(function(userData, repsData) {
		return { ...userData.toJSON(), reps: repsData.results };
	});
}

export function getUser(req, res, next) {
	queryForUser(req.query.userId, 'id')
	.then(function(userData) {
		return res.status(201).json(userData);
	})
	.catch(function(err) {
		console.error('Error in getUser: ', err);
		return res.status(500).json('User not found');
	});
}
app.get('/user', getUser);

export function postUser(req, res, next) {	
	const phoneHash = encryptPhone(req.body.phone);
	const locData = { zipcode: req.body.zipcode };
	User.findOne({
		where: {
			phone: phoneHash,
			signupCompleted: true,
		}
	})
	.then(function(completedUserData) {
		if (completedUserData) { throw new Error('Phone number already used'); }
		return User.update({ signupAttempts: sequelize.literal('"signupAttempts" + 1') }, {
			where: { phone: phoneHash, signupCompleted: false },
			individualHooks: true, // necessary for afterUpdate hook to fire.
		});
	})
	.then(function(updateCount) {
		if (updateCount[0]) { 
			return User.findOne({ where: { phone: phoneHash } }); 
		}

		return getStateDistrict(locData)
		.then(function(stateDist) {
			if (!stateDist.state) { throw new Error('Invalid Zipcode'); }
			return User.create({
				phone: phoneHash,
				name: req.body.name,
				zipcode: req.body.zipcode,
				parentId: req.body.parentId,
				variant: req.body.variant,
				state: stateDist.state,
				district: stateDist.district,
				signupCode: generateTextCode(),
				signupAttempts: 1,
				signupCompleted: false,
			});
		});
	})
	.then(function(userData) {
		return client.messages.create({
			to: req.body.phone,
			from: process.env.TWILIO_NUMBER,
			body: `Your authentication code is ${userData.signupCode}. Welcome to Fifty Nifty! `,
		});
	})
	.then(function(result) {
		return res.status(201).json(true);
	})
	.catch(function(err) {
		console.error('Error in postUser: ', err);
		let message = 'Phone number already used';
		if (err.message === 'Invalid Zipcode') { message = 'Invalid Zipcode'; }

		return res.status(500).json(message);
	});
}
app.post('/user', postUser);

export function getUserSimple(req, res, next) {
	User.findOne({
		where: {
			id: req.query.userId,
			signupCompleted: true
		},
		attributes: userAttributes,
	})
	.then(function(userData) {
		return userData.toJSON();
	})
	.then(function(userData) {
		return res.status(201).json(userData);
	})
	.catch(function(err) {
		console.error('Error in getUser: ', err);
		return res.status(500).json('User not found');
	});
}
app.get('/user/simple', getUserSimple);

export function postUserAuthenticate(req, res, next) {
	const phoneHash = encryptPhone(req.body.phone);
	// console.log(req.body.phone + ' ' + phoneHash + ' ' + req.body.signupCode);
	return User.update({ signupCompleted: true }, {
		where: {
			phone: phoneHash,
			signupCompleted: false,
			signupCode: req.body.signupCode,
		}
	})
	.then(function(updateCount) {
		if (!updateCount[0]) { 
			throw new Error('Invalid authentication code');
		}
		return User.findOne({
			where: {
				phone: phoneHash,
				signupCompleted: true,
			},
			attributes: userAttributes
		});
	})
	.then(function(userData) {
		return res.status(201).json(userData);
	})
	.catch(function(err) {
		console.error('Error in postUserAuthenticate: ', err);
		const message = 'Invalid authentication code';
		return res.status(500).json(message);
	});
}

app.post('/user/authenticate', postUserAuthenticate);

export function putUserAddress(req, res, next) {
	// Address: String '123 Chestnut St Boston '
	// Zipcode: String '02476'
	const GOOGLE_KEY = process.env.GEOCODING_API_KEY;
	const addressHtml = encodeURI(req.body.address);
	const zipCode = req.body.zipcode;
	const apiRequestUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${addressHtml}&components=postal_code:${zipCode}&key=${GOOGLE_KEY}`;

	request({ uri: apiRequestUrl, json: true })
	.then((response) => {
		const lat = response.results[0].geometry.location.lat;
		const lon = response.results[0].geometry.location.lng;
		const zip = response.results[0].address_components.reduce((previous, current)=> {
			if (current.types[0] === 'postal_code') { return current.short_name; }
			return previous;
		}, '00000');

		if (zip === '00000') { console.log(apiRequestUrl); }
		const locData = { lat: lat, lon: lon };
		
		return Promise.all([lat, lon, zip, getStateDistrict(locData)]);
	})
	.spread(function(lat, lon, zip, getLocResult) {
		const state = getLocResult.state;
		const district = getLocResult.district;
		return User.update({ lat: lat, lon: lon, zip: zip, state: state, district: district }, {
			where: {
				id: req.body.userId
			}
		});
	})
	.then(function(updateCount) {
		return queryForUser(req.body.userId, 'id');
	})
	.then(function(userData) {
		return res.status(201).json(userData); 
	})
	.catch((err) => {
		console.log(err);
		return res.status(500).json(err); 
	});
}
app.put('/user/address', putUserAddress);

export function callAuthenticate(req, res, next) {
	const phoneHash = encryptPhone(req.params.number);
	return 	User.findOne({
		where: {
			phone: phoneHash
		},
		attributes: ['id', 'signupCode'],
	})
	.then(function(userData) {
		return client.calls.create({
			to: req.params.number,
			from: process.env.TWILIO_NUMBER,
			url: `${urldomain}/callverification/${userData.signupCode}`,
		})
		.catch(function(err) {
			console.log(err);
			throw new Error('Error in retreving the code - ' + err);
		});
	})
	.catch(function(err) {
		console.log(err);
		return res.status(500).json(err.message);
	});
}
app.get('/callAuthenticate/:number', callAuthenticate);
