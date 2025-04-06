import { createPublicClient, http } from 'viem'
import { sepolia, hardhat } from 'viem/chains'

export const publicClient = createPublicClient(
{ 
  chain: sepolia,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/rPdEQ-9jD9nKjwpj-SbkBnjcO6aIZojR")
},
// {
//     chain: hardhat,
//     transport: http(process.env.RPC_URL_HARDHAT)
// }
)