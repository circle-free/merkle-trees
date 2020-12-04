// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "../internal-merkle-library-sorted-hash.sol";

contract Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Sorted_Hash {
  bytes32 public root;

  event Some_Data(bytes32 some_data);

  function _debug_set_root(bytes32 _root) external {
    root = _root;
  }

  function create(bytes[] calldata elements) external {
    root = Internal_Merkle_Library_Sorted_Hash.create_from_many_c(elements);
  }

  function verify_size(uint256 size, bytes32 element_root) external view returns (bool) {
    return Internal_Merkle_Library_Sorted_Hash.verify_size(root, size, element_root);
  }

  function use_one(
    uint256 index,
    bytes calldata element,
    bytes32[] calldata proof
  ) external {
    require(Internal_Merkle_Library_Sorted_Hash.element_exists_c(root, index, element, proof), "INVALID_ELEMENT");

    emit Some_Data(keccak256(abi.encodePacked(bytes1(0x01), element)));
  }

  function use_many(bytes[] calldata elements, bytes32[] calldata proof) external {
    require(Internal_Merkle_Library_Sorted_Hash.elements_exist_c(root, elements, proof), "INVALID_ELEMENTS");

    uint256 using_element_count = elements.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 i;

    while (i < using_element_count) {
      some_data = keccak256(abi.encodePacked(some_data, elements[i]));
      i += 1;
    }

    emit Some_Data(some_data);
  }

  function update_one(
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_update_one_c(root, index, element, update_element, proof);
  }

  function update_many(
    bytes[] calldata elements,
    bytes[] calldata updates_elements,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_update_many_c(root, elements, updates_elements, proof);
  }

  function append_one(bytes calldata append_element, bytes32[] calldata proof) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_append_one_c(root, append_element, proof);
  }

  function append_many(bytes[] calldata append_elements, bytes32[] calldata proof) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_append_many_c(root, append_elements, proof);
  }

  function use_one_and_append_one(
    uint256 index,
    bytes calldata element,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_append_one_using_one_c(root, index, element, append_element, proof);
  }

  function use_one_and_append_many(
    uint256 index,
    bytes calldata element,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_append_many_using_one_c(
      root,
      index,
      element,
      append_elements,
      proof
    );
  }

  function use_many_and_append_one(
    bytes[] calldata elements,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_append_one_using_many_c(root, elements, append_element, proof);
  }

  function use_many_and_append_many(
    bytes[] calldata elements,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_append_many_using_many_c(root, elements, append_elements, proof);
  }

  function update_one_and_append_one(
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_update_one_and_append_one_c(
      root,
      index,
      element,
      update_element,
      append_element,
      proof
    );
  }

  function update_one_and_append_many(
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_update_one_and_append_many_c(
      root,
      index,
      element,
      update_element,
      append_elements,
      proof
    );
  }

  function update_many_and_append_one(
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_update_many_and_append_one_c(
      root,
      elements,
      update_elements,
      append_element,
      proof
    );
  }

  function update_many_and_append_many(
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external {
    root = Internal_Merkle_Library_Sorted_Hash.try_update_many_and_append_many_c(
      root,
      elements,
      update_elements,
      append_elements,
      proof
    );
  }
}
