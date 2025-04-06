import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem'
import {
  sepolia
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'D4A DApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    sepolia
  ],
  transports: {
    [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/rPdEQ-9jD9nKjwpj-SbkBnjcO6aIZojR"),
  },
  ssr: true,
});
