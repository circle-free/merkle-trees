// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

contract Append_Proofs_Sorted_Hash {
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

  function bit_count_32(uint32 n) internal pure returns (uint32) {
    uint32 m = n - ((n >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

    return ((m + (m >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
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

  function get_root(bytes32[] memory proof) public pure returns (bytes32) {
    uint256 proof_index = uint256(bit_count_32(uint32(uint256(proof[0]))));
    bytes32 hash = proof[proof_index];

    while (proof_index > 1) {
      hash = hash_pair(proof[--proof_index], hash);
    }

    return hash;
  }

  function append_one(bytes32 new_element, bytes32[] memory proof) public {
    uint256 total_element_count = uint256(proof[0]);
    uint256 proof_index = uint256(bit_count_32(uint32(total_element_count)));
    bytes32 hash = proof[proof_index];
    bytes32 new_hash = hash_pair(proof[proof_index], hash_node(bytes32(0), new_element));

    while (proof_index > 1) {
      new_hash = hash_pair(proof[--proof_index], new_hash);
      hash = hash_pair(proof[proof_index], hash);
    }

    validate(total_element_count, hash);
    set_root(total_element_count + 1, new_hash);
  }

  function append_many(bytes32[] memory new_elements, bytes32[] memory proof) public {
    uint256 total_element_count = uint256(proof[0]);
    uint256 new_elements_count = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](new_elements_count);
    uint256 write_index;

    while (write_index < new_elements_count) {
      new_hashes[write_index++] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;

    // resuse new_elements_count var here, since old one no longer needed (is now total)
    new_elements_count += total_element_count;
    uint256 upper_bound = new_elements_count - 1;
    uint256 offset = total_element_count;
    uint256 index = offset;
    uint256 proof_index = uint256(bit_count_32(uint32(total_element_count)));
    bytes32 hash = proof[proof_index];

    while (upper_bound > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        new_hashes[write_index++] = hash_pair(proof[proof_index--], new_hashes[read_index++]);

        if (proof_index > 0) hash = hash_pair(proof[proof_index], hash);

        index++;
      } else if (index < upper_bound) {
        new_hashes[write_index++] = hash_pair(new_hashes[read_index++], new_hashes[read_index++]);
        index += 2;
      }

      if (index >= upper_bound) {
        if (index == upper_bound) new_hashes[write_index] = new_hashes[read_index];

        read_index = 0;
        write_index = 0;
        upper_bound >>= 1;
        offset >>= 1;
        index = offset;
      }
    }

    validate(total_element_count, hash);
    set_root(new_elements_count, new_hashes[0]);
  }
}
