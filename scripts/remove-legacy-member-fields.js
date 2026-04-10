require('dotenv').config();
const mongoose = require('mongoose');
const { Member } = require('../db/models');

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000
  });

  const result = await Member.updateMany(
    {},
    {
      $unset: {
        'contact.phone': '',
        profilePicture: ''
      }
    }
  );

  console.log(JSON.stringify({
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
