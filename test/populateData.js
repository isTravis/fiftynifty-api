import Promise from 'bluebird';
import { sequelize, User, Call } from '../models';
import { generateUsers, generateCalls } from './generators';

console.log('Beginning Population');

// sequelize.sync({ force: true })
User.count()
.then(function(count) {
	const newUsers = generateUsers(10000, count);	
	console.log('Beginning creating Users');
	return Promise.each(newUsers, function(user, index) {
		if (index > 0 && index % 100 === 0) { console.log(`Created ${index} users`); }
		return User.create(user);
	});
})
.then(function(result) {
	console.log('Finished creating Users');
	return User.findAll();
})
.then(function(allUsers) {
	const newCalls = generateCalls(allUsers);
	console.log('Beginning creating Calls');
	return Call.bulkCreate(newCalls);
})
.then(function(result) {
	console.log('Finished creating Calls');
	console.log('Finished Population');
	process.exit();	
})
.catch(function(err) {
	console.log(err);
});
