// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract Index_Multi_Proofs {
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

  function set_root(bytes32 _root) public {
    root = _root;
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. total_element_count must be power of 2)
  function verify(uint256 total_element_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory decommitments) public view returns (bool) {
    uint256 index_count = indices.length;

    if (index_count != elements.length) return false;
    
    bytes32[] memory hashes = new bytes32[](index_count);
    uint256[] memory tree_indices = new uint256[](index_count);

    uint256 read_index;
    uint256 write_index;
    uint256 decommitment_index;

    for (; write_index < index_count; ++write_index) {
      tree_indices[write_index] = total_element_count + indices[write_index];
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
    }

    write_index = 0;
    uint256 index;
    
    while (true) {
      index = tree_indices[read_index];

      if (index == 1) return hash_node(bytes32(total_element_count), hashes[(write_index == 0 ? index_count : write_index) - 1]) == root;

      bool index_is_odd = index & 1 == 1;

      bytes32 right = index_is_odd ? hashes[read_index++] : decommitments[decommitment_index++];
      read_index %= index_count;
      bytes32 left = (index_is_odd && !(tree_indices[(read_index + 1) % index_count] == (index - 1))) ? decommitments[decommitment_index++] : hashes[read_index++];

      tree_indices[write_index] = index >> 1;
      hashes[write_index++] = hash_node(left, right);

      read_index %= index_count;
      write_index %= index_count;
    }
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. total_element_count must be power of 2)
  function use(uint256 total_element_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory decommitments) public {
    uint256 index_count = indices.length;
    bytes32 data_used;

    for (uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
    }

    emit Data_Used(data_used);

    require(verify(total_element_count, indices, elements, decommitments), "INVALID_PROOF");
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. total_element_count must be power of 2)
  function update(uint256 total_element_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory decommitments) public {
    uint256 index_count = indices.length;
    
    require(index_count == elements.length && new_elements.length == elements.length, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](index_count);
    bytes32[] memory new_hashes = new bytes32[](index_count);
    uint256[] memory tree_indices = new uint256[](index_count);

    uint256 read_index;
    uint256 write_index;
    uint256 decommitment_index;

    for (; write_index < index_count; ++write_index) {
      tree_indices[write_index] = total_element_count + indices[write_index];
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
      new_hashes[write_index] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    uint256 index;
    
    while (true) {
      index = tree_indices[read_index];

      if (index == 1) {
        read_index = (write_index == 0 ? index_count : write_index) - 1;
        require(hash_node(bytes32(total_element_count), hashes[read_index]) == root, "INVALID_PROOF");
        
        root = hash_node(bytes32(total_element_count), new_hashes[read_index]);
      }

      bool index_is_odd = index & 1 == 1;
      bool right_flag = index_is_odd && !(tree_indices[(read_index + 1) % index_count] == (index - 1));

      bytes32 right = index_is_odd ? hashes[read_index] : decommitments[decommitment_index];
      bytes32 new_right = index_is_odd ? new_hashes[read_index++] : decommitments[decommitment_index++];
      read_index %= index_count;

      bytes32 left = right_flag ? decommitments[decommitment_index] : hashes[read_index];
      bytes32 new_left = right_flag ? decommitments[decommitment_index++] : hashes[read_index++];
      read_index %= index_count;

      tree_indices[write_index] = index >> 1;
      hashes[write_index] = hash_node(left, right);
      new_hashes[write_index++] = hash_node(new_left, new_right);
      write_index %= index_count;
    }
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. total_element_count must be power of 2)
  function use_and_update(uint256 total_element_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory decommitments) public {
    uint256 index_count = indices.length;
    bytes32[] memory new_elements = new bytes32[](index_count);
    bytes32 data_used;

    for (uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
      new_elements[i] = data_used;
    }

    emit Data_Used(data_used);

    update(total_element_count, indices, elements, new_elements, decommitments);
  }
}
