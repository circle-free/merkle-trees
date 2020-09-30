// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

contract Indexed_Multi_Proofs_Sorted_Hash {
  bytes32 public root;

  event Data_Used(bytes32 data_used);

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

  function set_root(uint256 total_element_count, bytes32 element_root) public {
    root = hash_node(bytes32(total_element_count), element_root);
  }

  function validate(uint256 total_element_count, bytes32 element_root) internal view {
    require(hash_node(bytes32(total_element_count), element_root) == root, "INVALID_PROOF");
  }

  // Indices are required to be sorted highest to lowest.
  function get_root(uint256[] memory indices, bytes32[] memory elements, bytes32[] memory proof) public pure returns (bytes32) {
    uint256 index_count = indices.length;

    require(index_count == elements.length, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](index_count);
    uint256[] memory tree_indices = new uint256[](index_count);
    uint256 read_index = index_count - 1;
    uint256 write_index;
    
    while (write_index < index_count) {
      tree_indices[write_index] = uint256(proof[0]) + indices[read_index];
      hashes[write_index++] = hash_node(bytes32(0), elements[read_index--]);
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 1;
    uint256 index;
    
    while (true) {
      index = tree_indices[read_index];

      if (index == 1) return hashes[(write_index == 0 ? index_count : write_index) - 1];

      bool index_is_odd = index & 1 == 1;

      bytes32 right = index_is_odd ? hashes[read_index++] : proof[proof_index++];

      read_index %= index_count;

      bool nextIsSibling = tree_indices[(read_index + 1) % index_count] == (index - 1);
      bytes32 left = (index_is_odd && !nextIsSibling) ? proof[proof_index++] : hashes[read_index++];

      tree_indices[write_index] = index >> 1;
      hashes[write_index++] = hash_pair(left, right);

      read_index %= index_count;
      write_index %= index_count;
    }
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree
  function use(uint256[] memory indices, bytes32[] memory elements, bytes32[] memory proof) public {
    validate(uint256(proof[0]), get_root(indices, elements, proof));
    
    uint256 index_count = indices.length;
    bytes32 data_used;

    for (uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
    }

    emit Data_Used(data_used);
  }

  // Indices are required to be sorted highest to lowest.
  function get_roots(uint256[] memory indices, bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) public pure returns (bytes32, bytes32) {
    uint256 index_count = indices.length;
    
    require(index_count == elements.length && new_elements.length == elements.length, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](index_count);
    bytes32[] memory new_hashes = new bytes32[](index_count);
    uint256[] memory tree_indices = new uint256[](index_count);
    uint256 read_index = index_count - 1;
    uint256 write_index;

    while (write_index < index_count) {
      tree_indices[write_index] = uint256(proof[0]) + indices[read_index];
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      new_hashes[write_index++] = hash_node(bytes32(0), new_elements[read_index--]);
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 1;
    uint256 index;
    
    while (true) {
      index = tree_indices[read_index];

      if (index == 1) {
        read_index = (write_index == 0 ? index_count : write_index) - 1;
        return(hashes[read_index], new_hashes[read_index]);
      }

      bool index_is_odd = index & 1 == 1;
      bytes32 right = index_is_odd ? hashes[read_index] : proof[proof_index];
      bytes32 new_right = index_is_odd ? new_hashes[read_index++] : proof[proof_index++];

      read_index %= index_count;
      
      bool left_flag = index_is_odd && !(tree_indices[read_index] == (index - 1));
      hashes[write_index] = hash_pair(left_flag ? proof[proof_index] : hashes[read_index], right);
      new_hashes[write_index] = hash_pair(left_flag ? proof[proof_index++] : hashes[read_index++], new_right);
      tree_indices[write_index++] = index >> 1;

      read_index %= index_count;
      write_index %= index_count;
    }
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree
  function use_and_update(uint256[] memory indices, bytes32[] memory elements, bytes32[] memory proof) public {
    uint256 index_count = indices.length;
    bytes32[] memory new_elements = new bytes32[](index_count);
    bytes32 data_used;

    for (uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
      new_elements[i] = data_used;
    }

    emit Data_Used(data_used);

    (bytes32 old_element_root, bytes32 new_element_root) = get_roots(indices, elements, new_elements, proof);

    validate(uint256(proof[0]), old_element_root);
    set_root(uint256(proof[0]), new_element_root);
  }
}
