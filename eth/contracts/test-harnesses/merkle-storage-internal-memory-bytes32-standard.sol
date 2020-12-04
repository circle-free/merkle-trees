// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "../internal-merkle-library.sol";

contract Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Standard {
  bytes32 public root;

  event Some_Data(bytes32 some_data);

  function _debug_set_root(bytes32 _root) public {
    root = _root;
  }

  function create(bytes32[] memory elements) external {
    root = Internal_Merkle_Library.create_from_many_m(elements);
  }

  // Note: calldata here since only new data is via memory
  function verify_indices(bytes32[] calldata elements, bytes32[] calldata proof)
    public
    pure
    returns (uint256[] memory)
  {
    return Internal_Merkle_Library.get_indices(elements, proof);
  }

  function verify_size_with_proof(uint256 size, bytes32[] calldata proof) public view returns (bool) {
    return Internal_Merkle_Library.verify_size_with_proof(root, size, proof);
  }

  function verify_size(uint256 size, bytes32 element_root) public view returns (bool) {
    return Internal_Merkle_Library.verify_size(root, size, element_root);
  }

  function use_one(
    uint256 index,
    bytes32 element,
    bytes32[] calldata proof
  ) public {
    require(Internal_Merkle_Library.element_exists(root, index, element, proof), "INVALID_ELEMENT");

    emit Some_Data(
      Internal_Merkle_Library.hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, element)
    );
  }

  function use_many(bytes32[] memory elements, bytes32[] calldata proof) public {
    require(Internal_Merkle_Library.elements_exist_m(root, elements, proof), "INVALID_ELEMENTS");

    uint256 using_element_count = elements.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 i;

    while (i < using_element_count) {
      some_data = Internal_Merkle_Library.hash_node(some_data, elements[i]);
      i += 1;
    }

    emit Some_Data(some_data);
  }

  function update_one(
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_update_one(root, index, element, update_element, proof);
  }

  function update_many(
    bytes32[] calldata elements,
    bytes32[] memory updates_elements,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_update_many_m(root, elements, updates_elements, proof);
  }

  function append_one(bytes32 append_element, bytes32[] calldata proof) public {
    root = Internal_Merkle_Library.try_append_one(root, append_element, proof);
  }

  function append_many(bytes32[] memory append_elements, bytes32[] calldata proof) public {
    root = Internal_Merkle_Library.try_append_many_m(root, append_elements, proof);
  }

  function use_one_and_append_one(
    uint256 index,
    bytes32 element,
    bytes32 append_element,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_append_one_using_one(root, index, element, append_element, proof);
  }

  function use_one_and_append_many(
    uint256 index,
    bytes32 element,
    bytes32[] memory append_elements,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_append_many_using_one_m(root, index, element, append_elements, proof);
  }

  // Note: calldata here since only new data is via memory
  function use_many_and_append_one(
    bytes32[] calldata elements,
    bytes32 append_element,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_append_one_using_many(root, elements, append_element, proof);
  }

  function use_many_and_append_many(
    bytes32[] calldata elements,
    bytes32[] memory append_elements,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_append_many_using_many_m(root, elements, append_elements, proof);
  }

  function update_one_and_append_one(
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32 append_element,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_update_one_and_append_one(
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
    bytes32 element,
    bytes32 update_element,
    bytes32[] memory append_elements,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_update_one_and_append_many_m(
      root,
      index,
      element,
      update_element,
      append_elements,
      proof
    );
  }

  function update_many_and_append_one(
    bytes32[] calldata elements,
    bytes32[] memory update_elements,
    bytes32 append_element,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_update_many_and_append_one_m(
      root,
      elements,
      update_elements,
      append_element,
      proof
    );
  }

  function update_many_and_append_many(
    bytes32[] calldata elements,
    bytes32[] memory update_elements,
    bytes32[] memory append_elements,
    bytes32[] calldata proof
  ) public {
    root = Internal_Merkle_Library.try_update_many_and_append_many_m(
      root,
      elements,
      update_elements,
      append_elements,
      proof
    );
  }
}
