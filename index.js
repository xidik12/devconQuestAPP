// index.js

const { Coinbase, Wallet, hashMessage, readContract } = require('@coinbase/coinbase-sdk');
const path = require('path');
const fs = require('fs');

// Configure the SDK with your API key
Coinbase.configureFromJson({
  filePath: path.join(__dirname, 'cdp_api_key.json'),
});

// Set the network (optional)
Coinbase.networkId = Coinbase.networks.BaseSepolia; // Using Base Sepolia testnet

async function createWallet() {
  // Create a new wallet
  let wallet = await Wallet.create({ networkId: Coinbase.networkId });
  console.log('Wallet created:', wallet);

  // Export wallet data
  const walletData = wallet.export();

  // Save wallet data to a file
  fs.writeFileSync('wallet_data.json', JSON.stringify(walletData));
  console.log('Wallet data saved to wallet_data.json');

  return wallet;
}

async function importWallet() {
  // Check if wallet data file exists
  if (fs.existsSync('wallet_data.json')) {
    const walletData = JSON.parse(fs.readFileSync('wallet_data.json', 'utf8'));
    // Import the wallet
    let wallet = await Wallet.import(walletData);
    console.log('Wallet imported:', wallet);
    return wallet;
  } else {
    // Create a new wallet if none exists
    return await createWallet();
  }
}

async function getDefaultAddress(wallet) {
  let address = await wallet.getDefaultAddress();
  console.log('Default address:', address.toString());
  return address;
}

async function createNewAddress(wallet) {
  let newAddress = await wallet.createAddress();
  console.log('New address created:', newAddress.toString());
  return newAddress;
}

async function performTransfer(wallet, destinationAddress) {
  let transfer = await wallet.createTransfer({
    amount: 0.001, // Adjust the amount as needed
    assetId: Coinbase.assets.Eth, // ETH asset ID
    destination: destinationAddress, // Destination address
  });

  console.log('Transfer initiated:', transfer);

  // Wait for the transfer to complete
  await transfer.wait();

  console.log('Transfer completed');
}

async function readContractData(wallet, address) {
  const contractAddress = '0xB8f25B54651E229160556ACDe0b49966a14F4858'; // Replace with actual contract address
  const methodName = 'balanceOf';
  const methodArgs = {
    account: address.toString(),
  };
  const abi = [
    {
      constant: true,
      inputs: [{ name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      type: 'function',
    },
  ];

  // Invoke the contract method using readContract function
  let result = await readContract({
    networkId: Coinbase.networkId,
    contractAddress,
    method: methodName,
    args: methodArgs,
    abi,
  });

  console.log(`Token balance: ${result}`);
}

async function deployToken(wallet) {
  let myToken = await wallet.deployToken({
    name: 'MyToken',
    symbol: 'MTK',
    totalSupply: 1000000,
  });
  console.log('Token deployed at:', myToken.getContractAddress());
}

async function signMessage(wallet) {
  const message = 'Hello, Coinbase!';
  const signature = await wallet.createPayloadSignature(hashMessage(message));
  console.log('Message signature:', signature.toString());
}

async function listBalances(wallet) {
  const balances = await wallet.listBalances();
  console.log('Wallet balances:', balances.toString());
}

async function listTransactions(address) {
  const transactions = await address.listTransactions({ limit: 5 });
  transactions.forEach((tx) => console.log(tx.toString()));
}

async function main() {
  try {
    // Import or create wallet
    const wallet = await importWallet();

    // Get default address
    const defaultAddress = await getDefaultAddress(wallet);

    // List balances before transactions
    await listBalances(wallet);

    // Create a new address
    const newAddress = await createNewAddress(wallet);

    // Perform a transfer to the new address
    await performTransfer(wallet, newAddress.toString());

    // List balances after transfer
    await listBalances(wallet);

    // List transactions for the default address
    await listTransactions(defaultAddress);

    // Sign a message
    await signMessage(wallet);

    // Deploy a new ERC-20 token
    await deployToken(wallet);

    // Interact with a smart contract
    await readContractData(wallet, defaultAddress);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
