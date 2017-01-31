import CryptoJS from 'crypto-js';
import app from '../server';
import { User } from '../models';

export const userAttributes = ['id', 'name', 'zipcode'];

export function postUser(req, res, next) {	
	console.log(req.body);
	const phoneHash = CryptoJS.AES.encrypt(req.body.phone, process.env.PHONE_KEY).toString();
	return User.create({
		phone: phoneHash,
		name: req.body.name,
		zipcode: req.body.zipcode,
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
