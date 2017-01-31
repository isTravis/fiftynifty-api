if (process.env.NODE_ENV !== 'production') {
	require('./config.js');
}

const Sequelize = require('sequelize');

const useSSL = process.env.DATABASE_URL.indexOf('localhost:') === -1;
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, dialectOptions: { ssl: useSSL } });

// Change to true to update the model in the database.
// NOTE: This being set to true will erase your data.
sequelize.sync({ force: true });


// A user is created when a person enters their phone number and zipcode
// Phone number is stored with no special characters except for a leading + which designates country code. Country code must always be included
// For example: 781-641-5555 structured as +17816415555 and then encrypted
const User = sequelize.define('User', {
	name: {
		type: Sequelize.TEXT, 
		allowNull: false, 
	},
	phone: { 
		type: Sequelize.STRING,
		allowNull: false, 
		unique: true,
		len: [44, 44], // Phone number is encoded to 44 byte string
	},
	zipcode: { 
		type: Sequelize.STRING, // Stored as a string to preserve leading zeros. 
		allowNull: false, 
		len: [5, 5],
	},
});


const Call = sequelize.define('Call', {
	// callerId
	// numberDialed 
	// recipient
	// county
	// state
	// zip
	// createdAt
	// duration
});

const Invite = sequelize.define('Invite', {
	// inviterId
	// invitedId
	// invitedPhone
	// hash
});

// A pub can have many contributors, but a contributor belongs to only a single pub
User.hasMany(Call, { onDelete: 'CASCADE', as: 'calls', foreignKey: 'callerId' });
User.hasMany(Invite, { onDelete: 'CASCADE', as: 'invitationsReceived', foreignKey: 'invitedId' });
User.hasMany(Invite, { onDelete: 'CASCADE', as: 'invitationsSent', foreignKey: 'inviterId' });


const db = {
	User: User,
	Call: Call,
	Invite: Invite,
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
