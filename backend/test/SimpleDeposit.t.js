const { assert, expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  

  describe("D4A", function () {

    const AAVE_POOL_ADDRESS_MAINNET = process.env.AAVE_POOL_ADDRESS_MAINNET || '';
    const USDC_ADDRESS_MAINNET = process.env.USDC_ADDRESS_MAINNET || '';
    const UNISWAP_ROUTER_ADDRESS_MAINNET = process.env.UNISWAP_ROUTER_ADDRESS_MAINNET || '';
    const AUSDC_ADDRESS_MAINNET = process.env.AUSDC_ADDRESS_MAINNET || '';


    async function deployContractDepositTestFixture() {

      const [owner, addressUser] = await ethers.getSigners();
      const poolAddress = AAVE_POOL_ADDRESS_MAINNET; // Adresse Pool aave v3 sur Mainnet
      const usdcTokenAddress = USDC_ADDRESS_MAINNET; // Adresse usdc sur Mainnet
      const uniswapRouterAddress = UNISWAP_ROUTER_ADDRESS_MAINNET; // Adresse Routeur Uniswap v2 sur Mainnet
      const aUsdcTokenAddress = AUSDC_ADDRESS_MAINNET; // Adresse des aave usdc aToken sur Mainnet

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


    //   // Prerequisites: Have USDC on the owner wallet
    //   // Swap ETH to USDC
    //   // Show balance before SWAP
    //   const usdcBalanceOwnerBefore = await usdcToken.balanceOf(owner.address);
    //   console.log("On Fixture: ETH Owner balance before SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
    //   console.log("On Fixture: USDC Owner balance before SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerBefore, 6));
    
    //   // Get Weth ERC20 token address
    //   const wethAddress = await uniswapRouter.WETH();

    //   // Swap 
    //   await uniswapRouter.swapExactETHForTokens(
    //             100, // Minimum slippage
    //             [wethAddress, usdcTokenAddress], // Swap path (WETH -> USDC)
    //             owner.address, // The address which will receive USDC
    //             Math.floor(Date.now() / 1000) + 60 * 20, // Trx must be confirmed in next 20 minutes
    //             { value: hre.ethers.parseEther('1') } // Amount to swap of 1 ETH
    //         )

    //   // Show balance after SWAP
    //   const usdcBalanceOwnerAfter = await usdcToken.balanceOf(owner.address);
    //   console.log("On Fixture: ETH Owner balance after SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
    //   console.log("On Fixture: USDC Owner balance after SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerAfter, 6));

      return { d4A, owner, poolAddress, usdcTokenAddress, usdcToken, aUsdcToken, aavePool, uniswapRouter, addressUser };

    }

    describe("Deployment", function() {

        it("should deploy the contract with the right onwer", async function() {
          const { d4A, owner, poolAddress, usdcTokenAddress } = await loadFixture(deployContractDepositTestFixture);
  
          const contractOwner = await d4A.owner();
          const contractPoolAddress = await d4A.aavePool();
          const contractUsdcTokenAddress = await d4A.usdcToken();
  
          assert(contractOwner === owner.address);
          assert(contractPoolAddress === poolAddress);
          assert(contractUsdcTokenAddress === usdcTokenAddress);
  
        })
  
    })

    describe("Swap ETH to USDC", function() { 

        it("should have USDC in owner wallet", async function () {
          const { owner, usdcToken } = await loadFixture(deployContractDepositTestFixture);
  
          // Vérifier que le owner a bien reçu des USDC après le swap
          const usdcBalanceOwner = await usdcToken.balanceOf(owner.address);
          console.log("USDC Owner balance: ", hre.ethers.formatUnits(usdcBalanceOwner, 6));
  
          // Le solde du owner en USDC doit avoir augmenté
          expect(usdcBalanceOwner).to.be.gt(0); 
        
        })
  
    })


    describe("Deposit and withdraw on insurance", function() { 

        it('should revert when amount sent is 0 ', async function() {
          const { d4A } = await loadFixture(deployContractDepositTestFixture);
  
          await expect(d4A.depositUSDC(0))
                  .to.be.revertedWith("Amount must be greater than 0");
        })

        it("should revert when amount sent is more than the wallet balance", async function() {
            const { d4A } = await loadFixture(deployContractDepositTestFixture);
            const parsedAmountToDeposit = hre.ethers.parseUnits("10000", 6); // 10000 usdc
    
            await expect(d4A.depositUSDC(parsedAmountToDeposit))
                    .to.be.revertedWith("Insufficient funds"); 
        })
        
        it("should revert when not owner who burn token", async function() {
            const { d4A, addressUser } = await loadFixture(deployContractDepositTestFixture);

            await expect(d4A.connect(addressUser).burn(0))
                    .to.be.revertedWithCustomError(d4A, "OwnableUnauthorizedAccount")
                    .withArgs(addressUser);
        })

        it("should revert withdraw 0 token", async function() {
            const { d4A } = await loadFixture(deployContractDepositTestFixture);

            await expect(d4A.withdrawUSDC(0))
                    .to.be.revertedWith("Amount must be greater than 0");
        })

        it("should revert when amount withdrawn is more than the balance on the contract", async function() {
            const { d4A } = await loadFixture(deployContractDepositTestFixture);

            await expect(d4A.withdrawUSDC(10000000))
                    .to.be.revertedWith("Insufficient funds");
        })

        it("should deposit usdc on the contract, get D4ATokens and burn them", async function() {
          
            const { d4A, owner, poolAddress, usdcTokenAddress, usdcToken, aUsdcToken, aavePool, uniswapRouter } = await loadFixture(deployContractDepositTestFixture);
        
            // Envoyer de l'usdc au contrat
            const parsedAmountToDeposit = hre.ethers.parseUnits("1000", 6);  
            console.log("Montant d'usdc à déposer: ", parsedAmountToDeposit);

            const ownerUsdcBalanceOnTheContractBeforeDeposit = await d4A.getUserBalance(owner.address);
            const ownerD4ABalanceOnTheContractBeforeDeposit = await d4A.balanceOf(owner.address);
      
            await expect(d4A.depositUSDC(parsedAmountToDeposit))
                    .to.be.revertedWith("Allowance too low");

            // Approuver le contrat pour pouvoir transférer les tokens USDC
            await usdcToken.approve(d4A, parsedAmountToDeposit);
      
            // Vérifier la balance eth du owner avant depot
            console.log("ETH Owner balance before DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
            // Vérifier la balance usdc du owner avant depot
            console.log("USDC Owner balance before DEPOSIT: ",  hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
            // Vérifier la balance usdc du owner sur le contrat avant depot
            console.log("USDC Owner balance on contract before DEPOSIT: ",  hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractBeforeDeposit, 6));
            // Vérifier la balance usdc du contrat avant depot
            console.log("USDC Contract balance before DEPOSIT: ", hre.ethers.formatUnits(await usdcToken.balanceOf(d4A), 6));
      
            expect(await d4A.getUsdcBalance()).to.eq(0);

            // Déposer les tokens dans le contrat
            await expect(d4A.depositUSDC(parsedAmountToDeposit))
                    .to.emit(d4A, "Deposited")
                    .withArgs(owner.address, parsedAmountToDeposit);
            
            console.log("USDC deposited");

            const ownerUsdcBalanceOnTheContractAfterDeposit = await d4A.getUserBalance(owner.address);
            const ownerD4ABalanceOnTheContractAfterDeposit = await d4A.balanceOf(owner.address);
      
            // Vérifier la balance eth du owner avant depot
            console.log("ETH Owner balance after DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
            // Vérifier que le owner a bien dépensé ses usdc
            console.log("USDC Owner balance after DEPOSIT: ", hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
            // Vérifier la balance usdc du owner sur le contrat avant depot
            console.log("USDC Owner balance on contract before DEPOSIT: ",  hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractAfterDeposit, 6));
            // Vérifier que le contrat a bien reçu des USDC
            console.log("USDC Contract balance after DEPOSIT: ", await d4A.getUserBalance(owner.address));
            // Vérifier que le contrat a bien reçu des D4A
            console.log("D4A User balance after DEPOSIT: ",  hre.ethers.formatUnits(ownerD4ABalanceOnTheContractAfterDeposit, 6));

            
            const d4ABalance = 1000000000*(15/100);

            // Contract balance must be equal to amount deposited
            expect(await d4A.getUsdcBalance()).to.eq(1000000000);
            // Owner balance on the contract must be equal to amount deposited
            expect(ownerUsdcBalanceOnTheContractAfterDeposit).to.eq(parsedAmountToDeposit); 
            // Owner must have received 15% of his deposit in D4A
            expect(ownerD4ABalanceOnTheContractAfterDeposit).to.eq(d4ABalance); 
            
            // Should revert if burn more than balance
            await expect(d4A.burn(5000000000))
                    .to.be.revertedWithCustomError(d4A, "ERC20InsufficientBalance")
                    .withArgs(owner.address, d4ABalance, 5000000000);

            
            // Burn the token
            // Déposer les tokens dans le contrat
            await expect(d4A.burn(d4ABalance)).to.emit(d4A, "Burned").withArgs(owner.address, d4ABalance);

            const ownerD4ABalanceOnTheContractAfterBurn = await d4A.balanceOf(owner.address);

            // D4A should have been burned
            console.log("D4A User balance after BURN: ",  hre.ethers.formatUnits(ownerD4ABalanceOnTheContractAfterBurn, 6));

            // Owner balance must be equal to 0
            expect(ownerD4ABalanceOnTheContractAfterBurn).to.eq(0);
    
            const ownerUsdcBalanceOnTheContractAfterWithdraw = await d4A.getUserBalance(owner.address);

            // withdrawUSDC
            await expect(d4A.withdrawUSDC(1000000000))
                    .to.emit(d4A, "Withdrawn")
                    .withArgs(owner.address, 1000000000);

            console.log("USDC Contract balance after WITHDRAW: ", hre.ethers.formatUnits(await usdcToken.balanceOf(d4A), 6));
            console.log("USDC Owner balance after WITHDRAW: ", hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
            console.log("USDC Owner balance on contract before WITHDRAW: ",  hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractAfterWithdraw, 6));

            expect(ownerUsdcBalanceOnTheContractAfterWithdraw).to.eq(1000000000);
            expect(await usdcToken.balanceOf(owner.address)).to.eq(3931262574);
            expect(ownerUsdcBalanceOnTheContractAfterWithdraw).to.eq(1000000000);

        })
  
  
      })
    
});