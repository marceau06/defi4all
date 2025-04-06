
'use client';
import { Button } from '@/components/ui/button'
import { toast } from "sonner"
import { useWriteContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants'
import { useEffect } from 'react'




const Mint = ({ mintableTokens, refetchMintableTokens, refetchD4ABalance }) => {

    // Minimal value for Minting D4A
    const minimumMintingValue = 0.000001

    const { data: hash, error, isPending, isSuccess, writeContract } = useWriteContract()

    const handleMint= async () => {
        try {
            console.log("Initiating minting...");
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'mintTokens',
            });
        } catch (error) {
            console.log("Erreur lors du minting :", error);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            toast("MINT D4A: Transaction successful", {
                description: "Hash: " + hash,
            })
            refetchMintableTokens()
            refetchD4ABalance()
        }
        }, [isSuccess])

  return (
    <div className="flex justify-center items-center">
        <Button             
            className="w-3xl mt-4 border border-transparent shadow-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-emerald-500"
            onClick={handleMint} 
            disabled={mintableTokens < minimumMintingValue || isPending}> 
            { mintableTokens < minimumMintingValue 
                ? 'No mintable D4A available'
                : isPending 
                    ? 'Minting D4A...'
                    : 'MINT D4A'
            }
        </Button>
    </div>
  )
}

export default Mint
