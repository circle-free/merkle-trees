// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

library Merkle_Library_Sorted_Hash {
  function hash_node(bytes32 a, bytes32 b) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, a)
      mstore(0x20, b)
      hash := keccak256(0x00, 0x40)
    }
  }

  function hash_pair(bytes32 a, bytes32 b) internal pure returns (bytes32 hash) {
    if (a < b) {
      assembly {
        mstore(0x00, a)
        mstore(0x20, b)
        hash := keccak256(0x00, 0x40)
      }
    } else {
      assembly {
        mstore(0x00, b)
        mstore(0x20, a)
        hash := keccak256(0x00, 0x40)
      }
    }
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

  function get_root_from_one(bytes32 element) internal pure returns (bytes32) {
    return hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, element);
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
        hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[left_index]);
        break;
      }

      hashes[write_index++] = hash_pair(hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[left_index]), hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[left_index + 1]));
    }

    write_index = 0;

    while (hashes_size > 1) {
      left_index = write_index << 1;

      if (left_index == hashes_size - 1) hashes[write_index++] = hashes[left_index];

      if (left_index >= hashes_size) {
        write_index = 0;
        hashes_size = (hashes_size >> 1) + (hashes_size & 1);
        continue;
      }

      hashes[write_index++] = hash_pair(hashes[left_index], hashes[left_index + 1]);
    }

    return hashes[0];
  }

  function get_root_from_single_proof(uint256 index, bytes32 element, bytes32[] memory proof) internal pure returns (bytes32 hash) {
    uint256 proof_index = proof.length - 1;
    hash = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, element);
    uint256 upperBound = uint256(proof[0]) - 1;

    while(proof_index > 0) {
      if (index != upperBound || (index & 1 == 1)) {
        hash = hash_pair(proof[proof_index--], hash);
      }

      index >>= 1;
      upperBound >>= 1;
    }
  }

  function get_roots_from_single_proof_update(uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory proof) internal pure returns (bytes32 hash, bytes32 new_hash) {
    uint256 proof_index = proof.length - 1;
    hash = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, element);
    new_hash = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, new_element);
    uint256 upperBound = uint256(proof[0]) - 1;
    bytes32 scratch;

    while(proof_index > 0) {
      if ((index != upperBound) || (index & 1 == 1)) {
        scratch = proof[proof_index--];
        hash = hash_pair(scratch, hash);
        new_hash = hash_pair(scratch, new_hash);
      }

      index >>= 1;
      upperBound >>= 1;
    }
  }

  function get_root_from_multi_proof(bytes32[] memory elements, bytes32[] memory proof) internal pure returns (bytes32) {
    uint256 verifying_element_count = elements.length;
    bytes32[] memory hashes = new bytes32[](verifying_element_count);
    uint256 read_index = verifying_element_count - 1;
    uint256 write_index;

    while (write_index < verifying_element_count) {
      hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[read_index]);
      write_index++;
      read_index--;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 right;
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          return hashes[(write_index == 0 ? verifying_element_count : write_index) - 1];
        }

        hashes[write_index] = hashes[read_index];

        read_index = (read_index + 1) % verifying_element_count;
        write_index = (write_index + 1) % verifying_element_count;
        bit_check <<= 1;
        continue;
      }

      right = (flags & bit_check == bit_check) ? hashes[read_index++] : proof[proof_index++];

      read_index %= verifying_element_count;

      hashes[write_index] = hash_pair(hashes[read_index], right);

      read_index = (read_index + 1) % verifying_element_count;
      write_index = (write_index + 1) % verifying_element_count;
      bit_check <<= 1;
    }
  }

  function get_roots_from_multi_proof_update(bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32) {
    uint256 new_element_count = new_elements.length;
    require(elements.length == new_element_count, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](new_element_count << 1);
    uint256 read_index = new_element_count - 1;
    uint256 write_index;

    while (write_index < new_element_count) {
      hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[read_index]);
      hashes[new_element_count + write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, new_elements[read_index--]);
      write_index++;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];
    bytes32 scratch;
    
    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? new_element_count : write_index) - 1;

          return (hashes[read_index], hashes[new_element_count + read_index]);
        }

        hashes[write_index] = hashes[read_index];
        hashes[new_element_count + write_index] = hashes[new_element_count + read_index];

        read_index = (read_index + 1) % new_element_count;
        write_index = (write_index + 1) % new_element_count;
        bit_check <<= 1;
        continue;
      }

      // it seems "scratch = (read_index + 1) % new_element_count" is cheaper for large quantities

      if (flags & bit_check == bit_check) {
        hashes[write_index] = hash_pair(hashes[read_index], hashes[(read_index + 1) % new_element_count]);
        hashes[new_element_count + write_index] = hash_pair(hashes[new_element_count + read_index], hashes[new_element_count + ((read_index + 1) % new_element_count)]);

        read_index = read_index + 2;
      } else {
        scratch = proof[proof_index++];
        hashes[write_index] = hash_pair(hashes[read_index], scratch);
        hashes[new_element_count + write_index] = hash_pair(hashes[new_element_count + read_index], scratch);

        read_index = read_index + 1;
      }

      read_index %= new_element_count;
      write_index = (write_index + 1) % new_element_count;
      bit_check <<= 1;
    }
  }

  function get_root_from_append_proof(bytes32[] memory proof) internal pure returns (bytes32 hash) {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    hash = proof[proof_index];

    while (proof_index > 1) {
      hash = hash_pair(proof[--proof_index], hash);
    }

    return hash;
  }

  function get_roots_from_append_proof_single_append(bytes32 new_element, bytes32[] memory proof) internal pure returns (bytes32 hash, bytes32 new_hash) {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    hash = proof[proof_index];
    new_hash = hash_pair(hash, hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, new_element));
    bytes32 scratch;

    while (proof_index > 1) {
      scratch = proof[--proof_index];
      new_hash = hash_pair(scratch, new_hash);
      hash = hash_pair(scratch, hash);
    }
  }

  function get_roots_from_append_proof_multi_append(bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32 hash, bytes32) {
    uint256 new_elements_count = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](new_elements_count);
    uint256 write_index;

    while (write_index < new_elements_count) {
      new_hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, new_elements[write_index]);
      write_index++;
    }

    write_index = 0;
    uint256 read_index;
    uint256 offset = uint256(proof[0]);
    uint256 index = offset;

    // resuse new_elements_count var here, since old one no longer needed (is now total)
    new_elements_count += offset;
    uint256 upper_bound = new_elements_count - 1;
    uint256 proof_index = bit_count_32(uint32(offset));
    hash = proof[proof_index];

    while (upper_bound > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        new_hashes[0] = hash_pair(proof[proof_index--], new_hashes[read_index++]);

        if (proof_index > 0) hash = hash_pair(proof[proof_index], hash);

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

  function get_append_proof_from_multi_proof(bytes32[] memory elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32[] memory append_proof) {
    uint256 element_count = elements.length;
    require(elements.length == element_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[](element_count);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[read_index--]);
      write_index++;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 append_node_index = uint256(proof[0]);
    uint256 read_index_of_append_node = 0;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 hash;
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? element_count : write_index) - 1;

          require(append_proof_index == 2 || hash == hashes[read_index], "INVALID_PROOF");

          if (append_proof_index == 2) append_proof[1] = hashes[read_index];

          return (hashes[read_index], append_proof);
        }

        if (append_node_index & 1 == 1) {
          hash = hashes[read_index];
          append_proof[--append_proof_index] = hash;
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
            // use read_index_of_append_node as temporary scratch
            read_index_of_append_node = (read_index + 1) % element_count;

            hash = hash_pair(hashes[read_index_of_append_node], hash);
            append_proof[--append_proof_index] = hashes[read_index_of_append_node];
          } else {
            hash = hash_pair(proof[proof_index], hash);
            append_proof[--append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;
      }

      // TODO: use scratch or hashes[write_index] = hash_pair(hashes[read_index++], hashes[(read_index % update_element_count)]);
      if (flags & bit_check == bit_check) {
        hashes[write_index] = hash_pair(hashes[read_index], hashes[((read_index + 1) % element_count)]);

        read_index = read_index + 2;
      } else {
        hashes[write_index] = hash_pair(hashes[read_index], proof[proof_index]);

        read_index = read_index + 1;
      }

      read_index %= element_count;
      write_index = (write_index + 1) % element_count;
      bit_check = bit_check << 1;
    }
  }

  function get_append_proof_from_multi_proof_update(bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32[] memory append_proof) {
    uint256 update_element_count = update_elements.length;
    require(elements.length == update_element_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[]((update_element_count << 1) + 1);
    uint256 read_index = update_element_count - 1;
    uint256 write_index;

    while (write_index < update_element_count) {
      hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, elements[read_index]);
      hashes[update_element_count + write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, update_elements[read_index--]);
      write_index++;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 append_node_index = uint256(proof[0]);
    uint256 read_index_of_append_node = 0;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? update_element_count : write_index) - 1;

          require(append_proof_index == 2 || hashes[update_element_count << 1] == hashes[read_index], "INVALID_PROOF");

          if (append_proof_index == 2) append_proof[1] = hashes[update_element_count + read_index];

          return (hashes[read_index], append_proof);
        }

        if (append_node_index & 1 == 1) {
          hashes[update_element_count << 1] = hashes[read_index];
          append_proof[--append_proof_index] = hashes[update_element_count + read_index];
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;

        hashes[write_index] = hashes[read_index];
        hashes[update_element_count + write_index] = hashes[update_element_count + read_index];

        read_index = (read_index + 1) % update_element_count;
        write_index = (write_index + 1) % update_element_count;
        bit_check <<= 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          if (flags & bit_check == bit_check) {
            // use read_index_of_append_node as temporary scratch
            read_index_of_append_node = (read_index + 1) % update_element_count;

            hashes[update_element_count << 1] = hash_pair(hashes[read_index_of_append_node], hashes[update_element_count << 1]);
            append_proof[--append_proof_index] = hashes[update_element_count + read_index_of_append_node];
          } else {
            // use read_index_of_append_node as temporary scratch
            read_index_of_append_node = update_element_count << 1;

            // TODO: proof[proof_index] is read twice, consider scratch proof[proof_index]
            hashes[read_index_of_append_node] = hash_pair(proof[proof_index], hashes[read_index_of_append_node]);
            append_proof[--append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;
      }

      // TODO: use scratch or hashes[write_index] = hash_pair(hashes[read_index++], hashes[(read_index % update_element_count)]);
      if (flags & bit_check == bit_check) {
        hashes[write_index] = hash_pair(hashes[read_index], hashes[(read_index + 1) % update_element_count]);
        hashes[update_element_count + write_index] = hash_pair(hashes[update_element_count + read_index], hashes[update_element_count + ((read_index + 1) % update_element_count)]);

        read_index = read_index + 2;
      } else {
        // TODO: proof[proof_index] is read twice, consider scratch proof[proof_index++]
        hashes[write_index] = hash_pair(hashes[read_index], proof[proof_index]);
        hashes[update_element_count + write_index] = hash_pair(hashes[update_element_count + read_index], proof[proof_index++]);

        read_index = read_index + 1;
      }

      read_index %= update_element_count;
      write_index = (write_index + 1) % update_element_count;
      bit_check <<= 1;
    }
  }

  // TODO: get_new_root_from_append_proof_single_append

  function get_new_root_from_append_proof_multi_append(bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    uint256 new_elements_count = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](new_elements_count);
    uint256 write_index;

    while (write_index < new_elements_count) {
      new_hashes[write_index] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000000, new_elements[write_index]);
      write_index++;
    }

    write_index = 0;
    uint256 read_index;
    uint256 offset = uint256(proof[0]);
    uint256 index = offset;

    // resuse new_elements_count var here, since old one no longer needed (is now total)
    new_elements_count += offset;
    uint256 upper_bound = new_elements_count - 1;
    uint256 proof_index = proof.length - 1;

    while (upper_bound > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        new_hashes[0] = hash_pair(proof[proof_index], new_hashes[read_index]);

        read_index++;
        proof_index--;
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

  function get_roots_from_combined_proof_and_append(bytes32[] memory elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32) {
    (bytes32 old_element_root, bytes32[] memory append_proof) = get_append_proof_from_multi_proof(elements, proof);
    bytes32 new_element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return (old_element_root, new_element_root);
  }

  function get_roots_from_combined_proof_update_and_append(bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32) {
    (bytes32 old_element_root, bytes32[] memory append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);
    bytes32 new_element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return (old_element_root, new_element_root);
  }

  function element_exists(bytes32 root, uint256 index, bytes32 element, bytes32[] memory proof) internal pure returns (bool) {
    // TODO: this might not be efficient for most cases
    // if (root == 0x0000000000000000000000000000000000000000000000000000000000000000 || proof[0] == 0x0000000000000000000000000000000000000000000000000000000000000000) return false;
    
    return hash_node(proof[0], get_root_from_single_proof(index, element, proof)) == root;
  }

  function elements_exist(bytes32 root, bytes32[] memory elements, bytes32[] memory proof) internal pure returns (bool) {
    // TODO: this might not be efficient for most cases
    // if (root == 0x0000000000000000000000000000000000000000000000000000000000000000 || proof[0] == 0x0000000000000000000000000000000000000000000000000000000000000000) return false;

    return hash_node(proof[0], get_root_from_multi_proof(elements, proof)) == root;
  }

  function try_update_one(bytes32 root, uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory proof) internal pure returns (bytes32) {
    bytes32 total_element_count = proof[0];
    
    require(root != 0x0000000000000000000000000000000000000000000000000000000000000000 || total_element_count == 0x0000000000000000000000000000000000000000000000000000000000000000, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_single_proof_update(index, element, new_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  function try_update_many(bytes32 root, bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    bytes32 total_element_count = proof[0];
    
    require(root != 0x0000000000000000000000000000000000000000000000000000000000000000 || total_element_count == 0x0000000000000000000000000000000000000000000000000000000000000000, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_multi_proof_update(elements, new_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  function try_append_one(bytes32 root, bytes32 new_element, bytes32[] memory proof) internal pure returns (bytes32) {
    bytes32 total_element_count = proof[0];
    
    require((root == 0x0000000000000000000000000000000000000000000000000000000000000000) == (total_element_count == 0x0000000000000000000000000000000000000000000000000000000000000000), "INVALID_TREE");

    if (root == 0x0000000000000000000000000000000000000000000000000000000000000000) return hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, get_root_from_one(new_element));
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_append_proof_single_append(new_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + 1), new_element_root);
  }

  function try_append_many(bytes32 root, bytes32[] memory new_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    bytes32 total_element_count = proof[0];
    
    require((root == 0x0000000000000000000000000000000000000000000000000000000000000000) == (total_element_count == 0x0000000000000000000000000000000000000000000000000000000000000000), "INVALID_TREE");
    
    if (root == 0x0000000000000000000000000000000000000000000000000000000000000000) return hash_node(bytes32(new_elements.length), get_root_from_many(new_elements));
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_append_proof_multi_append(new_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + new_elements.length), new_element_root);
  }

  function try_elements_exist_and_append_many(bytes32 root, bytes32[] memory elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    bytes32 total_element_count = proof[0];
    
    require(root != 0x0000000000000000000000000000000000000000000000000000000000000000 || total_element_count == 0x0000000000000000000000000000000000000000000000000000000000000000, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_combined_proof_and_append(elements, append_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), new_element_root);
  }

  function try_update_many_and_append_many(bytes32 root, bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory append_elements, bytes32[] memory proof) internal pure returns (bytes32) {
    bytes32 total_element_count = proof[0];
    
    require(root != 0x0000000000000000000000000000000000000000000000000000000000000000 || total_element_count == 0x0000000000000000000000000000000000000000000000000000000000000000, "EMPTY_TREE");
    
    (bytes32 old_element_root, bytes32 new_element_root) = get_roots_from_combined_proof_update_and_append(elements, update_elements, append_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), new_element_root);
  }
}
