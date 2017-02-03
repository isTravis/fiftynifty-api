import request from 'request-promise';
import app from '../server';
import { User, Call } from '../models';
import { encryptPhone } from '../utilities/encryption';

export const userAttributes = ['id', 'name', 'zipcode', 'parentId', 'hierarchyLevel'];

export function getUser(req, res, next) {	
	return User.find({
		where: {
			id: req.query.userId
		},
		include: [
			{ model: User, as: 'descendents', hierarchy: true, attributes: userAttributes, include: { model: Call, as: 'calls' } },
			{ model: Call, as: 'calls' },
		],
		attributes: userAttributes,
	})
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
	
	return User.create({
		phone: phoneHash,
		name: req.body.name,
		zipcode: req.body.zipcode,
		parentId: req.body.parentId,
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

	return request(apiRequestUrl)
	.then((response) => {
		const lat = response.results[0].geometry.location.lat;
		const lng = response.results[0].geometry.location.lng;
		return { lat: lat, lng: lng }; 
	})
	.catch((error) => {
		console.log(error);
	});
}
app.post('/address', findLatLocFromAddressInput);
