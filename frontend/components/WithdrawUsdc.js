'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits  } from "ethers"

const WithdrawUsdc = ({ refetchUserBalanceOnContract, refetchUserBalance, refetchBalanceContract }) => {

    const [amount, setAmount] = useState('')

    const { data: hash, error, isPending, writeContract } = useWriteContract()

    const handleWithdraw = async () => { 
        try {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'withdrawUSDC',
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
            toast("WITHDRAW USDC: Transaction successful", {
                description: "Hash: " + hash,
            })
            setAmount('')
            refetchUserBalanceOnContract()
            refetchUserBalance()
            refetchBalanceContract()
        }
    }, [isConfirmed])

    useEffect(() => {
        if (error) {
            toast("Error: Transaction failed", {
                description: "Hash: " + hash + "  Cause: " + error,
            })
        }
    }, [error])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-8'>Withdraw USDC from insurance</h2>
            {isConfirming && <div>Waiting for confirmation...</div>}
            <Input 
                type='number' 
                className="bg-emerald-900/20 focus:ring-emerald-500 focus:border-emerald-500 block border border-emerald-300 rounded-md w-full" 
                placeholder='Amount in USDC...' 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
            />
            <Button             
                className="w-3xl mt-4 border border-transparent shadow-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-emerald-500"
                onClick={handleWithdraw} 
                disabled={isConfirming}>{isConfirming ? 'Depositing USDC...' : 'Withdraw USDC from Insurance'}
            </Button>
        </div>
    )
}

export default WithdrawUsdc;