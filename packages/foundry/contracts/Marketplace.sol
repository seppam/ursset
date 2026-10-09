// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { PropertyToken } from "./PropertyToken.sol";

/// @notice Peer-to-peer resale at a fixed price. Non-custodial: units stay in the seller's wallet
/// (and keep earning rent) until a buyer fills the listing. The seller approves this contract once.
contract Marketplace {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        uint256 units;
        uint256 unitPrice;
        bool active;
    }

    PropertyToken public immutable property;
    IERC20 public immutable payToken;

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed listingId, address indexed seller, uint256 units, uint256 unitPrice);
    event Cancelled(uint256 indexed listingId);
    event Sold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 units, uint256 cost);

    error ZeroAmount();
    error NotSeller();
    error NotActive();
    error InsufficientUnits();

    constructor(PropertyToken property_, IERC20 payToken_) {
        property = property_;
        payToken = payToken_;
    }

    function list(uint256 units, uint256 unitPrice) external returns (uint256 listingId) {
        if (units == 0 || unitPrice == 0) revert ZeroAmount();
        if (property.balanceOf(msg.sender) < units) revert InsufficientUnits();
        listingId = ++listingCount;
        listings[listingId] = Listing(msg.sender, units, unitPrice, true);
        emit Listed(listingId, msg.sender, units, unitPrice);
    }

    function cancel(uint256 listingId) external {
        Listing storage l = listings[listingId];
        if (l.seller != msg.sender) revert NotSeller();
        if (!l.active) revert NotActive();
        l.active = false;
        emit Cancelled(listingId);
    }

    function buy(uint256 listingId) external {
        Listing storage l = listings[listingId];
        if (!l.active) revert NotActive();
        if (property.balanceOf(l.seller) < l.units) revert InsufficientUnits();
        l.active = false;

        // The token rejects the transfer when the buyer is not verified.
        property.transferFrom(l.seller, msg.sender, l.units);
        uint256 cost = l.units * l.unitPrice;
        payToken.safeTransferFrom(msg.sender, l.seller, cost);
        emit Sold(listingId, msg.sender, l.seller, l.units, cost);
    }
}
