// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { KYCRegistry } from "../contracts/KYCRegistry.sol";
import { MockIDR } from "../contracts/MockIDR.sol";
import { PropertyFactory } from "../contracts/PropertyFactory.sol";
import { PropertyToken } from "../contracts/PropertyToken.sol";
import { RentDistributor } from "../contracts/RentDistributor.sol";
import { PrimarySale } from "../contracts/PrimarySale.sol";
import { Marketplace } from "../contracts/Marketplace.sol";

contract FactoryTest is Test {
    KYCRegistry kyc;
    MockIDR idr;
    PropertyFactory factory;

    address operator = makeAddr("operator");
    address dina = makeAddr("dina");
    address budi = makeAddr("budi");
    address attacker = makeAddr("attacker");

    function setUp() public {
        vm.startPrank(operator);
        kyc = new KYCRegistry(operator);
        idr = new MockIDR(operator);
        factory = new PropertyFactory(kyc, idr, operator);
        kyc.setRegistrar(address(factory), true);
        idr.setRegistrar(address(factory), true);
        idr.mint(operator, 1_000_000_000);
        kyc.setVerified(dina, true);
        kyc.setVerified(budi, true);
        idr.mint(dina, 1_000_000);
        idr.mint(budi, 1_000_000);
        vm.stopPrank();
    }

    function _params(string memory name, uint256 units) internal pure returns (PropertyFactory.Params memory) {
        return PropertyFactory.Params({
            name: name,
            symbol: "KOS",
            location: "Depok",
            totalUnits: units,
            unitPrice: 10_000,
            documentHash: keccak256("docs"),
            metadataURI: "https://example.com/p.json",
            treasury: address(0)
        });
    }

    function _create(string memory name, uint256 units)
        internal
        returns (PropertyToken token, PrimarySale sale, RentDistributor dist, Marketplace market)
    {
        vm.prank(operator);
        uint256 id = factory.createProperty(_params(name, units));
        (address t, address s, address d, address m,,) = factory.properties(id);
        return (PropertyToken(t), PrimarySale(s), RentDistributor(d), Marketplace(m));
    }

    function test_CreatesAndWiresAProperty() public {
        (PropertyToken token, PrimarySale sale, RentDistributor dist, Marketplace market) = _create("Kos A", 1000);
        assertEq(factory.propertyCount(), 1);
        assertEq(token.owner(), operator);
        assertEq(dist.owner(), operator);
        assertEq(token.balanceOf(address(sale)), 1000);
        assertEq(sale.unitsLeft(), 1000);
        assertEq(address(token.distributor()), address(dist));
        assertEq(address(market.property()), address(token));
        assertTrue(kyc.isVerified(address(sale)));
        assertEq(token.documentURI(), "https://example.com/p.json");
    }

    function test_BuyWorksWithoutExtraSetup() public {
        (PropertyToken token, PrimarySale sale,,) = _create("Kos A", 1000);
        vm.prank(dina);
        sale.buy(5, 0);
        assertEq(token.balanceOf(dina), 5);
        assertEq(idr.balanceOf(operator), 1_000_000_000 + 50_000); // treasury defaults to the operator
    }

    function test_OperatorCanDepositRentAfterCreation() public {
        (PropertyToken token, PrimarySale sale, RentDistributor dist,) = _create("Kos A", 1000);
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(operator);
        dist.depositRent(1000);
        assertEq(dist.pending(dina), 1000);
        assertEq(token.balanceOf(dina), 10);
    }

    function test_KycStillBlocksStrangersOnNewProperty() public {
        (, PrimarySale sale,,) = _create("Kos A", 1000);
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, attacker));
        sale.buy(1, 0);
    }

    function test_PropertiesAreIndependent() public {
        (PropertyToken a, PrimarySale saleA,,) = _create("Kos A", 1000);
        (PropertyToken b, PrimarySale saleB, RentDistributor distB,) = _create("Kos B", 5000);
        vm.prank(dina);
        saleA.buy(10, 0);
        vm.prank(budi);
        saleB.buy(20, 0);
        assertEq(factory.propertyCount(), 2);
        assertEq(a.balanceOf(dina), 10);
        assertEq(b.balanceOf(dina), 0);
        assertEq(saleB.unitsLeft(), 4980);
        vm.prank(operator);
        distB.depositRent(2000);
        assertEq(distB.pending(budi), 2000);
        assertEq(distB.pending(dina), 0);
    }

    function test_OnlyOperatorCreatesProperties() public {
        vm.prank(attacker);
        vm.expectRevert();
        factory.createProperty(_params("Kos X", 100));
    }

    function test_RejectsEmptySupply() public {
        vm.prank(operator);
        vm.expectRevert(PropertyFactory.ZeroUnits.selector);
        factory.createProperty(_params("Kos X", 0));
    }

    function test_OnlyRegistrarOrOwnerCanVerify() public {
        vm.prank(attacker);
        vm.expectRevert(KYCRegistry.NotAuthorized.selector);
        kyc.setVerified(attacker, true);
        vm.prank(attacker);
        vm.expectRevert(MockIDR.NotAuthorized.selector);
        idr.setTrustedSpender(attacker, true);
    }
}
