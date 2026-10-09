// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { KYCRegistry } from "./KYCRegistry.sol";
import { MockIDR } from "./MockIDR.sol";
import { PropertyToken } from "./PropertyToken.sol";
import { RentDistributor } from "./RentDistributor.sol";
import { PrimarySale } from "./PrimarySale.sol";
import { Marketplace } from "./Marketplace.sol";

/// @notice Lists a new rental property in one transaction: deploys its token, sale, rent distributor and
/// marketplace, wires them together, verifies the sale contract and mints the unit inventory. The operator
/// ends up owning the token and the distributor, so it can deposit rent.
/// @dev The photos and description live offchain; `metadataURI` points to that JSON and is stored in the token.
contract PropertyFactory is Ownable {
    struct Property {
        address token;
        address sale;
        address distributor;
        address market;
        address creator;
        string metadataURI;
    }

    struct Params {
        string name;
        string symbol;
        string location;
        uint256 totalUnits;
        uint256 unitPrice;
        bytes32 documentHash;
        string metadataURI;
        address treasury;
    }

    KYCRegistry public immutable kyc;
    MockIDR public immutable idr;

    Property[] public properties;

    event PropertyCreated(
        uint256 indexed id, address indexed token, address sale, address distributor, address market, string metadataURI
    );

    error ZeroUnits();

    constructor(KYCRegistry kyc_, MockIDR idr_, address owner_) Ownable(owner_) {
        kyc = kyc_;
        idr = idr_;
    }

    function propertyCount() external view returns (uint256) {
        return properties.length;
    }

    function createProperty(Params calldata p) external onlyOwner returns (uint256 id) {
        if (p.totalUnits == 0 || p.unitPrice == 0) revert ZeroUnits();
        address operator = owner();
        address treasury = p.treasury == address(0) ? operator : p.treasury;

        PropertyToken token =
            new PropertyToken(p.name, p.symbol, address(this), kyc, p.totalUnits, p.location, p.documentHash, p.metadataURI);
        RentDistributor distributor = new RentDistributor(idr, address(this));
        PrimarySale sale = new PrimarySale(token, idr, treasury, p.unitPrice);
        Marketplace market = new Marketplace(token, idr);

        distributor.setup(token, address(sale));
        token.setDistributor(distributor);
        kyc.setVerified(address(sale), true);
        token.mintInventory(address(sale));

        idr.setTrustedSpender(address(sale), true);
        idr.setTrustedSpender(address(market), true);
        idr.setTrustedSpender(address(distributor), true);

        token.transferOwnership(operator);
        distributor.transferOwnership(operator);

        id = properties.length;
        properties.push(Property(address(token), address(sale), address(distributor), address(market), msg.sender, p.metadataURI));
        emit PropertyCreated(id, address(token), address(sale), address(distributor), address(market), p.metadataURI);
    }
}
