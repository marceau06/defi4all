import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia
} from 'wagmi/chains'; 

import { http } from 'viem';

export const config = getDefaultConfig({
  appName: 'Defi4all DApp',
  projectId: 'DEFI4ALL_PROJECT_ID',
  chains: [
    sepolia
  ],
  transports: {
    [sepolia.id]: http(process.env.RPC_URL),
  },
  ssr: true,
});