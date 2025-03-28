const { assert, expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  

  describe("D4A", function () {

    const AAVE_POOL_ADDRESS_MAINNET = process.env.AAVE_POOL_ADDRESS_MAINNET || '';
    const USDC_ADDRESS_MAINNET = process.env.USDC_ADDRESS_MAINNET || '';
    const UNISWAP_ROUTER_ADDRESS_MAINNET = process.env.UNISWAP_ROUTER_ADDRESS_MAINNET || '';
    const AUSDC_ADDRESS_MAINNET = process.env.AUSDC_ADDRESS_MAINNET || '';


    async function deployContractFixture() {

      const [owner] = await ethers.getSigners();
      const poolAddress = AAVE_POOL_ADDRESS_MAINNET; // Adresse Pool aave v3 sur Mainnet
      const usdcTokenAddress = USDC_ADDRESS_MAINNET; // Adresse usdc sur Mainnet
      const uniswapRouterAddress = UNISWAP_ROUTER_ADDRESS_MAINNET; // Adresse Routeur Uniswap v2 sur Mainnet
      const aUsdcTokenAddress = AUSDC_ADDRESS_MAINNET; // Adresse des aave usdc aToken sur Mainnet

      // Deploy D4A contract
      const d4A = await hre.ethers.deployContract("D4A", [owner.address, poolAddress, usdcTokenAddress, aUsdcTokenAddress])
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
      const usdcBalanceOwnerBefore = await usdcToken.balanceOf(owner.address);
      console.log("On Fixture: ETH Owner balance before SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      console.log("On Fixture: USDC Owner balance before SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerBefore, 6));
    
      // Get Weth ERC20 token address
      const wethAddress = await uniswapRouter.WETH();

      // Swap 
      await uniswapRouter.swapExactETHForTokens(
                100, // Minimum slippage
                [wethAddress, usdcTokenAddress], // Swap path (WETH -> USDC)
                owner.address, // The address which will receive USDC
                Math.floor(Date.now() / 1000) + 60 * 20, // Trx must be confirmed in next 20 minutes
                { value: hre.ethers.parseEther('1') } // Amount to swap of 1 ETH
            )

      // Show balance after SWAP
      const usdcBalanceOwnerAfter = await usdcToken.balanceOf(owner.address);
      console.log("On Fixture: ETH Owner balance after SWAP:", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      console.log("On Fixture: USDC Owner balance after SWAP :", hre.ethers.formatUnits(usdcBalanceOwnerAfter, 6));


      return { d4A, owner, poolAddress, usdcTokenAddress, usdcToken, aUsdcToken, aavePool, uniswapRouter };
    }



    async function simpleDepositFixture() {
      
      const { d4A, owner, poolAddress, usdcTokenAddress, usdcToken, aUsdcToken, aavePool, uniswapRouter } = await loadFixture(deployContractFixture);
      
      // Envoyer de l'usdc au contrat
      const amountToDeposit = hre.ethers.parseUnits("1000", 6);  
      console.log("Montant d'usdc à déposer: ", amountToDeposit);

      // Approuver le contrat pour pouvoir transférer les tokens USDC
      await usdcToken.approve(d4A, amountToDeposit);

      // Vérifier la balance eth du owner avant depot
      console.log("On Fixture: ETH Owner balance before DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      // Vérifier la balance usdc du owner avant depot
      console.log("On Fixture: USDC Owner balance before DEPOSIT: ",  hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
      // Vérifier la balance usdc du contrat avant depot
      console.log("On Fixture: USDC Contract balance before DEPOSIT: ", hre.ethers.formatUnits(await usdcToken.balanceOf(d4A), 6));

      // Déposer les tokens dans le contrat
      const depositTx = await d4A.depositUSDC(amountToDeposit);
      await depositTx.wait();
      console.log("Dépôt d'usdt effectué avec succès pour owner en utilisant la fonction depositUSDC");

      // Vérifier la balance eth du owner avant depot
      console.log("On Fixture: ETH Owner balance after DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      // Vérifier que le owner a bien dépensé ses usdc
      console.log("On Fixture: USDC Owner balance after DEPOSIT: ", hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
      // Vérifier que le contrat a bien reçu des USDC
      console.log("On Fixture: USDC Contract balance after DEPOSIT: ", await d4A.getUserBalance(owner.address));

      return { d4A, owner, poolAddress, usdcTokenAddress, usdcToken, aUsdcToken, aavePool, uniswapRouter };

    }


  
    describe("Deployment", function() {

      it("should deploy the contract with the right onwer", async function() {
        const { d4A, owner, poolAddress, usdcTokenAddress } = await loadFixture(deployContractFixture);

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
        const { owner, usdcToken } = await loadFixture(deployContractFixture);

        // Vérifier que le owner a bien reçu des USDC après le swap
        const usdcBalanceOwner = await usdcToken.balanceOf(owner.address);
        console.log("USDC Owner balance: ", hre.ethers.formatUnits(usdcBalanceOwner, 6));

        // Le solde du owner en USDC doit avoir augmenté
        expect(usdcBalanceOwner).to.be.gt(0); 
      
      })


    })



    describe("USDC deposited on the contract", function() { 

      it('should USDC be on the contract', async function() {
        const { d4A, owner } = await loadFixture(simpleDepositFixture);

        // Vérifier que le contrat a bien reçu des USDC après le deposit
        const usdcBalanceOwnerOnContract = await d4A.getUserBalance(owner.address);
        console.log("USDC Owner balance on contract: ", hre.ethers.formatUnits(usdcBalanceOwnerOnContract, 6));

        // Le solde du owner en USDC doit avoir augmenté
        expect(usdcBalanceOwnerOnContract).to.be.gt(0); 
      
      })


    })



    describe("Deposit and withdraw on aave pool", function() { 

      it('should revert when amount sent is 0 ', async function() {
        const { d4A } = await loadFixture(simpleDepositFixture);

        await expect(d4A.supplyToAave(0))
                .to.be.revertedWith("Amount must be greater than 0");
      
      })


      it('should revert when amount sent is more than the wallet balance ', async function() {
        const { d4A } = await loadFixture(simpleDepositFixture);
        const amountToDeposit = hre.ethers.parseUnits("10000", 6); // 10000 usdc

        await expect(d4A.supplyToAave(amountToDeposit))
                .to.be.revertedWith("Insufficient funds"); 
      })


      it('should add liquidity to the AAVE V3 Pool', async function() {
        
        const { d4A, owner, aavePool, usdcToken, aUsdcToken } = await loadFixture(simpleDepositFixture);

        console.log("********************* SUPPLY TEST *********************");

        // Supply amount is 50 usdc
        const amountUSDC = hre.ethers.parseUnits("50", 6);
        console.log("Amount to supply: ", amountUSDC);
        
        console.log("///////////// Contract /////////////");
        const contractUsdcBalanceBeforeSupply = await usdcToken.balanceOf(d4A);
        const contractAUsdcBalanceBeforeSupply = await aUsdcToken.balanceOf(d4A);
        const contractEthBalanceBeforeSupply = await ethers.provider.getBalance(d4A);

        console.log("USDC Contract balance before SUPPLY: ", hre.ethers.formatUnits(contractUsdcBalanceBeforeSupply, 6));
        console.log("AUSDC Contract balance before SUPPLY: ", hre.ethers.formatUnits(contractAUsdcBalanceBeforeSupply, 8));
        console.log("ETH Contract balance before SUPPLY: ", hre.ethers.formatUnits(contractEthBalanceBeforeSupply, 18));
        
        console.log("///////////// Owner /////////////");
        const ownerUsdcBalanceBeforeSupply = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalanceBeforeSupply = await aUsdcToken.balanceOf(owner.address);
        const ownerUsdcBalanceOnTheContractBeforeSupply = await d4A.getUserBalance(owner.address);
        const ownerEthBalanceBeforeSupply = await ethers.provider.getBalance(owner.address);
        
        console.log("USDC Owner balance before SUPPLY: ", hre.ethers.formatUnits(ownerUsdcBalanceBeforeSupply, 6));
        console.log("USDC Owner balance on the contract before SUPPLY: ", hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractBeforeSupply, 6)); 
        console.log("AUSDC Owner balance before SUPPLY: ", await aUsdcToken.balanceOf(owner.address));
        console.log("ETH Owner balance before SUPPLY: ", hre.ethers.formatUnits(ownerEthBalanceBeforeSupply, 18));

        // USDC Contract balance before SUPPLY
        expect(contractUsdcBalanceBeforeSupply).to.equal(1000000000);
        // AUSDC Contract balance before SUPPLY
        expect(contractAUsdcBalanceBeforeSupply).to.equal(0);
        // ETH Contract balance before SUPPLY
        // expect(contractEthBalanceBeforeSupply).to.equal(0);


        // USDC Owner balance before SUPPLY
        expect(ownerUsdcBalanceBeforeSupply).to.equal(2931262574);
        // AUSDC Owner balance before SUPPLY
        expect(ownerAUsdcBalanceBeforeSupply).to.equal(0);
        // USDC Owner balance on the contract before SUPPLY
        expect(ownerUsdcBalanceOnTheContractBeforeSupply).to.equal(1000000000);

        // Do the supply
        await expect(d4A.supplyToAave(amountUSDC))
          .to.emit(d4A, "SuppliedToAave")
          .withArgs(owner.address, amountUSDC);

        console.log("********************* SUPPLY DONE *********************");
        console.log("Dépôt sur la pool effectué avec succès pour un montant de ", amountUSDC);
        
        const contractUsdcBalanceAfterSupply = await usdcToken.balanceOf(d4A);
        const contractAUsdcBalanceAfterSupply = await aUsdcToken.balanceOf(d4A);
        const contractEthBalanceAfterSupply = await ethers.provider.getBalance(d4A);
        
        console.log("///////////// Contract /////////////");
        console.log("USDC Contract balance after SUPPLY: ", hre.ethers.formatUnits(contractUsdcBalanceAfterSupply, 6));
        console.log("AUSDC Contract balance after SUPPLY: ", hre.ethers.formatUnits(contractAUsdcBalanceAfterSupply, 8));
        console.log("ETH Contract balance after SUPPLY: ", hre.ethers.formatUnits(contractEthBalanceAfterSupply, 18));

        const ownerUsdcBalanceAfterSupply = await usdcToken.balanceOf(owner.address);
        const ownerAUsdcBalancefterSupply = await aUsdcToken.balanceOf(owner.address);
        const ownerUsdcBalanceOnTheContractAfterSupply = await d4A.getUserBalance(owner.address);
        const ownerEthBalanceAfterSupply = await ethers.provider.getBalance(owner.address);

        console.log("///////////// Owner /////////////");
        console.log("USDC Owner balance after SUPPLY: ", hre.ethers.formatUnits(ownerUsdcBalanceAfterSupply, 6));
        console.log("AUSDC Contract balance after SUPPLY: ",  hre.ethers.formatUnits(ownerAUsdcBalancefterSupply, 8));
        console.log("USDC Owner balance on the contract after SUPPLY: ", hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractAfterSupply, 6));
        console.log("ETH Owner balance after SUPPLY: ", hre.ethers.formatUnits(ownerEthBalanceAfterSupply, 18));

        // USDC Contract balance before SUPPLY
        expect(contractUsdcBalanceAfterSupply).to.equal(950000000);
        // AUSDC Contract balance before SUPPLY
        expect(contractAUsdcBalanceBeforeSupply).to.equal(0);
        // ETH Contract balance before SUPPLY
        // expect(contractEthBalanceAfterSupply).to.equal(0);


        // USDC Owner balance before SUPPLY
        expect(ownerUsdcBalanceAfterSupply).to.equal(2931262574);
        // AUSDC Owner balance before SUPPLY
        expect(ownerAUsdcBalancefterSupply).to.equal(50000000);
        // USDC Owner balance on the contract before SUPPLY
        expect(ownerUsdcBalanceOnTheContractAfterSupply).to.equal(1000000000);

        console.log("********************* WITHDRAWAL TEST *********************");

        // Withdraw amount is 40 usdc
        const amountToWithdraw = hre.ethers.parseUnits("40", 6) // 40 USDC

        // Approuver le contrat pour pouvoir transférer les tokens AUSDC au contrat
        await aUsdcToken.approve(d4A, amountToWithdraw);

        await expect(d4A.withdrawFromAave(amountToWithdraw))
        .to.emit(d4A, "WithdrawnFromAave")
        .withArgs(owner.address, amountToWithdraw);

        console.log("********************* WITHDRAW DONE *********************");

        const contractUsdcBalanceAfterWithdraw = await usdcToken.balanceOf(d4A);
        const contractAUsdcBalanceAfterWithdraw = await aUsdcToken.balanceOf(d4A);
        const contractEthBalanceAfterWithdraw = await ethers.provider.getBalance(d4A);

        // console.log("USDC Contract balance after WITHDRAW: ", contractUsdcBalanceAfterWithdraw);
        console.log("///////////// Contract /////////////");
        console.log("USDC Contract balance after WITHDRAW: ", hre.ethers.formatUnits(contractUsdcBalanceAfterWithdraw, 6));
        console.log("AUSDC Contract balance on the pool after WITHDRAW: ", hre.ethers.formatUnits(contractAUsdcBalanceAfterWithdraw, 8));
        console.log("ETH Contract balance after WITHDRAW: ", hre.ethers.formatUnits(contractEthBalanceAfterWithdraw, 18));

        const ownerUsdcBalanceAfterWithdraw = await usdcToken.balanceOf(owner.address);
        const ownerUsdcBalanceOnTheContractAfterWithdraw = await d4A.getUserBalance(owner.address)
        const ownerAUsdcBalanceAfterWithdraw = await aUsdcToken.balanceOf(owner.address);
        const ownerEthBalanceAfterWithdraw = await ethers.provider.getBalance(owner.address)

        console.log("///////////// Owner /////////////");
        console.log("USDC Owner balance after WITHDRAW: ", hre.ethers.formatUnits(ownerUsdcBalanceAfterWithdraw, 6));
        console.log("AUSDC Owner balance on the pool after WITHDRAW: ",  hre.ethers.formatUnits(contractAUsdcBalanceAfterWithdraw, 8));
        console.log("USDC Owner balance on the contract after WITHDRAW: ", hre.ethers.formatUnits(ownerUsdcBalanceOnTheContractAfterWithdraw, 6));
        console.log("ETH Owner balance after WITHDRAW: ", hre.ethers.formatUnits(ownerEthBalanceAfterWithdraw, 18));

        console.log("Balance aUsdcToken owner : ", await aUsdcToken.balanceOf(owner.address));

        // USDC Contract balance before SUPPLY
        expect(contractUsdcBalanceAfterWithdraw).to.equal(950000000);
        // AUSDC Contract balance before SUPPLY
        expect(contractAUsdcBalanceAfterWithdraw).to.equal(0);
        // ETH Contract balance before SUPPLY
        // expect(contractEthBalanceAfterSupply).to.equal(0);


        // USDC Owner balance before SUPPLY
        expect(ownerUsdcBalanceAfterWithdraw).to.equal(2971262574);
        // AUSDC Owner balance before SUPPLY
        expect(ownerAUsdcBalanceAfterWithdraw).to.equal(10000000);
        // USDC Owner balance on the contract before SUPPLY
        expect(ownerUsdcBalanceOnTheContractAfterWithdraw).to.equal(1000000000);

        // expect(parseFloat(hre.ethers.formatUnits(contractAaveAccountDataAfterWithdraw.totalCollateralBase.toString(), 8))).to.be.closeTo(40, 1);

      })


    })
    
  });