require('dotenv').config();
const mongoose = require('mongoose');
const AdminPasskey = require('../models/AdminPasskey');
const { hashPasskey } = require('../utils/cryptoUtils');

async function setup() {
  const passkeyArg = process.argv[2] || process.env.ADMIN_PASSKEY;

  if (!passkeyArg || passkeyArg.trim().length < 4) {
    console.error('❌ Error: Please provide a passkey of at least 4 characters.');
    console.log('Usage: node scripts/setupPasskey.js <your_passkey>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const existing = await AdminPasskey.findOne();
    if (existing) {
      console.error('🔒 ERROR: An admin passkey has already been created in MongoDB.');
      console.error('Nobody else can create or overwrite it.');
      process.exit(1);
    }

    const { salt, hash } = hashPasskey(passkeyArg.trim());
    await AdminPasskey.create({
      passkeyHash: hash,
      salt,
    });

    console.log('✅ Admin passkey successfully created and saved in MongoDB!');
    console.log('🔒 Setup is now permanently locked. Nobody else can create it.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to setup passkey:', err.message);
    process.exit(1);
  }
}

setup();
