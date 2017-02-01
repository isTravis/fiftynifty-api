if (process.env.NODE_ENV !== 'production') {
	require('./config.js');
}

const Sequelize = require('sequelize');
require('sequelize-hierarchy')(Sequelize);

const useSSL = process.env.DATABASE_URL.indexOf('localhost:') === -1;
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false, dialectOptions: { ssl: useSSL } });

// Change to true to update the model in the database.
// NOTE: This being set to true will erase your data.
sequelize.sync({ force: false });


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
User.isHierarchy();

const Call = sequelize.define('Call', {
	numberDialed: { type: Sequelize.TEXT },
	recipientId: { type: Sequelize.TEXT },
	district: { type: Sequelize.INTEGER },
	state: { type: Sequelize.TEXT },
	zip: { type: Sequelize.TEXT },
	duration: { type: Sequelize.INTEGER },
	// callerId
});

// A pub can have many contributors, but a contributor belongs to only a single pub
User.hasMany(Call, { onDelete: 'CASCADE', as: 'calls', foreignKey: 'callerId' });


const db = {
	User: User,
	Call: Call,
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
