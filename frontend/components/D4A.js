'use client';
import { useAccount } from 'wagmi'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useReadContract } from 'wagmi';

import { parseAbiItem } from 'viem'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/constants'
import { publicClient } from '@/utils/client'
import Events from '@/components/Events'

const Bank = () => {

  const { isConnected, address } = useAccount()

  const [events, setEvents] = useState([])

//   const { data: balance, isPending, error, refetch } = useReadContract({
//     address: CONTRACT_ADDRESS,
//     abi: CONTRACT_ABI,
//     functionName: 'getBalanceOfUser',
//     account: address,
//   })

  const getEvents = async() => {
    const depositEvents = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: parseAbiItem('event Deposited(address indexed account, uint amount)'),
      // du 7895383 bloc
      fromBlock: 21423360n,
      // jusqu'au dernier
      toBlock: 'latest' // Pas besoin valeur par défaut
    })

    const withdrawEvents = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: parseAbiItem('event Withdrawn(address indexed account, uint amount)'),
      // du premier bloc
      fromBlock: 21423360n,
      // jusqu'au dernier
      toBlock: 'latest' // Pas besoin valeur par défaut
    })

    const combinedEvents = depositEvents.map((event) => ({
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
          COMPONENTS HERE
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