import Promise from 'bluebird';
if (process.env.NODE_ENV !== 'production') {
	require('./config.js');
}

/* Initialize Redis */
/* ------------- */
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', function (err) {
	console.log('redisClient Error:  ' + err);
});

// redisClient.flushdb( function (err, succeeded) {
// 	console.log('Flushed Redis DB'); 
// });

/* ------------- */

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
		validate: {
			len: [24, 24], // Phone number is encoded to 44 byte string
		},
	},
	zipcode: { 
		type: Sequelize.STRING, // Stored as a string to preserve leading zeros. 
		allowNull: false, 
		validate: {
			len: [5, 5],
		},
	},
	lat: {
		type: Sequelize.DOUBLE,
	},
	lon: {
		type: Sequelize.DOUBLE,
	},
	state: {
		type: Sequelize.TEXT,
	},
	district: {
		type: Sequelize.INTEGER,
	},
	variant: {
		type: Sequelize.INTEGER,
	},
	verificationCode: {
		type: Sequelize.STRING,
	},
	verificationExpiration: {
		type: Sequelize.DATE,
	},
	verificationAttempts: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},
	signupCode: {
		type: Sequelize.STRING,
	},
	signupAttempts: { 
		type: Sequelize.INTEGER,
		defaultValue: 1, 
	},
	signupCompleted: { type: Sequelize.BOOLEAN },
});
User.isHierarchy();

const Call = sequelize.define('Call', {
	twilioId: { type: Sequelize.TEXT },
	numberDialed: { type: Sequelize.TEXT },
	recipientId: { type: Sequelize.TEXT },
	district: { type: Sequelize.INTEGER },
	state: { type: Sequelize.TEXT },
	zip: { type: Sequelize.TEXT },
	duration: { type: Sequelize.INTEGER },
	completed: { type: Sequelize.INTEGER },
	// callerId
});


// A pub can have many contributors, but a contributor belongs to only a single pub
User.hasMany(Call, { onDelete: 'CASCADE', as: 'calls', foreignKey: 'callerId' });

const db = {
	User: User,
	Call: Call
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.redisClient = redisClient;

module.exports = db;
