// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

// TODO: vulnerable to second pre-image attack. Consider mixing in depth.

contract Append_Proofs {
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

  function bit_count(uint32 n) internal pure returns (uint32 bits) {
    uint32 m = n - ((n >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

    return ((m + (m >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  }

  function round_up_to_power_of_2(uint32 n) internal pure returns (uint32 power_of_2) {
    if (bit_count(n) == 1) return n;

    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;

    return n + 1;
  }

  function verify(uint32 element_count, bytes32[] memory decommitments) public view returns (bool valid) {
    uint32 n = bit_count(element_count) - 1;
    bytes32 hash = decommitments[n];

    for (uint32 i = n; i > 0; --i) {
      hash = hash_node(decommitments[i - 1], hash);
    }

    return hash_node(bytes32(uint256(element_count)), hash) == root;
  }

  function append(uint32 element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) public {
    uint32 new_element_count = uint32(new_elements.length);
    uint32 total_leaf_count = round_up_to_power_of_2(element_count + new_element_count);
    bytes32[] memory hashes = new bytes32[](new_element_count);

    uint32 n = bit_count(element_count) - 1;
    bytes32 hash = decommitments[n];
    uint32 lower_bound = total_leaf_count + element_count;
    uint32 upper_bound = total_leaf_count + element_count + new_element_count - 1;
    uint32 i = 0;
    uint32 write_index = 0;
    uint32 offset = total_leaf_count + element_count;

    for(; write_index < new_element_count; ++write_index) {
      hashes[write_index] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;

    while (true) {
      uint32 index = offset + i;

      if (index == 1) {
        require(hash_node(bytes32(uint256(element_count)), hash) == root, "INVALID_ELEMENTS");

        root = hash_node(bytes32(uint256(element_count + new_element_count)), hashes[0]);
      }

      if ((index == lower_bound) && (index & 1 == 1)) {
        hashes[write_index++] = hash_node(decommitments[n--], hashes[i++]);
        hash = hash_node(decommitments[n], hash);
        continue;
      }

      if (index == upper_bound) hashes[write_index++] = hashes[i];

      if (index >= upper_bound) {
        i = 0;
        offset = offset >> 1;
        write_index = 0;
        lower_bound = lower_bound >> 1;
        upper_bound = upper_bound >> 1;
        continue;
      }

      hashes[write_index++] = hash_node(hashes[i++], hashes[i++]);
    }
  }
}
