// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { KYCRegistry } from "../contracts/KYCRegistry.sol";
import { MockIDR } from "../contracts/MockIDR.sol";
import { PropertyToken } from "../contracts/PropertyToken.sol";
import { RentDistributor } from "../contracts/RentDistributor.sol";
import { PrimarySale } from "../contracts/PrimarySale.sol";
import { Marketplace } from "../contracts/Marketplace.sol";

contract URSSETTest is Test {
    KYCRegistry kyc;
    MockIDR idr;
    PropertyToken token;
    RentDistributor dist;
    PrimarySale sale;
    Marketplace market;

    address operator = makeAddr("operator");
    address dina = makeAddr("dina");
    address budi = makeAddr("budi");
    address stranger = makeAddr("stranger");

    uint256 constant UNITS = 300_000;
    uint256 constant PRICE = 10_000;

    function setUp() public {
        vm.startPrank(operator);
        kyc = new KYCRegistry(operator);
        idr = new MockIDR(operator);
        token = new PropertyToken("Kos Melati", "MELATI", operator, kyc, UNITS, "Depok", bytes32(0), "ipfs://x");
        dist = new RentDistributor(idr, operator);
        sale = new PrimarySale(token, idr, operator, PRICE);
        market = new Marketplace(token, idr);
        dist.setup(token, address(sale));
        token.setDistributor(dist);
        kyc.setVerified(address(sale), true);
        token.mintInventory(address(sale));
        idr.setTrustedSpender(address(sale), true);
        idr.setTrustedSpender(address(market), true);
        idr.setTrustedSpender(address(dist), true);
        idr.mint(operator, 1_000_000_000);
        kyc.setVerified(dina, true);
        kyc.setVerified(budi, true);
        idr.mint(dina, 1_000_000);
        idr.mint(budi, 1_000_000);
        idr.mint(stranger, 1_000_000);
        vm.stopPrank();
    }

    // KYC enforcement

    function test_UnverifiedBuyerCannotBuy() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, stranger));
        sale.buy(5, 0);
    }

    function test_TransferToUnverifiedWalletIsRejected() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(dina);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, stranger));
        token.transfer(stranger, 5);
    }

    function test_RevokedWalletCannotSend() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(operator);
        kyc.setVerified(dina, false);
        vm.prank(dina);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, dina));
        token.transfer(budi, 1);
    }

    // Primary sale and Urunan Room

    function test_BuyMovesUnitsAndPayment() public {
        vm.prank(dina);
        sale.buy(5, 0);
        assertEq(token.balanceOf(dina), 5);
        assertEq(idr.balanceOf(dina), 1_000_000 - 5 * PRICE);
        assertEq(sale.unitsLeft(), UNITS - 5);
    }

    function test_CannotBuyMoreThanInventory() public {
        vm.prank(dina);
        vm.expectRevert(abi.encodeWithSelector(PrimarySale.SoldOut.selector, UNITS + 1, UNITS));
        sale.buy(UNITS + 1, 0);
    }

    function test_UrunanRoomTracksProgress() public {
        vm.prank(dina);
        uint256 roomId = sale.createRoom("Urunan Kos Melati", 1000);
        vm.prank(dina);
        sale.buy(50, roomId);
        vm.prank(budi);
        sale.buy(50, roomId);
        vm.prank(budi);
        sale.buy(20, roomId);
        (, , uint256 target, uint256 raised, uint256 contributors) = sale.rooms(roomId);
        assertEq(target, 1000);
        assertEq(raised, 120);
        assertEq(contributors, 2);
        assertEq(sale.contributed(roomId, budi), 70);
        // each person owns their own units
        assertEq(token.balanceOf(dina), 50);
        assertEq(token.balanceOf(budi), 70);
    }

    function test_UnknownRoomReverts() public {
        vm.prank(dina);
        vm.expectRevert(abi.encodeWithSelector(PrimarySale.UnknownRoom.selector, 7));
        sale.buy(1, 7);
    }

    // Rent

    function test_RentIsSplitProRata() public {
        vm.prank(dina);
        sale.buy(30, 0);
        vm.prank(budi);
        sale.buy(10, 0);
        vm.prank(operator);
        dist.depositRent(4_000);
        assertEq(dist.pending(dina), 3_000);
        assertEq(dist.pending(budi), 1_000);
        vm.prank(dina);
        dist.claim();
        assertEq(idr.balanceOf(dina), 1_000_000 - 30 * PRICE + 3_000);
        assertEq(dist.pending(dina), 0);
    }

    function test_UnsoldInventoryEarnsNoRent() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(operator);
        dist.depositRent(1_000);
        assertEq(dist.pending(dina), 1_000);
        assertEq(dist.pending(address(sale)), 0);
    }

    function test_LateBuyerGetsNoPastRent() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(operator);
        dist.depositRent(1_000);
        vm.prank(budi);
        sale.buy(10, 0);
        assertEq(dist.pending(budi), 0);
        assertEq(dist.pending(dina), 1_000);
    }

    function test_RentFollowsUnitsAfterTransfer() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(operator);
        dist.depositRent(1_000);
        // Dina keeps the rent earned before she sends units away.
        vm.prank(dina);
        token.transfer(budi, 10);
        assertEq(dist.pending(dina), 1_000);
        assertEq(dist.pending(budi), 0);
        vm.prank(operator);
        dist.depositRent(500);
        assertEq(dist.pending(budi), 500);
        assertEq(dist.pending(dina), 1_000);
    }

    function test_ClaimWithNothingReverts() public {
        vm.prank(dina);
        vm.expectRevert(RentDistributor.NothingToClaim.selector);
        dist.claim();
    }

    function test_OnlyOperatorDepositsRent() public {
        vm.prank(dina);
        vm.expectRevert();
        dist.depositRent(1);
    }

    // Marketplace

    function test_MarketplaceSale() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.startPrank(dina);
        token.approve(address(market), 4);
        uint256 id = market.list(4, 12_000);
        vm.stopPrank();
        vm.prank(budi);
        market.buy(id);
        assertEq(token.balanceOf(budi), 4);
        assertEq(token.balanceOf(dina), 6);
        assertEq(idr.balanceOf(dina), 1_000_000 - 10 * PRICE + 4 * 12_000);
    }

    function test_MarketplaceRejectsUnverifiedBuyer() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.startPrank(dina);
        token.approve(address(market), 4);
        uint256 id = market.list(4, 12_000);
        vm.stopPrank();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, stranger));
        market.buy(id);
    }

    function test_SellerKeepsEarningRentWhileListed() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.startPrank(dina);
        token.approve(address(market), 10);
        market.list(10, 11_000);
        vm.stopPrank();
        vm.prank(operator);
        dist.depositRent(2_000);
        assertEq(dist.pending(dina), 2_000);
    }

    function test_OnlySellerCancels() public {
        vm.prank(dina);
        sale.buy(10, 0);
        vm.prank(dina);
        uint256 id = market.list(4, 12_000);
        vm.prank(budi);
        vm.expectRevert(Marketplace.NotSeller.selector);
        market.cancel(id);
        vm.prank(dina);
        market.cancel(id);
        vm.prank(budi);
        vm.expectRevert(Marketplace.NotActive.selector);
        market.buy(id);
    }

    function test_CannotMintInventoryTwice() public {
        vm.prank(operator);
        vm.expectRevert(PropertyToken.AlreadyMinted.selector);
        token.mintInventory(operator);
    }
}
