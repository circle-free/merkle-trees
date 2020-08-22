// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

contract Flag_Multi_Proofs_Sorted_Hash {
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
  function get_root(bytes32[] memory elements, bytes32[] memory proof) public pure returns (bytes32) {
    uint256 verifying_element_count = elements.length;
    bytes32[] memory hashes = new bytes32[](verifying_element_count);
    uint256 write_index;

    while (write_index < verifying_element_count) {
      hashes[write_index++] = hash_node(bytes32(0), elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    uint256 decommitment_index;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 right;
    
    while (true) {
      if (proof[1] & bit_check == bit_check) {
        if (proof[0] & bit_check == bit_check) return hashes[(write_index == 0 ? verifying_element_count : write_index) - 1];

        hashes[write_index++] = hashes[read_index++];

        read_index %= verifying_element_count;
        write_index %= verifying_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      right = (proof[0] & bit_check == bit_check) ? hashes[read_index++] : proof[2 + decommitment_index++];

      read_index %= verifying_element_count;

      hashes[write_index++] = hash_pair(hashes[read_index++], right);

      read_index %= verifying_element_count;
      write_index %= verifying_element_count;
      bit_check = bit_check << 1;
    }
  }

  // Indices are required to be sorted highest to lowest.
  function use(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) public {
    validate(total_element_count, get_root(elements, proof));
    
    uint256 using_element_count = elements.length;
    bytes32 data_used;

    for (uint256 i; i < using_element_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
    }

    emit Data_Used(data_used);
  }

  // Indices are required to be sorted highest to lowest.
  function get_roots(bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) public pure returns(bytes32, bytes32) {
    uint256 new_element_count = new_elements.length;
    require(elements.length == new_element_count, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](new_element_count << 1);
    uint256 write_index;
    
    while (write_index < new_element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
      hashes[new_element_count + write_index++] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    uint256 decommitment_index;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 right;
    bytes32 new_right;
    
    while (true) {
      if (proof[1] & bit_check == bit_check) {
        if (proof[0] & bit_check == bit_check) {
          read_index = (write_index == 0 ? new_element_count : write_index) - 1;
          
          return (hashes[read_index], hashes[new_element_count + read_index]);
        }

        hashes[write_index] = hashes[read_index];
        hashes[new_element_count + write_index++] = hashes[new_element_count + read_index++];

        read_index %= new_element_count;
        write_index %= new_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      right = (proof[0] & bit_check == bit_check) ? hashes[read_index] : proof[2 + decommitment_index];
      new_right = (proof[0] & bit_check == bit_check) ? hashes[new_element_count + read_index++] : proof[2 + decommitment_index++];

      read_index %= new_element_count;

      hashes[write_index] = hash_pair(hashes[read_index], right);
      hashes[new_element_count + write_index++] = hash_pair(hashes[new_element_count + read_index++], new_right);

      read_index %= new_element_count;
      write_index %= new_element_count;
      bit_check = bit_check << 1;
    }
  }

  // Indices are required to be sorted highest to lowest.
  function use_and_update(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) public {
    uint256 using_element_count = elements.length;
    bytes32[] memory new_elements = new bytes32[](using_element_count);
    bytes32 data_used;

    for (uint256 i; i < using_element_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
      new_elements[i] = data_used;
    }

    emit Data_Used(data_used);

    (bytes32 old_element_root, bytes32 new_element_root) = get_roots(elements, new_elements, proof);
    
    validate(total_element_count, old_element_root);
    set_root(total_element_count, new_element_root);
  }
}
