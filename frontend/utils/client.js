import { createPublicClient, http } from 'viem'
import { sepolia, hardhat } from 'viem/chains'

export const publicClient = createPublicClient(
// { 
//   chain: sepolia,
//   transport: http(process.env.RPC_URL_SEPOLIA)
// },
{
    chain: hardhat,
    transport: http(process.env.RPC_URL_HARDHAT)
}
)