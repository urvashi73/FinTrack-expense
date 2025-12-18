// Load environment variables from the .env file
require('dotenv').config();

// Log the DATABASE_URL to check if it's loaded correctly
console.log(process.env.DATABASE_URL);
