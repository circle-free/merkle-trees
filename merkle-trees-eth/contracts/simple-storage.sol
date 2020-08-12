// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract Simple_Storage {
  mapping(uint256 => bytes32) public elements;

  event Data_Used(bytes32 data_used);

  constructor(uint256[] memory indices, bytes32[] memory _elements) public {
    uint256 index_count = indices.length;

    for(uint256 i = 0; i < index_count; ++i) {
      elements[indices[i]] = _elements[i];
    }
  }

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  function verify(uint256[] memory indices, bytes32[] memory _elements) public view returns (bool valid) {
    if (indices.length != _elements.length) return false;

    uint256 index_count = indices.length;

    for(uint256 i = 0; i < index_count; ++i) {
      if (elements[indices[i]] != _elements[i]) return false;
    }

    return true;
  }

  function use(uint256[] memory indices) public {
    uint256 index_count = indices.length;
    bytes32 data_used = bytes32(0);

    for(uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[indices[i]]);
    }

    emit Data_Used(data_used);
  }

  function update(uint256[] memory indices, bytes32[] memory new_elements) public {
    uint256 index_count = indices.length;

    for(uint256 i = 0; i < index_count; ++i) {
      elements[indices[i]] = new_elements[i];
    }
  }

  function use_and_update(uint256[] memory indices) public {
    uint256 index_count = indices.length;
    bytes32 data_used = bytes32(0);

    for(uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[indices[i]]);
      elements[indices[i]] = data_used;
    }

    emit Data_Used(data_used);
  }
}
