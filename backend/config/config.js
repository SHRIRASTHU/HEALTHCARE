require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthcare_db',
  jwtSecret: process.env.JWT_SECRET || 'healthcare_super_secret_jwt_key_2026',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  paymentKeyId: process.env.PAYMENT_KEY_ID || 'rzp_test_healthcare_key',
  paymentKeySecret: process.env.PAYMENT_KEY_SECRET || 'rzp_test_healthcare_secret',
  env: process.env.NODE_ENV || 'development'
};
