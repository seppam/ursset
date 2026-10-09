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

/// @dev Shared deployment through the real PropertyFactory so the tests exercise the production wiring.
abstract contract Deployed is Test {
    KYCRegistry public kyc;
    MockIDR public idr;
    PropertyFactory public factory;
    PropertyToken public token;
    PrimarySale public sale;
    RentDistributor public dist;
    Marketplace public market;

    address operator = makeAddr("operator");
    address dina = makeAddr("dina");
    address budi = makeAddr("budi");
    address carol = makeAddr("carol");
    address eve = makeAddr("eve"); // verified, used as the griefer / sniper
    address stranger = makeAddr("stranger"); // never verified

    uint256 constant UNITS = 1000;
    uint256 constant PRICE = 10_000;

    function _deploy() internal {
        vm.startPrank(operator);
        kyc = new KYCRegistry(operator);
        idr = new MockIDR(operator);
        factory = new PropertyFactory(kyc, idr, operator);
        kyc.setRegistrar(address(factory), true);
        idr.setRegistrar(address(factory), true);
        address[5] memory users = [dina, budi, carol, eve, stranger];
        for (uint256 i; i < users.length; i++) {
            idr.mint(users[i], 1_000_000_000_000);
            if (users[i] != stranger) kyc.setVerified(users[i], true);
        }
        idr.mint(operator, 1_000_000_000_000);
        uint256 id = factory.createProperty(
            PropertyFactory.Params({
                name: "Kos",
                symbol: "KOS",
                location: "Depok",
                totalUnits: UNITS,
                unitPrice: PRICE,
                documentHash: keccak256("docs"),
                metadataURI: "ipfs://x",
                treasury: address(0)
            })
        );
        vm.stopPrank();
        (address t, address s, address d, address m,,) = factory.properties(id);
        token = PropertyToken(t);
        sale = PrimarySale(s);
        dist = RentDistributor(d);
        market = Marketplace(m);
        // The distributor is not a trusted spender; the operator approves it like any normal ERC-20 spender.
        vm.prank(operator);
        idr.approve(address(dist), type(uint256).max);
    }
}

/// @dev Bounded random actor. All calls are wrapped so expected reverts do not abort the run; ghost variables
/// record what succeeded so the invariants can check the outcome.
contract Handler is Deployed {
    address[] public actors;
    address[] public extras; // addresses that must never hold units
    mapping(address => bool) public wasRevoked;

    uint256 public ops; // upper bound of rounding events (every settle truncates < 1 token)
    bool public unverifiedReceived;
    uint256 public deposits;

    constructor() {
        _deploy();
        actors.push(dina);
        actors.push(budi);
        actors.push(carol);
        actors.push(eve);
        extras.push(stranger);
        extras.push(address(market));
        extras.push(address(dist));
        extras.push(address(token));
        extras.push(address(kyc));
        extras.push(address(factory));
        extras.push(address(idr));
        extras.push(address(this));
    }

    function actorCount() external view returns (uint256) {
        return actors.length;
    }

    function extraCount() external view returns (uint256) {
        return extras.length;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function _anyTarget(uint256 seed) internal view returns (address) {
        uint256 n = actors.length + extras.length + 1;
        uint256 i = seed % n;
        if (i < actors.length) return actors[i];
        i -= actors.length;
        if (i < extras.length) return extras[i];
        return address(sale);
    }

    function _checkReceipt(address to) internal {
        if (!kyc.isVerified(to)) unverifiedReceived = true;
    }

    function buy(uint256 a, uint256 units, uint256 roomSeed) external {
        address who = _actor(a);
        units = bound(units, 1, 60);
        uint256 room = sale.roomCount() == 0 ? 0 : roomSeed % (sale.roomCount() + 1);
        vm.prank(who);
        try sale.buy(units, room) {
            ops += 2;
            _checkReceipt(who);
        } catch { }
    }

    function createRoom(uint256 a, uint256 target) external {
        vm.prank(_actor(a));
        sale.createRoom("room", bound(target, 1, 500));
    }

    function transferUnits(uint256 a, uint256 toSeed, uint256 units) external {
        address from = _actor(a);
        address to = _anyTarget(toSeed);
        units = bound(units, 0, 60);
        vm.prank(from);
        try token.transfer(to, units) {
            ops += 2;
            _checkReceipt(to);
        } catch { }
    }

    function list(uint256 a, uint256 units, uint256 price) external {
        address who = _actor(a);
        units = bound(units, 1, 60);
        vm.startPrank(who);
        token.approve(address(market), units);
        try market.list(units, bound(price, 1, 20_000)) { } catch { }
        vm.stopPrank();
    }

    function fill(uint256 a, uint256 idSeed) external {
        uint256 n = market.listingCount();
        if (n == 0) return;
        address who = _actor(a);
        vm.prank(who);
        try market.buy(1 + (idSeed % n)) {
            ops += 2;
            _checkReceipt(who);
        } catch { }
    }

    function cancel(uint256 idSeed) external {
        uint256 n = market.listingCount();
        if (n == 0) return;
        uint256 id = 1 + (idSeed % n);
        (address seller,,,) = market.listings(id);
        vm.prank(seller);
        try market.cancel(id) { } catch { }
    }

    function deposit(uint256 amount) external {
        amount = bound(amount, 1, 5_000_000);
        vm.prank(operator);
        try dist.depositRent(amount) {
            deposits += 1;
            ops += 1;
        } catch { }
    }

    function claim(uint256 a) external {
        vm.prank(_actor(a));
        try dist.claim() {
            ops += 1;
        } catch { }
    }

    function setVerified(uint256 a, bool v) external {
        address who = _actor(a);
        vm.prank(operator);
        kyc.setVerified(who, v);
        if (!v) wasRevoked[who] = true;
    }
}

contract InvariantsTest is Deployed {
    Handler handler;

    function setUp() public {
        handler = new Handler();
        // The handler owns the deployment; mirror its addresses locally.
        kyc = handler.kyc();
        idr = handler.idr();
        factory = handler.factory();
        token = handler.token();
        sale = handler.sale();
        dist = handler.dist();
        market = handler.market();

        targetContract(address(handler));
        bytes4[] memory sel = new bytes4[](8);
        sel[0] = Handler.buy.selector;
        sel[1] = Handler.createRoom.selector;
        sel[2] = Handler.transferUnits.selector;
        sel[3] = Handler.list.selector;
        sel[4] = Handler.fill.selector;
        sel[5] = Handler.cancel.selector;
        sel[6] = Handler.deposit.selector;
        sel[7] = Handler.claim.selector;
        // verify/revoke is a separate selector so it is also fuzzed
        bytes4[] memory all = new bytes4[](9);
        for (uint256 i; i < 8; i++) {
            all[i] = sel[i];
        }
        all[8] = Handler.setVerified.selector;
        targetSelector(FuzzSelector({ addr: address(handler), selectors: all }));
    }

    function _sumActorBalances() internal view returns (uint256 s) {
        for (uint256 i; i < handler.actorCount(); i++) {
            s += token.balanceOf(handler.actors(i));
        }
    }

    /// (a) rent: holders can never claim more than was deposited; the distributor is solvent; dust is bounded.
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 50
    function invariant_RentNeverExceedsDeposits() public view {
        uint256 pendingSum;
        for (uint256 i; i < handler.actorCount(); i++) {
            pendingSum += dist.pending(handler.actors(i));
        }
        assertEq(dist.pending(address(sale)), 0, "inventory earns rent");
        uint256 claimed = dist.totalClaimed();
        uint256 deposited = dist.totalDeposited();
        assertLe(pendingSum + claimed, deposited, "owed + claimed exceeds deposits");
        assertGe(idr.balanceOf(address(dist)), pendingSum, "distributor insolvent");
        assertEq(idr.balanceOf(address(dist)), deposited - claimed, "distributor balance drifted");
        // Dust bound: each settle / deposit / view floors away < 1 token.
        uint256 dust = deposited - claimed - pendingSum;
        assertLe(dust, handler.ops() + handler.actorCount(), "rounding dust above bound");
    }

    /// (b) the sum of balances equals the total supply, which is fixed at totalUnits.
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 50
    function invariant_BalancesSumToSupply() public view {
        uint256 s = _sumActorBalances() + token.balanceOf(address(sale));
        for (uint256 i; i < handler.extraCount(); i++) {
            s += token.balanceOf(handler.extras(i));
        }
        assertEq(s, token.totalSupply());
        assertEq(token.totalSupply(), UNITS);
    }

    /// (c) + (e) units live only in the sale contract or in wallets that were verified at receipt time.
    /// A wallet that is currently unverified must have been revoked after receiving. No stranger, marketplace,
    /// distributor or other contract ever holds units, and no transfer to an unverified wallet ever succeeded.
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 50
    function invariant_UnitsOnlyInVerifiedHands() public view {
        assertFalse(handler.unverifiedReceived(), "unverified wallet received units");
        for (uint256 i; i < handler.actorCount(); i++) {
            address a = handler.actors(i);
            if (token.balanceOf(a) > 0 && !kyc.isVerified(a)) assertTrue(handler.wasRevoked(a), "stranger holds units");
        }
        for (uint256 i; i < handler.extraCount(); i++) {
            assertEq(token.balanceOf(handler.extras(i)), 0, "non-holder has units");
        }
        assertEq(token.balanceOf(address(market)), 0, "marketplace custody");
    }

    /// (d) primary sale: units left plus units held by buyers equals total supply.
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 50
    function invariant_SaleInventoryPlusHoldersEqualsSupply() public view {
        assertEq(sale.unitsLeft() + _sumActorBalances(), token.totalSupply());
    }

    /// Room accounting: raisedUnits equals the sum of per-wallet contributions.
    /// forge-config: default.invariant.runs = 256
    /// forge-config: default.invariant.depth = 50
    function invariant_RoomAccounting() public view {
        for (uint256 r = 1; r <= sale.roomCount(); r++) {
            (,,, uint256 raised, uint256 contributors) = sale.rooms(r);
            uint256 sum;
            uint256 n;
            for (uint256 i; i < handler.actorCount(); i++) {
                uint256 c = sale.contributed(r, handler.actors(i));
                sum += c;
                if (c > 0) n++;
            }
            assertEq(raised, sum, "room raised mismatch");
            assertEq(contributors, n, "room contributors mismatch");
        }
    }
}

/// @dev Targeted fuzz tests and executable evidence for the findings in docs/SECURITY.md.
contract SecurityTest is Deployed {
    function setUp() public {
        _deploy();
    }

    function _buy(address who, uint256 units) internal {
        vm.prank(who);
        sale.buy(units, 0);
    }

    // ---------- fuzz ----------

    function testFuzz_RentSplitNeverOverpays(uint8 a, uint8 b, uint32 amount, uint8 moves) public {
        uint256 ua = bound(a, 1, 200);
        uint256 ub = bound(b, 1, 200);
        uint256 amt = bound(amount, 1, 4_000_000_000);
        _buy(dina, ua);
        _buy(budi, ub);
        // some transfers back and forth to force settles
        for (uint256 i; i < bound(moves, 0, 6); i++) {
            vm.prank(dina);
            token.transfer(budi, 0);
        }
        vm.prank(operator);
        dist.depositRent(amt);
        uint256 total = dist.pending(dina) + dist.pending(budi);
        assertLe(total, amt);
        assertGe(total + 2, amt); // two holders, < 1 token lost each
    }

    function testFuzz_StrangerCanNeverReceiveUnits(uint8 units, uint8 route) public {
        uint256 u = bound(units, 1, 50);
        _buy(dina, 100);
        vm.startPrank(dina);
        uint256 r = route % 3;
        if (r == 0) {
            vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, stranger));
            token.transfer(stranger, u);
        } else if (r == 1) {
            token.approve(stranger, u);
            vm.stopPrank();
            vm.prank(stranger);
            vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, stranger));
            token.transferFrom(dina, stranger, u);
            return;
        } else {
            vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, address(market)));
            token.transfer(address(market), u);
        }
        vm.stopPrank();
        assertEq(token.balanceOf(stranger), 0);
    }

    function testFuzz_ClaimEverythingLeavesOnlyDust(uint16 u1, uint16 u2, uint32 amt) public {
        uint256 a = bound(u1, 1, 400);
        uint256 b = bound(u2, 1, 400);
        uint256 d = bound(amt, 1, 1_000_000_000);
        _buy(dina, a);
        _buy(budi, b);
        vm.prank(operator);
        dist.depositRent(d);
        uint256 got;
        if (dist.pending(dina) > 0) {
            vm.prank(dina);
            got += dist.claim();
        }
        if (dist.pending(budi) > 0) {
            vm.prank(budi);
            got += dist.claim();
        }
        assertLe(got, d);
        assertLe(d - got, 2);
        assertEq(idr.balanceOf(address(dist)), d - got);
    }

    // ---------- known issues: tests pin CURRENT behaviour ----------

    /// F-01 (Low): a zero-value transfer by any verified wallet forces `settle(victim)`, which truncates the
    /// victim's fractional rent. Repeating it after every small deposit keeps a small holder at 0 forever.
    function test_KnownIssue_ZeroTransferGriefsSmallHolderRent() public {
        _buy(dina, 10); // victim
        _buy(carol, 10); // control, same size, not griefed
        _buy(budi, 90);
        for (uint256 i; i < 20; i++) {
            vm.prank(operator);
            dist.depositRent(10); // 110 circulating units, 10 tIDR => 0.909 per 10 units
            vm.prank(eve);
            token.transfer(dina, 0); // eve holds 0 units; a zero-value transfer is allowed
        }
        assertEq(dist.pending(dina), 0, "victim lost all rent to truncation");
        assertEq(dist.pending(carol), 18, "control accumulates normally");
    }

    /// F-02 (Medium for production, Info for demo): un-verifying a holder freezes the units (no transfer in or
    /// out, no forced recovery) while rent keeps accruing and can still be claimed.
    function test_KnownIssue_RevokedHolderKeepsRentButUnitsAreFrozen() public {
        _buy(dina, 10);
        vm.prank(operator);
        kyc.setVerified(dina, false);
        vm.prank(operator);
        dist.depositRent(1000);
        assertEq(dist.pending(dina), 1000);
        vm.prank(dina);
        assertEq(dist.claim(), 1000); // claim does not check KYC
        vm.prank(dina);
        vm.expectRevert(abi.encodeWithSelector(PropertyToken.NotVerified.selector, dina));
        token.transfer(address(sale), 10); // cannot even return the units to the sale
        assertEq(token.balanceOf(dina), 10);
    }

    /// F-03 (Medium, operator only): the registrar / owner can mark any address a trusted spender, which then
    /// drains any tIDR balance without approval. Test token only; never ship this in a real stablecoin.
    function test_KnownIssue_TrustedSpenderCanDrainAnyHolder() public {
        address thief = makeAddr("thief");
        vm.prank(operator);
        idr.setTrustedSpender(thief, true);
        uint256 before_ = idr.balanceOf(dina);
        vm.prank(thief);
        idr.transferFrom(dina, thief, before_);
        assertEq(idr.balanceOf(dina), 0);
        assertEq(idr.balanceOf(thief), before_);
        // a non-privileged account cannot do this
        vm.prank(stranger);
        vm.expectRevert(MockIDR.NotAuthorized.selector);
        idr.setTrustedSpender(stranger, true);
    }

    /// F-04 (fixed): the factory no longer marks the distributor a trusted spender, so it cannot pull tIDR
    /// from users without an allowance.
    function test_DistributorIsNotATrustedSpender() public view {
        assertFalse(idr.trustedSpender(address(dist)));
        assertEq(idr.allowance(dina, address(dist)), 0);
    }

    /// F-05 (Low): rent is a snapshot at deposit time. A verified wallet that buys units from a seller right
    /// before `depositRent` and sells them back right after captures a full period of rent for the cost of the
    /// spread. The operator can mitigate by depositing in a private transaction.
    function test_KnownIssue_RentSnipingRoundTrip() public {
        _buy(dina, 100);
        _buy(budi, 100);
        // dina lists 100 units at the primary price; eve snipes them
        vm.startPrank(dina);
        token.approve(address(market), 100);
        uint256 id = market.list(100, PRICE);
        vm.stopPrank();
        vm.prank(eve);
        market.buy(id);
        vm.prank(operator);
        dist.depositRent(2000); // 200 circulating units => 10 per unit
        assertEq(dist.pending(eve), 1000, "sniper earns half the period");
        assertEq(dist.pending(dina), 0, "the real holder earned nothing");
        // eve resells at the same price: net cost 0 tIDR
        vm.startPrank(eve);
        token.approve(address(market), 100);
        uint256 id2 = market.list(100, PRICE);
        vm.stopPrank();
        vm.prank(carol);
        market.buy(id2);
        vm.prank(eve);
        dist.claim();
        assertEq(idr.balanceOf(eve), 1_000_000_000_000 + 1000);
    }

    /// F-06 (Info): a listing is only checked at creation. Selling more than owned across listings, or moving
    /// the units away, leaves stale listings that revert on fill; nothing else breaks and no funds are at risk.
    function test_KnownIssue_StaleAndOverlappingListings() public {
        _buy(dina, 10);
        vm.startPrank(dina);
        token.approve(address(market), 10);
        uint256 l1 = market.list(10, PRICE);
        uint256 l2 = market.list(10, PRICE); // 20 listed, 10 owned
        vm.stopPrank();
        vm.prank(budi);
        market.buy(l1);
        vm.prank(carol);
        vm.expectRevert(Marketplace.InsufficientUnits.selector);
        market.buy(l2);
        // a listing without approval also lists fine but cannot be filled
        _buy(carol, 5);
        vm.prank(carol);
        uint256 l3 = market.list(5, PRICE);
        vm.prank(budi);
        vm.expectRevert(); // ERC20InsufficientAllowance
        market.buy(l3);
    }

    /// F-07 (Info): anyone, even an unverified wallet, can create rooms; a room has no cap, deadline or
    /// recipient. `raisedUnits` can exceed `targetUnits` and is only a counter.
    function test_KnownIssue_RoomsAreCountersOnly() public {
        vm.prank(stranger);
        uint256 room = sale.createRoom("anything", 5);
        vm.prank(dina);
        sale.buy(50, room);
        (,, uint256 target, uint256 raised,) = sale.rooms(room);
        assertEq(target, 5);
        assertEq(raised, 50);
    }

    /// F-08 (Info): any verified wallet can push units onto another verified wallet without consent.
    function test_KnownIssue_UnsolicitedTransfersAreAllowed() public {
        _buy(dina, 3);
        vm.prank(dina);
        token.transfer(budi, 3);
        assertEq(token.balanceOf(budi), 3);
    }

    /// F-09 (Info): tIDR sent straight to the distributor, and rounding dust, have no rescue path.
    function test_KnownIssue_DistributorHasNoSweep() public {
        _buy(dina, 3);
        vm.prank(dina);
        idr.transfer(address(dist), 500);
        assertEq(idr.balanceOf(address(dist)), 500);
        assertEq(dist.totalDeposited(), 0);
        assertEq(dist.pending(dina), 0);
    }

    // ---------- access control and hand-offs ----------

    function test_FactoryLeavesNoPrivilegedKeysBehind() public view {
        assertEq(token.owner(), operator);
        assertEq(dist.owner(), operator);
        assertEq(factory.owner(), operator);
        assertEq(kyc.owner(), operator);
        assertEq(idr.owner(), operator);
        assertTrue(kyc.registrar(address(factory))); // registrar role is never revoked: see F-10
        assertFalse(kyc.isVerified(address(factory)));
        assertFalse(kyc.isVerified(address(market)));
        assertFalse(kyc.isVerified(address(dist)));
    }

    function test_OperatorCannotRepeatOneShotSetters() public {
        vm.startPrank(operator);
        vm.expectRevert(PropertyToken.AlreadyMinted.selector);
        token.mintInventory(operator);
        vm.expectRevert(PropertyToken.DistributorAlreadySet.selector);
        token.setDistributor(dist);
        vm.expectRevert(RentDistributor.AlreadySetup.selector);
        dist.setup(token, operator);
        vm.stopPrank();
    }

    function test_OnlyTokenCanSettle() public {
        vm.prank(dina);
        vm.expectRevert(RentDistributor.NotToken.selector);
        dist.settle(dina);
    }

    function test_StrangerCannotUseFactoryOrRegistry() public {
        vm.startPrank(stranger);
        vm.expectRevert(KYCRegistry.NotAuthorized.selector);
        kyc.setVerified(stranger, true);
        vm.expectRevert();
        kyc.setRegistrar(stranger, true);
        vm.expectRevert();
        idr.mint(stranger, 1);
        vm.expectRevert();
        dist.depositRent(1);
        vm.stopPrank();
    }

    function test_DepositWithNoCirculatingUnitsReverts() public {
        vm.prank(operator);
        vm.expectRevert(RentDistributor.NoCirculatingUnits.selector);
        dist.depositRent(1000);
    }

    function test_UnitsReturnedToSaleStopEarningRent() public {
        _buy(dina, 10);
        vm.prank(dina);
        token.transfer(address(sale), 4);
        vm.prank(operator);
        dist.depositRent(600);
        assertEq(dist.pending(dina), 600); // 6 circulating units, all dina's
        assertEq(sale.unitsLeft(), UNITS - 6);
    }
}
