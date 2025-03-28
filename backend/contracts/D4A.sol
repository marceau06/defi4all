// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { DataTypes } from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import { IAToken } from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IAToken.sol";


contract D4A is Ownable {

    // Mapping to save users deposits 
    mapping(address => uint256) public userDeposits;

    // Interfaces deployed contracts
    IPool public aavePool;
    IERC20 public usdcToken;
    IERC20 public ausdcToken;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event SuppliedToAave(address indexed user, uint256 amount);
    event WithdrawnFromAave(address indexed user, uint256 amount);

    // Constructor
    constructor(address _initialOwner, address _aavePoolAddress, address _usdcTokenAddress, address _ausdcTokenAddress) Ownable(_initialOwner) {
        aavePool = IPool(_aavePoolAddress);
        usdcToken = IERC20(_usdcTokenAddress);
        ausdcToken = IERC20(_ausdcTokenAddress);
    }

    /// @notice Allows the user to deposit USDC into the contract
    /// @dev Supplies a certain amount of usdc into the contract
    /// @param _amount The amount in wei to send
    function depositUSDC(uint256 _amount) external {

        require(_amount > 0, "Not enough funds deposited");
        // Vérifier que l'utilisateur a suffisamment d'USDC
        require(usdcToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        // usdcToken.approve(msg.sender, _amount);
    
        // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
        // uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        // require(allowance >= _amount, "Allowance too low");

        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Allowance too low");

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

        // Mettre à jour le solde du dépôt de l'utilisateur avant le retrait
        userDeposits[msg.sender] -= _amount;

        emit Withdrawn(msg.sender, _amount);
    }

    /// @notice Allows the user to let the contract supply USDC into the aave pool
    /// @dev Supplies a certain amount of usdc into the aave pool
    /// @param _amount The amount in wei to supply
    function supplyToAave(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(usdcToken.balanceOf(msg.sender) >= _amount, "Insufficient funds");
        
        // Approve the aavePool contract to transfer the tokens
        usdcToken.approve(address(aavePool), _amount);

        // Supplies a certain _amount of usdc into the Aave V3 aavePool contract
        aavePool.supply(address(usdcToken), _amount, msg.sender, 0);

        emit SuppliedToAave(msg.sender, _amount);
    }

    /// @notice Allows the user to let the contract withdraw USDC from the aave pool
    /// @dev Withdraw a certain amount of usdc from the aave pool
    /// @param _amount The amount in wei to withdraw
    function withdrawFromAave(uint256 _amount) external {
        require(_amount > 0, "Amount to withdraw must be greater than 0");
        require(ausdcToken.balanceOf(msg.sender) >= _amount, "Insufficient balance of aUsdc");

        ausdcToken.approve(msg.sender, _amount);
    
        // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
        uint256 allowance = ausdcToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Allowance too low");

        // Effectuer le transfert de Aave USDC vers ce contrat
        ausdcToken.transferFrom(msg.sender, address(this), _amount);

        // Effectuer le retrait de USDC 
        aavePool.withdraw(address(usdcToken), _amount, msg.sender);

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
















