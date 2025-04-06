import { formatUnits  } from "ethers";

const GetBalance = ({ balance, isPending, error, balanceTitle  }) => {
  return (
    <div className="mt-6 flex items-baseline gap-2">
        {isPending && <div>Loading...</div>}
        {error && <div>Error: {error.shortMessage || error.message}</div>}
        {balance !== undefined && <div><span className="text-4xl font-bold">{formatUnits(balance.toString(), 6).toString()}</span>  <span className="text-sm text-muted-foreground">USDC</span></div>}
    </div>
  )
}

export default GetBalance