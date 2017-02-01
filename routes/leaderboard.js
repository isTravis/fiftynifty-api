import CryptoJS from 'crypto-js';
import app from '../server';
import { User } from '../models';

export const userAttributes = ['id', 'name', 'zipcode'];

export function getLeaderboard(req, res, next) {	

	return User.findAll({
		where: {
			parentId: null
		},
		include: {
			model: User,
			as: 'descendents',
			hierarchy: true,
		},
		attributes: userAttributes,
	})
	.then(function(leadersData) {
		return res.status(201).json(leadersData);
	})
	.catch(function(err) {
		console.error('Error in getUser: ', err);
		return res.status(500).json('User not found');
	});
}
app.get('/leaderboard', getLeaderboard);
