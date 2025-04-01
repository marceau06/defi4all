'use client'; 
import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/constants";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {

    const { address } = useAccount();

    const { data: balance, isConnected, isLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserBalance',
        args: [address]
    })

    const { data: owner, error } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'owner'
    })


    return (
        <div className="flex justify-between items-center p-5">
            {
            (isConnected) ?
                <div>
                    <span>D4A Balance: </span>
                    {
                        (isLoading) ? 
                            "Loading..."
                        :
                            (balance !== undefined && balance > 0) ? 
                                balance.toString() 
                            : "0"
                        } "D4A"
                </div>
            :
                "D4A DApp"
            }
            <div><ConnectButton showBalance={false} /></div>
        </div>
    )
}

export default Header