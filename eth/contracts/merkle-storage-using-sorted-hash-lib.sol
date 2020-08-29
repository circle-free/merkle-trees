// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

import "./merkle-library-sorted-hash.sol";

contract Merkle_Storage_Using_Sorted_Hash_Lib {
  bytes32 public root;

  event Some_Data(bytes32 some_data);

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  function hash_pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
    return a < b ? hash_node(a, b) : hash_node(b, a);
  }

  function _debug_set_root(bytes32 _root) public {
    root = _root;
  }

  function use_one(uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) public {
    require(Merkle_Library_Sorted_Hash.element_exists(root, total_element_count, index, element, decommitments), "INVALID_ELEMENT");
    
    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, element));
  }

  function update_one(uint256 total_element_count, uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory decommitments) public {
    root = Merkle_Library_Sorted_Hash.try_update_one(root, total_element_count, index, element, new_element, decommitments);
  }

  function use_and_update_one(uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) public {
    root = Merkle_Library_Sorted_Hash.try_update_one(root, total_element_count, index, element, hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element), decommitments);

    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, element));
  }

  function use_many(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) public {
    require(Merkle_Library_Sorted_Hash.elements_exist(root, total_element_count, elements, proof), "INVALID_ELEMENTS");
    
    uint256 using_element_count = elements.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 i;

    while (i < using_element_count) {
      some_data = hash_node(some_data, elements[i]);
      i++;
    }

    emit Some_Data(some_data);
  }

  function update_many(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) public {
    root = Merkle_Library_Sorted_Hash.try_update_many(root, total_element_count, elements, new_elements, proof);
  }

  function use_and_update_many(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) public {
    uint256 using_element_count = elements.length;
    bytes32[] memory new_elements = new bytes32[](using_element_count);
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 element;

    for (uint256 i; i < using_element_count; ++i) {
      element = elements[i];
      new_elements[i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
      some_data = hash_node(some_data, element);
    }

    root = Merkle_Library_Sorted_Hash.try_update_many(root, total_element_count, elements, new_elements, proof);

    emit Some_Data(some_data);
  }

  function append_one(uint256 total_element_count, bytes32 new_element, bytes32[] memory decommitments) public {
    root = Merkle_Library_Sorted_Hash.try_append_one(root, total_element_count, new_element, decommitments);
  }

  function append_many(uint256 total_element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) public {
    root = Merkle_Library_Sorted_Hash.try_append_many(root, total_element_count, new_elements, decommitments);
  }

  function use_and_update_and_append_many(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) public {
    uint256 using_element_count = elements.length;
    bytes32[] memory update_elements = new bytes32[](using_element_count);
    bytes32[] memory append_elements = new bytes32[](using_element_count);
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 element;

    for (uint256 i; i < using_element_count; ++i) {
      element = elements[i];
      update_elements[i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
      append_elements[i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000003, element);
      some_data = hash_node(some_data, element);
    }

    root = Merkle_Library_Sorted_Hash.try_update_many_and_append_many(root, total_element_count, elements, update_elements, append_elements, proof);

    emit Some_Data(some_data);
  }
}
