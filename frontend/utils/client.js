import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

export const publicClient = createPublicClient(
{ 
  chain: sepolia,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/rPdEQ-9jD9nKjwpj-SbkBnjcO6aIZojR")
}
)