'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ADDRESS_ABI} from '@/constants'
import { useState, useEffect } from 'react'
import { parseUnits  } from "ethers";

const DepositUsdc = ({ refetchUserBalanceOnContract, refetchUserBalance, refetchBalanceContract }) => {

    const [amount, setAmount] = useState()

     // Hook pour l'approbation
     const {
        data: hash,
        writeContract: approve
    } = useWriteContract();

    // Hook pour le dépôt
    const {
        data: depositData,
        writeContract: deposit,
        isLoading: isLoadingDeposit,
        isSuccess: isSuccessDeposit,
        error: depositError
    } = useWriteContract();

    // Fonction pour initier l'approbation
    const handleApprove = async () => {
        try {
            console.log("Initiating approve...");
            approve({
                address: USDC_ADDRESS,
                abi: USDC_ADDRESS_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parseUnits(amount.toString(), 6)]
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
                functionName: 'depositUSDC',
                args: [parseUnits(amount.toString(), 6)],
            });
        } catch (error) {
            console.log("Erreur lors du dépôt :", error);
        }
    }

    // Gérer l'effet de la confirmation de la transaction de dépôt
    useEffect(() => {
        console.log(isApproveConfirmed)
        if (isApproveConfirmed) {
            handleDeposit();
        }
    }, [isApproveConfirmed]);

    useEffect(() => {
        if (isSuccessDeposit) {
            console.log("hash of deposit: ", depositData)
            toast("DEPOSIT Transaction successful.")
            refetchUserBalanceOnContract()
            refetchUserBalance()
            refetchBalanceContract()
            setAmount('')
        }
    }, [isSuccessDeposit])
    
    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-2'>Deposit USDC into insurance</h2>
            {depositData && <div>Transaction Hash: {depositData}</div>}
            {isLoadingDeposit && <div>Waiting for confirmation...</div>}
            {isSuccessDeposit && <div>Transaction confirmed.</div>}
            {depositError && (
                <div>Error: {depositError.shortMessage || depositError.message}</div>
            )}
            <Label>Amount in USDC: </Label>
            <Input type='number' placeholder='Amount in USDC...' value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button className="w-full" onClick={handleApprove} disabled={isLoadingDeposit}>{isLoadingDeposit ? 'Depositing...' : 'Deposit'}</Button>
        </div>
    )
}

export default DepositUsdc