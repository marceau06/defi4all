// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
require('dotenv').config();

const poolAddress = process.env.AAVE_POOL_ADDRESS_MAINNET; 
const usdcTokenAddress = process.env.USDC_ADDRESS_MAINNET;
const hardhatOwnerAddress = process.env.HARDHAT_OWNER_ADDRESS;
const ausdcTokenAddress = process.env.AUSDC_ADDRESS_MAINNET;
const uniswapV2Router02Address = process.env.UNISWAP_ROUTER_ADDRESS_MAINNET;

module.exports = buildModule("D4AModule", (m) => {

    const d4A = m.contract("D4A", [hardhatOwnerAddress, poolAddress, usdcTokenAddress, ausdcTokenAddress, uniswapV2Router02Address]);

    return { d4A }
});