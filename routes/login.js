import passport from 'passport';
import app from '../server';
import { User } from '../models';

export function login(req, res) {
	const user = req.user || {};
	User.findOne({ 
		where: { id: user.id },
	})
	.then(function(userData) {
		return res.status(201).json(userData);
	})
	.catch(function(err) {
		return res.status(500).json(err);
	});

}
app.get('/login', login);
app.post('/login', passport.authenticate('local'), login);
