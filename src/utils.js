import * as anchor from '@project-serum/anchor';
import { Program, utils, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { sendTransactions } from './connection.tsx';
import idl from './idl.json';
const {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  MINT_SIZE,
} = require('@solana/spl-token');
const { SystemProgram } = web3;

export const _getState = async (provider, wallet) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  const [userstakingPubkey] = await web3.PublicKey.findProgramAddress(
    [wallet.publicKey.toBuffer()],
    program.programId
  );

  console.log(stakingPubkey.toBase58(), "aaaa")
  const testdata = await program.account.mintingAccount.fetch(stakingPubkey);

  console.log(testdata, "testdata")

  let userdata = [];
  try {
    userdata = await program.account.userMintingAccount.fetch(
      userstakingPubkey
    );
  } catch (err) {
    console.log(err);
  }
  console.log('ud:', userdata, testdata);

  const wlList = await program.account.whiteList.all();
  for (const i in wlList) {
    console.log(wlList[i].account.user.toBase58())
  }

  const ogList = await program.account.originalList.all();
  for (const i in wlList) {
    console.log(wlList[i].account.user.toBase58())
  }
  console.log('wlList', wlList);
  console.log('ogList', ogList);
  let curStage = testdata.curStage;
  const ogPrice = testdata.ogPrice.div(new anchor.BN(1e6)).toNumber();
  const wlPrice = testdata.wlPrice.div(new anchor.BN(1e6)).toNumber();
  const publicPrice = testdata.publicPrice.div(new anchor.BN(1e6)).toNumber();
  const ogAmout = testdata.ogMax.toNumber();
  const wlAmout = testdata.wlMax.toNumber();
  const publicAmount = testdata.publicMax.toNumber();
  const baseUri = testdata.baseUri;

  let isShow = false;
  for (const og of ogList) {
    if (og == wallet.publicKey && curStage == 1) {
      isShow = true;
      break;
    }
  }
  for (const og of wlList) {
    if (og == wallet.publicKey && curStage == 2) {
      isShow = true;
      break;
    }
  }
  let price = publicPrice;
  if (curStage == 1) price = ogPrice;
  console.log(isShow, curStage, price, ogPrice, wlPrice, publicPrice);
  return {
    show: isShow,
    stage: curStage,
    price: price,
    ogPrice: ogPrice,
    wlPrice: wlPrice,
    publicPrice: publicPrice,
    ogAmout: ogAmout,
    wlAmout: wlAmout,
    publicAmount: publicAmount,
    baseUri: baseUri,
  };
};

export const addOgList = async (provider, wallet, newLists) => {
  console.log(newLists);
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.addOgList(stakingBump, newLists, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const addWlList = async (provider, wallet, newLists) => {

  console.log(newLists)

  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );

  let user = new PublicKey(newLists[0]);

  const [wlPDA, wlPDABump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode('nftminting')),
      Buffer.from(utils.bytes.utf8.encode('whitelist')),
      stakingPubkey.toBuffer(),
      user.toBuffer(),
    ],
    program.programId
  );

  console.log(stakingPubkey.toBuffer(), "wlPDA")
  console.log(wlPDA.toBase58(), "wlPDA")

  let tx = await program.rpc.addWlList(user, {
    accounts: {
      admin: wallet.publicKey,
      mintingAccount: stakingPubkey,
      wlList: wlPDA,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
  });

  console.log(tx, "success");
};

export const addBlList = async (provider, wallet, newLists) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.addBlList(stakingBump, newLists, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const removeOgList = async (provider, wallet, newLists) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.removeOgList(stakingBump, newLists, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const removeWlList = async (provider, wallet, newLists) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.removeWlList(stakingBump, newLists, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const removeBlList = async (provider, wallet, newLists) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.removeBlList(stakingBump, newLists, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const updatePrice = async (
  provider,
  wallet,
  ogPrice,
  wlPrice,
  blPrice
) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.updatePrice(
    stakingBump,
    new anchor.BN(ogPrice).mul(new anchor.BN(1e6)),
    new anchor.BN(wlPrice).mul(new anchor.BN(1e6)),
    new anchor.BN(blPrice).mul(new anchor.BN(1e6)),
    {
      accounts: {
        mintingAccount: stakingPubkey,
        admin: wallet.publicKey,
      },
    }
  );
};

export const updateAmount = async (
  provider,
  wallet,
  ogPrice,
  wlPrice,
  blPrice
) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.updateAmount(
    stakingBump,
    new anchor.BN(ogPrice),
    new anchor.BN(wlPrice),
    new anchor.BN(blPrice),
    {
      accounts: {
        mintingAccount: stakingPubkey,
        admin: wallet.publicKey,
      },
    }
  );
};

export const setStage = async (provider, wallet, newStage) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.setStage(stakingBump, newStage, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const setUri = async (provider, wallet, newUri) => {
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  await program.rpc.setUri(stakingBump, newUri, {
    accounts: {
      mintingAccount: stakingPubkey,
      admin: wallet.publicKey,
    },
  });
};

export const initialize = async (provider, wallet) => {
  const programID = new PublicKey(idl.metadata.address);
  console.log('programID', programID.toBase58());
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );
  console.log('stakingPubkey', stakingPubkey.toBase58());
  console.log('stakingBump', stakingBump);

  let ix = await program.rpc.initialize(
    // stakingBump,
    wallet.publicKey,
    new anchor.BN(9999),
    new anchor.BN(20),
    new anchor.BN(20),
    new anchor.BN(20),
    new anchor.BN(15e8),
    new anchor.BN(2e9),
    new anchor.BN(2e9),
    {
      accounts: {
        mintingAccount: stakingPubkey,
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
    }
  );

  console.log(ix, 'success');
};

export const multiMint = async (provider, wallet, count) => {
  const { SystemProgram, Keypair } = web3;
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program(idl, programID, provider);
  const [stakingPubkey, stakingBump] = await web3.PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode('wallet_nft_minting'))],
    program.programId
  );

  const mintingAccountInfo = await program.account.mintingAccount.fetch(stakingPubkey);

  console.log(mintingAccountInfo, "mintingAccountInfo")

  const [userMintingPubkey, userMintingBump] =
    await web3.PublicKey.findProgramAddress(
      [wallet.publicKey.toBuffer()],
      program.programId
    );
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  let lamports =
    await program.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );

  const owner = new PublicKey(mintingAccountInfo.adminKey);
  const getMetadata = async (mint) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };
  const getMasterEdition = async (mint) => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
          Buffer.from('edition'),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  console.log("===============================================================")

  const [wlPDA, wlPDABump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode('nftminting')),
      Buffer.from(utils.bytes.utf8.encode('whitelist')),
      stakingPubkey.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  const [ogPDA, ogPDABump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from(utils.bytes.utf8.encode('nftminting')),
      Buffer.from(utils.bytes.utf8.encode('originallist')),
      stakingPubkey.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  console.log(wlPDA.toBase58(), "wlPDA")
  console.log(ogPDA.toBase58(), "ogPDA")

  const signersMatrix = [];
  const instructionsMatrix = [];
  for (let index = 0; index < count; index++) {
    const mintKey = anchor.web3.Keypair.generate();
    const NftTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      provider.wallet.publicKey
    );
    const signers = [mintKey];
    const cleanupInstructions = [];
    const instructions = [
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(
        mintKey.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        NftTokenAccount,
        wallet.publicKey,
        mintKey.publicKey
      ),
    ];
    const metadataAddress = await getMetadata(mintKey.publicKey);
    const masterEdition = await getMasterEdition(mintKey.publicKey);
    instructions.push(
      program.instruction.mintNft(
        mintKey.publicKey,
        'Flofi',
        // stakingBump,
        {
          accounts: {
            mintAuthority: wallet.publicKey,
            mint: mintKey.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            metadata: metadataAddress,
            tokenAccount: NftTokenAccount,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            payer: wallet.publicKey,
            owner: owner,
            mintingAccount: stakingPubkey,
            wlList: wlPDA,
            ogList: ogPDA,

            userMintingCounterAccount: userMintingPubkey,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            masterEdition: masterEdition,
          },
        }
      )
    );
    signersMatrix.push(signers);
    instructionsMatrix.push(instructions);
    if (cleanupInstructions.length > 0) {
      instructionsMatrix.push(cleanupInstructions);
      signersMatrix.push([]);
    }
  }
  try {
    return (
      await sendTransactions(
        provider.connection,
        provider.wallet,
        instructionsMatrix,
        signersMatrix
      )
    ).txs.map((t) => t.txid);
  } catch (e) {
    console.log(e);
    return false;
  }
};
