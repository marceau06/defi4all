'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI, AAVE_USDC_ADDRESS, AAVE_USDC_ADDRESS_ABI } from '@/constants'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits  } from "ethers"

const WithdrawAave = ({ refetchUserBalanceOnContract, refetchUserBalance, refetchBalanceContract }) => {

    const [amount, setAmount] = useState('')

    const { address } = useAccount()

    const { data: hash, error, isPending, writeContract } = useWriteContract()

    const handleWithdraw = async () => { 
        try {
            writeContract({
                address: AAVE_USDC_ADDRESS,
                abi: AAVE_USDC_ADDRESS_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, parseUnits(amount, 6)]
            })
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'withdrawFromAave',
                args: [parseUnits(amount, 6)],
            })
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
            console.log("Dans UseEffect")
            toast("Transaction successful.")
            setAmount('')
            refetchUserBalanceOnContract()
            refetchUserBalance()
            refetchBalanceContract()
        }
    }, [isConfirmed])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-2'>Withdraw</h2>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {error && (
                <div>Error: {error.shortMessage || error.message}</div>
            )}
            <Label>Amount in USDC to withdraw: </Label>
            <Input type='number' placeholder='Amount in USDC...' value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button className="w-full" onClick={handleWithdraw} disabled={isPending}>{isPending ? 'Withdrawing...' : 'Withdraw'}</Button>
        </div>
    )
}

export default WithdrawAave;