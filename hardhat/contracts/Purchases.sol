// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Purchases {
  struct Purchase {
    address buyer;
    string mediaId;
    uint256 pricePaid;
    uint256 timestamp;
  }

  mapping(string => Purchase[]) public purchases;

  event PurchaseRecorded(address indexed buyer, string mediaId, uint256 pricePaid);

  function recordPurchase(string memory mediaId, uint256 pricePaid) external {
    purchases[mediaId].push(Purchase(msg.sender, mediaId, pricePaid, block.timestamp));
    emit PurchaseRecorded(msg.sender, mediaId, pricePaid);
  }

  function getPurchases(string memory mediaId) external view returns (Purchase[] memory) {
    return purchases[mediaId];
  }
}