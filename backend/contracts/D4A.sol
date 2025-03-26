// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "hardhat/console.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IPool } from "@aave/core-v3/contracts/interfaces/IPool.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol"; // For ABI

contract D4A is ERC20, Ownable {

    // A sortir du contrat ?
    address public poolAddress; // = 0x7d2768DE32b0b02F0B9c292b13B7a4F2a21d6F6A;  // Aave V3 Pool address on Sepolia (example)
    address public usdcTokenAddress; // = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;  // Adresse de l'USDC sur Mainnet

    IPool private pool;
    IERC20 public usdcToken;

    uint256 private constant MAX_SUPPLY = 1000000; // Combien de max supply
    uint256 public constant ETH_PER_TOKEN = 0.001 ether; // 1 D4A = 0.001 ETH

    // Mapping pour stocker les dépôts des utilisateurs
    mapping(address => uint256) public userDeposits;

    // Events
    event usdcDeposited(address indexed account, uint amount);
    event supplyToProtocol1(address indexed user, uint256 amount);
    event usdcWithdrawn(address indexed asset, uint256 amount, address indexed user, uint256 withdrawnAmount);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);


    constructor(address _initialOwner, address _poolAddress, address _usdcTokenAddress) ERC20("Defi4AllToken", "D4A") Ownable(_initialOwner) {
        pool = IPool(_poolAddress);
        usdcToken = IERC20(_usdcTokenAddress);
        poolAddress = _poolAddress;
        usdcTokenAddress = _usdcTokenAddress;
    }

    ///@notice Allows a user to deposit usdc on the smart contract
    function depositUSDC(uint256 amount) external payable {

        require(amount > 0, "Not enough funds deposited");

        // Vérifier que l'utilisateur a suffisamment d'USDC
        uint256 userBalanceUsdc = usdcToken.balanceOf(msg.sender);
        require(userBalanceUsdc >= amount, "Insufficient balance");

        // Vérifier que l'utilisateur a autorisé le contrat à transférer les tokens
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "Allowance too low");

        // Effectuer le transfert de USDC vers ce contrat
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        // Mettre à jour le solde du dépôt de l'utilisateur
        userDeposits[msg.sender] += amount;

        // Émettre un événement pour notifier le dépôt
        emit Deposited(msg.sender, amount);
    }

        // Fonction de retrait de USDC
    function withdrawUSDC(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender] >= amount, "Insufficient deposit");

        // Mettre à jour le solde du dépôt de l'utilisateur avant le retrait
        userDeposits[msg.sender] -= amount;

        // Effectuer le transfert de USDC à l'utilisateur
        bool success = usdcToken.transfer(msg.sender, amount);
        require(success, "Transfer failed");

        // Émettre un événement pour notifier le retrait
        emit Withdrawn(msg.sender, amount);
    }

    // Fonction pour récupérer le solde de USDC du contrat
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    ///@notice Allows to get the amount of usdc the user has on the smart contract 
    ///@return The amount of usdc the user has on the smart contract
    function getUserBalance(address _address) external view returns(uint) {
        return userDeposits[_address];
    }


    /// @notice Permet de déposer des usdc sur la stratégie
    /// @dev Supplies a certain amount of usdc into the protocol
    /// @param _amount Le montant en wei à emprunter
    /// @param _address L'adresse qui va recevoir les aTokens
    function supplyToAave(address _address, uint256 _amount) public {

        require(_amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender] >= _amount, "Insufficient deposit");

        // Peut être remplacé en utilisant supplyWithPermit
        // Approve the Pool contract to transfer the tokens
        // On doit appeler la fonction approve du token usdc qu'on veut déposer 
        // pour permettre au contrat Aave de transferer le montant des tokens 
        // qu'on souhaite fournir en tant que liquidité.
        usdcToken.approve(poolAddress, _amount);

        // userDeposits[msg.sender] -= _amount;

        // Call the supply function on the Aave V3 Pool contract
        // Supplies a certain _amount of usdc into the protocol 
        // minting the same amount of corresponding aTokens and transferring them to the _address address
        // pool.supply(usdcTokenAddress, _amount, _address, 0);  // 0 for no referral code
        pool.supply(usdcTokenAddress, _amount, _address, 0);

        emit supplyToProtocol1(_address, _amount);

    }

    // Function to withdraw funds from Aave V3
    // function withdrawFromAave(uint256 _amount) external {
    //     require(_amount > 0, "Amount must be greater than zero");

    //     // Call the Aave V3 withdraw function
    //     // asset : L'adresse du token à retirer.
    //     // amount : Le montant à retirer.
    //     // to : L'adresse qui recevra les fonds retirés.
    //     uint256 withdrawnAmount = pool.withdraw(usdcTokenAddress, _amount, msg.sender);

    //     // Emit an event after withdrawal (optional)
    //     emit Withdrawn(usdcTokenAddress, _amount, msg.sender, withdrawnAmount);
    // }
}



