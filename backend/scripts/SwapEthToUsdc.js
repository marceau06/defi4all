const { ethers } = require("hardhat");

async function main() {

    const [owner, addressUser] = await ethers.getSigners();
    const usdcTokenAddress = process.env.USDC_ADDRESS_MAINNET || '';
    const uniswapRouterAddress = process.env.UNISWAP_ROUTER_ADDRESS_MAINNET || '';
    const hardhatOwnerAddress = process.env.HARDHAT_OWNER_ADDRESS || '';

    // Get usdc contract
    const usdcToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcTokenAddress);
    // Get uniswap v2 router
    const uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddress);

    // Swap ETH to USDC

    // Show balance before SWAP
    const usdcBalanceOwnerBeforeSwap = await usdcToken.balanceOf(owner.address);
    console.log("ETH Owner balance before SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
    console.log("USDC Owner balance before SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerBeforeSwap, 6));

    // Get Weth ERC20 token address
    const wethAddress = await uniswapRouter.WETH();
    // Value of eth in usdc on block number 21423360
    const ethValueInUsdc = 3931262574;

    // Swap 
    await uniswapRouter.swapExactETHForTokens(
            // Minimum slippage
            100, 
            // Swap path (WETH -> USDC)
            [wethAddress, usdcTokenAddress], 
            // The address which will receive USDC
            owner.address, 
            // Trx must be confirmed in next 20 minutes
            Math.floor(Date.now() / 1000) + 60 * 20, 
            // Amount to swap of 1000 ETH
            { value: hre.ethers.parseEther('1000') } 
        )

    // Show balance after SWAP
    const usdcBalanceOwnerAfterSwap = await usdcToken.balanceOf(owner.address);
    console.log("ETH Owner balance after SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
    console.log("USDC Owner balance after SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerAfterSwap, 6));

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});