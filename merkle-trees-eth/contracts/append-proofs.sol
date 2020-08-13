// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract Append_Proofs {
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

  function bit_count_32(uint32 n) internal pure returns (uint32) {
    uint32 m = n - ((n >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

    return ((m + (m >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  }

  function round_up_to_power_of_2(uint32 n) internal pure returns (uint32) {
    if (bit_count_32(n) == 1) return n;

    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;

    return n + 1;
  }

  function set_root(bytes32 _root) public {
    root = _root;
  }

  function verify(uint256 total_element_count, bytes32[] memory decommitments) public view returns (bool) {
    uint256 n = bit_count_32(uint32(total_element_count));
    bytes32 hash = decommitments[--n];

    while (n > 0) {
      hash = hash_node(decommitments[--n], hash);
    }

    return hash_node(bytes32(total_element_count), hash) == root;
  }

  function append_one(uint256 total_element_count, bytes32 new_element, bytes32[] memory decommitments) public {
    uint256 n = bit_count_32(uint32(total_element_count));
    bytes32 hash = decommitments[--n];
    bytes32 new_hash = hash_node(decommitments[n], hash_node(bytes32(0), new_element));

    while (n > 0) {
      new_hash = hash_node(decommitments[--n], new_hash);
      hash = hash_node(decommitments[n], hash);
    }

    require(hash_node(bytes32(total_element_count), hash) == root, "INVALID_PROOF");

    root = hash_node(bytes32(total_element_count + 1), new_hash);
  }

  function append_many(uint256 total_element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) public {
    uint256 n = bit_count_32(uint32(total_element_count)) - 1;
    bytes32 hash = decommitments[n];
    bytes32[] memory new_hashes = new bytes32[]((new_elements.length >> 1) + 1);
    uint256 new_total_element_count = total_element_count + new_elements.length;
    uint256 upper_bound = new_total_element_count - 1;
    uint256 write_index;
    uint256 read_index;
    uint256 offset = total_element_count;
    uint256 index = offset;
    bool use_elements;

    while (upper_bound > 0) {
      use_elements = offset >= total_element_count;

      if ((write_index == 0) && (index & 1 == 1)) {
        new_hashes[write_index++] = hash_node(decommitments[n--], use_elements ? hash_node(bytes32(0), new_elements[read_index++]) : new_hashes[read_index++]);

        if (n < total_element_count) hash = hash_node(decommitments[n], hash);

        index++;
      } else if (index < upper_bound) {
        new_hashes[write_index++] = hash_node(use_elements ? hash_node(bytes32(0), new_elements[read_index++]) : new_hashes[read_index++], use_elements ? hash_node(bytes32(0), new_elements[read_index++]) : new_hashes[read_index++]);
        index += 2;
      }

      if (index >= upper_bound) {
        if (index == upper_bound) new_hashes[write_index] = use_elements ? hash_node(bytes32(0), new_elements[read_index]) : new_hashes[read_index];

        read_index = 0;
        write_index = 0;
        upper_bound >>= 1;
        offset >>= 1;
        index = offset;
      }
    }

    require(hash_node(bytes32(total_element_count), hash) == root, "INVALID_PROOF");

    root = hash_node(bytes32(new_total_element_count), new_hashes[0]);
  }
}
