// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { PropertyToken } from "./PropertyToken.sol";

/// @notice Primary sale at a fixed price. A buyer may join an Urunan Room: a shared target that
/// friends fill together. Each buyer receives units in their own wallet; nobody holds anyone's money.
contract PrimarySale {
    using SafeERC20 for IERC20;

    struct Room {
        address creator;
        string title;
        uint256 targetUnits;
        uint256 raisedUnits;
        uint256 contributors;
    }

    PropertyToken public immutable property;
    IERC20 public immutable payToken;
    address public immutable treasury;
    uint256 public immutable unitPrice;

    uint256 public roomCount;
    mapping(uint256 => Room) public rooms;
    mapping(uint256 => mapping(address => uint256)) public contributed;

    event RoomCreated(uint256 indexed roomId, address indexed creator, string title, uint256 targetUnits);
    event UnitsBought(address indexed buyer, uint256 indexed roomId, uint256 units, uint256 cost);

    error ZeroUnits();
    error SoldOut(uint256 requested, uint256 available);
    error UnknownRoom(uint256 roomId);

    constructor(PropertyToken property_, IERC20 payToken_, address treasury_, uint256 unitPrice_) {
        property = property_;
        payToken = payToken_;
        treasury = treasury_;
        unitPrice = unitPrice_;
    }

    function unitsLeft() public view returns (uint256) {
        return property.balanceOf(address(this));
    }

    function createRoom(string calldata title, uint256 targetUnits) external returns (uint256 roomId) {
        if (targetUnits == 0) revert ZeroUnits();
        roomId = ++roomCount;
        rooms[roomId] = Room(msg.sender, title, targetUnits, 0, 0);
        emit RoomCreated(roomId, msg.sender, title, targetUnits);
    }

    /// @param roomId 0 buys outside any room.
    function buy(uint256 units, uint256 roomId) external {
        if (units == 0) revert ZeroUnits();
        uint256 left = unitsLeft();
        if (units > left) revert SoldOut(units, left);

        if (roomId != 0) {
            if (roomId > roomCount) revert UnknownRoom(roomId);
            Room storage room = rooms[roomId];
            if (contributed[roomId][msg.sender] == 0) room.contributors += 1;
            contributed[roomId][msg.sender] += units;
            room.raisedUnits += units;
        }

        // The token rejects the transfer when the buyer is not verified.
        property.transfer(msg.sender, units);
        uint256 cost = units * unitPrice;
        payToken.safeTransferFrom(msg.sender, treasury, cost);
        emit UnitsBought(msg.sender, roomId, units, cost);
    }
}
