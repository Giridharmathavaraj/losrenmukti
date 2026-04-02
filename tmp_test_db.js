const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://giridharmathavaraj_db_user:JlqWzElUK6bDDVUt@cluster0.kjqzoqe.mongodb.net/loanpro_db?retryWrites=true&w=majority';

console.log('Testing connection to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
