import app from '../server';
import { User } from '../models';

export function postUser(req, res, next) {	
	return User.create({
		phone: req.body.phone,
		name: req.body.name,
		zipcode: req.body.zipcode,
		
	})
	.then(function(result) {
		return res.status(201).json(true);
	})
	.catch(function(err) {
		console.error('Error in postUser: ', err);
		return res.status(500).json('Phone number already used');
	});
}
app.post('/user', postUser);

