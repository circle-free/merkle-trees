// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

contract Simple_Storage {
  uint256 public size;
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
    require(index < size, "INVALID_ELEMENT");

    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, items[index]));
  }

  function use_many(uint256[] memory indices) public {
    uint256 index_count = indices.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 i;
    uint256 index;

    while (i < index_count) {
      index = indices[i];
      require(index < size, "INVALID_ELEMENT");

      some_data = hash_node(some_data, items[index]);
      i += 1;
    }

    emit Some_Data(some_data);
  }

  function update_one(uint256 index, bytes32 update_element) public {
    require(index < size, "INVALID_ELEMENT");

    items[index] = update_element;
  }

  function update_many(uint256[] memory indices, bytes32[] memory update_elements) public {
    uint256 index_count = indices.length;
    require(update_elements.length == index_count, "LENGTH_MISMATCH");

    uint256 index;
    uint256 i;

    while (i < index_count) {
      index = indices[i];
      require(index < size, "INVALID_ELEMENT");

      items[index] = update_elements[i];
      i += 1;
    }
  }

  function append_one(bytes32 append_element) public {
    items[size] = append_element;
    size += 1;
  }

  function append_many(bytes32[] memory append_elements) public {
    uint256 element_count = append_elements.length;
    uint256 current_size = size;
    uint256 i;

    while (i < element_count) {
      items[current_size] = append_elements[i];
      i += 1;
      current_size += 1;
    }

    size = current_size;
  }

  function use_one_and_append_one(uint256 index, bytes32 append_element) public {
    require(index < size, "INVALID_ELEMENT");

    bytes32 used = items[index];
    items[size] = append_element;
    size += 1;
  }

  function use_one_and_append_many(uint256 index, bytes32[] memory append_elements) public {
    require(index < size, "INVALID_ELEMENT");

    bytes32 used = items[index];
    uint256 element_count = append_elements.length;
    uint256 current_size = size;
    uint256 i;

    while (i < element_count) {
      items[current_size] = append_elements[i];
      i += 1;
      current_size += 1;
    }

    size = current_size;
  }

  function use_many_and_append_one(uint256[] memory indices, bytes32 append_element) public {
    bytes32 used;
    uint256 indices_count = indices.length;
    uint256 i;
    uint256 index;

    while (i < indices_count) {
      index = indices[i];
      require(index < size, "INVALID_ELEMENT");

      used = items[index];
      i += 1;
    }

    items[size] = append_element;
    size += 1;
  }

  function use_many_and_append_many(uint256[] memory indices, bytes32[] memory append_elements) public {
    bytes32 used;
    uint256 count = indices.length;
    uint256 i;
    uint256 index;

    while (i < count) {
      index = indices[i];
      require(index < size, "INVALID_ELEMENT");

      used = items[index];
      i += 1;
    }

    count = append_elements.length;
    index = size;
    i = 0;

    while (i < count) {
      items[index] = append_elements[i];
      i += 1;
      index += 1;
    }

    size = index;
  }

  function update_one_and_append_one(
    uint256 index,
    bytes32 update_element,
    bytes32 append_element
  ) public {
    require(index < size, "INVALID_ELEMENT");

    items[index] = update_element;
    items[size] = append_element;
    size += 1;
  }

  function update_one_and_append_many(
    uint256 index,
    bytes32 update_element,
    bytes32[] memory append_elements
  ) public {
    require(index < size, "INVALID_ELEMENT");
    items[index] = update_element;

    uint256 element_count = append_elements.length;
    uint256 current_size = size;
    uint256 i;

    while (i < element_count) {
      items[current_size] = append_elements[i];
      i += 1;
      current_size += 1;
    }

    size = current_size;
  }

  function update_many_and_append_one(
    uint256[] memory indices,
    bytes32[] memory update_elements,
    bytes32 append_element
  ) public {
    uint256 index_count = indices.length;
    require(update_elements.length == index_count, "LENGTH_MISMATCH");

    uint256 index;
    uint256 i;

    while (i < index_count) {
      index = indices[i];
      require(index < size, "INVALID_ELEMENT");

      items[index] = update_elements[i];
      i += 1;
    }

    items[size] = append_element;
    size += 1;
  }

  function update_many_and_append_many(
    uint256[] memory indices,
    bytes32[] memory update_elements,
    bytes32[] memory append_elements
  ) public {
    uint256 count = indices.length;
    require(update_elements.length == count, "LENGTH_MISMATCH");

    uint256 index;
    uint256 i;

    while (i < count) {
      index = indices[i];
      require(index < size, "INVALID_ELEMENT");

      items[index] = update_elements[i];
      i += 1;
    }

    append_elements.length;
    index = size;
    i = 0;

    while (i < count) {
      items[index] = append_elements[i];
      i += 1;
      index += 1;
    }

    size = index;
  }
}
