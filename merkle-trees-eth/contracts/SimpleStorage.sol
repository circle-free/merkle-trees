// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract SimpleStorage {
  mapping(uint256 => bytes32) public data;

  event Test(bytes32 eventData);

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  function use(uint256[] memory indices) public {
    uint256 n = indices.length;
    bytes32 eventData = bytes32(0);

    for(uint256 i = 0; i < n; ++i) {
      eventData = hash_node(eventData, data[indices[i]]);
    }

    emit Test(eventData);
  }

  function update(uint256[] memory indices, bytes32[] memory values) public {
    uint256 n = indices.length;

    for(uint256 i = 0; i < n; ++i) {
      data[indices[i]] = values[i];
    }
  }

  function useAndupdate(uint256[] memory indices, bytes32[] memory values) public {
    uint256 n = indices.length;
    bytes32 eventData = bytes32(0);

    for(uint256 i = 0; i < n; ++i) {
      eventData = hash_node(eventData, data[indices[i]]);
      data[indices[i]] = values[i];
    }

    emit Test(eventData);
  }
}
