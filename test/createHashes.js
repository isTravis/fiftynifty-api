import Promise from 'bluebird';
import { sequelize, User } from '../models';
import { generateHash } from '../utilities/generateHash';

console.log('Beginning Population');

sequelize.sync({ force: false })
.then(function() {
	return User.findAll()	;
})
.then(function(allUsers) {
	const updates = allUsers.map((user)=> {
		return User.update(
			{ hash: generateHash() }, 
			{
				where: {
					id: user.id
				}
			}
		);
	});
	
	return Promise.all(updates);
})
.then(function(result) {
	console.log('Finished adding Hashes to Users');
	process.exit();	
})
.catch(function(err) {
	console.log(err);
});
