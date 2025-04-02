'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, AAVE_USDC_ADDRESS, AAVE_USDC_ADDRESS_ABI } from '@/constants'
import { useState, useEffect } from 'react'
import { parseUnits  } from "ethers"

const WithdrawAave = ({ refetchUserBalanceOnContract, refetchUserBalance, refetchBalanceContract }) => {

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
            toast("DEPOSIT Transaction successful.")
            refetchUserBalanceOnContract()
            refetchUserBalance()
            refetchBalanceContract()
            setAmount('')
        }
    }, [isSuccessWithdrawFromAave])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-2'>Withdraw from AAVE V3 Pool</h2>
            {withdrawFromAaveData && <div>Transaction Hash: {withdrawFromAaveData}</div>}
            {isLoadingWithdrawFromAave && <div>Waiting for confirmation...</div>}
            {isSuccessWithdrawFromAave && <div>Transaction confirmed.</div>}
            {withdrawFromAaveError && (
                <div>Error: {withdrawFromAaveError.shortMessage || withdrawFromAaveError.message}</div>
            )}
            <Label>Amount in USDC to withdraw: </Label>
            <Input type='number' placeholder='Amount in USDC...' value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button className="w-full" onClick={handleApprove} disabled={isLoadingWithdrawFromAave}>{isLoadingWithdrawFromAave ? 'Withdrawing...' : 'Withdraw'}</Button>
        </div>
    )
}

export default WithdrawAave;