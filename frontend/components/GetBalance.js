import { formatUnits  } from "ethers";

const GetBalance = ({ balance, isPending, error,  }) => {
  return (
    <div>
        {isPending && <div>Loading...</div>}
        {error && <div>Error: {error.shortMessage || error.message}</div>}
        {balance !== undefined && <div>Balance: {formatUnits(balance.toString(), 6).toString()} USDC</div>}
    </div>
  )
}

export default GetBalance