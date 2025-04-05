'use client';
import { useAccount } from 'wagmi'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useReadContract } from 'wagmi';

import { parseAbiItem } from 'viem'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, USDC_ADDRESS_ABI } from '@/constants'
import { publicClient } from '@/utils/client'
import Events from '@/components/Events'
import GetBalance from '@/components/GetBalance'
import DepositUsdc from '@/components/DepositUsdc'
import WithdrawUsdc from '@/components/WithdrawUsdc'
import SupplyAave from '@/components/SupplyAave'
import WithdrawAave from '@/components/WithdrawAave'
import { useTheme } from "next-themes"

const Bank = () => {


    const { isConnected, address } = useAccount()

    const [eventsUsdc, setEventsUsdc] = useState([])
    const [eventsAave, setEventsAave] = useState([])


    const { data: userBalanceOnContract, isPending, error, refetch: refetchUserBalanceOnContract } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserBalance'
    })

    // const { data: usdcBalanceOfUser, refetch: refetchUserBalance } = useReadContract({
    //   address: CONTRACT_ADDRESS,
    //   abi: CONTRACT_ABI,
    //   functionName: 'getUsdcBalanceOfUser'
    // })

    const { data: balanceContract, refetch: refetchBalanceContract } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUsdcBalance'
    })

    const { data: d4ABalance, refetch: refetchD4ABalance } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [address],
    })

    const { data: usdcBalanceOfUser, refetch: refetchUserBalance } = useReadContract({
      address: USDC_ADDRESS,
      abi: USDC_ADDRESS_ABI,
      functionName: 'balanceOf',  
      args: [address],
    })

    const getEvents = async() => {

        const depositEvents = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem('event Deposited(address indexed account, uint amount, uint timestamp)'),
            // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
            fromBlock: 22176642n,
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })

        const withdrawEvents = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem('event Withdrawn(address indexed account, uint amount, uint timestamp)'),
            // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
            fromBlock: 22176642n,
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })

        const supplyAaveEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem('event SuppliedToAave(address indexed account, uint amount, uint timestamp)'),
          // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
          fromBlock: 22176642n,
          // jusqu'au dernier
          toBlock: 'latest' // Pas besoin valeur par défaut
        })

      const withdrawAaveEvents = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem('event WithdrawnFromAave(address indexed account, uint amount, uint timestamp)'),
          // du premier bloc choisi dans la config hardhat pour faire le fork du mainnet
          fromBlock: 22176642n,
          // jusqu'au dernier
          toBlock: 'latest' // Pas besoin valeur par défaut
        })

      const combinedEventInsurance = 
      depositEvents.map((event) => ({
          type: 'Deposited',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.args.timestamp), // On récupère le timestamp de la trx via les evenements
          // blockTimestamp: Number(event.blockNumber)
      })).concat(withdrawEvents.map((event) => ({
          type: 'Withdrawn',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.args.timestamp),
          // blockTimestamp: Number(event.blockNumber)
      })))

      const combinedEventsAave = 
      supplyAaveEvents.map((event) => ({
          type: 'SuppliedToAave',
            address: event.args.account,
            amount: event.args.amount,
            blockTimestamp: Number(event.args.timestamp),
            // blockTimestamp: Number(event.blockNumber)
        })).concat(withdrawAaveEvents.map((event) => ({
          type: 'WithdrawnFromAave',
          address: event.args.account,
          amount: event.args.amount,
          blockTimestamp: Number(event.args.timestamp),
          // blockTimestamp: Number(event.blockNumber)
        })))  

      const sortedEventsUsdc = combinedEventInsurance.sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp))
      const sortedEventsAave = combinedEventsAave.sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp))

      console.log("Sorted Events USDC", sortedEventsUsdc)
      console.log("Sorted Events AAVE", sortedEventsAave)

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

  // Appelé à chaque Action
  const handleDepositOrWithdraw = async () => {
    if(address !== 'undefined') {
      await getEvents();
    }
  };

  return (
    <>
    <div className="flex flex-col items-stretch justify-center min-h-screen antialiased gradient bg-gradient-to-t from-emerald-700 to-black leading-relaxed tracking-wide">
    <div className="flex justify-between items-center border-b p-5">
      <div className="flex flex-col justify-between items-center">
        <GetBalance userBalanceOnContract={userBalanceOnContract} balance={usdcBalanceOfUser} isPending={isPending} error={error} />
        Your USDC balance
      </div>
      <div className="flex flex-col justify-between items-center">
        <GetBalance userBalanceOnContract={userBalanceOnContract} balance={userBalanceOnContract} isPending={isPending} error={error} />
        Your Insurance balance
      </div>
      <div className="flex flex-col justify-between items-center">
        <GetBalance userBalanceOnContract={d4ABalance} balance={d4ABalance} isPending={isPending} error={error} />
        Your D4A balance
      </div>
      <div className="flex flex-col justify-between items-center">
        <GetBalance userBalanceOnContract={userBalanceOnContract} balance={balanceContract} isPending={isPending} error={error} />
        Insurance balance
      </div>
    </div>
      {isConnected ? (
        <>
        <div className="flex flex-row justify-between items-center">
          <div className="flex-1 text-center border-r border-gray-300 pt-10">
              <h1 className='text-2xl font-bold mb-2'>Insurance</h1>
              <div className="pl-10 pr-10">
                <DepositUsdc onDeposit={handleDepositOrWithdraw} refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={eventsUsdc} />
                <WithdrawUsdc onWithdraw={handleDepositOrWithdraw} refetchUserBalanceOnContract={refetchUserBalanceOnContract} refetchUserBalance={refetchUserBalance} refetchBalanceContract={refetchBalanceContract} events={eventsUsdc} />
              </div>
              <Events events={eventsUsdc} />
          </div>
          <div className="flex-1 text-center pt-10">
              <h1 className='text-2xl font-bold mb-2'>AAVE</h1>
              <div className="px-10">
                <SupplyAave events={eventsAave} />
                <WithdrawAave events={eventsAave} />
              </div>
              <Events events={eventsAave} />
          </div>
          </div>
        </>
      ) : (
        <Alert className="bg-yellow-100 text-center flex-1" >
          <AlertTitle>Not connected</AlertTitle>
          <AlertDescription>Please connect your wallet to continue</AlertDescription>
        </Alert>
      )}
    </div>
    </>
  )
}

export default Bank