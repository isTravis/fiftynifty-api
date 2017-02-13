import Promise from 'bluebird';
import CryptoJS from 'crypto-js';
import app from '../server';
import { redisClient, User, Call } from '../models';
import { userAttributes, callAttributes } from './user';

export function queryForLeaderboard() {
	return User.findAll({
		where: {
			parentId: null,
			signupCompleted: true,
		},
		include: [
			{ model: User, as: 'descendents', hierarchy: true, where: { signupCompleted: true }, required: false, attributes: userAttributes, include: { model: Call, as: 'calls', attributes: callAttributes } },
			{ model: Call, as: 'calls', attributes: callAttributes },
		],
		attributes: userAttributes,
	});
}

function findAllToArray(array) {
	return array.map((item)=> {
		return item.toJSON();
	});
}
export function getLeaderboard(req, res, next) {	

	console.time('leaderboardQueryTime');
	redisClient.getAsync('leaderboard')
	.then(function(redisResult) {
		if (redisResult) { return redisResult; }
		return queryForLeaderboard();
	})
	.then(function(leadersData) {
		if (!leadersData) { throw new Error('Error building leaderboard'); }
		console.log('Using Cache: ', !leadersData[0].toJSON);
		const outputData = leadersData[0].toJSON ? findAllToArray(leadersData) : JSON.parse(leadersData);
		
		const cacheTimeout = process.env.IS_PRODUCTION_API === 'TRUE' ? 60 * 2 : 10;
		const setCache = leadersData[0].toJSON ? redisClient.setexAsync('leaderboard', cacheTimeout, JSON.stringify(outputData)) : {};
		return Promise.all([outputData, setCache]);
	})
	.spread(function(outputData, cacheResult) {
		console.timeEnd('leaderboardQueryTime');
		return res.status(201).json(outputData);
	})
	.catch(function(err) {
		console.error('Error in getUser: ', err);
		return res.status(500).json('User not found');
	});
}
app.get('/leaderboard', getLeaderboard);
