// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract Index_Multi_Proofs {
  bytes32 public root;

  event Data_Used(bytes32 data_used);

  constructor(bytes32 _root) public {
    root = _root;
  }

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. leaf_count must be power of 2)
  function verify(uint256 leaf_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory decommitments) public view returns (bool valid) {
    if (indices.length != elements.length) return false;
    
    uint256 index_count = indices.length;
    bytes32[] memory hashes = new bytes32[](index_count);
    uint256[] memory tree_indices = new uint256[](index_count);

    uint256 hash_read_index = uint256(0);
    uint256 hash_write_index = uint256(0);
    uint256 decommitment_index = uint256(0);

    for(; hash_write_index < index_count; ++hash_write_index) {
      tree_indices[hash_write_index] = leaf_count + indices[hash_write_index];
      hashes[hash_write_index] = hash_node(bytes32(0), elements[hash_write_index]);
    }

    hash_write_index = 0;
    uint256 index;
    
    while (true) {
      index = tree_indices[hash_read_index];

      if (index == 1) return hash_node(bytes32(leaf_count), hashes[(hash_write_index == 0 ? index_count : hash_write_index) - 1]) == root;

      bool index_is_odd = index & 1 == 1;

      bytes32 right = index_is_odd ? hashes[hash_read_index++] : decommitments[decommitment_index++];
      hash_read_index %= index_count;
      bytes32 left = (index_is_odd && !(tree_indices[(hash_read_index + 1) % index_count] == (index - 1))) ? decommitments[decommitment_index++] : hashes[hash_read_index++];

      tree_indices[hash_write_index] = index >> 1;
      hashes[hash_write_index++] = hash_node(left, right);

      hash_read_index %= index_count;
      hash_write_index %= index_count;
    }
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. leaf_count must be power of 2)
  function use(uint256 leaf_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory decommitments) public {
    uint256 index_count = indices.length;
    bytes32 data_used = bytes32(0);

    for(uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
    }

    emit Data_Used(data_used);

    require(verify(leaf_count, indices, elements, decommitments), "INVALID_ELEMENTS");
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. leaf_count must be power of 2)
  function update(uint256 leaf_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory decommitments) public {
    require(indices.length == elements.length && new_elements.length == elements.length, "LENGTH_MISMATCH");
    
    uint256 index_count = indices.length;
    bytes32[] memory hashes = new bytes32[](index_count);
    bytes32[] memory new_hashes = new bytes32[](index_count);
    uint256[] memory tree_indices = new uint256[](index_count);

    uint256 hash_read_index = uint256(0);
    uint256 hash_write_index = uint256(0);
    uint256 decommitment_index = uint256(0);

    for(; hash_write_index < index_count; ++hash_write_index) {
      tree_indices[hash_write_index] = leaf_count + indices[hash_write_index];
      hashes[hash_write_index] = hash_node(bytes32(0), elements[hash_write_index]);
      new_hashes[hash_write_index] = hash_node(bytes32(0), new_elements[hash_write_index]);
    }

    hash_write_index = 0;
    uint256 index;
    
    while (true) {
      index = tree_indices[hash_read_index];

      if (index == 1) {
        hash_read_index = (hash_write_index == 0 ? index_count : hash_write_index) - 1;
        require(hash_node(bytes32(leaf_count), hashes[hash_read_index]) == root, "INVALID_ELEMENTS");
        
        root = hash_node(bytes32(leaf_count), new_hashes[hash_read_index]);
      }

      bool index_is_odd = index & 1 == 1;
      bool right_flag = index_is_odd && !(tree_indices[(hash_read_index + 1) % index_count] == (index - 1));

      bytes32 right = index_is_odd ? hashes[hash_read_index] : decommitments[decommitment_index];
      bytes32 new_right = index_is_odd ? new_hashes[hash_read_index++] : decommitments[decommitment_index++];
      hash_read_index %= index_count;

      bytes32 left = right_flag ? decommitments[decommitment_index] : hashes[hash_read_index];
      bytes32 new_left = right_flag ? decommitments[decommitment_index++] : hashes[hash_read_index++];
      hash_read_index %= index_count;

      tree_indices[hash_write_index] = index >> 1;
      hashes[hash_write_index] = hash_node(left, right);
      new_hashes[hash_write_index++] = hash_node(new_left, new_right);
      hash_write_index %= index_count;
    }
  }

  // Indices are required to be sorted highest to lowest.
  // Does not work with unbalanced tree (i.e. leaf_count must be power of 2)
  function use_and_update(uint256 leaf_count, uint256[] memory indices, bytes32[] memory elements, bytes32[] memory decommitments) public {
    uint256 index_count = indices.length;
    bytes32[] memory new_elements = new bytes32[](index_count);
    bytes32 data_used = bytes32(0);

    for(uint256 i; i < index_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
      new_elements[i] = data_used;
    }

    emit Data_Used(data_used);

    update(leaf_count, indices, elements, new_elements, decommitments);
  }
}
