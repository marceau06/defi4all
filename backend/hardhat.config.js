require("@nomicfoundation/hardhat-toolbox");
require ("dotenv").config();

const ALCHEMY_SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC_URL || '';
const ALCHEMY_MAINNET_RPC_URL = process.env.ALCHEMY_MAINNET_RPC_URL || '';
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || '';

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    hardhat: {
      forking: {
        enabled: true,
        url: ALCHEMY_MAINNET_RPC_URL,
        blockNumber: 22176642, // Quel bloc number ?
        initialBaseFeePerGas: 0,
        maxFeePerGas: 8000000000000 // Definir le max de gas que l'on peut mettre dans une transaction
      }
    },
    // sepolia: {
    //   url: ALCHEMY_SEPOLIA_RPC_URL,
    //   chainId: 11155111,
    //   accounts: [`0x${SEPOLIA_PRIVATE_KEY}`]
    // }
  },
  etherscan: {
    apiKey: {
      sepolia: 'NIQE1J72UCHKDBQM1S88QVSUFBDZ8T1AYX'
    }
  }
};