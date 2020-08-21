// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

contract Simple_Storage {
  mapping(uint256 => bytes32) public items;

  event Some_Data(bytes32 some_data);

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  function use_one(uint256 index) public {
    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, items[index]));
  }

  function update_one(uint256 index, bytes32 update_element) public {
    items[index] = update_element;
  }

  function use_and_update_one(uint256 index) public {
    bytes32 element = items[index];

    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, element));
    
    items[index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
  }

  function use_many(uint256[] memory indices) public {
    uint256 index_count = indices.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;

    for (uint256 i; i < index_count; ++i) {
      some_data = hash_node(some_data, items[indices[i]]);
    }

    emit Some_Data(some_data);
  }

  function update_many(uint256[] memory indices, bytes32[] memory update_elements) public {
    uint256 index_count = indices.length;
    require(update_elements.length == index_count, "LENGTH_MISMATCH");

    for (uint256 i; i < index_count; ++i) {
      items[indices[i]] = update_elements[i];
    }
  }

  function use_and_update_many(uint256[] memory indices) public {
    uint256 index_count = indices.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 element;

    for (uint256 i; i < index_count; ++i) {
      element = items[indices[i]];
      items[indices[i]] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
      some_data = hash_node(some_data, element);
    }

    emit Some_Data(some_data);
  }

  function append_one(uint256 append_index, bytes32 append_element) public {
    items[append_index] = append_element;
  }

  function append_many(uint256 append_index, bytes32[] memory append_elements) public {
    uint256 element_count = append_elements.length;

    for (uint256 i; i < element_count; ++i) {
      items[append_index + i] = append_elements[i];
    }
  }

  function use_and_update_and_append_many(uint256[] memory indices, uint256 append_index) public {
    uint256 index_count = indices.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 element;

    for (uint256 i; i < index_count; ++i) {
      element = items[indices[i]];
      items[indices[i]] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
      items[append_index + i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000003, element);
      some_data = hash_node(some_data, element);
    }

    emit Some_Data(some_data);
  }
}
