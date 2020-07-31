// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

// TODO: vulnerable to second pre-image attack. Consider mixing in depth.

contract AppendableMerkle {
  bytes32 public mixed_root;

  event Test(bytes32 event_data);

  constructor(bytes32 _mixed_root) public {
    mixed_root = _mixed_root;
  }

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  function bit_count(uint256 n) internal pure returns (uint16 bits) {
    uint256 m = n - ((n >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

    return uint16(((m + (m >> 4) & 0xF0F0F0F) * 0x1010101) >> 24);
  }

  // Indices are required to be sorted highest to lowest.
  function append(bytes32 value, bytes32 root, uint256 real_leaf_count, bytes32[] memory decommitments) public {
    require(bit_count(real_leaf_count) == decommitments.length, "DECOMMITMENT_LENGTH_MISMATCH");

    // State is empty, just set mixed root to H(1, v)
    if (mixed_root == bytes32(0) && root == bytes32(0) && real_leaf_count == uint256(0)) {
      mixed_root = hash_node(bytes32(0x0000000000000000000000000000000000000000000000000000000000000001), value);
      return;
    }

    require(mixed_root != bytes32(0) && root != bytes32(0) && real_leaf_count != uint256(0), "PARAMETERS_MISSING");
    require(hash_node(bytes32(real_leaf_count), root) == mixed_root, "INVALID_PARAMETERS");

    // Merkle Tree is perect, just set mixed root to H(n + 1, H(r, v))
    if (real_leaf_count & (real_leaf_count-1) == 0) {
      mixed_root = hash_node(bytes32(real_leaf_count + 1), hash_node(root, value));
      return;
    }

    uint256 n = decommitments.length - 1;
    bytes32 new_root = hash_node(decommitments[n], value);

    for (uint256 i = n; i > 0; ++i) {
      new_root = hash_node(decommitments[i-1], new_root);
      decommitments[i-1] = hash_node(decommitments[i-1], decommitments[i]);

      if (i == 1) {
        require(hash_node(bytes32(real_leaf_count), decommitments[0]) == mixed_root, "INVALID_DECOMMITMENTS");

        mixed_root = hash_node(bytes32(real_leaf_count + 1), new_root);
        return;
      }
    }
  }
}
