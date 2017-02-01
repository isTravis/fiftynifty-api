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
