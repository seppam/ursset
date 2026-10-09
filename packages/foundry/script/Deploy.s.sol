//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { KYCRegistry } from "../contracts/KYCRegistry.sol";
import { MockIDR } from "../contracts/MockIDR.sol";
import { PropertyFactory } from "../contracts/PropertyFactory.sol";

/**
 * @notice Deploys the shared pieces (KYC registry, test Rupiah, property factory) and lists two
 * illustrative properties. More properties are listed later through the operator page.
 * The deployer is also the operator that verifies wallets, mints test Rupiah and deposits rent.
 *
 * METADATA_BASE (env, default the live app) is where the property JSON and photos are hosted.
 */
contract DeployScript is ScaffoldETHDeploy {
    uint256 constant UNIT_PRICE = 10_000;
    uint256 constant OPERATOR_FLOAT = 1_000_000_000;

    function run() external ScaffoldEthDeployerRunner {
        string memory base = vm.envOr("METADATA_BASE", string("https://ursset.vercel.app"));

        KYCRegistry kyc = new KYCRegistry(deployer);
        MockIDR idr = new MockIDR(deployer);
        PropertyFactory factory = new PropertyFactory(kyc, idr, deployer);
        kyc.setRegistrar(address(factory), true);
        idr.setRegistrar(address(factory), true);
        idr.mint(deployer, OPERATOR_FLOAT);

        factory.createProperty(
            PropertyFactory.Params({
                name: "Kos Melati Depok",
                symbol: "MELATI",
                location: "Depok, Jawa Barat",
                totalUnits: 300_000,
                unitPrice: UNIT_PRICE,
                documentHash: keccak256("URSSET illustrative legal documents v1: Kos Melati"),
                metadataURI: string.concat(base, "/properties/melati.json"),
                treasury: address(0)
            })
        );
        factory.createProperty(
            PropertyFactory.Params({
                name: "Kos Dago Asri Bandung",
                symbol: "DAGO",
                location: "Bandung, Jawa Barat",
                totalUnits: 200_000,
                unitPrice: UNIT_PRICE,
                documentHash: keccak256("URSSET illustrative legal documents v1: Kos Dago Asri"),
                metadataURI: string.concat(base, "/properties/dago.json"),
                treasury: address(0)
            })
        );
    }
}
