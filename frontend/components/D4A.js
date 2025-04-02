'use client';
import { useAccount } from 'wagmi'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useReadContract } from 'wagmi';

import { parseAbiItem } from 'viem'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants'
import { publicClient } from '@/utils/client'
import Events from '@/components/Events'
import GetBalance from '@/components/GetBalance'
import DepositUsdc from '@/components/DepositUsdc'
import WithdrawUsdc from '@/components/WithdrawUsdc'
import SupplyAave from '@/components/SupplyAave'
import WithdrawAave from '@/components/WithdrawAave'
import { useTheme } from "next-themes"

const Bank = () => {

    useTheme("dark");

    const { isConnected, address } = useAccount()

    const [eventsUsdc, setEventsUsdc] = useState([])
    const [eventsAave, setEventsAave] = useState([])


    const { data: userBalanceOnContract, isPending, error, refetch: refetchUserBalanceOnContract } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserBalance'
    })

    const { data: msgSenderOnContract } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserAddress'
    })

    const { data: usdcBalanceOfUser, refetch: refetchUserBalance } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getUsdcBalanceOfUser'
    })

    const { data: balanceContract, refetch: refetchBalanceContract } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUsdcBalance'
    })

    const getEvents = async() => {

        const depositEvents = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem('event Deposited(address indexed account, uint amount)'),
            // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
            fromBlock: 21423360n,
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })

        const withdrawEvents = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem('event Withdrawn(address indexed account, uint amount)'),
            // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
            fromBlock: 21423360n,
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })

        const supplyAaveEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem('event SuppliedToAave(address indexed account, uint amount)'),
          // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
          fromBlock: 21423360n,
          // jusqu'au dernier
          toBlock: 'latest' // Pas besoin valeur par défaut
        })

      const withdrawAaveEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem('event WithdrawnFromAave(address indexed account, uint amount)'),
          // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
          fromBlock: 21423360n,
          // jusqu'au dernier
          toBlock: 'latest' // Pas besoin valeur par défaut
        })

      const combinedEventInsurance = 
      depositEvents.map((event) => ({
          type: 'Deposited',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.blockTimestamp)
      })).concat(withdrawEvents.map((event) => ({
          type: 'Withdrawn',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.blockTimestamp)
      })))

      const combinedEventsAave = 
      supplyAaveEvents.map((event) => ({
          type: 'SuppliedToAave',
            address: event.args.account,
            amount: event.args.amount,
            blockTimestamp: Number(event.blockTimestamp)
        })).concat(withdrawAaveEvents.map((event) => ({
          type: 'WithdrawnFromAave',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.blockTimestamp)
        })))  

      const sortedEventsUsdc = combinedEventInsurance.sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp))
      const sortedEventsAave = combinedEventsAave.sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp))

      console.log(sortedEventsUsdc)
      console.log(sortedEventsAave)

      setEventsUsdc(sortedEventsUsdc)
      setEventsAave(sortedEventsAave)

  }

  useEffect(() => {
    const getAllEvents = async() => {
      if(address !== 'undefined') {
        await getEvents();
      }
    }
    getAllEvents();
  }, [address])

  return (
    <div className="flex flex-row items-stretch justify-center min-h-screen">
      {isConnected ? (
        <>
          <div className="flex-1 text-center border-r border-gray-300 ">
              <h1 className='text-2xl font-bold mb-2'>Insurance</h1>
              <div className="pl-10 pr-10">
                <DepositUsdc refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={eventsUsdc} />
                <WithdrawUsdc refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={eventsUsdc} />
              </div>
              <Events events={eventsUsdc} />
          </div>
          <div className="flex-1 text-center border-r border-gray-300 ">
              <h1 className='text-2xl font-bold mb-2'>AAVE</h1>
              <div className="px-10">
                <SupplyAave events={eventsAave} />
                <WithdrawAave events={eventsAave} />
              </div>
              <Events events={eventsAave} />
          </div>
        </>
      ) : (
        <Alert className="bg-yellow-100 text-center flex-1" >
          <AlertTitle>Not connected</AlertTitle>
          <AlertDescription>Please connect your wallet to continue</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default Bank