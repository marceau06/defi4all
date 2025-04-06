'use client';
import { useAccount } from 'wagmi'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useReadContract, useBlockNumber } from 'wagmi';
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
import Mint from '@/components/Mint'


const D4A = () => {


    const { isConnected, address } = useAccount()

    const [eventsUsdc, setEventsUsdc] = useState([])
    const [eventsAave, setEventsAave] = useState([])

    // Get the current block number
    const { data: blockNumber } = useBlockNumber({ watch: true })


    const { data: userBalanceOnContract, isPending: userBalanceOnContractPending, error: userBalanceOnContractError, refetch: refetchUserBalanceOnContract } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserBalance'
    })

    const { data: mintableTokens, refetch: refetchMintableTokens, isPending: mintableTokensPending, error: mintableTokensError } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getTotalRewards'
    })


    const { data: balanceContract, refetch: refetchBalanceContract, isPending: balanceContractPending, error: balanceContractError} = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUsdcBalance'
    })

    const { data: d4ABalance, refetch: refetchD4ABalance, isPending: d4ABalancePending, error: d4ABalanceError } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [address],
    })

    const { data: usdcBalanceOfUser, refetch: refetchUserBalance, isPending: usdcBalanceOfUserPending, error: usdcBalanceOfUserError } = useReadContract({
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

  // Refetch à chaque nouveau bloc
  useEffect(() => {
    if (blockNumber) {
      refetchMintableTokens();
    }
  }, [blockNumber, mintableTokens])


  useEffect(() => {
    const getAllEvents = async() => {
      if(address !== 'undefined') {
        await getEvents();
      }
    }
    getAllEvents();
    refetchMintableTokens();
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


      {isConnected ? (
        <>

      <div className="flex justify-between items-center border-b p-5">
          <div className="flex flex-col justify-between items-center">
            <GetBalance balance={usdcBalanceOfUser} isPending={usdcBalanceOfUserPending} error={usdcBalanceOfUserError} />
            Your USDC balance
          </div>
          <div className="flex flex-col justify-between items-center">
            <GetBalance balance={userBalanceOnContract} isPending={userBalanceOnContractPending} error={userBalanceOnContractError} />
            Your Insurance balance
          </div>
          <div className="flex flex-col justify-between items-center">
            <GetBalance balance={d4ABalance} isPending={d4ABalancePending} error={d4ABalanceError} />
            Your D4A balance
          </div>
          <div className="flex flex-col justify-between items-center">
            <GetBalance balance={balanceContract} isPending={balanceContractPending} error={balanceContractError} />
            Insurance balance
          </div>
      </div>
        <div className="flex flex-row items-center border-b pb-5">
          <div className="pl-5 flex flex-col items-center">

          <GetBalance balance={mintableTokens} isPending={mintableTokensPending} error={mintableTokensError} />
          Your Rewards available
          </div>
          <div className="pl-5">
            <Mint mintableTokens={mintableTokens} refetchMintableTokens={refetchMintableTokens} refetchD4ABalance={refetchD4ABalance}/>
          </div>
      </div>
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
              <h1 className='text-2xl font-bold mb-2'>STRATEGIES</h1>
              <div className="px-10">
                <SupplyAave onSupplyAave={handleDepositOrWithdraw} events={eventsAave} />
                <WithdrawAave onWithdrawAave={handleDepositOrWithdraw} events={eventsAave} />
              </div>
              <Events events={eventsAave} />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-row px-20 items-center h-screen">
        <Alert className="text-center text-4xl" >
          <AlertTitle>Not connected</AlertTitle>
          <AlertDescription>Please connect your wallet to continue</AlertDescription>
        </Alert>
        </div>
      )}
    </div>
    </>
  )
}

export default D4A