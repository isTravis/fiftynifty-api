import Promise from 'bluebird';

if (process.env.NODE_ENV !== 'production') {
	require('./config.js');
}

const Sequelize = require('sequelize');
const passportLocalSequelize = require('passport-local-sequelize');

const useSSL = process.env.DATABASE_URL.indexOf('localhost:') === -1;
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, dialectOptions: { ssl: useSSL } });

// Change to true to update the model in the database.
// NOTE: This being set to true will erase your data.
sequelize.sync({ force: false });

// Used to collect emails to create user accounts with.
// Trigger is attached such that emails are sent when a new row is added.

const User = sequelize.define('User', {
	name: {
		type: Sequelize.TEXT, 
	},
	avatar: { type: Sequelize.TEXT },
	email: { 
		type: Sequelize.TEXT, 
		allowNull: false, 
		unique: true,
		validate: {
			isEmail: true,
			isLowercase: true,
		} 
	},
	phone: { 
		type: Sequelize.STRING,
		allowNull: false, 
		unique: true,
	},
	zipcode: { type: Sequelize.STRING },

	hash: Sequelize.TEXT,
	salt: Sequelize.TEXT,
});

passportLocalSequelize.attachToUser(User, {
	usernameField: 'phone',
	hashField: 'hash',
	saltField: 'salt'
});

const Call = sequelize.define('Call', {
	// caller
	// numberDialed
	// recipient
	// county
	// state
	// zip
});

const Invite = sequelize.define('Invite', {
	// inviter
	// phone
});

// A pub can have many contributors, but a contributor belongs to only a single pub
User.hasMany(Call, { onDelete: 'CASCADE', as: 'calls', foreignKey: 'userId' });
User.hasMany(Invite, { onDelete: 'CASCADE', as: 'invitations', foreignKey: 'userId' });


const db = {
	User: User,
	Call: Call,
	Invite: Invite,
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
