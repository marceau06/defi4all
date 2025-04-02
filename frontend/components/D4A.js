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

const Bank = () => {

    const { isConnected, address } = useAccount()

    const [events, setEvents] = useState([])

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

      const combinedEvents = 
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
      }))).concat(supplyAaveEvents.map((event) => ({
          type: 'SuppliedToAave',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.blockTimestamp)
      }))).concat(withdrawAaveEvents.map((event) => ({
          type: 'WithdrawnFromAave',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.blockTimestamp)
      })))

      console.log(combinedEvents)

      const sortedEvents = combinedEvents.sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp))

      setEvents(sortedEvents)

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
    <>
      {isConnected ? (
        <div>
          <p>
            msg.sender: {msgSenderOnContract}
          </p>
          userBalanceOnContract: <GetBalance balance={userBalanceOnContract} isPending={isPending} error={error} />
          usdcBalanceOfUser: <GetBalance balance={usdcBalanceOfUser} isPending={isPending} error={error} />
          balanceContract: <GetBalance balance={balanceContract} isPending={isPending} error={error} />
          <DepositUsdc refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={events} />
          <WithdrawUsdc refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={events} />
          <SupplyAave refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={events} />
          <WithdrawAave refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={events} />
          <Events events={events} />
        </div>
      ) : (
        <Alert className='bg-yellow-100'>
          <AlertTitle>Not connected</AlertTitle>
          <AlertDescription>Please connect your wallet to continue</AlertDescription>
        </Alert>
      )}
    </>
  )
}

export default Bank