'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ADDRESS_ABI} from '@/constants'
import { useState, useEffect } from 'react'
import { parseUnits  } from "ethers";

const SupplyAave = ({ onSupplyAave }) => {

    const [amount, setAmount] = useState()

    // Hook pour l'approbation
    const {
        data: hash,
        writeContract: approve,

    } = useWriteContract();

    // Hook pour le dépôt
    const {
        data: depositData,
        writeContract: deposit,
        isLoading: isLoadingDeposit,
        isSuccess: isSuccessDeposit,
        error: depositError,
    } = useWriteContract();

    // Fonction pour initier l'approbation
    const handleApprove = async () => {
        try {
            console.log("Initiating approve...");
            approve({
                address: USDC_ADDRESS,
                abi: USDC_ADDRESS_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parseUnits(amount.toString(), 6)],
            });
        } catch (error) {
            console.log("Erreur lors de l'approbation :", error);
        }
    };

    // Suivre la transaction d'approbation
    const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    // Fonction pour initier le dépôt
    const handleDeposit = async () => {
        try {
            console.log("Initiating deposit...");
            deposit({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'supplyToAave',
                args: [parseUnits(amount.toString(), 6)],
            });
        } catch (error) {
            console.log("Erreur lors du dépôt :", error);
        }
    }

    // Gérer l'effet de la confirmation de la transaction de dépôt
    useEffect(() => {
        if (isApproveConfirmed) {
            handleDeposit();
        }
    }, [isApproveConfirmed]);

    useEffect(() => {
        if (isSuccessDeposit) {
            console.log("hash of deposit: ", depositData)
            toast("SUPPLY TO STRATEGY: Transaction successful", {
                description: "Hash: " + depositData,
            })
            onSupplyAave()
            setAmount('')
        }
    }, [isSuccessDeposit])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-8'>Supply to the STRATEGY</h2>
            {isLoadingDeposit && <div>Waiting for confirmation...</div>}
            {depositError && (
                <div>Error: {depositError.shortMessage || depositError.message}</div>
            )}
            <Input 
                type='number' 
                className="bg-emerald-900/20 focus:ring-emerald-500 focus:border-emerald-500 block border border-emerald-300 rounded-md w-full" 
                placeholder='Amount in USDC...' 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
            />
            <Button             
                className="w-3xl mt-4 border border-transparent shadow-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-emerald-500"
                onClick={handleApprove} 
                disabled={isLoadingDeposit}>{isLoadingDeposit ? 'Depositing USDC...' : 'Supply USDC to strategy'}
            </Button>
        </div>
    )
}

export default SupplyAave