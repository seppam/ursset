// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Splits rent deposits pro rata across unit holders. Uses an accumulator, so cost does not
/// grow with the number of holders. The property token calls `settle` before any balance changes.
/// Units still held by the primary sale (unsold inventory) earn no rent.
contract RentDistributor is Ownable {
    using SafeERC20 for IERC20;

    uint256 private constant PRECISION = 1e18;

    IERC20 public immutable rentToken;
    IERC20 public token;
    address public inventory;

    uint256 public accPerUnit;
    uint256 public totalDeposited;
    uint256 public totalClaimed;

    mapping(address => uint256) public paid;
    mapping(address => uint256) public accrued;

    event RentDeposited(address indexed by, uint256 amount, uint256 circulatingUnits);
    event RentClaimed(address indexed holder, uint256 amount);

    error AlreadySetup();
    error NotToken();
    error NoCirculatingUnits();
    error NothingToClaim();

    constructor(IERC20 rentToken_, address owner_) Ownable(owner_) {
        rentToken = rentToken_;
    }

    function setup(IERC20 token_, address inventory_) external onlyOwner {
        if (address(token) != address(0)) revert AlreadySetup();
        token = token_;
        inventory = inventory_;
    }

    function circulating() public view returns (uint256) {
        return token.totalSupply() - token.balanceOf(inventory);
    }

    function depositRent(uint256 amount) external onlyOwner {
        uint256 units = circulating();
        if (units == 0) revert NoCirculatingUnits();
        rentToken.safeTransferFrom(msg.sender, address(this), amount);
        accPerUnit += (amount * PRECISION) / units;
        totalDeposited += amount;
        emit RentDeposited(msg.sender, amount, units);
    }

    function pending(address holder) public view returns (uint256) {
        if (holder == inventory) return 0;
        return accrued[holder] + (token.balanceOf(holder) * (accPerUnit - paid[holder])) / PRECISION;
    }

    function settle(address holder) external {
        if (msg.sender != address(token)) revert NotToken();
        _settle(holder);
    }

    function claim() external returns (uint256 amount) {
        _settle(msg.sender);
        amount = accrued[msg.sender];
        if (amount == 0) revert NothingToClaim();
        accrued[msg.sender] = 0;
        totalClaimed += amount;
        rentToken.safeTransfer(msg.sender, amount);
        emit RentClaimed(msg.sender, amount);
    }

    function _settle(address holder) internal {
        if (holder == inventory || holder == address(0)) return;
        accrued[holder] += (token.balanceOf(holder) * (accPerUnit - paid[holder])) / PRECISION;
        paid[holder] = accPerUnit;
    }
}
