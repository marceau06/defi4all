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

const SupplyAave = ({ refetchUserBalanceOnContract, refetchUserBalance, refetchBalanceContract }) => {

    const [amount, setAmount] = useState()
    const { address } = useAccount()
    const { data: hash, error, isPending, writeContract } = useWriteContract()

    const handleDeposit = async () => { 
        console.log("In HandleDeposit()")
        try {
            writeContract({
                address: USDC_ADDRESS,
                abi: USDC_ADDRESS_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parseUnits(amount, 6)]
            })
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'supplyToAave',
                args: [parseUnits(amount, 6)]
            })
            // if (!approve) return;

            // // Appeler d'abord l'approve pour autoriser le contrat à transférer les USDC
            // await approve?.();

            // // Ensuite, appeler la fonction de dépôt
            // if (deposit) {
            // await deposit?.();
            // }
        }
        catch(error) {
            console.log(error)
        }
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

    useEffect(() => {
        if (isConfirmed) {
            toast("Transaction successful.")
            setAmount('')
            refetchUserBalanceOnContract()
            refetchUserBalance()
            refetchBalanceContract()
        }
    }, [isConfirmed])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-2'>Supply to AAVE V3 Pool</h2>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {error && (
                <div>Error: {error.shortMessage || error.message}</div>
            )}
            <Label>Amount in USDC: </Label>
            <Input type='number' placeholder='Amount in USDC...' value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button className="w-full" onClick={handleDeposit} disabled={isPending}>{isPending ? 'Depositing...' : 'Deposit'}</Button>
        </div>
    )
}

export default SupplyAave