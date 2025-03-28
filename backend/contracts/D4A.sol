// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
// import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol"; // For ABI
import { DataTypes } from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol"; // For ABI
import { IAToken } from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IAToken.sol";


contract D4A is Ownable {

    // Mapping to save users deposits 
    mapping(address => uint256) public userDeposits;

    address public poolAddress;
    address public usdcTokenAddress;

    // Interfaces deployed contracts
    IPool public pool;
    IERC20 public usdcToken;
    IERC20 public ausdcToken;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event SuppliedToAave(address indexed user, uint256 amount);
    event WithdrawnFromAave(address indexed user, uint256 amount);

    // Constructor
    constructor(address _initialOwner, address _poolAddress, address _usdcTokenAddress, address _ausdcTokenAddress) Ownable(_initialOwner) {
        pool = IPool(_poolAddress);
        usdcToken = IERC20(_usdcTokenAddress);
        ausdcToken = IERC20(_ausdcTokenAddress);
        poolAddress = _poolAddress;
        usdcTokenAddress = _usdcTokenAddress;
    }

    /// @notice Allows the user to deposit USDC into the contract
    /// @dev Supplies a certain amount of usdc into the contract
    /// @param _amount The amount in wei to send
    function depositUSDC(uint256 _amount) external payable {

        require(_amount > 0, "Not enough funds deposited");
        // Vérifier que l'utilisateur a suffisamment d'USDC
        require(usdcToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        // usdcToken.approve(msg.sender, _amount);
    
        // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
        // uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        // require(allowance >= _amount, "Allowance too low");

        uint256 allowance2 = usdcToken.allowance(msg.sender, address(this));
        uint256 allowance1 = usdcToken.allowance(address(this), msg.sender);
        console.log("Allowance 1 :", allowance1);
        console.log("Allowance 2 :", allowance2);

        // Effectuer le transfert de USDC vers ce contrat
        usdcToken.transferFrom(msg.sender, address(this), _amount);
        // bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        // require(success, "Transfer failed");

        // Mettre à jour le solde du dépôt de l'utilisateur
        userDeposits[msg.sender] += _amount;

        // Émettre un événement pour notifier le dépôt
        emit Deposited(msg.sender, _amount);
    }

    /// @notice Allows the user to withdraw USDC from contract
    /// @dev Withdraw a certain amount of usdc from contract
    /// @param _amount The amount in wei to withdraw
    function withdrawUSDC(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender] >= _amount, "Insufficient deposit");
        
        // usdcToken.approve(msg.sender, _amount);



        // Effectuer le transfert de USDC à l'utilisateur
        usdcToken.transfer(msg.sender, _amount);
        // bool success = usdcToken.transfer(msg.sender, amount);
        // require(success, "Transfer failed");

        // Mettre à jour le solde du dépôt de l'utilisateur avant le retrait
        userDeposits[msg.sender] -= _amount;

        // Émettre un événement pour notifier le retrait
        emit Withdrawn(msg.sender, _amount);
    }

    /// @notice Allows the user to deposit USDC into the strategy
    /// @dev Supplies a certain amount of usdc into the protocol
    /// @param _amount The amount in wei to provide
    function supplyToAave(uint256 _amount) external {

        require(_amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender] >= _amount, "Insufficient funds");

        // Peut être remplacé en utilisant supplyWithPermit
        // Obligatoire quand on interagit avec AAVE
        // Approve the Pool contract to transfer the tokens
        // On doit appeler la fonction approve du token usdc qu'on veut déposer 
        // pour permettre au contrat Aave de transferer le montant des tokens 
        // qu'on souhaite fournir en tant que liquidité.
        // usdcToken.approve(msg.sender, _amount);

        // uint256 allowance = usdcToken.allowance(msg.sender, poolAddress);
        // require(allowance >= _amount, "Allowance too low");

        usdcToken.approve(poolAddress, _amount);


        // Call the supply function on the Aave V3 Pool contract
        // Supplies a certain _amount of usdc into the protocol 
        // minting the same amount of corresponding aTokens and transferring them to the _address address
        // pool.supply(usdcTokenAddress, _amount, _address, 0);  // 0 for no referral code
        // pool.supply(usdcTokenAddress, _amount, address(this), 0);
        pool.supply(usdcTokenAddress, _amount, msg.sender, 0);

        // pool.setUserUseReserveAsCollateral(usdcTokenAddress, true);

        emit SuppliedToAave(msg.sender, _amount);

    }

    // Function to withdraw funds from Aave V3
    /// @notice Allows the contract to withdraw USDC from Aave V3 pool
    /// @dev Withdraw a certain amount of usdc from Aave V3 pool
    /// @param _amount The amount in wei to withdraw
    // function withdrawFromAave(address ad, uint256 _amount) external {
    //     require(_amount > 0, "Amount must be greater than zero");

    //     // address addressAUsdc = pool.getReserveData(usdcTokenAddress).aTokenAddress;
    //     // console.log("Expected USDC Address from Aave:", addressAUsdc);

    //     console.log("Owner: ", ausdcToken.balanceOf(msg.sender));
    //     console.log("Contract: ", ausdcToken.balanceOf(address(this)));
    //     console.log("Amount: ", _amount);

    //     // (DataTypes.ReserveData memory reserveData) = pool.getReserveData(usdcTokenAddress);
    //     // console.log("USDC Reserve Status:", reserveData.configuration.data);

    //     // // Vérifier que msg.sender a bien des aUSDC
    //     // uint256 aUSDCBalance = aUSDCToken.balanceOf(msg.sender);
    //     // console.log("aUSDC Balance before withdraw:", aUSDCBalance);
    //     // require(aUSDCBalance >= _amount, "Not enough aUSDC to withdraw");

    //     ausdcToken.approve(msg.sender, _amount);
    //     ausdcToken.approve(address(this), _amount);
    //     ausdcToken.approve(ad, _amount);
        
    //     // usdcToken.approve(msg.sender, _amount);
    //     // usdcToken.approve(address(this), _amount);


    //     // uint256 allowance = aUSDCToken.allowance(msg.sender, address(this));
    //     // console.log("Allowance:", allowance);
    

    //     // // Transfert des USDC du user vers le contrat (nécessite un approve)
    //     // bool success = aUSDCToken.transferFrom(msg.sender, address(this), _amount);

    //     // require(success, "Echec du transfert");

    
    //     // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
    //     // uint256 allowance = usdcToken.allowance(msg.sender, address(this));
    //     // require(allowance >= _amount, "Allowance too low");

    //     require(ausdcToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");
    //     console.log("Balance in contract ", ausdcToken.balanceOf(msg.sender));
    
    //     // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
    //     // uint256 allowance = usdcToken.allowance(msg.sender, address(this));
    //     // require(allowance >= _amount, "Allowance too low");

    //     // Effectuer le transfert de USDC vers ce contrat
    //     // ausdcToken.transferFrom(ad, address(this), _amount);
    //     usdcToken.transferFrom(msg.sender, address(this), _amount);


    //     // uint256 aUSDCBalanceC = IERC20(expectedUSDC).balanceOf(address(this));
    //     // console.log("aUSDC Balance before withdraw:", aUSDCBalanceC);
    //     // require(aUSDCBalanceC >= _amount, "Not enough aUSDC to withdraw");
               
    //     // pool.withdraw(usdcTokenAddress, _amount, address(this));
    //     // pool.withdraw(usdcTokenAddress, _amount, msg.sender);



    //     // // Emit an event after withdrawal (optional)
    //     // emit WithdrawnFromAave(msg.sender, _amount);

    // }



    function withdrawFromAave(uint256 _amount) external payable {

        require(_amount > 0, "Not enough funds deposited");
        // Vérifier que l'utilisateur a suffisamment d'USDC
        // require(usdcToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        ausdcToken.approve(msg.sender, _amount);
    
        // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
        uint256 allowance2 = ausdcToken.allowance(msg.sender, address(this));
        uint256 allowance1 = ausdcToken.allowance(address(this), msg.sender);
        console.log("Allowance 1 :", allowance1);
        console.log("Allowance 2 :", allowance2);
        
        // require(allowance >= _amount, "Allowance too low");

        // Effectuer le transfert de USDC vers ce contrat
        ausdcToken.transferFrom(msg.sender, address(this), _amount);
        // ausdcToken.transfer(msg.sender, 10000000);

        pool.withdraw(usdcTokenAddress, _amount, msg.sender);

        // IAToken aToken = IAToken(0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c);
        // aToken.transferOnLiquidation(msg.sender, address(this), 10000000);

        // ausdcToken._transfer(msg.sender, address(this), 10);
        
        
        // bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        // require(success, "Transfer failed");

        // Mettre à jour le solde du dépôt de l'utilisateur
        // userDeposits[msg.sender] += _amount;

        // Émettre un événement pour notifier le dépôt
        emit WithdrawnFromAave(msg.sender, _amount);
    }




    ///@notice Allows to get the amount of usdc on the smart contract 
    ///@return The amount of usdc on the smart contract
    function getUsdcBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    ///@notice Allows to get the amount of usdc the user has deposit on the smart contract 
    ///@return The amount of usdc the user has deposit on the smart contract
    function getUserBalance(address _address) external view returns(uint) {
        return userDeposits[_address];
    }
}
















