'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, AAVE_USDC_ADDRESS, AAVE_USDC_ADDRESS_ABI } from '@/constants'
import { useState, useEffect } from 'react'
import { parseUnits  } from "ethers"

const WithdrawAave = ({}) => {

    const [amount, setAmount] = useState()

    // Hook pour l'approbation
    const {
        data: hash,
        writeContract: approve,
    } = useWriteContract();

    // Hook pour le dépôt
    const {
        data: withdrawFromAaveData,
        writeContract: withdrawFromAave,
        isLoading: isLoadingWithdrawFromAave,
        isSuccess: isSuccessWithdrawFromAave,
        error: withdrawFromAaveError,
    } = useWriteContract();
    
    // Fonction pour initier l'approbation
    const handleApprove = async () => {
        try {
            console.log("Initiating approve...");
            approve({
                address: AAVE_USDC_ADDRESS,
                abi: AAVE_USDC_ADDRESS_ABI,
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
    const handleWithdraw = async () => {
        try {
            console.log("Initiating withdraw...");
            withdrawFromAave({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'withdrawFromAave',
                args: [parseUnits(amount.toString(), 6)],
            });
        } catch (error) {
            console.log("Erreur lors du dépôt :", error);
        }
    }

    // Gérer l'effet de la confirmation de la transaction de dépôt
    useEffect(() => {
        if (isApproveConfirmed) {
            handleWithdraw();
        }
    }, [isApproveConfirmed]);

    useEffect(() => {
        if (isSuccessWithdrawFromAave) {
            console.log("hash of deposit: ", withdrawFromAaveData)
            toast("WITHDRAW FROM AAVE: Transaction successful", {
                description: "Hash: " + withdrawFromAaveData,
            })
            setAmount('')
        }
    }, [isSuccessWithdrawFromAave])

    useEffect(() => {
        if (withdrawFromAaveError) {
            toast("Error: Transaction failed", {
                description: "Cause: " + withdrawFromAaveError,
            })
        }
    }, [withdrawFromAaveError])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-8'>Withdraw from AAVE V3 Pool</h2>
            {isLoadingWithdrawFromAave && <div>Waiting for confirmation...</div>}
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
            disabled={isLoadingWithdrawFromAave}>{isLoadingWithdrawFromAave ? 'Withdrawing USDC...' : 'Withdraw USDC from Aave pool'}
        </Button>
        </div>
    )
}

export default WithdrawAave;