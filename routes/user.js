import Promise from 'bluebird';
import request from 'request-promise';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone } from '../utilities/encryption';
import { zipcodeToStateDistrict } from '../utilities/zipcodeData';

export const userAttributes = ['id', 'name', 'zipcode', 'parentId', 'hierarchyLevel', 'lat', 'lon', 'createdAt', 'state', 'district'];

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

export function postUser(req, res, next) {	
	const phoneHash = encryptPhone(req.body.phone);
	zipcodeToStateDistrict(req.body.zipcode).then((stateDist)=>{
		User.create({
			phone: phoneHash,
			name: req.body.name,
			zipcode: req.body.zipcode,
			parentId: req.body.parentId,
			state: stateDist.state,
			district: stateDist.district,
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

		return User.update({ lat: lat, lon: lon, zip: zip }, {
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
