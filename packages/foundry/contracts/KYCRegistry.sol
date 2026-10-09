// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Allow-list of wallets that passed identity checks. Only the address and a boolean live
/// onchain; no personal data is ever stored here.
contract KYCRegistry is Ownable {
    mapping(address => bool) private _verified;
    /// @notice Trusted contracts (the property factory) that may verify the contracts they create.
    mapping(address => bool) public registrar;

    error NotAuthorized();

    event VerificationSet(address indexed account, bool verified);

    constructor(address owner_) Ownable(owner_) { }

    function setRegistrar(address account, bool allowed) external onlyOwner {
        registrar[account] = allowed;
    }

    function setVerified(address account, bool verified) external {
        if (msg.sender != owner() && !registrar[msg.sender]) revert NotAuthorized();
        _verified[account] = verified;
        emit VerificationSet(account, verified);
    }

    function isVerified(address account) external view returns (bool) {
        return _verified[account];
    }
}
