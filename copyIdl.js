const fs = require('fs');
const idl = require('../BE/target/idl/wallet_nft_mint.json');

fs.writeFileSync('./src/idl.json', JSON.stringify(idl));
