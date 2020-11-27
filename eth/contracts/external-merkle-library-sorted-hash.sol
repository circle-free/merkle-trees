// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library External_Merkle_Library_Sorted_Hash {
  // Hashes a and b in the order they are passed
  function hash_node(bytes32 a, bytes32 b) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, a)
      mstore(0x20, b)
      hash := keccak256(0x00, 0x40)
    }
  }

  // Hashes a and b in sorted order
  function hash_pair(bytes32 a, bytes32 b) internal pure returns (bytes32 hash) {
    hash = a < b ? hash_node(a, b) : hash_node(b, a);
  }

  // Counts number of set bits (1's) in 32-bit unsigned integer
  function bit_count_32(uint32 n) internal pure returns (uint32) {
    n = n - ((n >> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >> 2) & 0x33333333);

    return (((n + (n >> 4)) & 0xF0F0F0F) * 0x1010101) >> 24;
  }

  // Round 32-bit unsigned integer up to the nearest power of 2
  function round_up_to_power_of_2(uint32 n) internal pure returns (uint32) {
    if (bit_count_32(n) == 1) return n;

    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;

    return n + 1;
  }

  // Get the Element Merkle Root for a tree with just a single bytes element in calldata
  function get_root_from_one(bytes calldata element) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes1(0), element));
  }

  // Get the Element Merkle Root for a tree with just a single bytes32 element in calldata
  function get_root_from_one(bytes32 element) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes1(0), element));
  }

  // Get nodes (parent of leafs) from bytes elements in calldata
  function get_nodes_from_elements(bytes[] calldata elements) internal pure returns (bytes32[] memory nodes) {
    uint256 element_count = elements.length;
    uint256 node_count = (element_count >> 1) + (element_count & 1);
    nodes = new bytes32[](node_count);
    uint256 write_index;
    uint256 left_index;

    while (write_index < node_count) {
      left_index = write_index << 1;

      if (left_index == element_count - 1) {
        nodes[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[left_index]));
        break;
      }

      nodes[write_index++] = hash_pair(
        keccak256(abi.encodePacked(bytes1(0), elements[left_index])),
        keccak256(abi.encodePacked(bytes1(0), elements[left_index + 1]))
      );
    }
  }

  // Get nodes (parent of leafs) from bytes32 elements in calldata
  function get_nodes_from_elements(bytes32[] calldata elements) internal pure returns (bytes32[] memory nodes) {
    uint256 element_count = elements.length;
    uint256 node_count = (element_count >> 1) + (element_count & 1);
    nodes = new bytes32[](node_count);
    uint256 write_index;
    uint256 left_index;

    while (write_index < node_count) {
      left_index = write_index << 1;

      if (left_index == element_count - 1) {
        nodes[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[left_index]));
        break;
      }

      nodes[write_index++] = hash_pair(
        keccak256(abi.encodePacked(bytes1(0), elements[left_index])),
        keccak256(abi.encodePacked(bytes1(0), elements[left_index + 1]))
      );
    }
  }

  // Get the Element Merkle Root given nodes (parent of leafs)
  function get_root_from_nodes(bytes32[] memory nodes) internal pure returns (bytes32) {
    uint256 node_count = nodes.length;
    uint256 write_index;
    uint256 left_index;

    while (node_count > 1) {
      left_index = write_index << 1;

      if (left_index == node_count - 1) {
        nodes[write_index] = nodes[left_index];
        write_index = 0;
        node_count = (node_count >> 1) + (node_count & 1);
        continue;
      }

      if (left_index >= node_count) {
        write_index = 0;
        node_count = (node_count >> 1) + (node_count & 1);
        continue;
      }

      nodes[write_index++] = hash_pair(nodes[left_index], nodes[left_index + 1]);
    }

    return nodes[0];
  }

  // Get the Element Merkle Root for a tree with several bytes elements in calldata
  function get_root_from_many(bytes[] calldata elements) internal pure returns (bytes32) {
    return get_root_from_nodes(get_nodes_from_elements(elements));
  }

  // Get the Element Merkle Root for a tree with several bytes32 elements in calldata
  function get_root_from_many(bytes32[] calldata elements) internal pure returns (bytes32) {
    return get_root_from_nodes(get_nodes_from_elements(elements));
  }

  // get_root_from_size_proof cannot be implemented with sorted hashed pairs

  // Get the original Element Merkle Root, given an index, a leaf, and a Single Proof
  function get_root_from_leaf_and_single_proof(
    uint256 index,
    bytes32 leaf,
    bytes32[] calldata proof
  ) internal pure returns (bytes32) {
    uint256 proof_index = proof.length - 1;
    uint256 upper_bound = uint256(proof[0]) - 1;

    while (proof_index > 0) {
      if (index != upper_bound || (index & 1 == 1)) {
        leaf = hash_pair(proof[proof_index], leaf);
        proof_index -= 1;
      }

      index >>= 1;
      upper_bound >>= 1;
    }

    return leaf;
  }

  // Get the original Element Merkle Root, given an index, a bytes element in calldata, and a Single Proof
  function get_root_from_single_proof(
    uint256 index,
    bytes calldata element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(bytes1(0), element));
    hash = get_root_from_leaf_and_single_proof(index, hash, proof);
  }

  // Get the original Element Merkle Root, given an index, a bytes32 element, and a Single Proof
  function get_root_from_single_proof(
    uint256 index,
    bytes32 element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 hash) {
    hash = keccak256(abi.encodePacked(bytes1(0), element));
    hash = get_root_from_leaf_and_single_proof(index, hash, proof);
  }

  // Get the original and updated Element Merkle Root, given an index, a leaf, an update leaf, and a Single Proof
  function get_roots_from_leaf_and_single_proof_update(
    uint256 index,
    bytes32 leaf,
    bytes32 update_leaf,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 scratch, bytes32) {
    uint256 proof_index = proof.length - 1;
    uint256 upper_bound = uint256(proof[0]) - 1;

    while (proof_index > 0) {
      if ((index != upper_bound) || (index & 1 == 1)) {
        scratch = proof[proof_index];
        proof_index -= 1;
        leaf = hash_pair(scratch, leaf);
        update_leaf = hash_pair(scratch, update_leaf);
      }

      index >>= 1;
      upper_bound >>= 1;
    }

    return (leaf, update_leaf);
  }

  // Get the original and updated Element Merkle Root,
  // given an index, a bytes element in calldata, a bytes update element in calldata, and a Single Proof
  function get_roots_from_single_proof_update(
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 hash, bytes32 update_hash) {
    hash = keccak256(abi.encodePacked(bytes1(0), element));
    update_hash = keccak256(abi.encodePacked(bytes1(0), update_element));
    return get_roots_from_leaf_and_single_proof_update(index, hash, update_hash, proof);
  }

  // Get the original and updated Element Merkle Root, given an index, a bytes32 element, a bytes32 update element, and a Single Proof
  function get_roots_from_single_proof_update(
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 hash, bytes32 update_hash) {
    hash = keccak256(abi.encodePacked(bytes1(0), element));
    update_hash = keccak256(abi.encodePacked(bytes1(0), update_element));
    return get_roots_from_leaf_and_single_proof_update(index, hash, update_hash, proof);
  }

  // get_indices_from_multi_proof cannot be implemented with sorted hashed pairs

  // Get leafs from bytes elements in calldata, in reverse order
  function get_reversed_leafs_from_elements(bytes[] calldata elements) internal pure returns (bytes32[] memory leafs) {
    uint256 element_count = elements.length;
    leafs = new bytes32[](element_count);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[read_index]));
      write_index += 1;
      read_index -= 1;
    }
  }

  // Get leafs from bytes32 elements in calldata, in reverse order
  function get_reversed_leafs_from_elements(bytes32[] calldata elements)
    internal
    pure
    returns (bytes32[] memory leafs)
  {
    uint256 element_count = elements.length;
    leafs = new bytes32[](element_count);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[read_index]));
      write_index += 1;
      read_index -= 1;
    }
  }

  // Get the original Element Merkle Root, given leafs and an Existence Multi Proof
  function get_root_from_leafs_and_multi_proof(bytes32[] memory leafs, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 right)
  {
    uint256 leaf_count = leafs.length;
    uint256 read_index;
    uint256 write_index;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) return leafs[(write_index == 0 ? leaf_count : write_index) - 1];

        leafs[write_index] = leafs[read_index];

        read_index = (read_index + 1) % leaf_count;
        write_index = (write_index + 1) % leaf_count;
        bit_check <<= 1;
        continue;
      }

      right = (flags & bit_check == bit_check) ? leafs[read_index++] : proof[proof_index++];

      read_index %= leaf_count;

      leafs[write_index] = hash_pair(right, leafs[read_index]);

      read_index = (read_index + 1) % leaf_count;
      write_index = (write_index + 1) % leaf_count;
      bit_check <<= 1;
    }
  }

  // Get the original Element Merkle Root, given bytes elements in calldata and an Existence Multi Proof
  function get_root_from_multi_proof(bytes[] calldata elements, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32)
  {
    return get_root_from_leafs_and_multi_proof(get_reversed_leafs_from_elements(elements), proof);
  }

  // Get the original Element Merkle Root, given bytes32 elements in calldata and an Existence Multi Proof
  function get_root_from_multi_proof(bytes32[] calldata elements, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32)
  {
    return get_root_from_leafs_and_multi_proof(get_reversed_leafs_from_elements(elements), proof);
  }

  // Get current and update leafs from current bytes elements in calldata and update bytes elements in calldata, in reverse order
  function get_reversed_leafs_from_current_and_update_elements(
    bytes[] calldata elements,
    bytes[] calldata update_elements
  ) internal pure returns (bytes32[] memory leafs, bytes32[] memory update_leafs) {
    uint256 element_count = elements.length;
    require(update_elements.length == element_count, "LENGTH_MISMATCH");

    leafs = new bytes32[](element_count);
    update_leafs = new bytes32[](element_count);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[read_index]));
      update_leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), update_elements[read_index]));
      write_index += 1;
      read_index -= 1;
    }
  }

  // Get current and update leafs from current bytes32 elements in calldata and update bytes32 elements in calldata, in reverse order
  function get_reversed_leafs_from_current_and_update_elements(
    bytes32[] calldata elements,
    bytes32[] calldata update_elements
  ) internal pure returns (bytes32[] memory leafs, bytes32[] memory update_leafs) {
    uint256 element_count = elements.length;
    require(update_elements.length == element_count, "LENGTH_MISMATCH");

    leafs = new bytes32[](element_count);
    update_leafs = new bytes32[](element_count);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[read_index]));
      update_leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), update_elements[read_index]));
      write_index += 1;
      read_index -= 1;
    }
  }

  // Get the original and updated Element Merkle Root, given leafs, update leafs, and an Existence Multi Proof
  function get_roots_from_leafs_and_multi_proof_update(
    bytes32[] memory leafs,
    bytes32[] memory update_leafs,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 flags, bytes32 skips) {
    uint256 leaf_count = update_leafs.length;
    uint256 read_index;
    uint256 write_index;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    flags = proof[1];
    skips = proof[2];
    bytes32 scratch;
    uint256 scratch_2;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? leaf_count : write_index) - 1;

          return (leafs[read_index], update_leafs[read_index]);
        }

        leafs[write_index] = leafs[read_index];
        update_leafs[write_index] = update_leafs[read_index];

        read_index = (read_index + 1) % leaf_count;
        write_index = (write_index + 1) % leaf_count;
        bit_check <<= 1;
        continue;
      }

      if (flags & bit_check == bit_check) {
        scratch_2 = (read_index + 1) % leaf_count;
        leafs[write_index] = hash_pair(leafs[read_index], leafs[scratch_2]);
        update_leafs[write_index] = hash_pair(update_leafs[read_index], update_leafs[scratch_2]);
        read_index += 2;
      } else {
        scratch = proof[proof_index++];
        leafs[write_index] = hash_pair(scratch, leafs[read_index]);
        update_leafs[write_index] = hash_pair(scratch, update_leafs[read_index]);
        read_index += 1;
      }

      read_index %= leaf_count;
      write_index = (write_index + 1) % leaf_count;
      bit_check <<= 1;
    }
  }

  // Get the original and updated Element Merkle Root,
  // given bytes elements in calldata, bytes update elements in calldata, and an Existence Multi Proof
  function get_roots_from_multi_proof_update(
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes32[] calldata proof
  ) internal pure returns (bytes32, bytes32) {
    (bytes32[] memory leafs, bytes32[] memory update_leafs) = get_reversed_leafs_from_current_and_update_elements(
      elements,
      update_elements
    );
    return get_roots_from_leafs_and_multi_proof_update(leafs, update_leafs, proof);
  }

  // Get the original and updated Element Merkle Root,
  // given bytes32 elements in calldata, bytes32 update elements in calldata, and an Existence Multi Proof
  function get_roots_from_multi_proof_update(
    bytes32[] calldata elements,
    bytes32[] calldata update_elements,
    bytes32[] calldata proof
  ) internal pure returns (bytes32, bytes32) {
    (bytes32[] memory leafs, bytes32[] memory update_leafs) = get_reversed_leafs_from_current_and_update_elements(
      elements,
      update_elements
    );
    return get_roots_from_leafs_and_multi_proof_update(leafs, update_leafs, proof);
  }

  // Get the original Element Merkle Root, given an Append Proof
  function get_root_from_append_proof(bytes32[] calldata proof) internal pure returns (bytes32 hash) {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    hash = proof[proof_index];

    while (proof_index > 1) {
      proof_index -= 1;
      hash = hash_pair(proof[proof_index], hash);
    }
  }

  // Get the original and updated Element Merkle Root, given append leaf and an Append Proof
  function get_roots_from_leaf_and_append_proof_single_append(bytes32 append_leaf, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 hash, bytes32 scratch)
  {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    hash = proof[proof_index];
    append_leaf = hash_pair(hash, append_leaf);

    while (proof_index > 1) {
      proof_index -= 1;
      scratch = proof[proof_index];
      append_leaf = hash_pair(scratch, append_leaf);
      hash = hash_pair(scratch, hash);
    }

    return (hash, append_leaf);
  }

  // Get the original and updated Element Merkle Root, given a bytes append element in calldata and an Append Proof
  function get_roots_from_append_proof_single_append(bytes calldata append_element, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 append_leaf, bytes32)
  {
    append_leaf = keccak256(abi.encodePacked(bytes1(0), append_element));
    return get_roots_from_leaf_and_append_proof_single_append(append_leaf, proof);
  }

  // Get the original and updated Element Merkle Root, given a bytes32 append element in calldata and an Append Proof
  function get_roots_from_append_proof_single_append(bytes32 append_element, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 append_leaf, bytes32)
  {
    append_leaf = keccak256(abi.encodePacked(bytes1(0), append_element));
    return get_roots_from_leaf_and_append_proof_single_append(append_leaf, proof);
  }

  // Get leafs from bytes elements in calldata
  function get_leafs_from_elements(bytes[] calldata elements) internal pure returns (bytes32[] memory leafs) {
    uint256 element_count = elements.length;
    leafs = new bytes32[](element_count);

    while (element_count > 0) {
      element_count -= 1;
      leafs[element_count] = keccak256(abi.encodePacked(bytes1(0), elements[element_count]));
    }
  }

  // Get leafs from bytes32 elements in calldata
  function get_leafs_from_elements(bytes32[] calldata elements) internal pure returns (bytes32[] memory leafs) {
    uint256 element_count = elements.length;
    leafs = new bytes32[](element_count);

    while (element_count > 0) {
      element_count -= 1;
      leafs[element_count] = keccak256(abi.encodePacked(bytes1(0), elements[element_count]));
    }
  }

  // Get the original and updated Element Merkle Root, given append leafs and an Append Proof
  function get_roots_from_leafs_and_append_proof_multi_append(bytes32[] memory append_leafs, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 hash, bytes32)
  {
    uint256 leaf_count = append_leafs.length;
    uint256 write_index;
    uint256 read_index;
    uint256 offset = uint256(proof[0]);
    uint256 index = offset;

    // reuse leaf_count variable as upper_bound, since leaf_count no longer needed
    leaf_count += offset;
    leaf_count -= 1;
    uint256 proof_index = bit_count_32(uint32(offset));
    hash = proof[proof_index];

    while (leaf_count > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        append_leafs[0] = hash_pair(proof[proof_index], append_leafs[read_index]);
        proof_index -= 1;
        read_index += 1;

        if (proof_index > 0) {
          hash = hash_pair(proof[proof_index], hash);
        }

        write_index = 1;
        index += 1;
      } else if (index < leaf_count) {
        append_leafs[write_index++] = hash_pair(append_leafs[read_index++], append_leafs[read_index]);
        read_index += 1;
        index += 2;
      }

      if (index >= leaf_count) {
        if (index == leaf_count) {
          append_leafs[write_index] = append_leafs[read_index];
        }

        read_index = 0;
        write_index = 0;
        leaf_count >>= 1;
        offset >>= 1;
        index = offset;
      }
    }

    return (hash, append_leafs[0]);
  }

  // Get the original and updated Element Merkle Root, given bytes append elements in calldata and an Append Proof
  function get_roots_from_append_proof_multi_append(bytes[] calldata append_elements, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32, bytes32)
  {
    return get_roots_from_leafs_and_append_proof_multi_append(get_leafs_from_elements(append_elements), proof);
  }

  // Get the original and updated Element Merkle Root, given bytes32 append elements in calldata and an Append Proof
  function get_roots_from_append_proof_multi_append(bytes32[] calldata append_elements, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32, bytes32)
  {
    return get_roots_from_leafs_and_append_proof_multi_append(get_leafs_from_elements(append_elements), proof);
  }

  // Get the updated Element Merkle Root, given an append leaf and an Append Proof
  function get_new_root_from_leafs_and_append_proof_single_append(bytes32 append_leaf, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 append_hash)
  {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    append_hash = hash_pair(proof[proof_index], append_leaf);

    while (proof_index > 1) {
      proof_index -= 1;
      append_hash = hash_pair(proof[proof_index], append_hash);
    }
  }

  // Get the updated Element Merkle Root, given a bytes append elements in calldata and an Append Proof
  function get_new_root_from_append_proof_single_append(bytes calldata append_element, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 append_leaf)
  {
    append_leaf = keccak256(abi.encodePacked(bytes1(0), append_element));
    return get_new_root_from_leafs_and_append_proof_single_append(append_leaf, proof);
  }

  // Get the updated Element Merkle Root, given a bytes32 append elements in calldata and an Append Proof
  function get_new_root_from_append_proof_single_append(bytes32 append_element, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 append_leaf)
  {
    append_leaf = keccak256(abi.encodePacked(bytes1(0), append_element));
    return get_new_root_from_leafs_and_append_proof_single_append(append_leaf, proof);
  }

  // Get the updated Element Merkle Root, given append leafs and an Append Proof
  function get_new_root_from_leafs_and_append_proof_multi_append(bytes32[] memory append_leafs, bytes32[] memory proof)
    internal
    pure
    returns (bytes32)
  {
    uint256 leaf_count = append_leafs.length;
    uint256 write_index;
    uint256 read_index;
    uint256 offset = uint256(proof[0]);
    uint256 index = offset;

    // reuse leaf_count variable as upper_bound, since leaf_count no longer needed
    leaf_count += offset;
    leaf_count -= 1;
    uint256 proof_index = proof.length - 1;

    while (leaf_count > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        append_leafs[0] = hash_pair(proof[proof_index], append_leafs[read_index]);

        read_index += 1;
        proof_index -= 1;
        write_index = 1;
        index += 1;
      } else if (index < leaf_count) {
        append_leafs[write_index++] = hash_pair(append_leafs[read_index++], append_leafs[read_index++]);

        index += 2;
      }

      if (index >= leaf_count) {
        if (index == leaf_count) {
          append_leafs[write_index] = append_leafs[read_index];
        }

        read_index = 0;
        write_index = 0;
        leaf_count >>= 1;
        offset >>= 1;
        index = offset;
      }
    }

    return append_leafs[0];
  }

  // Get the updated Element Merkle Root, given bytes append elements in calldata and an Append Proof
  function get_new_root_from_append_proof_multi_append(bytes[] calldata append_elements, bytes32[] memory proof)
    internal
    pure
    returns (bytes32)
  {
    return get_new_root_from_leafs_and_append_proof_multi_append(get_leafs_from_elements(append_elements), proof);
  }

  // Get the updated Element Merkle Root, given bytes32 append elements in calldata and an Append Proof
  function get_new_root_from_append_proof_multi_append(bytes32[] calldata append_elements, bytes32[] memory proof)
    internal
    pure
    returns (bytes32)
  {
    return get_new_root_from_leafs_and_append_proof_multi_append(get_leafs_from_elements(append_elements), proof);
  }

  // Get the original Element Merkle Root and derive Append Proof, given an index, an append leaf, and a Single Proof
  function get_append_proof_from_leaf_and_single_proof(
    uint256 index,
    bytes32 leaf,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 append_hash, bytes32[] memory append_proof) {
    uint256 proof_index = proof.length - 1;
    uint256 append_node_index = uint256(proof[0]);
    uint256 upper_bound = append_node_index - 1;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 scratch;

    while (proof_index > 0) {
      if (index != upper_bound || (index & 1 == 1)) {
        scratch = proof[proof_index];
        leaf = hash_pair(scratch, leaf);

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_proof[append_proof_index] = scratch;
          append_hash = hash_pair(scratch, append_hash);
        }

        proof_index -= 1;
      } else if (append_node_index & 1 == 1) {
        append_proof_index -= 1;
        append_proof[append_proof_index] = leaf;
        append_hash = leaf;
      }

      index >>= 1;
      upper_bound >>= 1;
      append_node_index >>= 1;
    }

    require(append_proof_index == 2 || append_hash == leaf, "INVALID_PROOF");

    if (append_proof_index == 2) {
      append_proof[1] = leaf;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof, given an index, a bytes element in calldata, and a Single Proof
  function get_append_proof_from_single_proof(
    uint256 index,
    bytes calldata element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 leaf, bytes32[] memory) {
    leaf = keccak256(abi.encodePacked(bytes1(0), element));
    return get_append_proof_from_leaf_and_single_proof(index, leaf, proof);
  }

  // Get the original Element Merkle Root and derive Append Proof, given an index, a bytes32 element, and a Single Proof
  function get_append_proof_from_single_proof(
    uint256 index,
    bytes32 element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 leaf, bytes32[] memory) {
    leaf = keccak256(abi.encodePacked(bytes1(0), element));
    return get_append_proof_from_leaf_and_single_proof(index, leaf, proof);
  }

  // Get the original Element Merkle Root and derive Append Proof, given an index, a leaf, an update leaf, and a Single Proof
  function get_append_proof_from_leaf_and_single_proof_update(
    uint256 index,
    bytes32 leaf,
    bytes32 update_leaf,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 append_hash, bytes32[] memory append_proof) {
    uint256 proof_index = proof.length - 1;
    uint256 append_node_index = uint256(proof[0]);
    uint256 upper_bound = append_node_index - 1;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 scratch;

    while (proof_index > 0) {
      if (index != upper_bound || (index & 1 == 1)) {
        scratch = proof[proof_index];
        leaf = hash_pair(scratch, leaf);
        update_leaf = hash_pair(scratch, update_leaf);

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_proof[append_proof_index] = scratch;
          append_hash = hash_pair(scratch, append_hash);
        }

        proof_index -= 1;
      } else if (append_node_index & 1 == 1) {
        append_proof_index -= 1;
        append_proof[append_proof_index] = update_leaf;
        append_hash = leaf;
      }

      index >>= 1;
      upper_bound >>= 1;
      append_node_index >>= 1;
    }

    require(append_proof_index == 2 || append_hash == leaf, "INVALID_PROOF");

    if (append_proof_index == 2) {
      append_proof[1] = update_leaf;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof,
  // given an index, a bytes element in calldata, a bytes update element in calldata, and a Single Proof
  function get_append_proof_from_single_proof_update(
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 leaf, bytes32[] memory) {
    leaf = keccak256(abi.encodePacked(bytes1(0), element));
    bytes32 update_leaf = keccak256(abi.encodePacked(bytes1(0), update_element));
    return get_append_proof_from_leaf_and_single_proof_update(index, leaf, update_leaf, proof);
  }

  // Get the original Element Merkle Root and derive Append Proof,
  // given an index, a bytes32 element, a bytes32 update element, and a Single Proof
  function get_append_proof_from_single_proof_update(
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] calldata proof
  ) internal pure returns (bytes32 leaf, bytes32[] memory) {
    leaf = keccak256(abi.encodePacked(bytes1(0), element));
    bytes32 update_leaf = keccak256(abi.encodePacked(bytes1(0), update_element));
    return get_append_proof_from_leaf_and_single_proof_update(index, leaf, update_leaf, proof);
  }

  // Hashes leaf at read index and next index (circular) to write index
  function hash_within_leafs(
    bytes32[] memory leafs,
    uint256 write_index,
    uint256 read_index,
    uint256 leaf_count
  ) internal pure {
    leafs[write_index] = hash_pair(leafs[read_index], leafs[(read_index + 1) % leaf_count]);
  }

  // Hashes value with leaf at read index to write index
  function hash_with_leafs(
    bytes32[] memory leafs,
    bytes32 value,
    uint256 write_index,
    uint256 read_index
  ) internal pure {
    leafs[write_index] = hash_pair(value, leafs[read_index]);
  }

  // Get the original Element Merkle Root and derive Append Proof, given leafs and an Existence Multi Proof
  function get_append_proof_from_leafs_and_multi_proof(bytes32[] memory leafs, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 append_hash, bytes32[] memory append_proof)
  {
    uint256 leaf_count = leafs.length;
    uint256 read_index;
    uint256 write_index;
    uint256 proof_index = 3;
    uint256 append_node_index = uint256(proof[0]);
    uint256 append_proof_index = uint256(bit_count_32(uint32(append_node_index))) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];
    uint256 read_index_of_append_node;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? leaf_count : write_index) - 1;

          // reuse flags as scratch variable
          flags = leafs[read_index];

          require(append_proof_index == 2 || append_hash == flags, "INVALID_PROOF");

          if (append_proof_index == 2) {
            append_proof[1] = flags;
          }

          return (append_hash, append_proof);
        }

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_hash = leafs[read_index]; // TODO scratch this leafs[read_index] above
          append_proof[append_proof_index] = leafs[read_index];
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;

        leafs[write_index] = leafs[read_index];

        read_index = (read_index + 1) % leaf_count;
        write_index = (write_index + 1) % leaf_count;
        bit_check <<= 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;

          if (flags & bit_check == bit_check) {
            // reuse read_index_of_append_node as temporary scratch variable
            read_index_of_append_node = (read_index + 1) % leaf_count;

            append_hash = hash_pair(leafs[read_index_of_append_node], append_hash);
            append_proof[append_proof_index] = leafs[read_index_of_append_node];
          } else {
            append_hash = hash_pair(proof[proof_index], append_hash);
            append_proof[append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;
      }

      if (flags & bit_check == bit_check) {
        hash_within_leafs(leafs, write_index, read_index, leaf_count);
        read_index += 2;
      } else {
        hash_with_leafs(leafs, proof[proof_index], write_index, read_index);
        proof_index += 1;
        read_index += 1;
      }

      read_index %= leaf_count;
      write_index = (write_index + 1) % leaf_count;
      bit_check <<= 1;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof, given bytes elements in calldata and an Existence Multi Proof
  function get_append_proof_from_multi_proof(bytes[] calldata elements, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32, bytes32[] memory)
  {
    return get_append_proof_from_leafs_and_multi_proof(get_reversed_leafs_from_elements(elements), proof);
  }

  // Get the original Element Merkle Root and derive Append Proof, given bytes32 elements in calldata and an Existence Multi Proof
  function get_append_proof_from_multi_proof(bytes32[] calldata elements, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32, bytes32[] memory)
  {
    return get_append_proof_from_leafs_and_multi_proof(get_reversed_leafs_from_elements(elements), proof);
  }

  // Get combined current and update leafs from current bytes elements in calldata and update bytes elements in calldata, in reverse order
  function get_reversed_combined_leafs_from_current_and_update_elements(
    bytes[] calldata elements,
    bytes[] calldata update_elements
  ) internal pure returns (bytes32[] memory combined_leafs) {
    uint256 element_count = elements.length;
    require(update_elements.length == element_count, "LENGTH_MISMATCH");

    combined_leafs = new bytes32[](element_count << 1);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      combined_leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[read_index]));
      combined_leafs[element_count + write_index] = keccak256(abi.encodePacked(bytes1(0), update_elements[read_index]));
      write_index += 1;
      read_index -= 1;
    }
  }

  // Get combined current and update leafs from current bytes32 elements in calldata and update bytes32 elements in calldata, in reverse order
  function get_reversed_combined_leafs_from_current_and_update_elements(
    bytes32[] calldata elements,
    bytes32[] calldata update_elements
  ) internal pure returns (bytes32[] memory combined_leafs) {
    uint256 element_count = elements.length;
    require(update_elements.length == element_count, "LENGTH_MISMATCH");

    combined_leafs = new bytes32[](element_count << 1);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      combined_leafs[write_index] = keccak256(abi.encodePacked(bytes1(0), elements[read_index]));
      combined_leafs[element_count + write_index] = keccak256(abi.encodePacked(bytes1(0), update_elements[read_index]));
      write_index += 1;
      read_index -= 1;
    }
  }

  // Copy leaf and update leaf at read indices and to write indices
  function copy_within_combined_leafs(
    bytes32[] memory combined_leafs,
    uint256 write_index,
    uint256 read_index,
    uint256 leaf_count
  ) internal pure {
    combined_leafs[write_index] = combined_leafs[read_index];
    combined_leafs[leaf_count + write_index] = combined_leafs[leaf_count + read_index];
  }

  // Hashes leaf and update leaf at read indices and next indices (circular) to write indices
  function hash_within_combined_leafs(
    bytes32[] memory combined_leafs,
    uint256 write_index,
    uint256 read_index,
    uint256 leaf_count
  ) internal pure {
    uint256 scratch = (read_index + 1) % leaf_count;
    combined_leafs[write_index] = hash_pair(combined_leafs[read_index], combined_leafs[scratch]);
    combined_leafs[leaf_count + write_index] = hash_pair(
      combined_leafs[leaf_count + read_index],
      combined_leafs[leaf_count + scratch]
    );
  }

  // Hashes value with leaf and update leaf at read indices to write indices
  function hash_with_combined_leafs(
    bytes32[] memory combined_leafs,
    bytes32 value,
    uint256 write_index,
    uint256 read_index,
    uint256 leaf_count
  ) internal pure {
    combined_leafs[write_index] = hash_pair(value, combined_leafs[read_index]);
    combined_leafs[leaf_count + write_index] = hash_pair(value, combined_leafs[leaf_count + read_index]);
  }

  // Get the original Element Merkle Root and derive Append Proof, given combined leafs and update leafs and an Existence Multi Proof
  function get_append_proof_from_leafs_and_multi_proof_update(bytes32[] memory combined_leafs, bytes32[] calldata proof)
    internal
    pure
    returns (bytes32 append_hash, bytes32[] memory append_proof)
  {
    uint256 leaf_count = combined_leafs.length >> 1;
    uint256 read_index;
    uint256 write_index;
    uint256 read_index_of_append_node;
    uint256 proof_index = 3;
    uint256 append_node_index = uint256(proof[0]);
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? leaf_count : write_index) - 1;

          // reuse flags as scratch variable
          flags = combined_leafs[read_index];

          require(append_proof_index == 2 || append_hash == flags, "INVALID_PROOF");

          if (append_proof_index == 2) {
            append_proof[1] = combined_leafs[leaf_count + read_index];
          }

          return (flags, append_proof);
        }

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_hash = combined_leafs[read_index];
          append_proof[append_proof_index] = combined_leafs[leaf_count + read_index];
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;

        combined_leafs[write_index] = combined_leafs[read_index];
        combined_leafs[leaf_count + write_index] = combined_leafs[leaf_count + read_index];

        read_index = (read_index + 1) % leaf_count;
        write_index = (write_index + 1) % leaf_count;
        bit_check <<= 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;

          if (flags & bit_check == bit_check) {
            // use read_index_of_append_node as temporary scratch
            read_index_of_append_node = (read_index + 1) % leaf_count;

            append_hash = hash_pair(combined_leafs[read_index_of_append_node], append_hash);
            append_proof[append_proof_index] = combined_leafs[leaf_count + read_index_of_append_node];
          } else {
            append_hash = hash_pair(proof[proof_index], append_hash);
            append_proof[append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;
      }

      if (flags & bit_check == bit_check) {
        hash_within_combined_leafs(combined_leafs, write_index, read_index, leaf_count);
        read_index += 2;
      } else {
        hash_with_combined_leafs(combined_leafs, proof[proof_index], write_index, read_index, leaf_count);
        proof_index += 1;
        read_index += 1;
      }

      read_index %= leaf_count;
      write_index = (write_index + 1) % leaf_count;
      bit_check <<= 1;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof,
  // given bytes elements in calldata, bytes update elements in calldata, and an Existence Multi Proof
  function get_append_proof_from_multi_proof_update(
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes32[] calldata proof
  ) internal pure returns (bytes32, bytes32[] memory) {
    return
      get_append_proof_from_leafs_and_multi_proof_update(
        get_reversed_combined_leafs_from_current_and_update_elements(elements, update_elements),
        proof
      );
  }

  // Get the original Element Merkle Root and derive Append Proof,
  // given bytes32 elements in calldata, bytes32 update elements in calldata, and an Existence Multi Proof
  function get_append_proof_from_multi_proof_update(
    bytes32[] calldata elements,
    bytes32[] calldata update_elements,
    bytes32[] calldata proof
  ) internal pure returns (bytes32, bytes32[] memory) {
    return
      get_append_proof_from_leafs_and_multi_proof_update(
        get_reversed_combined_leafs_from_current_and_update_elements(elements, update_elements),
        proof
      );
  }

  // INTERFACE: Check if bytes element in calldata exists at index, given a root and a Single Proof
  function element_exists(
    bytes32 root,
    uint256 index,
    bytes calldata element,
    bytes32[] calldata proof
  ) external pure returns (bool) {
    return hash_node(proof[0], get_root_from_single_proof(index, element, proof)) == root;
  }

  // INTERFACE: Check if bytes32 element exists at index, given a root and a Single Proof
  function element_exists(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32[] calldata proof
  ) external pure returns (bool) {
    return hash_node(proof[0], get_root_from_single_proof(index, element, proof)) == root;
  }

  // INTERFACE: Check if bytes elements in calldata exist, given a root and a Single Proof
  function elements_exist(
    bytes32 root,
    bytes[] calldata elements,
    bytes32[] calldata proof
  ) external pure returns (bool) {
    return hash_node(proof[0], get_root_from_multi_proof(elements, proof)) == root;
  }

  // INTERFACE: Check if bytes32 elements in calldata exist, given a root and a Single Proof
  function elements_exist(
    bytes32 root,
    bytes32[] calldata elements,
    bytes32[] calldata proof
  ) external pure returns (bool) {
    return hash_node(proof[0], get_root_from_multi_proof(elements, proof)) == root;
  }

  // get_indices cannot be implemented with sorted hashed pairs

  // verify_size_with_proof cannot be implemented with sorted hashed pairs

  // INTERFACE: Check tree size, given a the Element Merkle Root
  function verify_size(
    bytes32 root,
    uint256 size,
    bytes32 element_root
  ) external pure returns (bool) {
    if (root == bytes32(0) && size == 0) return true;

    return hash_node(bytes32(size), element_root) == root;
  }

  // INTERFACE: Try to update a bytes element in calldata, given a root, and index, an bytes element in calldata, and a Single Proof
  function try_update_one(
    bytes32 root,
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  // INTERFACE: Try to update a bytes32 element, given a root, and index, an bytes32 element, and a Single Proof
  function try_update_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  // INTERFACE: Try to update bytes elements in calldata, given a root, bytes elements in calldata, and an Existence Multi Proof
  function try_update_many(
    bytes32 root,
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  // INTERFACE: Try to update bytes32 elements in calldata, given a root, bytes32 elements in calldata, and an Existence Multi Proof
  function try_update_many(
    bytes32 root,
    bytes32[] calldata elements,
    bytes32[] calldata update_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  // INTERFACE: Try to append a bytes element in calldata, given a root and an Append Proof
  function try_append_one(
    bytes32 root,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require((root == bytes32(0)) == (total_element_count == bytes32(0)), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(uint256(1)), get_root_from_one(append_element));

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_append_proof_single_append(append_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + 1), new_element_root);
  }

  // INTERFACE: Try to append a bytes32 element, given a root and an Append Proof
  function try_append_one(
    bytes32 root,
    bytes32 append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require((root == bytes32(0)) == (total_element_count == bytes32(0)), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(uint256(1)), get_root_from_one(append_element));

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_append_proof_single_append(append_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + 1), new_element_root);
  }

  // INTERFACE: Try to append bytes elements in calldata, given a root and an Append Proof
  function try_append_many(
    bytes32 root,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require((root == bytes32(0)) == (total_element_count == bytes32(0)), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(append_elements.length), get_root_from_many(append_elements));

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_append_proof_multi_append(append_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), new_element_root);
  }

  // INTERFACE: Try to append bytes32 elements in calldata, given a root and an Append Proof
  function try_append_many(
    bytes32 root,
    bytes32[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require((root == bytes32(0)) == (total_element_count == bytes32(0)), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(append_elements.length), get_root_from_many(append_elements));

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_append_proof_multi_append(append_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), new_element_root);
  }

  // INTERFACE: Try to append a bytes element in calldata, given a root, an index, a bytes element in calldata, and a Single Proof
  function try_append_one_using_one(
    bytes32 root,
    uint256 index,
    bytes calldata element,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof(index, element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to append a bytes32 element, given a root, an index, a bytes32 element, and a Single Proof
  function try_append_one_using_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof(index, element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to append bytes elements in calldata, given a root, an index, a bytes element in calldata, and a Single Proof
  function try_append_many_using_one(
    bytes32 root,
    uint256 index,
    bytes calldata element,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof(index, element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to append bytes32 elements in calldata, given a root, an index, a bytes32 element, and a Single Proof
  function try_append_many_using_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof(index, element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to append a bytes element in calldata, given a root, bytes elements in calldata, and an Existence Multi Proof
  function try_append_one_using_many(
    bytes32 root,
    bytes[] calldata elements,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof(elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to append a bytes32 element, given a root, bytes32 elements in calldata, and an Existence Multi Proof
  function try_append_one_using_many(
    bytes32 root,
    bytes32[] calldata elements,
    bytes32 append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof(elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to append bytes elements in calldata, given a root, bytes elements in calldata, and an Existence Multi Proof
  function try_append_many_using_many(
    bytes32 root,
    bytes[] calldata elements,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof(elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to append bytes32 elements in calldata, given a root, bytes32 elements in calldata, and an Existence Multi Proof
  function try_append_many_using_many(
    bytes32 root,
    bytes32[] calldata elements,
    bytes32[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof(elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to update a bytes element in calldata and append a bytes element in calldata,
  // given a root, an index, a bytes element in calldata, and a Single Proof
  function try_update_one_and_append_one(
    bytes32 root,
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to update a bytes32 element and append a bytes32 element,
  // given a root, an index, a bytes32 element, and a Single Proof
  function try_update_one_and_append_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32 append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to update a bytes element in calldata and append bytes elements in calldata,
  // given a root, an index, a bytes element in calldata, and a Single Proof
  function try_update_one_and_append_many(
    bytes32 root,
    uint256 index,
    bytes calldata element,
    bytes calldata update_element,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to update a bytes32 element and append bytes32 elements in calldata,
  // given a root, an index, a bytes32 element, and a Single Proof
  function try_update_one_and_append_many(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to update bytes elements in calldata and append a bytes element in calldata,
  // given a root, bytes elements in calldata, and a Single Proof
  function try_update_many_and_append_one(
    bytes32 root,
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes calldata append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to update bytes32 elements in calldata and append a bytes32 element,
  // given a root, bytes32 elements in calldata, and a Single Proof
  function try_update_many_and_append_one(
    bytes32 root,
    bytes32[] calldata elements,
    bytes32[] calldata update_elements,
    bytes32 append_element,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // INTERFACE: Try to update bytes elements in calldata and append bytes elements in calldata,
  // given a root, bytes elements in calldata, and an Existence Multi Proof
  function try_update_many_and_append_many(
    bytes32 root,
    bytes[] calldata elements,
    bytes[] calldata update_elements,
    bytes[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Try to update bytes32 elements in calldata and append bytes32 elements in calldata,
  // given a root, bytes32 elements in calldata, and an Existence Multi Proof
  function try_update_many_and_append_many(
    bytes32 root,
    bytes32[] calldata elements,
    bytes32[] calldata update_elements,
    bytes32[] calldata append_elements,
    bytes32[] calldata proof
  ) external pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // INTERFACE: Create a tree and return the root, given a bytes element in calldata
  function create_from_one(bytes calldata element) external pure returns (bytes32 new_element_root) {
    return hash_node(bytes32(uint256(1)), get_root_from_one(element));
  }

  // INTERFACE: Create a tree and return the root, given a bytes32 element
  function create_from_one(bytes32 element) external pure returns (bytes32 new_element_root) {
    return hash_node(bytes32(uint256(1)), get_root_from_one(element));
  }

  // INTERFACE: Create a tree and return the root, given bytes elements in calldata
  function create_from_many(bytes[] calldata elements) external pure returns (bytes32 new_element_root) {
    return hash_node(bytes32(elements.length), get_root_from_many(elements));
  }

  // INTERFACE: Create a tree and return the root, given bytes32 elements in calldata
  function create_from_many(bytes32[] calldata elements) external pure returns (bytes32 new_element_root) {
    return hash_node(bytes32(elements.length), get_root_from_many(elements));
  }
}
