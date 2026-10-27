const mongoose = require('mongoose');

const adminPasskeySchema = new mongoose.Schema(
  {
    passkeyHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'admin_passkey',
  }
);

module.exports = mongoose.model('AdminPasskey', adminPasskeySchema);
