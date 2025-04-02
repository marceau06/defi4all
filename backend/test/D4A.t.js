const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  

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

      })

    })

    describe("Swap ETH to USDC", function() { 

      it("should have USDC in owner wallet", async function () {
        const { owner, usdcToken, ethValueInUsdc } = await loadFixture(deployContractSupplyTestFixture);

        // Verify that the owner has received USDC after the swap
        const usdcBalanceOwner = await usdcToken.balanceOf(owner.address);
        console.log("USDC Owner balance: ", hre.ethers.formatUnits(usdcBalanceOwner, 6));

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
                .to.be.revertedWith("Amount must be greater than 0");
      
      })

      it('should revert when amount sent is more than the wallet balance', async function() {
        const { d4A } = await loadFixture(deployContractSupplyTestFixture);
        const amountToDeposit = hre.ethers.parseUnits("10000", 6); // 10000 usdc

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
        const amountToDeposit = hre.ethers.parseUnits("10000", 6); // 10000 usdc

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

        console.log("AUSDC Contract balance before SUPPLY: ", hre.ethers.formatUnits(contractAUsdcBalanceBeforeSupply, 8));
        console.log("ETH Contract balance before SUPPLY: ", hre.ethers.formatUnits(contractEthBalanceBeforeSupply, 18));
        
        const ownerUsdcBalanceBeforeSupply = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalanceBeforeSupply = await aUsdcToken.balanceOf(owner.address);
        const ownerEthBalanceBeforeSupply = await ethers.provider.getBalance(owner.address);
        
        console.log("USDC Owner balance before SUPPLY: ", hre.ethers.formatUnits(ownerUsdcBalanceBeforeSupply, 6));
        console.log("AUSDC Owner balance before SUPPLY: ", await aUsdcToken.balanceOf(owner.address));
        console.log("ETH Owner balance before SUPPLY: ", hre.ethers.formatUnits(ownerEthBalanceBeforeSupply, 18));

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

        // Do the supply
        await expect(d4A.supplyToAave(amount))
          .to.emit(d4A, "SuppliedToAave")
          .withArgs(owner.address, amount);
        
        console.log("********************* SUPPLY DONE *********************");
        console.log("Deposit to the pool successfully made for an amount of ", amount);

        const contractAUsdcBalanceAfterSupply = await aUsdcToken.balanceOf(d4A);
        const contractEthBalanceAfterSupply = await ethers.provider.getBalance(d4A);
        
        console.log("AUSDC Contract balance after SUPPLY: ", hre.ethers.formatUnits(contractAUsdcBalanceAfterSupply, 6));
        console.log("ETH Contract balance after SUPPLY: ", hre.ethers.formatUnits(contractEthBalanceAfterSupply, 18));

        const ownerUsdcBalanceAfterSupply = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalancefterSupply = await aUsdcToken.balanceOf(owner.address);
        const ownerEthBalanceAfterSupply = await ethers.provider.getBalance(owner.address);

        console.log("USDC Owner balance after SUPPLY: ", hre.ethers.formatUnits(ownerUsdcBalanceAfterSupply, 6));
        console.log("AUSDC Contract balance after SUPPLY: ",  hre.ethers.formatUnits(ownerAUsdcBalancefterSupply, 6));
        console.log("ETH Owner balance after SUPPLY: ", hre.ethers.formatUnits(ownerEthBalanceAfterSupply, 18));

        // AUSDC Contract balance after SUPPLY
        expect(contractAUsdcBalanceBeforeSupply).to.equal(0);
        // USDC Owner balance after SUPPLY
        // 2931262574 - 50000000 = 2881262574
        expect(ownerUsdcBalanceAfterSupply).to.equal(ethValueInUsdc - Number(amount));
        // AUSDC Owner balance after SUPPLY         
        expect(ownerAUsdcBalancefterSupply).to.equal(amount);

        console.log("********************* WITHDRAWAL TEST *********************");

        // Should revert when allowance is less than the amount to supply
        await expect(d4A.withdrawFromAave(amount))
                .to.be.revertedWith("Allowance too low");

        // Use AaveUSDC approve to the contract to be able to transfer AaveUSDC tokens
        await aUsdcToken.approve(d4A, amount);

        // Do the withdraw
        await expect(d4A.withdrawFromAave(amount))
                .to.emit(d4A, "WithdrawnFromAave")
                .withArgs(owner.address, amount);

        console.log("********************* WITHDRAW DONE *********************");
        console.log("Withdrawal to the pool successfully made for an amount of ", amount);

        const contractAUsdcBalanceAfterWithdraw = await aUsdcToken.balanceOf(d4A);
        const contractEthBalanceAfterWithdraw = await ethers.provider.getBalance(d4A);

        console.log("AUSDC Contract balance on the pool after WITHDRAW: ", hre.ethers.formatUnits(contractAUsdcBalanceAfterWithdraw, 6));
        console.log("ETH Contract balance after WITHDRAW: ", hre.ethers.formatUnits(contractEthBalanceAfterWithdraw, 18));

        const ownerUsdcBalanceAfterWithdraw = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalanceAfterWithdraw = await aUsdcToken.balanceOf(owner.address);
        const ownerEthBalanceAfterWithdraw = await ethers.provider.getBalance(owner.address)

        console.log("USDC Owner balance after WITHDRAW: ", hre.ethers.formatUnits(ownerUsdcBalanceAfterWithdraw, 6));
        console.log("AUSDC Owner balance after WITHDRAW: : ", hre.ethers.formatUnits(ownerAUsdcBalanceAfterWithdraw, 6));
        console.log("AUSDC contract balance on the pool after WITHDRAW: ",  hre.ethers.formatUnits(contractAUsdcBalanceAfterWithdraw, 8));
        console.log("ETH Owner balance after WITHDRAW: ", hre.ethers.formatUnits(ownerEthBalanceAfterWithdraw, 18));

        // AUSDC Contract balance after Withdraw
        expect(contractAUsdcBalanceAfterWithdraw).to.equal(0);
        // USDC Owner balance after Withdraw: Recover all the USDC that had been supplied 
        expect(ownerUsdcBalanceAfterWithdraw).to.equal(ethValueInUsdc);
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
          const amount = hre.ethers.parseUnits("10000", 6); // 10000 usdc
  
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

      it("should deposit usdc on the contract, get D4ATokens and burn them", async function() {
          const { d4A, owner, usdcToken, ethValueInUsdc } = await loadFixture(deployContractSupplyTestFixture);
          
          console.log("********************* DEPOSIT TEST *********************");
          // Amount to supply is 1000 usdc
          const amount = hre.ethers.parseUnits("1000", 6);  
          // Owner should receive 15% of his deposit in D4A
          const d4ABalance = Number(amount)*(15/100);
          console.log("Amount usdc to supplly: ", amount);

          const ownerUsdcBalanceOnTheContractBeforeDeposit = await d4A.getUserBalance();
          const ownerUsdcBalanceBeforeDeposit = await usdcToken.balanceOf(owner.address);
          const contractUsdcBalanceBeforeDeposit = await usdcToken.balanceOf(d4A);

          console.log("ETH Owner balance before DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
          console.log("USDC Owner balance before DEPOSIT: ",  hre.ethers.formatUnits(ownerUsdcBalanceBeforeDeposit, 6));
          console.log("USDC Owner balance on contract before DEPOSIT: ",  hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractBeforeDeposit, 6));
          console.log("USDC Contract balance before DEPOSIT: ", hre.ethers.formatUnits(contractUsdcBalanceBeforeDeposit, 6));

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
                  .withArgs(owner.address, amount);
          console.log("USDC deposited");
          console.log("********************* DEPOSIT DONE *********************");
          console.log("Deposit to the contract successfully made for an amount of ", amount);


          const ownerUsdcBalanceOnTheContractAfterDeposit = await d4A.getUserBalance();
          const ownerUsdcBalanceAfterDeposit = await usdcToken.balanceOf(owner.address);
          const contractUsdcBalanceAfterDeposit = await usdcToken.balanceOf(d4A);
          const ownerD4ABalanceOnTheContractAfterDeposit = await d4A.balanceOf(owner.address);
    
          console.log("ETH Owner balance after DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
          console.log("USDC Owner balance after DEPOSIT: ", hre.ethers.formatUnits(ownerUsdcBalanceAfterDeposit, 6));
          console.log("USDC Owner balance on contract before DEPOSIT: ",  hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractAfterDeposit, 6));
          console.log("USDC Contract balance after DEPOSIT: ", hre.ethers.formatUnits(contractUsdcBalanceAfterDeposit, 6));
          console.log("D4A Owner balance after DEPOSIT: ",  hre.ethers.formatUnits(ownerD4ABalanceOnTheContractAfterDeposit, 6));

          // Contract balance must be equal to amount deposited
          expect(await d4A.getUsdcBalance()).to.eq(amount);
          // Owner balance on the contract must be equal to amount deposited
          expect(ownerUsdcBalanceOnTheContractAfterDeposit).to.eq(amount); 
          // Owner must have received 15% of his deposit in D4A
          expect(ownerD4ABalanceOnTheContractAfterDeposit).to.eq(d4ABalance); 
          

          console.log("********************* BURN TEST *********************");
          // Should revert if burn more than balance
          await expect(d4A.burn(5000000000))
                  .to.be.revertedWithCustomError(d4A, "ERC20InsufficientBalance")
                  .withArgs(owner.address, d4ABalance, 5000000000);
          
          // Burn the token
          await expect(d4A.burn(d4ABalance))
                  .to.emit(d4A, "Burned")
                  .withArgs(owner.address, d4ABalance);

          const ownerD4ABalanceOnTheContractAfterBurn = await d4A.balanceOf(owner.address);
          console.log("D4A User balance after BURN: ",  hre.ethers.formatUnits(ownerD4ABalanceOnTheContractAfterBurn, 6));
          console.log("********************* BURN DONE *********************");

          // Owner balance must be equal to 0
          expect(ownerD4ABalanceOnTheContractAfterBurn).to.eq(0);

          console.log("********************* WITHDRAW TEST *********************");
          // withdrawUSDC
          await expect(d4A.withdrawUSDC(1000000000))
                  .to.emit(d4A, "Withdrawn")
                  .withArgs(owner.address, 1000000000);
          console.log("********************* WITHDRAW DONE *********************");
          console.log("Deposit to the contract successfully made for an amount of ", amount);

          const ownerUsdcBalanceOnTheContractAfterWithdraw = await d4A.getUserBalance();
          const ownerUsdcBalanceAfterWithdraw = await usdcToken.balanceOf(owner.address);

          console.log("USDC Contract balance after WITHDRAW: ", hre.ethers.formatUnits(await usdcToken.balanceOf(d4A), 6));
          console.log("USDC Owner balance after WITHDRAW: ", hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
          console.log("USDC Owner balance on contract before WITHDRAW: ",  hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractAfterWithdraw, 6));

          expect(ownerUsdcBalanceOnTheContractAfterWithdraw).to.eq(0);
          expect(ownerUsdcBalanceAfterWithdraw).to.eq(ethValueInUsdc);
      })
    })
    
  });