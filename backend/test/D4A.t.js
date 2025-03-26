const { assert, expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { BigNumber } = require("hardhat");
const { bigint } = require("hardhat/internal/core/params/argumentTypes");
// const { convertToCurrencyDecimals } = require("@aave/core-v3/helpers/contracts-helpers");
  
  describe("D4A", function () {

    async function simpleDepositFixture() {

      const [owner] = await ethers.getSigners();
      const addressUser = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"; // Adresse du compte 13 sur la blockchain hardhat locale
      const poolAddress = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"; // Adresse Pool aave v3 sur Mainnet
      const usdcTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Adresse usdc sur Mainnet
      const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Adresse Routeur Uniswap v2 sur Mainnet
      const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/rPdEQ-9jD9nKjwpj-SbkBnjcO6aIZojR");

      // Déployer le contrat D4A
      const d4AContract = await hre.ethers.deployContract("D4A", [owner.address, poolAddress, usdcTokenAddress])

      // Swap ETH to USDC to have USDC on the owner wallet
      
      // Créer une instance de USDC
      const usdcToken = await ethers.getContractAt("IERC20", usdcTokenAddress);
      // console.log(usdcToken);
      // Récupérer le routeur uniswap v2 sur le réseau
      const uniswapRouter = await ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddress);
      
      // SWAP ETH to USDC
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

      // // Prepare amount 10 ETH to send to the contract
      // const depositAmount = hre.ethers.parseEther("10");
      // // Send
      // await owner.sendTransaction({
      //   to: d4AContract,
      //   value: depositAmount,
      // });

      // Envoyer de l'usdc au contrat
      const amountToDeposit = hre.ethers.parseUnits("1000", 6);  
      console.log("Montant d'usdc à déposer: ", amountToDeposit);

      // Approuver le contrat pour pouvoir transférer les tokens USDC
      await usdcToken.approve(d4AContract, amountToDeposit);

      // Vérifier la balance eth du owner avant depot
      console.log("On Fixture: ETH Owner balance before DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      // Vérifier la balance usdc du owner avant depot
      console.log("On Fixture: USDC Owner balance before DEPOSIT: ",  hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
      // Vérifier la balance usdc du contrat avant depot
      console.log("On Fixture: USDC Contract balance before DEPOSIT: ", hre.ethers.formatUnits(await usdcToken.balanceOf(d4AContract), 6));

      // Déposer les tokens dans le contrat
      const depositTx = await d4AContract.depositUSDC(amountToDeposit);
      await depositTx.wait();
      console.log("Dépôt d'usdt effectué avec succès pour owner en utilisant la fonction depositUSDC");

      // Vérifier la balance eth du owner avant depot
      console.log("On Fixture: ETH Owner balance after DEPOSIT: ", hre.ethers.formatEther(await ethers.provider.getBalance(owner.address)));
      // Vérifier que le owner a bien dépensé ses usdc
      console.log("On Fixture: USDC Owner balance after DEPOSIT: ", hre.ethers.formatUnits(await usdcToken.balanceOf(owner.address), 6));
      // Vérifier que le contrat a bien reçu des USDC
      console.log("On Fixture: USDC Contract balance after DEPOSIT: ", await d4AContract.getUserBalance(owner.address));
      



      return { d4AContract, owner, addressUser, poolAddress, usdcTokenAddress, usdcToken, provider, uniswapRouter }
    }
  
    describe("Deployment", function() {

      it("should deploy the contract with the right onwer", async function() {

        const { d4AContract, owner, poolAddress, usdcTokenAddress } = await loadFixture(simpleDepositFixture);

        const contractOwner = await d4AContract.owner();
        const contractPoolAddress = await d4AContract.poolAddress();
        const contractUsdcTokenAddress = await d4AContract.usdcTokenAddress();

        assert(contractOwner === owner.address);
        assert(contractPoolAddress === poolAddress);
        assert(contractUsdcTokenAddress === usdcTokenAddress);

      })
    })

    describe("Swap ETH to USDC", function() { 

      // it("should be ETH on the contract", async function () {

      //   const { d4AContract } = await loadFixture(simpleDepositFixture);
        
      //   // Vérifier que le owner a bien reçu des USDC après le swap
      //   const ethBalanceContract = await ethers.provider.getBalance(d4AContract);
      //   console.log("ETH Contract balance: ", ethBalanceContract)

      //   expect(ethBalanceContract).to.be.gt(0);
      
      // })

      it("should have USDC in owner wallet", async function () {

        const { owner, usdcToken } = await loadFixture(simpleDepositFixture);

        // Vérifier que le owner a bien reçu des USDC après le swap
        const usdcBalanceOwner = await usdcToken.balanceOf(owner.address);
        console.log("USDC Owner balance: ", hre.ethers.formatUnits(usdcBalanceOwner, 6));

        // Le solde du owner en USDC doit avoir augmenté
        expect(usdcBalanceOwner).to.be.gt(0); 
      
      })
    })

    describe("Deposit on the contract", function() { 

      it('should USDC be on the contract', async function() {

        const { d4AContract, owner } = await loadFixture(simpleDepositFixture);

        // Vérifier que le contrat a bien reçu des USDC après le deposit
        const usdcBalanceOwnerOnContract = await d4AContract.getUserBalance(owner.address);
        console.log("USDC Owner balance on contract: ", hre.ethers.formatUnits(usdcBalanceOwnerOnContract, 6));

        // Le solde du owner en USDC doit avoir augmenté
        expect(usdcBalanceOwnerOnContract).to.be.gt(0); 
      
      })
    })

    describe("Deposit on aave pool", function() { 
      it('should add liquidity to the AAVE V3 Pool', async function() {
        
        const { d4AContract, owner, account2, poolAddress, usdcTokenAddress, usdcToken, provider } = await loadFixture(simpleDepositFixture);

        const aavePool = await hre.ethers.getContractAt("IPool", poolAddress);

        // const amountUSDC = hre.ethers.parseUnits("4", 6); // 50 USDC
        const amountUSDC = 50000000; // 50 USDC

        console.log("Amount to supply: ", amountUSDC.toString());

        const ownerAaveAccountDataBefore= await aavePool.getUserAccountData(owner.address);
        const ownerUsdcBalanceBefore = await usdcToken.balanceOf(owner.address);
        const contractUsdcBalanceBefore = await usdcToken.balanceOf(d4AContract);
        

        // console.log("ETH Owner balance before SUPPLY: ",  await ethers.provider.getBalance(owner.address));
        // console.log("USDC Owner balance:", hre.ethers.formatUnits(ownerUsdcBalanceBefore, 6));
        console.log("USDC Contract balance before SUPPLY: ", contractUsdcBalanceBefore);
        console.log("USDC Contract balance before SUPPLY: ", hre.ethers.formatUnits(contractUsdcBalanceBefore, 6));
        console.log("USDC Owner balance on the pool before SUPPLY: ", hre.ethers.formatUnits(ownerAaveAccountDataBefore.totalCollateralBase.toString(), 6));
        console.log("USDC Owner balance on the contract before SUPPLY: ", await d4AContract.getUserBalance(owner.address)); 


        await expect(d4AContract.supplyToAave(owner.address, amountUSDC))
          .to.emit(d4AContract, "supplyToProtocol1")
          .withArgs(owner.address, amountUSDC);
        console.log("Dépôt sur la pool effectué avec succès pour un montant de ", amountUSDC);

        // expect(userDataBefore.totalCollateralBase).to.be.eq(100);
        
        const ownerAaveAccountDataAfter= await aavePool.getUserAccountData(owner.address);
        const ownerUsdcBalanceAfter = await hre.ethers.formatUnits(ownerAaveAccountDataAfter.totalCollateralBase.toString(), 6);
        const contractUsdcBalanceAfter = await usdcToken.balanceOf(d4AContract);
        
        // console.log("ETH Owner balance after SUPPLY: ",  await ethers.provider.getBalance(owner.address));
        // console.log("USDC Owner after: ", hre.ethers.formatUnits(ownerUsdcBalanceAfter, 6));
        console.log("USDC Contract balance after SUPPLY: ", contractUsdcBalanceAfter);
        console.log("USDC Contract balance after SUPPLY: ", hre.ethers.formatUnits(contractUsdcBalanceAfter, 6));
        console.log("USDC Contract balance after SUPPLY: ", ownerAaveAccountDataAfter.totalCollateralBase);
        console.log("USDC Owner balance on the pool after SUPPLY: ",  hre.ethers.formatUnits(ownerAaveAccountDataAfter.totalCollateralBase.toString(), 6));
        console.log("USDC Owner balance on the contract after SUPPLY: ", await d4AContract.getUserBalance(owner.address)); 


        expect(ownerAaveAccountDataAfter.totalCollateralBase)
              .to.be.closeTo(amountUSDC, 1);

      })
    })
    
  });