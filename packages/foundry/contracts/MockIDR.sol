// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Test Rupiah (tIDR). Simulates a balance topped up through a licensed payment provider.
/// 1 token = Rp1, zero decimals. Testnet only.
/// @dev Trusted spenders (the sale and marketplace contracts) skip the approve step so a user buys
/// in a single transaction. This shortcut exists only because this is a test token.
contract MockIDR is ERC20, Ownable {
    mapping(address => bool) public trustedSpender;
    mapping(address => bool) public registrar;

    error NotAuthorized();

    constructor(address owner_) ERC20("Test Rupiah", "tIDR") Ownable(owner_) { }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function setRegistrar(address account, bool allowed) external onlyOwner {
        registrar[account] = allowed;
    }

    function setTrustedSpender(address spender, bool trusted) external {
        if (msg.sender != owner() && !registrar[msg.sender]) revert NotAuthorized();
        trustedSpender[spender] = trusted;
    }

    function allowance(address owner_, address spender) public view override returns (uint256) {
        if (trustedSpender[spender]) return type(uint256).max;
        return super.allowance(owner_, spender);
    }

    function _spendAllowance(address owner_, address spender, uint256 value) internal override {
        if (trustedSpender[spender]) return;
        super._spendAllowance(owner_, spender, value);
    }
}
