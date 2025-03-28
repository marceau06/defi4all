// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
require('dotenv').config();

const poolAddress = process.env.AAVE_POOL_ADDRESS_SEPOLIA; 
const usdcTokenAddress = process.env.USDC_ADDRESS_SEPOLIA;
const sepoliaOwnerAddress = process.env.SEPOLIA_OWNER_ADDRESS;

module.exports = buildModule("D4AModule", (m) => {

    const d4A = m.contract("D4A", [sepoliaOwnerAddress, poolAddress, usdcTokenAddress]);

    return { d4A }
});