require('dotenv').config();

const config = {
	env: process.env.NODE_ENV || 'development',
	port: parseInt(process.env.PORT || '5000', 10),
	baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
	mongo: {
		uri: process.env.MONGO_URI
	},
	redis: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT || '6379', 10),
		password: process.env.REDIS_PASSWORD || undefined
	},
	email: {
		stream: process.env.REDIS_STREAM_EMAIL || null,
		serviceUrl: process.env.EMAIL_SERVICE_URL || null
	},
	apiKeys: {
		admin: process.env.ADMIN_API_KEY,
		organizerId: process.env.ORGANIZER_ID,
		scannerId: process.env.SCANNER_ID
	}
};

module.exports = config;