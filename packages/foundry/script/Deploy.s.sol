//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { KYCRegistry } from "../contracts/KYCRegistry.sol";
import { MockIDR } from "../contracts/MockIDR.sol";
import { PropertyToken } from "../contracts/PropertyToken.sol";
import { RentDistributor } from "../contracts/RentDistributor.sol";
import { PrimarySale } from "../contracts/PrimarySale.sol";
import { Marketplace } from "../contracts/Marketplace.sol";

/**
 * @notice Deploys the whole URSSET stack for one illustrative property (Kos Melati, Depok).
 * Rp3 billion split into 300,000 units at Rp10,000 each. The deployer is also the operator that
 * verifies wallets, mints test Rupiah and deposits rent.
 */
contract DeployScript is ScaffoldETHDeploy {
    uint256 constant TOTAL_UNITS = 300_000;
    uint256 constant UNIT_PRICE = 10_000;
    uint256 constant OPERATOR_FLOAT = 1_000_000_000;

    function run() external ScaffoldEthDeployerRunner {
        KYCRegistry kyc = new KYCRegistry(deployer);
        MockIDR idr = new MockIDR(deployer);
        PropertyToken token = new PropertyToken(
            "Kos Melati Depok",
            "MELATI",
            deployer,
            kyc,
            TOTAL_UNITS,
            "Depok, Jawa Barat",
            keccak256("URSSET illustrative legal documents v1"),
            "ipfs://illustrative-kos-melati"
        );
        RentDistributor distributor = new RentDistributor(idr, deployer);
        PrimarySale sale = new PrimarySale(token, idr, deployer, UNIT_PRICE);
        Marketplace market = new Marketplace(token, idr);

        distributor.setup(token, address(sale));
        token.setDistributor(distributor);
        kyc.setVerified(address(sale), true);
        token.mintInventory(address(sale));

        idr.setTrustedSpender(address(sale), true);
        idr.setTrustedSpender(address(market), true);
        idr.setTrustedSpender(address(distributor), true);
        idr.mint(deployer, OPERATOR_FLOAT);
    }
}
