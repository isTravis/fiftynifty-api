import twilio from 'twilio';
import Promise from 'bluebird';
import request from 'request-promise';
import app from '../server';
import { User, Call, VerificationCode } from '../models';
import { encryptPhone } from '../utilities/encryption';
// import { parse, format } from 'libphonenumber-js';

export const userAttributes = ['id', 'name', 'zipcode', 'parentId', 'hierarchyLevel', 'lat', 'lon', 'createdAt', 'state', 'district'];
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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

const queryForUser = function(userId) {
	return User.findOne({
		where: {
			id: userId,
		},
		include: [
			{ model: User, as: 'descendents', hierarchy: true, attributes: userAttributes, include: { model: Call, as: 'calls' } },
			{ model: Call, as: 'calls' },
		],
		attributes: userAttributes,
	})
	.then(function(userData) {
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
};

export function getUser(req, res, next) {	
	queryForUser(req.query.userId)
	.then(function(userData) {
		return res.status(201).json(userData);
	})
	.catch(function(err) {
		console.error('Error in getUser: ', err);
		return res.status(500).json('User not found');
	});
}
app.get('/user', getUser);

// querying just for user details, not including phone calls and children, for showing referral on landing page
const queryForUserDetails = function(userId) {
    return User.findOne({
        where: {
            id: userId,
        },
        attributes: userAttributes,
    }).then (function(userData) {
        return userData.toJSON();
    })
};

export function getUserDetails(req, res, next) {
    queryForUserDetails(req.query.userId)
        .then(function(userData) {
            return res.status(201).json(userData);
        })
        .catch(function(err) {
            console.error('Error in getUser: ', err);
            return res.status(500).json('User not found');
        });
}
app.get('/username', getUserDetails);


export function postUser(req, res, next) {	
	const phoneHash = encryptPhone(req.body.phone);
	const locData = { zipcode: req.body.zipcode };
	getStateDistrict(locData)
	.then(function(stateDist) {
		return User.create({
			phone: phoneHash,
			name: req.body.name,
			zipcode: req.body.zipcode,
			parentId: req.body.parentId,
			state: stateDist.state,
			district: stateDist.district,
		});
	})
	.then(function(result) {
		return User.find({
			where: {
				id: result.id
			},
			attributes: userAttributes
		});
	})
	.then(function(userData) {
		return res.status(201).json(userData);
	})
	.catch(function(err) {
		console.error('Error in postUser: ', err);
		return res.status(500).json('Phone number already used');
	});
}
app.post('/user', postUser);

export function findLatLocFromAddressInput(req, res, next) {
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
		return queryForUser(req.body.userId);
	})
	.then(function(userData) {
		return res.status(201).json(userData); 
	})
	.catch((err) => {
		console.log(err);
		return res.status(500).json(err); 
	});
}
app.post('/address', findLatLocFromAddressInput);

export function sendTwoFactorCode(req, res, next) {
	// Generate random in range
	const verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000);
	User.update({
		verificationCode: verificationCode,
		verificationExpiration: (new Date()).toUTCString(),
	}, {
		where: { phone: encryptPhone(req.params.number) },
	})
	.then(function(result) {
		if (result[0] === 0){
			console.log(req.params.number + ' - Phone not in the database');
			return res.status(500).json('Phone not in the database');
		}
	})
	.catch(function(err) {
		console.log('Verification code creation error' + err);
		return res.status(500).json(err);
	});

	client.messages.create({
		to: req.params.number,
		from: process.env.TWILIO_NUMBER,
		body: 'The verification code is ' + verificationCode,
	})
	.then(function() {
		res.send('"Code created"');
		return res.status(201).end();
	});
}
app.get('/twofactor/:number', sendTwoFactorCode);

export function checkTwoFactorCode(req, res, next) {
	User.findOne({
		where: {
			phone: encryptPhone(req.body.phone),
			verificationCode: req.body.code,
		},
		attributes: ['id', 'verificationExpiration', 'verificationAttempts'],
	})
	.then(function(userData) {
		console.log(JSON.stringify(userData));
		const expirationDate = new Date(userData.verificationExpiration);
		const now = new Date();
		const id = userData.id;
		if (!userData){
			User.update({
				verificationAttempts: (userData.verificationAttempts + 1),
				where: { id : id },
			})
			.then(function(result){
				return res.status(500).json('Wrong code');
			});			 
		} else if (userData.verificationAttempts > 10) {
			return res.status(500).json('Too many attemps. Please wait for 10 minutes and try again.');
		} else if ((now - expirationDate) > (10 * 60 * 1000)) {
			request({ uri: `http://localhost:9876/twofactor/${req.body.phone}`})
			.then(function(response) {
				User.update({
					verificationAttempts: 0,
					where: { id : id },
				})
				.then(function(result){
					return res.status(500).json('Your code has expired after 10 minutes. A new code is being sent.');
				});
			})
			.catch(function(err) {
				return res.status(500).json("Your code has expired after 10 minutes. Impossible to generate a new code. Please try later.");
			});			 
		} else {
			User.update({
				verificationAttempts: 0,
				where: { id : id },
			})
			.then(function(result){
				res.send('"Correct code"');
				return res.status(200).end();
			});
		}
	})
	.catch((err) => {
		console.log(err);
		return res.status(500).json(err);
	});
}
app.post('/twofactor', checkTwoFactorCode);
