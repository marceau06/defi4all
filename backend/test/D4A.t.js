const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, network } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  

  describe("Supply", function () {

    async function deployContractSupplyTestFixture() {

      const [owner, addressUser] = await ethers.getSigners();
      const poolAddress = process.env.AAVE_POOL_ADDRESS_MAINNET || '';
      const usdcTokenAddress = process.env.USDC_ADDRESS_MAINNET || '';
      const uniswapRouterAddress = process.env.UNISWAP_ROUTER_ADDRESS_MAINNET || '';
      const aUsdcTokenAddress = process.env.AUSDC_ADDRESS_MAINNET || '';

      // Deploy D4A contract
      const d4A = await hre.ethers.deployContract("D4A", [owner.address, poolAddress, usdcTokenAddress, aUsdcTokenAddress, uniswapRouterAddress])
      // Get usdc contract
      const usdcToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcTokenAddress);
      // Get ausdc contract, aave token for usdc
      const aUsdcToken = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", aUsdcTokenAddress);
      // Get uniswap v2 router
      const uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddress);
      // Get aave v3 pool
      const aavePool = await hre.ethers.getContractAt("@aave/core-v3/contracts/interfaces/IPool.sol:IPool", poolAddress);


      // Prerequisites: Have USDC on the owner wallet
      // Swap ETH to USDC

      // Show balance before SWAP
      const usdcBalanceOwnerBeforeSwap = await usdcToken.balanceOf(owner.address);
      console.log("On Fixture: ETH Owner balance before SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      console.log("On Fixture: USDC Owner balance before SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerBeforeSwap, 6));
    
      // Get Weth ERC20 token address
      const wethAddress = await uniswapRouter.WETH();
      // Value of eth in usdc on block number 21423360
      const ethValueInUsdc = 1903933450;

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
                // Amount to swap of 1 ETH
                { value: hre.ethers.parseEther('1') } 
            )

      // Show balance after SWAP
      const usdcBalanceOwnerAfterSwap = await usdcToken.balanceOf(owner.address);
      console.log("On Fixture: ETH Owner balance after SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      console.log("On Fixture: USDC Owner balance after SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerAfterSwap, 6));

      return { d4A, owner, addressUser, poolAddress, usdcTokenAddress, usdcToken, aUsdcToken, aavePool, uniswapRouter, ethValueInUsdc };
    }


  
    describe("Deployment", function() {

      it("should deploy the contract with the right onwer", async function() {
        const { d4A, owner, poolAddress, usdcTokenAddress } = await loadFixture(deployContractSupplyTestFixture);

        const contractOwner = await d4A.owner();
        const contractPoolAddress = await d4A.aavePool();
        const contractUsdcTokenAddress = await d4A.usdcToken();

        expect(contractOwner).to.equal(owner.address);
        expect(contractPoolAddress).to.equal(poolAddress);
        expect(contractUsdcTokenAddress).to.equal(usdcTokenAddress);
        expect(await d4A.decimals()).to.equal(6);
        expect(await d4A.name()).to.equal("D4AToken");
        expect(await d4A.symbol()).to.equal("D4A");   
      })

    })

    describe("Swap ETH to USDC", function() { 

      it("should have USDC in owner wallet", async function () {
        const { owner, usdcToken, ethValueInUsdc } = await loadFixture(deployContractSupplyTestFixture);

        // Verify that the owner has received USDC after the swap
        const usdcBalanceOwner = await usdcToken.balanceOf(owner.address);
        // Owner's USDC balance must have increased
        expect(usdcBalanceOwner).to.gt(0);
        // Owner's USDC balance must be equal to 1 eth
        expect(usdcBalanceOwner).to.equal(ethValueInUsdc);
      
      })

    })

    describe("Deposit and withdraw on aave pool", function() { 

      it('should revert when amount sent is 0', async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);

        await expect(d4A.supplyToAave(0))
                .to.be.revertedWith("Supply too small (min 0.01 USDC)");
      
      })

      it('should revert when amount sent is more than the wallet balance', async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);
        const amountToDeposit = hre.ethers.parseUnits("10000", 6);

        await expect(d4A.supplyToAave(amountToDeposit))
                .to.be.revertedWith("Insufficient funds"); 
      })

      it('should revert when amount withdrawn is 0 ', async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);

        await expect(d4A.withdrawFromAave(0))
                .to.be.revertedWith("Amount must be greater than 0");
      
      })

      it('should revert when amount withdrawn is more than the wallet balance', async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);
        const amountToDeposit = hre.ethers.parseUnits("10000", 6);

        await expect(d4A.withdrawFromAave(amountToDeposit))
                .to.be.revertedWith("Insufficient balance of aUsdc"); 
      })

      it('should add liquidity to the AAVE V3 Pool', async function() {
        
        const { d4A, owner, usdcToken, aUsdcToken, ethValueInUsdc } = await loadFixture(deployContractSupplyTestFixture);
        
        console.log("********************* SUPPLY TEST *********************");

        // Amount to supply is 50 usdc
        const amount = hre.ethers.parseUnits("50", 6);
        console.log("Amount to supply: ", amount);
        
        const contractAUsdcBalanceBeforeSupply = await aUsdcToken.balanceOf(d4A);
        const contractEthBalanceBeforeSupply = await ethers.provider.getBalance(d4A);
        const ownerUsdcBalanceBeforeSupply = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalanceBeforeSupply = await aUsdcToken.balanceOf(owner.address);
        const ownerEthBalanceBeforeSupply = await ethers.provider.getBalance(owner.address);

        // AUSDC Contract balance before SUPPLY
        expect(contractAUsdcBalanceBeforeSupply).to.equal(0);
        // USDC Owner balance before SUPPLY
        expect(ownerUsdcBalanceBeforeSupply).to.equal(ethValueInUsdc);
        // AUSDC Owner balance before SUPPLY
        expect(ownerAUsdcBalanceBeforeSupply).to.equal(0);

        // Should revert when allowance is less than the amount to supply
        await expect(d4A.supplyToAave(amount))
                .to.be.revertedWith("Allowance too low");

        // Use USDC approve to the contract to be able to transfer USDC tokens
        await usdcToken.approve(d4A, amount);

        const latestBlock = await ethers.provider.getBlock("latest");
        // Do the supply
        await expect(d4A.supplyToAave(amount))
          .to.emit(d4A, "SuppliedToAave")
          .withArgs(owner.address, amount, anyValue); // We accept any value as `when` arg
        
        console.log("********************* SUPPLY DONE *********************");
        console.log("Deposit to the pool successfully made for an amount of ", amount);

        const ownerUsdcBalanceAfterSupply = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalancefterSupply = await aUsdcToken.balanceOf(owner.address);

        // AUSDC Contract balance after SUPPLY
        expect(contractAUsdcBalanceBeforeSupply).to.equal(0);
        // USDC Owner balance after SUPPLY
        // 2931262574 - 50000000 = 2881262574
        expect(ownerUsdcBalanceAfterSupply).to.equal(ethValueInUsdc - Number(amount));
        // AUSDC Owner balance after SUPPLY    
        // 0.5% of the amount goes to insurance
        const rate = 5 / 1000;
        const reduction = Number(amount) * rate;
        const reducedAmount = Number(amount) - reduction;
        expect(ownerAUsdcBalancefterSupply).to.equal(reducedAmount);


        console.log("********************* WITHDRAWAL TEST *********************");
        // Should revert when allowance is less than the amount to supply
        await expect(d4A.withdrawFromAave(reducedAmount))
                .to.be.revertedWith("Allowance too low");

        // Use AaveUSDC approve to the contract to be able to transfer AaveUSDC tokens
        await aUsdcToken.approve(d4A, reducedAmount);

        // Do the withdraw
        await expect(d4A.withdrawFromAave(reducedAmount))
                .to.emit(d4A, "WithdrawnFromAave")
                .withArgs(owner.address, reducedAmount, anyValue); // We accept any value as `when` arg

        console.log("********************* WITHDRAW DONE *********************");
        console.log("Withdrawal to the pool successfully made for an amount of ", reducedAmount);

        const contractAUsdcBalanceAfterWithdraw = await aUsdcToken.balanceOf(d4A);
        const ownerUsdcBalanceAfterWithdraw = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalanceAfterWithdraw = await aUsdcToken.balanceOf(owner.address);

        // AUSDC Contract balance after Withdraw
        expect(contractAUsdcBalanceAfterWithdraw).to.equal(0);
        // USDC Owner balance after Withdraw: Recover the USDC that had been supplied - the reduction of 0.5%
        expect(ownerUsdcBalanceAfterWithdraw).to.equal(Number(ownerUsdcBalanceAfterSupply) + Number(reducedAmount));
        // AUSDC Owner balance after Withdraw: Should be O as we recovered all the USDC that had been supplied  
        expect(ownerAUsdcBalanceAfterWithdraw).to.equal(0);
      })
    })

    describe("Deposit and withdraw on insurance", function() { 

      it('should revert when amount sent is 0 ', async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);

        await expect(d4A.depositUSDC(0))
                .to.be.revertedWith("Amount must be greater than 0");
      })

      it("should revert when amount sent is more than the wallet balance", async function() {
          const { d4A } = await loadFixture(deployContractSupplyTestFixture);
          const amount = hre.ethers.parseUnits("10000", 6);
  
          await expect(d4A.depositUSDC(amount))
                  .to.be.revertedWith("Insufficient funds"); 
      })
      
      it("should revert when not owner who burn token", async function() {
          const { d4A, addressUser } = await loadFixture(deployContractSupplyTestFixture);

          await expect(d4A.connect(addressUser).burn(0))
                  .to.be.revertedWithCustomError(d4A, "OwnableUnauthorizedAccount")
                  .withArgs(addressUser);
      })

      it("should revert withdraw 0 token", async function() {
          const { d4A } = await loadFixture(deployContractSupplyTestFixture);

          await expect(d4A.withdrawUSDC(0))
                  .to.be.revertedWith("Amount must be greater than 0");
      })

      it("should revert when amount withdrawn is more than the balance on the contract", async function() {
          const { d4A } = await loadFixture(deployContractSupplyTestFixture);

          await expect(d4A.withdrawUSDC(10000000))
                  .to.be.revertedWith("Insufficient funds");
      })


      it("should have no rewards available", async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);

        expect(await d4A.calculateRewards())
                .to.eq(0);
      })

      it("should deposit Usdc on the contract, mint D4ATokens, burn D4ATokens and withdraw Usdc", async function() {
          const { d4A, owner, usdcToken, ethValueInUsdc } = await loadFixture(deployContractSupplyTestFixture);

          // Should revert when Try Minting before deposit
          await expect(d4A.mintTokens())
                  .to.be.revertedWith("No mintable tokens available");

          console.log("********************* DEPOSIT TEST *********************");
          // Amount to supply is 1000 usdc
          const amount = hre.ethers.parseUnits("1000", 6);  
          console.log("Amount usdc to supplly: ", amount);

          // Should revert when allowance is less than the amount to supply
          await expect(d4A.depositUSDC(amount))
                    .to.be.revertedWith("Allowance too low");
  
          // Use USDC approve to the contract to be able to transfer USDC tokens
          await usdcToken.approve(d4A, amount);

          // Contract usdc balance should be 0
          expect(await d4A.getUsdcBalance()).to.eq(0);

          // Deposit tokens into the contract
          await expect(d4A.depositUSDC(amount))
                  .to.emit(d4A, "Deposited")
                  .withArgs(owner.address, amount, anyValue); // We accept any value as timestamp arg as hardhat can take more than 1 second to mine a block
          console.log("********************* DEPOSIT DONE *********************");
          console.log("Deposit to the contract successfully made for an amount of ", amount);

          const ownerUsdcBalanceOnTheContractAfterDeposit = await d4A.getUserBalance();
          const ownerD4ABalanceAfterDeposit = await d4A.balanceOf(owner.address);

          // Contract balance must be equal to amount deposited
          expect(await d4A.getUsdcBalance()).to.eq(amount);
          // Owner balance on the contract must be equal to amount deposited
          expect(ownerUsdcBalanceOnTheContractAfterDeposit).to.eq(amount); 
          // Owner must have received 15% of his deposit in D4A
          expect(ownerD4ABalanceAfterDeposit).to.eq(0); 
          

          console.log("********************* MINTING test *********************");

          const blockBefore = await ethers.provider.getBlock("latest");
          console.log("Timestamp before increase:", blockBefore.timestamp);
        
          const oneYearInSeconds = 31536000; // 1 year in seconds
          const oneMonthInSeconds = (30 * 24 * 60 * 60); // 1 mont in seconds
          const rewardsPerYear = 15 / 100; // 15% per year of rewards
          const expectedRewardsValuePerMonth = Math.trunc(Number(amount) * rewardsPerYear * oneMonthInSeconds / oneYearInSeconds); // Estimated 30 days of rewards
          const expectedRewardsValuePerSecond = Math.trunc(Number(amount) * rewardsPerYear / oneYearInSeconds); // Estimated 1 second of rewards

          // Check the amount of D4A tokens that can be minted before the time increase 
          const mintableTokensBefore = await d4A.calculateRewards();
          expect(mintableTokensBefore).to.eq(0);

          // Try to mint the tokens before the time increase
          await expect(d4A.mintTokens())
                  .to.be.revertedWith("No mintable tokens available");

          // Increase the time on the blockchain to 30 days before minting tokens
          await network.provider.send("evm_increaseTime", [oneMonthInSeconds]);
          // Mine a new block for the time change to take effect
          await network.provider.send("evm_mine");

          const blockAfter = await ethers.provider.getBlock("latest");
          console.log("Timestamp after increase:", blockAfter.timestamp);

          // Get the amount of D4A tokens that can be minted
          const mintableTokens = await d4A.getMintableTokens();
          // Get the amount of D4A tokens that can be minted
          const rewards = await d4A.calculateRewards();
          // Get all the tokens that can be minted
          const totalMintableTokens = mintableTokens + rewards;

          // Harhdat will mine a new block with the new timestamp when we call the mint function
          // Estimate calculated rewards after mining new block
          const expectedMintableTokens = expectedRewardsValuePerMonth + expectedRewardsValuePerSecond;

          // We accept a margin of error of 1 second of rewards because hardhat can take more than 1 second to mine a block
          expect(totalMintableTokens).to.be.closeTo(expectedMintableTokens, 1);
          // expect(totalMintableTokens).to.eq(expectedMintableTokens);

          // Mint the tokens
          await expect(d4A.mintTokens())
                  .to.emit(d4A, "Minted")
                  .withArgs(owner.address, anyValue); // We already know the value of the minted tokens with calculateRewards() function
          const ownerD4ABalanceOnTheContractAfterMint= await d4A.balanceOf(owner.address);
          console.log("********************* MINTING DONE *********************");
          console.log("D4A User balance after MINT: ",  hre.ethers.formatUnits(ownerD4ABalanceOnTheContractAfterMint, 6));



          console.log("********************* BURN TEST *********************");
          const ownerD4ABalanceBeforeBurn = await d4A.balanceOf(owner.address);

          // Should revert if burn more than balance
          await expect(d4A.burn(5000000000))
                  .to.be.revertedWithCustomError(d4A, "ERC20InsufficientBalance")
                  .withArgs(owner.address, ownerD4ABalanceBeforeBurn, 5000000000); 
                  
          // Burn the token
          await expect(d4A.burn(ownerD4ABalanceBeforeBurn))
                  .to.emit(d4A, "Burned")
                  .withArgs(owner.address, ownerD4ABalanceBeforeBurn);

          const ownerD4ABalanceOnTheContractAfterBurn = await d4A.balanceOf(owner.address);
          console.log("********************* BURN DONE *********************");
          console.log("D4A User balance after BURN: ",  hre.ethers.formatUnits(ownerD4ABalanceOnTheContractAfterBurn, 6));

          // Owner balance must be equal to 0
          expect(ownerD4ABalanceOnTheContractAfterBurn).to.eq(0);

          console.log("********************* WITHDRAW TEST *********************");
          // withdrawUSDC
          await expect(d4A.withdrawUSDC(amount))
                  .to.emit(d4A, "Withdrawn")
                  .withArgs(owner.address, amount, anyValue); // We accept any value as `when` arg
          console.log("********************* WITHDRAW DONE *********************");
          console.log("Deposit to the contract successfully made for an amount of ", amount);

          const ownerUsdcBalanceOnTheContractAfterWithdraw = await d4A.getUserBalance();
          const ownerUsdcBalanceAfterWithdraw = await usdcToken.balanceOf(owner.address);

          expect(ownerUsdcBalanceOnTheContractAfterWithdraw).to.eq(0);
          expect(ownerUsdcBalanceAfterWithdraw).to.eq(ethValueInUsdc);
        
          // Last test to check that no rewards received if deposit is less than 10 usdc

          // Approve the contract to spend USDC tokens
          await usdcToken.approve(d4A, 100000); // 0.1 usdc
 
          // Deposit tokens into the contract
          await expect(d4A.depositUSDC(100000))
                  .to.emit(d4A, "Deposited")
                  .withArgs(owner.address, 100000, anyValue); // We accept any value as `when` arg
          
          // Increase the time on the blockchain to 120 seconds
          await network.provider.send("evm_increaseTime", [120]);
          await network.provider.send("evm_mine");
          
          // Check that no rewards are available
          expect(await d4A.calculateRewards())
                  .to.eq(0);

          // Try Minting after time increased
          await expect(d4A.mintTokens())
                  .to.be.revertedWith("No mintable tokens available");

          // withdrawUSDC
          await expect(d4A.withdrawUSDC(100000))
                  .to.emit(d4A, "Withdrawn")
                  .withArgs(owner.address, 100000, anyValue)
      })
    })
    
  });