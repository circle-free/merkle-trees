// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

library Merkle_Library_IMB32SH {
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

  // Get the Element Merkle Root for a tree with just a single element
  function get_root_from_one(bytes32 element) internal pure returns (bytes32) {
    return hash_node(bytes32(0), element);
  }

  // Get the Element Merkle Root for a tree with several elements
  function get_root_from_many(bytes32[] memory elements) internal pure returns (bytes32) {
    uint256 element_count = elements.length;
    uint256 hashes_size = (element_count >> 1) + (element_count & 1);
    bytes32[] memory hashes = new bytes32[](hashes_size);
    uint256 write_index;
    uint256 left_index;

    while (write_index < hashes_size) {
      left_index = write_index << 1;

      if (left_index == element_count - 1) {
        hashes[write_index] = hash_node(bytes32(0), elements[left_index]);
        break;
      }

      hashes[write_index++] = hash_pair(
        hash_node(bytes32(0), elements[left_index]),
        hash_node(bytes32(0), elements[left_index + 1])
      );
    }

    write_index = 0;

    while (hashes_size > 1) {
      left_index = write_index << 1;

      if (left_index == hashes_size - 1) {
        hashes[write_index] = hashes[left_index];
        write_index = 0;
        hashes_size = (hashes_size >> 1) + (hashes_size & 1);
        continue;
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

  // get_root_from_size_proof cannot be implemented with sorted hashed pairs

  // Get the original Element Merkle Root, given a Single Proof
  function get_root_from_single_proof(
    uint256 index,
    bytes32 element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 hash) {
    uint256 proof_index = proof.length - 1;
    hash = hash_node(bytes32(0), element);
    uint256 upper_bound = uint256(proof[0]) - 1;

    while (proof_index > 0) {
      if (index != upper_bound || (index & 1 == 1)) {
        hash = hash_pair(proof[proof_index], hash);
        proof_index -= 1;
      }

      index >>= 1;
      upper_bound >>= 1;
    }
  }

  // Get the original and updated Element Merkle Root, given a Single Proof and an element to update at a given index
  function get_roots_from_single_proof_update(
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 hash, bytes32 update_hash) {
    uint256 proof_index = proof.length - 1;
    hash = hash_node(bytes32(0), element);
    update_hash = hash_node(bytes32(0), update_element);
    uint256 upper_bound = uint256(proof[0]) - 1;

    while (proof_index > 0) {
      if ((index != upper_bound) || (index & 1 == 1)) {
        // reuse element as scratch
        element = proof[proof_index];
        proof_index -= 1;
        hash = hash_pair(element, hash);
        update_hash = hash_pair(element, update_hash);
      }

      index >>= 1;
      upper_bound >>= 1;
    }
  }

  // get_indices_from_multi_proof cannot be implemented with sorted hashed pairs

  // Get the original Element Merkle Root, given an Existence Multi Proof
  function get_root_from_multi_proof(bytes32[] memory elements, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 right)
  {
    uint256 verifying_count = elements.length;
    bytes32[] memory hashes = new bytes32[](verifying_count);
    uint256 read_index = verifying_count - 1;
    uint256 write_index;

    while (write_index < verifying_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      write_index += 1;
      read_index -= 1;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 flags = proof[1];
    bytes32 skips = proof[2];

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) return hashes[(write_index == 0 ? verifying_count : write_index) - 1];

        hashes[write_index] = hashes[read_index];

        read_index = (read_index + 1) % verifying_count;
        write_index = (write_index + 1) % verifying_count;
        bit_check <<= 1;
        continue;
      }

      right = (flags & bit_check == bit_check) ? hashes[read_index++] : proof[proof_index++];

      read_index %= verifying_count;

      hashes[write_index] = hash_pair(right, hashes[read_index]);

      read_index = (read_index + 1) % verifying_count;
      write_index = (write_index + 1) % verifying_count;
      bit_check <<= 1;
    }
  }

  // Get the original and updated Element Merkle Root, given an Existence Multi Proof and elements to update
  function get_roots_from_multi_proof_update(
    bytes32[] memory elements,
    bytes32[] memory update_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 flags, bytes32 skips) {
    uint256 update_count = update_elements.length;
    require(elements.length == update_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[](update_count);
    bytes32[] memory update_hashes = new bytes32[](update_count);
    uint256 read_index = update_count - 1;
    uint256 write_index;

    while (write_index < update_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      update_hashes[write_index] = hash_node(bytes32(0), update_elements[read_index--]);
      write_index += 1;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    flags = proof[1];
    skips = proof[2];
    bytes32 scratch;
    uint256 scratch_2;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? update_count : write_index) - 1;

          return (hashes[read_index], update_hashes[read_index]);
        }

        hashes[write_index] = hashes[read_index];
        update_hashes[write_index] = update_hashes[read_index];

        read_index = (read_index + 1) % update_count;
        write_index = (write_index + 1) % update_count;
        bit_check <<= 1;
        continue;
      }

      if (flags & bit_check == bit_check) {
        scratch_2 = (read_index + 1) % update_count;
        hashes[write_index] = hash_pair(hashes[read_index], hashes[scratch_2]);
        update_hashes[write_index] = hash_pair(update_hashes[read_index], update_hashes[scratch_2]);
        read_index += 2;
      } else {
        scratch = proof[proof_index++];
        hashes[write_index] = hash_pair(scratch, hashes[read_index]);
        update_hashes[write_index] = hash_pair(scratch, update_hashes[read_index]);
        read_index += 1;
      }

      read_index %= update_count;
      write_index = (write_index + 1) % update_count;
      bit_check <<= 1;
    }
  }

  // Get the original Element Merkle Root, given an Append Proof
  function get_root_from_append_proof(bytes32[] memory proof) internal pure returns (bytes32 hash) {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    hash = proof[proof_index];

    while (proof_index > 1) {
      proof_index -= 1;
      hash = hash_pair(proof[proof_index], hash);
    }
  }

  // Get the original and updated Element Merkle Root, given an Append Proof and an element to append
  function get_roots_from_append_proof_single_append(bytes32 append_element, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 hash, bytes32 append_hash)
  {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    hash = proof[proof_index];
    append_hash = hash_pair(hash, hash_node(bytes32(0), append_element));

    while (proof_index > 1) {
      proof_index -= 1;

      // reuse append_element as scratch variable
      append_element = proof[proof_index];
      append_hash = hash_pair(append_element, append_hash);
      hash = hash_pair(append_element, hash);
    }
  }

  // Get the original and updated Element Merkle Root, given an Append Proof and elements to append
  function get_roots_from_append_proof_multi_append(bytes32[] memory append_elements, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 hash, bytes32)
  {
    uint256 append_count = append_elements.length;
    bytes32[] memory append_hashes = new bytes32[](append_count);
    uint256 write_index;

    while (write_index < append_count) {
      append_hashes[write_index] = hash_node(bytes32(0), append_elements[write_index]);
      write_index += 1;
    }

    write_index = 0;
    uint256 read_index;
    uint256 offset = uint256(proof[0]);
    uint256 index = offset;

    // reuse append_count variable as upper_bound, since append_count no longer needed
    append_count += offset;
    append_count -= 1;
    uint256 proof_index = bit_count_32(uint32(offset));
    hash = proof[proof_index];

    while (append_count > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        append_hashes[0] = hash_pair(proof[proof_index], append_hashes[read_index]);
        proof_index -= 1;
        read_index += 1;

        if (proof_index > 0) {
          hash = hash_pair(proof[proof_index], hash);
        }

        write_index = 1;
        index += 1;
      } else if (index < append_count) {
        append_hashes[write_index++] = hash_pair(append_hashes[read_index++], append_hashes[read_index]);
        read_index += 1;
        index += 2;
      }

      if (index >= append_count) {
        if (index == append_count) {
          append_hashes[write_index] = append_hashes[read_index];
        }

        read_index = 0;
        write_index = 0;
        append_count >>= 1;
        offset >>= 1;
        index = offset;
      }
    }

    return (hash, append_hashes[0]);
  }

  // Get the updated Element Merkle Root, given an Append Proof and an element to append
  function get_new_root_from_append_proof_single_append(bytes32 append_element, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 append_hash)
  {
    uint256 proof_index = bit_count_32(uint32(uint256(proof[0])));
    append_hash = hash_pair(proof[proof_index], hash_node(bytes32(0), append_element));

    while (proof_index > 1) {
      proof_index -= 1;
      append_hash = hash_pair(proof[proof_index], append_hash);
    }
  }

  // Get the updated Element Merkle Root, given an Append Proof and elements to append
  function get_new_root_from_append_proof_multi_append(bytes32[] memory append_elements, bytes32[] memory proof)
    internal
    pure
    returns (bytes32)
  {
    uint256 append_count = append_elements.length;
    bytes32[] memory append_hashes = new bytes32[](append_count);
    uint256 write_index;

    while (write_index < append_count) {
      append_hashes[write_index] = hash_node(bytes32(0), append_elements[write_index]);
      write_index += 1;
    }

    write_index = 0;
    uint256 read_index;
    uint256 offset = uint256(proof[0]);
    uint256 index = offset;

    // reuse append_count variable as upper_bound, since append_count no longer needed
    append_count += offset;
    append_count -= 1;
    uint256 proof_index = proof.length - 1;

    while (append_count > 0) {
      if ((write_index == 0) && (index & 1 == 1)) {
        append_hashes[0] = hash_pair(proof[proof_index], append_hashes[read_index]);

        read_index += 1;
        proof_index -= 1;
        write_index = 1;
        index += 1;
      } else if (index < append_count) {
        append_hashes[write_index++] = hash_pair(append_hashes[read_index++], append_hashes[read_index++]);

        index += 2;
      }

      if (index >= append_count) {
        if (index == append_count) {
          append_hashes[write_index] = append_hashes[read_index];
        }

        read_index = 0;
        write_index = 0;
        append_count >>= 1;
        offset >>= 1;
        index = offset;
      }
    }

    return append_hashes[0];
  }

  // Get the original Element Merkle Root and derive Append Proof, given a Single Proof
  function get_append_proof_from_single_proof(
    uint256 index,
    bytes32 element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 hash, bytes32[] memory append_proof) {
    uint256 proof_index = proof.length - 1;
    hash = hash_node(bytes32(0), element);
    uint256 append_node_index = uint256(proof[0]);
    uint256 upper_bound = append_node_index - 1;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 append_hash;
    bytes32 scratch;

    while (proof_index > 0) {
      if (index != upper_bound || (index & 1 == 1)) {
        scratch = proof[proof_index];
        hash = hash_pair(scratch, hash);

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_proof[append_proof_index] = scratch;
          append_hash = hash_pair(scratch, append_hash);
        }

        proof_index -= 1;
      } else if (append_node_index & 1 == 1) {
        append_proof_index -= 1;
        append_proof[append_proof_index] = hash;
        append_hash = hash;
      }

      index >>= 1;
      upper_bound >>= 1;
      append_node_index >>= 1;
    }

    require(append_proof_index == 2 || append_hash == hash, "INVALID_PROOF");

    if (append_proof_index == 2) {
      append_proof[1] = hash;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof, given a Single Proof, with an element to update
  function get_append_proof_from_single_proof_update(
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 hash, bytes32[] memory append_proof) {
    uint256 proof_index = proof.length - 1;
    hash = hash_node(bytes32(0), element);
    bytes32 update_hash = hash_node(bytes32(0), update_element);
    uint256 append_node_index = uint256(proof[0]);
    uint256 upper_bound = append_node_index - 1;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 append_hash;
    bytes32 scratch;

    while (proof_index > 0) {
      if (index != upper_bound || (index & 1 == 1)) {
        scratch = proof[proof_index];
        hash = hash_pair(scratch, hash);
        update_hash = hash_pair(scratch, update_hash);

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_proof[append_proof_index] = scratch;
          append_hash = hash_pair(scratch, append_hash);
        }

        proof_index -= 1;
      } else if (append_node_index & 1 == 1) {
        append_proof_index -= 1;
        append_proof[append_proof_index] = update_hash;
        append_hash = hash;
      }

      index >>= 1;
      upper_bound >>= 1;
      append_node_index >>= 1;
    }

    require(append_proof_index == 2 || append_hash == hash, "INVALID_PROOF");

    if (append_proof_index == 2) {
      append_proof[1] = update_hash;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof, given an Existence Multi Proof
  function get_append_proof_from_multi_proof(bytes32[] memory elements, bytes32[] memory proof)
    internal
    pure
    returns (bytes32 flags, bytes32[] memory append_proof)
  {
    uint256 element_count = elements.length;
    require(elements.length == element_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[](element_count + 1);
    uint256 read_index = element_count - 1;
    uint256 write_index;

    while (write_index < element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      read_index -= 1;
      write_index += 1;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    uint256 append_node_index = uint256(proof[0]);
    uint256 append_proof_index = uint256(bit_count_32(uint32(append_node_index))) + 1;
    append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    flags = proof[1];
    bytes32 skips = proof[2];
    uint256 read_index_of_append_node;

    while (true) {
      if (skips & bit_check == bit_check) {
        if (flags & bit_check == bit_check) {
          read_index = (write_index == 0 ? element_count : write_index) - 1;

          // reuse flags as scratch variable
          flags = hashes[read_index];

          require(append_proof_index == 2 || hashes[element_count] == flags, "INVALID_PROOF");

          if (append_proof_index == 2) {
            append_proof[1] = flags;
          }

          return (flags, append_proof);
        }

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          hashes[element_count] = hashes[read_index]; // TODO scratch this hashes[read_index] above
          append_proof[append_proof_index] = hashes[read_index];
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;

        hashes[write_index] = hashes[read_index];

        read_index = (read_index + 1) % element_count;
        write_index = (write_index + 1) % element_count;
        bit_check <<= 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;

          if (flags & bit_check == bit_check) {
            // reuse read_index_of_append_node as temporary scratch variable
            read_index_of_append_node = (read_index + 1) % element_count;

            hashes[element_count] = hash_pair(hashes[read_index_of_append_node], hashes[element_count]);
            append_proof[append_proof_index] = hashes[read_index_of_append_node];
          } else {
            hashes[element_count] = hash_pair(proof[proof_index], hashes[element_count]);
            append_proof[append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;
      }

      if (flags & bit_check == bit_check) {
        hashes[write_index] = hash_pair(hashes[read_index], hashes[(read_index + 1) % element_count]);
        read_index += 2;
      } else {
        hashes[write_index] = hash_pair(proof[proof_index], hashes[read_index]);
        proof_index += 1;
        read_index += 1;
      }

      read_index %= element_count;
      write_index = (write_index + 1) % element_count;
      bit_check <<= 1;
    }
  }

  // Get the original Element Merkle Root and derive Append Proof, given an Existence Multi Proof, with elements to update
  function get_append_proof_from_multi_proof_update(
    bytes32[] memory elements,
    bytes32[] memory update_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 append_hash, bytes32[] memory append_proof) {
    uint256 update_count = update_elements.length;
    require(elements.length == update_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[](update_count << 1);
    uint256 read_index = update_count - 1;
    uint256 write_index;

    while (write_index < update_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      hashes[update_count + write_index] = hash_node(bytes32(0), update_elements[read_index--]);
      write_index += 1;
    }

    read_index = 0;
    write_index = 0;
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
          read_index = (write_index == 0 ? update_count : write_index) - 1;

          // reuse flags as scratch variable
          flags = hashes[read_index];

          require(append_proof_index == 2 || append_hash == flags, "INVALID_PROOF");

          if (append_proof_index == 2) {
            append_proof[1] = hashes[update_count + read_index];
          }

          return (flags, append_proof);
        }

        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;
          append_hash = hashes[read_index];
          append_proof[append_proof_index] = hashes[update_count + read_index];
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;

        hashes[write_index] = hashes[read_index];
        hashes[update_count + write_index] = hashes[update_count + read_index];

        read_index = (read_index + 1) % update_count;
        write_index = (write_index + 1) % update_count;
        bit_check <<= 1;
        continue;
      }

      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          append_proof_index -= 1;

          if (flags & bit_check == bit_check) {
            // use read_index_of_append_node as temporary scratch
            read_index_of_append_node = (read_index + 1) % update_count;

            append_hash = hash_pair(hashes[read_index_of_append_node], append_hash);
            append_proof[append_proof_index] = hashes[update_count + read_index_of_append_node];
          } else {
            append_hash = hash_pair(proof[proof_index], append_hash);
            append_proof[append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index >>= 1;
      }

      if (flags & bit_check == bit_check) {
        hashes[write_index] = hash_pair(hashes[read_index], hashes[(read_index + 1) % update_count]);
        hashes[update_count + write_index] = hash_pair(
          hashes[update_count + read_index],
          hashes[update_count + ((read_index + 1) % update_count)]
        );
        read_index += 2;
      } else {
        hashes[write_index] = hash_pair(proof[proof_index], hashes[read_index]);
        hashes[update_count + write_index] = hash_pair(proof[proof_index], hashes[update_count + read_index]);
        proof_index += 1;
        read_index += 1;
      }

      read_index %= update_count;
      write_index = (write_index + 1) % update_count;
      bit_check <<= 1;
    }
  }

  // Check if element exists, given a Single Proof
  function element_exists(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32[] memory proof
  ) internal pure returns (bool) {
    return hash_node(proof[0], get_root_from_single_proof(index, element, proof)) == root;
  }

  // Check if elements exist, given an Existence Multi Proof
  function elements_exist(
    bytes32 root,
    bytes32[] memory elements,
    bytes32[] memory proof
  ) internal pure returns (bool) {
    return hash_node(proof[0], get_root_from_multi_proof(elements, proof)) == root;
  }

  // get_indices cannot be implemented with sorted hashed pairs

  // verify_size_with_proof cannot be implemented with sorted hashed pairs

  // Check tree size, given a the Element Merkle Root
  function verify_size(
    bytes32 root,
    uint256 size,
    bytes32 element_root
  ) internal pure returns (bool) {
    if (root == bytes32(0) && size == 0) return true;

    return hash_node(bytes32(size), element_root) == root;
  }

  // Try to update one element at an index, given a Single Proof and an element to update
  function try_update_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  // Try to update many elements, given an Existence Multi Proof and elements to update
  function try_update_many(
    bytes32 root,
    bytes32[] memory elements,
    bytes32[] memory update_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(total_element_count, new_element_root);
  }

  // Try to append one element, given an Append Proof and an element to append
  function try_append_one(
    bytes32 root,
    bytes32 append_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require((root == bytes32(0)) == (total_element_count == bytes32(0)), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(uint256(1)), get_root_from_one(append_element));

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_append_proof_single_append(append_element, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + 1), new_element_root);
  }

  // Try to append elements, given an Append Proof and elements to append
  function try_append_many(
    bytes32 root,
    bytes32[] memory append_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 new_element_root) {
    bytes32 total_element_count = proof[0];

    require((root == bytes32(0)) == (total_element_count == bytes32(0)), "INVALID_TREE");

    if (root == bytes32(0)) return hash_node(bytes32(append_elements.length), get_root_from_many(append_elements));

    bytes32 old_element_root;
    (old_element_root, new_element_root) = get_roots_from_append_proof_multi_append(append_elements, proof);

    require(hash_node(total_element_count, old_element_root) == root, "INVALID_PROOF");

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), new_element_root);
  }

  // Try to append an element, given a Single Proof and an element to append
  function try_append_one_using_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 append_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof(index, element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // Try to append elements, given a Single Proof and elements to append
  function try_append_many_using_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32[] memory append_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof(index, element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // Try to append an element, given an Existence Multi Proof and an element to append
  function try_append_one_using_many(
    bytes32 root,
    bytes32[] memory elements,
    bytes32 append_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof(elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // Try to append elements, given an Existence Multi Proof and elements to append
  function try_append_many_using_many(
    bytes32 root,
    bytes32[] memory elements,
    bytes32[] memory append_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof(elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // Try to update an element and append an element, given a Single Proof, an element to update, and an element to append
  function try_update_one_and_append_one(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32 append_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // Try to update an element and append elements, given a Single Proof, an element to update, and elements to append
  function try_update_one_and_append_many(
    bytes32 root,
    uint256 index,
    bytes32 element,
    bytes32 update_element,
    bytes32[] memory append_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_single_proof_update(index, element, update_element, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // Try to update elements and append an element, given an Existence Multi Proof, elements to update, and an element to append
  function try_update_many_and_append_one(
    bytes32 root,
    bytes32[] memory elements,
    bytes32[] memory update_elements,
    bytes32 append_element,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_single_append(append_element, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + 1), element_root);
  }

  // Try to update elements and append elements, given an Existence Multi Proof, elements to update, and elements to append
  function try_update_many_and_append_many(
    bytes32 root,
    bytes32[] memory elements,
    bytes32[] memory update_elements,
    bytes32[] memory append_elements,
    bytes32[] memory proof
  ) internal pure returns (bytes32 element_root) {
    bytes32 total_element_count = proof[0];

    require(root != bytes32(0) || total_element_count == bytes32(0), "EMPTY_TREE");

    bytes32[] memory append_proof;
    (element_root, append_proof) = get_append_proof_from_multi_proof_update(elements, update_elements, proof);

    require(hash_node(total_element_count, element_root) == root, "INVALID_PROOF");

    element_root = get_new_root_from_append_proof_multi_append(append_elements, append_proof);

    return hash_node(bytes32(uint256(total_element_count) + append_elements.length), element_root);
  }

  // Create a tree and return the root, given one element
  function create_from_one(bytes32 element) internal pure returns (bytes32 new_element_root) {
    return hash_node(bytes32(uint256(1)), get_root_from_one(element));
  }

  // Create a tree and return the root, given many element
  function create_from_many(bytes32[] memory elements) internal pure returns (bytes32 new_element_root) {
    return hash_node(bytes32(elements.length), get_root_from_many(elements));
  }
}
