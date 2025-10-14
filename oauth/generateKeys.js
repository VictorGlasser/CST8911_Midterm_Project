const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const privateKeyPath = path.join(__dirname, 'private.pem');
const publicKeyPath = path.join(__dirname, 'public.pem');

// use 2048-bit RSA keys for asymmetric signing
const keyOptions = {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki', // Subject Public Key Info
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8', // PKCS #8 format
    format: 'pem',
  },
};

crypto.generateKeyPair('rsa', keyOptions, (err, publicKey, privateKey) => {
  if (err) {
    console.error('Failed to generate key pair:', err);
    return;
  }

  fs.writeFileSync(privateKeyPath, privateKey);
  console.log(`Private key saved to: ${privateKeyPath}`);

  fs.writeFileSync(publicKeyPath, publicKey);
  console.log(`Public key saved to: ${publicKeyPath}\n`);

  const publicKeyString = publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '') // Remove all newlines
    .trim();

  console.log('\n---------------------------------------------------------');
  console.log('FOR AZURE FUNCTION ENVIRONMENT VARIABLE (JWT_PUBLIC_KEY):');
  console.log('---------------------------------------------------------');
  console.log(publicKeyString);
  console.log('---------------------------------------------------------');
  console.log('Copy the above string and use it as the value for JWT_PUBLIC_KEY in your Azure Function settings.');

});
