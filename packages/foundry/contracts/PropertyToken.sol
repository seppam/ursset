// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { KYCRegistry } from "./KYCRegistry.sol";
import { RentDistributor } from "./RentDistributor.sol";

/// @notice Fractional units of one rental property. Every transfer needs both sides verified in the
/// KYCRegistry, so compliance is enforced by the contract, not by the app.
contract PropertyToken is ERC20, Ownable {
    KYCRegistry public immutable kyc;
    RentDistributor public distributor;

    uint256 public immutable totalUnits;
    string public location;
    bytes32 public documentHash;
    string public documentURI;
    bool public inventoryMinted;

    error NotVerified(address account);
    error AlreadyMinted();
    error DistributorAlreadySet();

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        KYCRegistry kyc_,
        uint256 totalUnits_,
        string memory location_,
        bytes32 documentHash_,
        string memory documentURI_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        kyc = kyc_;
        totalUnits = totalUnits_;
        location = location_;
        documentHash = documentHash_;
        documentURI = documentURI_;
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function setDistributor(RentDistributor distributor_) external onlyOwner {
        if (address(distributor) != address(0)) revert DistributorAlreadySet();
        distributor = distributor_;
    }

    /// @notice Mints the whole supply once into the sale contract, which sells it to investors.
    function mintInventory(address to) external onlyOwner {
        if (inventoryMinted) revert AlreadyMinted();
        inventoryMinted = true;
        _mint(to, totalUnits);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && !kyc.isVerified(from)) revert NotVerified(from);
        if (to != address(0) && !kyc.isVerified(to)) revert NotVerified(to);
        if (address(distributor) != address(0)) {
            if (from != address(0)) distributor.settle(from);
            if (to != address(0)) distributor.settle(to);
        }
        super._update(from, to, value);
    }
}
