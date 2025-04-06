// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import { IUniswapV2Factory } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import { DataTypes } from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import { IAToken } from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IAToken.sol";

contract D4A is ERC20, Ownable {

    // Constants
    // Number of seconds in a year
    uint256 private constant SECONDS_IN_YEAR = 365 days;

    // Usdc minimum supply amount in wei (10 USDC) the user has to deposit to earn D4A tokens rewards
    uint256 private constant MINIMUM_SUPPLY = 1000000;

    // Struct to save user last deposit or withdraw time, usdc balance on the contract and balance of mintable tokens
    struct Account {
        uint balance;
        uint lastDepositOrWithdraw;
        uint mintableTokens;
    }

    // Mapping to save users accounts 
    mapping(address => Account) public userDeposits;

    // Interfaces deployed contracts
    // Aave V3 Pool contract
    IPool public aavePool;
    // USDC token contract
    IERC20 public usdcToken;
    // Aave USDC token contract
    IERC20 public ausdcToken;
    // Uniswap V2 Router contract
    IUniswapV2Router02 public uniswapV2Router02;

    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp); // Use timestamp to have transaction history
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event SuppliedToAave(address indexed user, uint256 amount, uint256 timestamp);
    event WithdrawnFromAave(address indexed user, uint256 amount, uint256 timestamp);
    event Minted(address indexed user, uint256 amount);
    event Burned(address indexed user, uint256 amount);

    // Constructor
    constructor(address _initialOwner, address _aavePoolAddress, address _usdcTokenAddress, address _ausdcTokenAddress, address _uniswapV2Router02) 
    ERC20("D4AToken", "D4A") 
    Ownable(_initialOwner) {
        aavePool = IPool(_aavePoolAddress);
        usdcToken = IERC20(_usdcTokenAddress);
        ausdcToken = IERC20(_ausdcTokenAddress);
        uniswapV2Router02 = IUniswapV2Router02(_uniswapV2Router02);
    }

    /// @notice Allows the user to deposit USDC into the contract
    /// @dev Supplies a certain amount of usdc into the contract
    /// @param _amount The amount in wei to send
    function depositUSDC(uint256 _amount) external {
        // Check that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");

        // Check that the user has authorized the contract to transfer the tokens
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Allowance too low");

        // We are already testing the allowance, so not really useful to check the balance amount
        // Check that the user has enough USDC
        // require(usdcToken.balanceOf(msg.sender) >= _amount, "Insufficient funds");

        // Update rewards
        userDeposits[msg.sender].mintableTokens += calculateRewards();

        // Set the last deposit time
        userDeposits[msg.sender].lastDepositOrWithdraw = block.timestamp;

        // Update user deposit balance
        userDeposits[msg.sender].balance += _amount;

        // Transfer USDC to this contract
        usdcToken.transferFrom(msg.sender, address(this), _amount);

        // Emit an event to notify the deposit
        emit Deposited(msg.sender, _amount, block.timestamp);
    }

    /// @notice Allows the user to withdraw USDC from contract
    /// @dev Withdraw a certain amount of usdc from contract
    /// @param _amount The amount in wei to withdraw
    function withdrawUSDC(uint256 _amount) external {
        // Check that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");
        // Check that the user has enough USDC on the contract
        require(userDeposits[msg.sender].balance >= _amount, "Insufficient funds");

        // Update mintable tokens amount
        userDeposits[msg.sender].mintableTokens += calculateRewards();

        // Update the last withdraw time
        userDeposits[msg.sender].lastDepositOrWithdraw = block.timestamp;

        // Update user deposit balance
        userDeposits[msg.sender].balance -= _amount;

        // Transfer USDC to the user
        usdcToken.transfer(msg.sender, _amount);
        
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    /// @notice Allows the user to let the contract supply USDC into the aave pool
    /// @dev Supplies a certain amount of usdc into the aave pool
    /// @param _amount The amount in wei to supply
    function supplyToAave(uint256 _amount) external {
        // Check that the amount is greater than 0
        require(_amount >= MINIMUM_SUPPLY, "Supply too small (min 10 USDC)");

        // Check that the user has authorized the contract to transfer the tokens
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Allowance too low");

        // We are already testing the allowance, so not really useful to check the balance amount
        // Check that the user has enough USDC
        // require(usdcToken.balanceOf(msg.sender) >= _amount, "Insufficient funds");

        // 0.5% fees retained in the contract (treasury)
        // Calculate the fees amount
        uint256 feesAmount = (_amount * 5) / 1000;
        
        // Deposit usdc to repay the contract
        usdcToken.transferFrom(msg.sender, address(this), _amount);

        // Approve the aavePool contract to transfer the tokens
        usdcToken.approve(address(aavePool), _amount);

        // Supplies _amount of usdc into the Aave V3 aavePool contract
        aavePool.supply(address(usdcToken), _amount - feesAmount, msg.sender, 0);

        emit SuppliedToAave(msg.sender, _amount, block.timestamp);
    }

    /// @notice Allows the user to let the contract withdraw USDC from the aave pool
    /// @dev Withdraw a certain amount of usdc from the aave pool
    /// @param _amount The amount in wei to withdraw
    function withdrawFromAave(uint256 _amount) external {
        // Check that the amount is greater than 0
        require(_amount > 0, "Amount must be greater than 0");
        // Check that the user has enough AAVE USDC
        require(ausdcToken.balanceOf(msg.sender) >= _amount, "Insufficient balance of aUsdc");
        // Check that the user has authorized the contract to transfer the tokens
        uint256 allowance = ausdcToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Allowance too low");

        // Transfer Aave USDC to this contract
        ausdcToken.transferFrom(msg.sender, address(this), _amount);

        // Withdraw USDC from the pool  
        aavePool.withdraw(address(usdcToken), _amount, msg.sender);

        emit WithdrawnFromAave(msg.sender, _amount, block.timestamp);
    }


    ///@notice Calculate rewards 
    ///@dev Calculate rewards based on deposit and elapsed time
    function calculateRewards() public view returns (uint256) {
        Account memory userAccount = userDeposits[msg.sender];
        if (userAccount.lastDepositOrWithdraw == 0 || block.timestamp <= userAccount.lastDepositOrWithdraw + 60 || userAccount.balance < MINIMUM_SUPPLY) {
            return 0;
        }
        uint256 timeElapsed = block.timestamp - userAccount.lastDepositOrWithdraw;
        return (userAccount.balance * timeElapsed * 15) / (SECONDS_IN_YEAR * 100);
    }

    ///@notice Allows to mint D4A token
    ///@dev Mint an amount of D4A token corresponding to the accumulated mintable tokens and the last rewards calculated 
    function mintTokens() public {
        Account storage userAccount = userDeposits[msg.sender];
        // Calculate rewards
        uint256 rewards = calculateRewards();

        // Add rewards to mintable tokens
        uint256 mintable = rewards + userAccount.mintableTokens;

        // Ensure there are tokens to mint
        require(mintable > 0, "No mintable tokens available");

        // Update the last deposit time to avoid unnecessary recalculations
        userAccount.lastDepositOrWithdraw = block.timestamp;

        // Reset mintable tokens before minting to save gas
        userAccount.mintableTokens = 0;

        // Mint tokens
        _mint(msg.sender, mintable);

        emit Minted(msg.sender, mintable);
    }

    ///@notice Allows the owner to burn D4A token
    function burn(uint256 _amount) external onlyOwner {
        _burn(msg.sender, _amount);
        emit Burned(msg.sender, _amount);
    }

    ///@notice Allows to get the amount of usdc on the smart contract 
    ///@return The amount of usdc on the smart contract
    function getUsdcBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    ///@notice Allows to get the amount of usdc the user has deposit on the smart contract 
    ///@return The amount of usdc the user has deposit on the smart contract
    function getUserBalance() external view returns(uint256) {
        return userDeposits[msg.sender].balance;
    }

    ///@notice Allows to get the amount of mintable D4A tokens the user has earned
    ///@return The amount of D4A tokens the user can mint
    function getMintableTokens() public view returns(uint256) {
        return userDeposits[msg.sender].mintableTokens;
    }

    ///@notice Allows to get the amount of usdc the user has deposit on the smart contract 
    ///@return The amount of usdc the user has deposit on the smart contract
    function getTotalRewards() external view returns(uint256) {
        return userDeposits[msg.sender].mintableTokens + calculateRewards();
    }

    ///@notice Overload the decimals function to set 6 decimals
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
}
















