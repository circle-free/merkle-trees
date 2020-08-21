// SPDX-License-Identifier: MIT

// NOTE: This is likely not optimized

pragma solidity >=0.6.0 <0.8.0;

library Merkle_Library_Optimized {
  function hash_node(bytes32 a, bytes32 b) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, a)
      mstore(0x20, b)
      hash := keccak256(0x00, 0x40)
    }

    return hash;
  }

  function hash_pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
    return a < b ? hash_node(a, b) : hash_node(b, a);
  }

  // TODO: bit_count_256

  function bit_count_32(uint32 n) internal pure returns (uint32) {
    uint32 m = n - ((n >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

    return ((m + (m >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  }

  function get_root_from_one(bytes32 element) internal pure returns (bytes32) {
    return hash_node(bytes32(0), element);
  }

  function get_root_from_many(bytes32[] memory elements) internal pure returns (bytes32) {
    uint256 total_element_count = elements.length;
    uint256 hashes_size = (total_element_count >> 1) + (total_element_count & 1);
    bytes32[] memory hashes = new bytes32[](hashes_size);
    uint256 write_index;
    uint256 left_index;

    while (write_index < hashes_size) {
      left_index = write_index << 1;

      if (left_index == total_element_count - 1) {
        hashes[write_index] = hash_node(bytes32(0), elements[left_index]);
        break;
      }

      hashes[write_index++] = hash_pair(hash_node(bytes32(0), elements[left_index]), hash_node(bytes32(0), elements[left_index + 1]));
    }

    write_index = 0;

    while (hashes_size > 1) {
      left_index = write_index << 1;

      if (left_index == hashes_size - 1) {
        hashes[write_index++] = hashes[left_index];
      }

      if (left_index >= hashes_size) {
        write_index = 0;
        hashes_size = (hashes_size >> 1) + (hashes_size & 1);
        continue;
      }

      hashes[write_index++] = hash_pair(hashes[left_index], hashes[left_index + 1]);
    }

    return hashes[0];
  }

  function get_root_from_single_proof(uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) internal pure returns (bytes32 hash) {
    uint256 decommitment_index = decommitments.length;
    hash = hash_node(bytes32(0), element);
    uint256 upperBound = total_element_count - 1;

    while(decommitment_index > 0) {
      if (index != upperBound || (index & 1 == 1)) hash = hash_pair(decommitments[--decommitment_index], hash);

      index = index >> 1;
      upperBound = upperBound >> 1;
    }

    return hash;
  }

  function get_roots_from_single_proof_update(uint256 total_element_count, uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory decommitments) internal pure returns (bytes32 hash, bytes32 new_hash) {
    uint256 decommitment_index = decommitments.length;
    hash = hash_node(bytes32(0), element);
    new_hash = hash_node(bytes32(0), new_element);
    uint256 upperBound = total_element_count - 1;

    while(decommitment_index > 0) {
      if ((index != upperBound) || (index & 1 == 1)) {
        hash = hash_pair(decommitments[--decommitment_index], hash);
        new_hash = hash_pair(decommitments[decommitment_index], new_hash);
      }

      index = index >> 1;
      upperBound = upperBound >> 1;
    }

    return (hash, new_hash);
  }

  function get_root_from_multi_proof(bytes32[] memory elements, bytes32[] memory proof) internal pure returns (bytes32) {
    uint256 verifying_element_count = elements.length;
    bytes32[] memory hashes = new bytes32[](verifying_element_count);

    uint256 write_index;

    while (write_index < verifying_element_count) {
      hashes[write_index++] = hash_node(bytes32(0), elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    uint256 decommitment_index = 2;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 right;
    bytes32 flags = proof[0];
    bytes32 skips = proof[1];

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          return hashes[(write_index == 0 ? verifying_element_count : write_index) - 1];
        }

        hashes[write_index++] = hashes[read_index++];

        read_index %= verifying_element_count;
        write_index %= verifying_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      right = (flags & bit_check == bit_check) ? hashes[read_index++] : proof[decommitment_index++];

      read_index %= verifying_element_count;

      hashes[write_index++] = hash_pair(hashes[read_index++], right);

      read_index %= verifying_element_count;
      write_index %= verifying_element_count;
      bit_check = bit_check << 1;
    }
  }

  function get_roots_from_multi_proof_update(bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32) {
    uint256 new_element_count = new_elements.length;
    require(elements.length == new_element_count, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](new_element_count << 1);
    uint256 write_index;

    while (write_index < new_element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
      hashes[write_index + new_element_count] = hash_node(bytes32(0), new_elements[write_index]);
      write_index++;
    }

    write_index = 0;
    uint256 read_index;
    uint256 decommitment_index = 2;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 flags = proof[0];
    bytes32 skips = proof[1];
    uint256 scratch1;
    
    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? new_element_count : write_index) - 1;

          return (hashes[read_index], hashes[read_index + new_element_count]);
        }

        hashes[write_index] = hashes[read_index];
        hashes[write_index + new_element_count] = hashes[read_index + new_element_count];

        read_index = (read_index + 1) % new_element_count;
        write_index = (write_index + 1) % new_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      if (flags & bit_check == bit_check) {
        scratch1 = (read_index + 1) % new_element_count;
        hashes[write_index] = hash_pair(hashes[read_index], hashes[scratch1]);
        hashes[write_index++ + new_element_count] = hash_pair(hashes[read_index + new_element_count], hashes[scratch1 + new_element_count]);
        read_index = read_index + 2;
      } else {
        hashes[write_index] = hash_pair(hashes[read_index], proof[decommitment_index]);
        hashes[write_index++ + new_element_count] = hash_pair(hashes[read_index++ + new_element_count], proof[decommitment_index++]);
      }

      read_index %= new_element_count;
      write_index %= new_element_count;
      bit_check = bit_check << 1;
    }
  }

  function get_root_from_append_proof(uint256 total_element_count, bytes32[] memory decommitments) internal pure returns (bytes32 hash) {
    uint256 decommitment_index = bit_count_32(uint32(total_element_count));
    hash = decommitments[--decommitment_index];

    while (decommitment_index > 0) {
      hash = hash_pair(decommitments[--decommitment_index], hash);
    }

    return hash;
  }

  function get_roots_from_append_proof_single_append(uint256 total_element_count, bytes32 new_element, bytes32[] memory decommitments) internal pure returns (bytes32 hash, bytes32 new_hash) {
    uint256 decommitment_index = bit_count_32(uint32(total_element_count));
    hash = decommitments[--decommitment_index];
    new_hash = hash_pair(decommitments[decommitment_index], hash_node(bytes32(0), new_element));

    while (decommitment_index > 0) {
      new_hash = hash_pair(decommitments[--decommitment_index], new_hash);
      hash = hash_pair(decommitments[decommitment_index], hash);
    }

    return (hash, new_hash);
  }

  function get_roots_from_append_proof_multi_append(uint256 total_element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) internal pure returns (bytes32 hash, bytes32) {
    uint256 upper_bound = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](upper_bound);
    uint256 write_index;

    while (write_index < upper_bound) {
      new_hashes[write_index++] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    upper_bound += total_element_count - 1;
    uint256 offset = total_element_count;
    uint256 index = offset;
    uint256 decommitment_index = bit_count_32(uint32(total_element_count)) - 1;
    hash = decommitments[decommitment_index];

    while (upper_bound > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        new_hashes[0] = hash_pair(decommitments[decommitment_index--], new_hashes[read_index++]);

        if (decommitment_index < total_element_count) hash = hash_pair(decommitments[decommitment_index], hash);

        write_index = 1;
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

    return (hash, new_hashes[0]);
  }

  function get_append_decommitments_from_multi_proof(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32[] memory append_decommitments) {
    uint256 element_count = elements.length;
    require(elements.length == element_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[](element_count);
    uint256 write_index;

    while (write_index < element_count) {
      hashes[write_index++] = hash_node(bytes32(0), elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    uint256 decommitment_index = 2;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 append_node_index = total_element_count;
    uint256 read_index_of_append_node = 0;
    uint256 append_decommitment_index = bit_count_32(uint32(total_element_count));
    append_decommitments = new bytes32[](append_decommitment_index);
    bytes32 hash;
    bytes32 flags = proof[0];
    bytes32 skips = proof[1];
    uint256 scratch1;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? element_count : write_index) - 1;

          require(append_decommitment_index == 1 || hash == hashes[read_index], "INVALID_PROOF");

          if (append_decommitment_index == 1) append_decommitments[0] = hashes[read_index];

          return (hashes[read_index], append_decommitments);
        }

        if (append_node_index & 1 == 1) {
          hash = hashes[read_index];
          append_decommitments[--append_decommitment_index] = hash;
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;

        hashes[write_index] = hashes[read_index];

        read_index = (read_index + 1) % element_count;
        write_index = (write_index + 1) % element_count;
        bit_check = bit_check << 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          if (flags & bit_check == bit_check) {
            scratch1 = (read_index + 1) % element_count;
            hash = hash_pair(hashes[scratch1], hash);
            append_decommitments[--append_decommitment_index] = hashes[scratch1];
          } else {
            hash = hash_pair(proof[decommitment_index], hash);
            append_decommitments[--append_decommitment_index] = proof[decommitment_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;
      }

      if (flags & bit_check == bit_check) {
        hashes[write_index++] = hash_pair(hashes[read_index], hashes[((read_index + 1) % element_count)]);
        read_index = read_index + 2;
      } else {
        hashes[write_index++] = hash_pair(hashes[read_index++], proof[decommitment_index]);
      }

      read_index %= element_count;
      write_index %= element_count;
      bit_check = bit_check << 1;
    }
  }

  function get_append_decommitments_from_multi_proof_update(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32[] memory) {
    uint256 update_element_count = update_elements.length;
    require(elements.length == update_element_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[](update_element_count << 1);
    uint256 write_index;

    while (write_index < update_element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
      hashes[write_index++ + update_element_count] = hash_node(bytes32(0), update_elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    uint256 decommitment_index = 2;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 append_node_index = total_element_count;
    uint256 read_index_of_append_node = 0;
    uint256 append_decommitment_index = bit_count_32(uint32(total_element_count));
    bytes32[] memory append_decommitments = new bytes32[](append_decommitment_index);
    bytes32 hash;
    bytes32 flags = proof[0];
    bytes32 skips = proof[1];
    uint256 scratch1;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? update_element_count : write_index) - 1;

          require(append_decommitment_index == 1 || hash == hashes[read_index], "INVALID_PROOF");

          if (append_decommitment_index == 1) append_decommitments[0] = hashes[read_index + update_element_count];

          return (hashes[read_index], append_decommitments);
        }

        if (append_node_index & 1 == 1) {
          hash = hashes[read_index];
          append_decommitments[--append_decommitment_index] = hashes[read_index + update_element_count];
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;

        hashes[write_index] = hashes[read_index];
        hashes[write_index++ + update_element_count] = hashes[read_index++ + update_element_count];

        read_index %= update_element_count;
        write_index %= update_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          if (flags & bit_check == bit_check) {
            scratch1 = (read_index + 1) % update_element_count;
            hash = hash_pair(hashes[scratch1], hash);
            append_decommitments[--append_decommitment_index] = hashes[scratch1 + update_element_count];
          } else {
            hash = hash_pair(proof[2 + decommitment_index], hash);
            append_decommitments[--append_decommitment_index] = proof[decommitment_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;
      }

      if (flags & bit_check == bit_check) {
        scratch1 = (read_index + 1) % update_element_count;
        hashes[write_index] = hash_pair(hashes[read_index], hashes[scratch1]);
        hashes[write_index++ + update_element_count] = hash_pair(hashes[read_index + update_element_count], hashes[scratch1 + update_element_count]);
        read_index = read_index + 2;
      } else {
        hashes[write_index] = hash_pair(hashes[read_index], proof[decommitment_index]);
        hashes[write_index++ + update_element_count] = hash_pair(hashes[read_index++ + update_element_count], proof[decommitment_index++]);
      }

      read_index %= update_element_count;
      write_index %= update_element_count;
      bit_check = bit_check << 1;
    }
  }

  function get_new_root_from_append_proof_multi_append(uint256 total_element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) internal pure returns (bytes32) {
    uint256 upper_bound = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](upper_bound);
    uint256 write_index;

    while (write_index < upper_bound) {
      new_hashes[write_index++] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    uint256 read_index;
    upper_bound += total_element_count - 1;
    uint256 offset = total_element_count;
    uint256 index = offset;
    uint256 decommitment_index = decommitments.length - 1;

    while (upper_bound > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        new_hashes[0] = hash_pair(decommitments[decommitment_index--], new_hashes[read_index++]);
        write_index = 1;
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

    return new_hashes[0];
  }

  function get_roots_from_combined_proof_and_append(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32) {
    (bytes32 old_element_root, bytes32[] memory append_decommitments) = get_append_decommitments_from_multi_proof(total_element_count, elements, proof);
    bytes32 new_element_root = get_new_root_from_append_proof_multi_append(total_element_count, append_elements, append_decommitments);

    return (old_element_root, new_element_root);
  }

  function get_roots_from_combined_proof_update_and_append(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32) {
    (bytes32 old_element_root, bytes32[] memory append_decommitments) = get_append_decommitments_from_multi_proof_update(total_element_count, elements, update_elements, proof);
    bytes32 new_element_root = get_new_root_from_append_proof_multi_append(total_element_count, append_elements, append_decommitments);

    return (old_element_root, new_element_root);
  }

  function element_exists(bytes32 root, uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) internal pure returns (bool) {
    if (root == bytes32(0) || total_element_count == 0) return false;
    
    return hash_node(bytes32(total_element_count), get_root_from_single_proof(total_element_count, index, element, decommitments)) == root;
  }

  function elements_exist(bytes32 root, uint256 total_element_count, bytes32[] memory elements, bytes32[] memory proof) internal pure returns (bool) {
    if (root == bytes32(0) || total_element_count == 0) return false;

    return hash_node(bytes32(total_element_count), get_root_from_multi_proof(elements, proof)) == root;
  }

  function try_update_one(bytes32 root, uint256 total_element_count, uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory decommitments) internal pure returns (bytes32) {
    require(root != bytes32(0) || total_element_count == 0, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_single_proof_update(total_element_count, index, element, new_element, decommitments);

    bytes32 total_element_count_b32 = bytes32(total_element_count);

    require(hash_node(total_element_count_b32, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count_b32, new_element_root);
  }

  function try_update_many(bytes32 root, uint256 total_element_count, bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    require(root != bytes32(0) || total_element_count == 0, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_multi_proof_update(elements, new_elements, proof);

    bytes32 total_element_count_b32 = bytes32(total_element_count);

    require(hash_node(total_element_count_b32, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count_b32, new_element_root);
  }

  function try_append_one(bytes32 root, uint256 total_element_count, bytes32 new_element, bytes32[] memory decommitments) internal pure returns (bytes32) {
    require((root == bytes32(0)) == (total_element_count == 0), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(uint256(1)), get_root_from_one(new_element));
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_append_proof_single_append(total_element_count, new_element, decommitments);

    require(hash_node(bytes32(total_element_count), old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(total_element_count + 1), new_element_root);
  }

  function try_append_many(bytes32 root, uint256 total_element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) internal pure returns (bytes32) {
    require((root == bytes32(0)) == (total_element_count == 0), "INVALID_TREE");
    
    if (root == bytes32(0)) return hash_node(bytes32(new_elements.length), get_root_from_many(new_elements));
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_append_proof_multi_append(total_element_count, new_elements, decommitments);

    require(hash_node(bytes32(total_element_count), old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(total_element_count + new_elements.length), new_element_root);
  }

  function try_update_and_append_many(bytes32 root, uint256 total_element_count, bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    require(root != bytes32(0) || total_element_count == 0, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_combined_proof_update_and_append(total_element_count, elements, update_elements, append_elements, proof);

    require(hash_node(bytes32(total_element_count), old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(total_element_count + append_elements.length), new_element_root);
  }

  function try_exist_and_append_many(bytes32 root, uint256 total_element_count, bytes32[] memory elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    require(root != bytes32(0) || total_element_count == 0, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_combined_proof_and_append(total_element_count, elements, append_elements, proof);

    require(hash_node(bytes32(total_element_count), old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(total_element_count + append_elements.length), new_element_root);
  }
}
