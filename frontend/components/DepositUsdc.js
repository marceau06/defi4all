'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt,useContractWrite, usePrepareContractWrite } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ADDRESS_ABI} from '@/constants'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits  } from "ethers";

const DepositUsdc = ({ refetchUserBalanceOnContract, refetchUserBalance, refetchBalanceContract }) => {

    const [amount, setAmount] = useState()
    // const [txState, setTxState] = useState("initial"); // initial | approve | approving | deposit | depositing | final
    // const [txHash, setTxHash] = useState("0x0");
    // const { address } = useAccount()
    // const { data: hash, error, isPending, writeContract } = useWriteContract()

     // Hook pour l'approbation
     const {
        data: approveData,
        writeContract: approve,
        isLoading: isLoadingApprove,
        isSuccess: isSuccessApprove,
        error: approveError,
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
            await approve({
                address: USDC_ADDRESS,
                abi: USDC_ADDRESS_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parseUnits(amount.toString(), 6)],
            });
        } catch (error) {
            console.log("Erreur lors de l'approbation :", error);
        }
    };

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
        if (isSuccessApprove) {
            handleDeposit();
        }
    }, [isSuccessApprove]);

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