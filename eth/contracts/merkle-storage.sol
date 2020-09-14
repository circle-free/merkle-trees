// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

contract Merkle_Storage {
  bytes32 public root;

  event Some_Data(bytes32 some_data);

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

  // TODO: can this be cheaper unravelled?
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

  function build_root_with_one(bytes32 element) internal {
    set_root(1, hash_node(bytes32(0), element));
  }

  function build_root_with_many(bytes32[] memory elements) internal {
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

    set_root(total_element_count, hashes[0]);
  }

  function verify_one(uint256 index, bytes32 element, bytes32[] memory proof) internal view {
    uint256 proof_index = proof.length - 1;
    bytes32 hash = hash_node(bytes32(0), element);
    uint256 total_element_count = uint256(proof[0]);
    uint256 upperBound = total_element_count - 1;

    while(proof_index > 0) {
      if (index != upperBound || (index & 1 == 1)) hash = hash_pair(proof[proof_index--], hash);

      index = index >> 1;
      upperBound = upperBound >> 1;
    }

    validate(total_element_count, hash);
  }

  function use_one(uint256 index, bytes32 element, bytes32[] memory proof) public {
    verify_one(index, element, proof);
    
    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, element));
  }

  function update_one(uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory proof) public {
    require(root != bytes32(0), "LIST_EMPTY");

    uint256 proof_index = proof.length - 1;
    bytes32 hash = hash_node(bytes32(0), element);
    bytes32 new_hash = hash_node(bytes32(0), new_element);
    uint256 total_element_count = uint256(proof[0]);
    uint256 upperBound = total_element_count - 1;

    while(proof_index > 0) {
      if ((index != upperBound) || (index & 1 == 1)) {
        hash = hash_pair(proof[proof_index], hash);
        new_hash = hash_pair(proof[proof_index--], new_hash);
      }

      index = index >> 1;
      upperBound = upperBound >> 1;
    }

    validate(total_element_count, hash);
    set_root(total_element_count, new_hash);
  }

  function use_and_update_one(uint256 index, bytes32 element, bytes32[] memory proof) public {
    emit Some_Data(hash_node(0x0000000000000000000000000000000000000000000000000000000000000001, element));

    update_one(index, element, hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element), proof);
  }

  function verify_many(bytes32[] memory elements, bytes32[] memory proof) internal view {
    uint256 verifying_element_count = elements.length;
    bytes32[] memory hashes = new bytes32[](verifying_element_count);
    uint256 read_index = verifying_element_count - 1;
    uint256 write_index;

    while (write_index < verifying_element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      write_index++;
      read_index--;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 right;
    
    while (true) {
      if (proof[2] & bit_check == bit_check) {
        if (proof[1] & bit_check == bit_check) {
          validate(uint256(proof[0]), hashes[(write_index == 0 ? verifying_element_count : write_index) - 1]);
          return;
        }

        hashes[write_index] = hashes[read_index];

        read_index = (read_index + 1) % verifying_element_count;
        write_index = (write_index + 1) % verifying_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      right = (proof[1] & bit_check == bit_check) ? hashes[read_index++] : proof[proof_index++];

      read_index %= verifying_element_count;

      hashes[write_index] = hash_pair(hashes[read_index], right);

      read_index = (read_index + 1) % verifying_element_count;
      write_index = (write_index + 1) % verifying_element_count;
      bit_check = bit_check << 1;
    }
  }

  function use_many(bytes32[] memory elements, bytes32[] memory proof) public {
    verify_many(elements, proof);
    
    uint256 using_element_count = elements.length;
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 i;

    while (i < using_element_count) {
      some_data = hash_node(some_data, elements[i]);
      i++;
    }

    emit Some_Data(some_data);
  }

  function update_many(bytes32[] memory elements, bytes32[] memory new_elements, bytes32[] memory proof) public {
    require(root != bytes32(0), "LIST_EMPTY");

    uint256 new_element_count = new_elements.length;
    require(elements.length == new_element_count, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](new_element_count << 1);
    uint256 read_index = new_element_count - 1;
    uint256 write_index;

    while (write_index < new_element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      hashes[new_element_count + write_index] = hash_node(bytes32(0), new_elements[read_index--]);
      write_index++;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    
    while (true) {
      if (proof[2] & bit_check == bit_check) {
        if (proof[1] & bit_check == bit_check) {
          read_index = (write_index == 0 ? new_element_count : write_index) - 1;
          write_index = uint256(proof[0]);  // total_element_count
          validate(write_index, hashes[read_index]);
          set_root(write_index, hashes[new_element_count + read_index]);

          return;
        }

        hashes[write_index] = hashes[read_index];
        hashes[new_element_count + write_index] = hashes[new_element_count + read_index];

        read_index = (read_index + 1) % new_element_count;
        write_index = (write_index + 1) % new_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      // it seems "scratch = (read_index + 1) % new_element_count" is cheaper for large quantities

      if (proof[1] & bit_check == bit_check) {
        hashes[write_index] = hash_pair(hashes[read_index], hashes[(read_index + 1) % new_element_count]);
        hashes[new_element_count + write_index] = hash_pair(hashes[new_element_count + read_index], hashes[new_element_count + ((read_index + 1) % new_element_count)]);
        read_index = read_index + 2;
      } else {
        hashes[write_index] = hash_pair(hashes[read_index], proof[proof_index]);
        hashes[new_element_count + write_index] = hash_pair(hashes[new_element_count + read_index], proof[proof_index++]);
        read_index = read_index + 1;
      }

      read_index %= new_element_count;
      write_index = (write_index + 1) % new_element_count;
      bit_check = bit_check << 1;
    }
  }

  function use_and_update_many(bytes32[] memory elements, bytes32[] memory proof) public {
    uint256 using_element_count = elements.length;
    bytes32[] memory new_elements = new bytes32[](using_element_count);
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 element;

    for (uint256 i; i < using_element_count; ++i) {
      element = elements[i];
      new_elements[i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
      some_data = hash_node(some_data, element);
    }

    emit Some_Data(some_data);

    update_many(elements, new_elements, proof);
  }

  function verify_append(bytes32[] memory proof) internal view {
    uint256 total_element_count = uint256(proof[0]);
    uint256 proof_index = bit_count_32(uint32(total_element_count));
    bytes32 hash = proof[proof_index];

    while (proof_index > 1) {
      hash = hash_pair(proof[--proof_index], hash);
    }

    validate(total_element_count, hash);
  }

  function append_one(bytes32 new_element, bytes32[] memory proof) public {
    if (root == bytes32(0)) return build_root_with_one(new_element);

    uint256 total_element_count = uint256(proof[0]);
    uint256 proof_index = bit_count_32(uint32(total_element_count));
    bytes32 hash = proof[proof_index];
    bytes32 new_hash = hash_pair(hash, hash_node(bytes32(0), new_element));
    bytes32 scratch;

    while (proof_index > 1) {
      scratch = proof[--proof_index];
      new_hash = hash_pair(scratch, new_hash);
      hash = hash_pair(scratch, hash);
    }

    validate(total_element_count, hash);
    set_root(total_element_count + 1, new_hash);
  }

  function append_many(bytes32[] memory new_elements, bytes32[] memory proof) public {
    if (root == bytes32(0)) return build_root_with_many(new_elements);

    uint256 total_element_count = uint256(proof[0]);
    uint256 new_elements_count = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](new_elements_count);
    uint256 write_index;

    while (write_index < new_elements_count) {
      new_hashes[write_index] = hash_node(bytes32(0), new_elements[write_index]);
      write_index++;
    }

    write_index = 0;
    uint256 read_index;

    // resuse new_elements_count var here, since old one no longer needed (is now total)
    new_elements_count += total_element_count;
    uint256 upper_bound = new_elements_count - 1;
    uint256 offset = total_element_count;
    uint256 index = offset;
    uint256 proof_index = bit_count_32(uint32(total_element_count));
    bytes32 hash = proof[proof_index];

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

    validate(total_element_count, hash);
    set_root(new_elements_count, new_hashes[0]);
  }

  function get_append_proof_with_update(bytes32[] memory elements, bytes32[] memory update_elements, bytes32[] memory proof) internal pure returns (bytes32, bytes32[] memory) {
    uint256 update_element_count = update_elements.length;
    require(elements.length == update_element_count, "LENGTH_MISMATCH");

    bytes32[] memory hashes = new bytes32[]((update_element_count << 1) + 1);
    uint256 read_index = update_element_count - 1;
    uint256 write_index;

    while (write_index < update_element_count) {
      hashes[write_index] = hash_node(bytes32(0), elements[read_index]);
      hashes[update_element_count + write_index] = hash_node(bytes32(0), update_elements[read_index--]);
      write_index++;
    }

    read_index = 0;
    write_index = 0;
    uint256 proof_index = 3;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 append_node_index = uint256(proof[0]);
    uint256 read_index_of_append_node = 0;
    uint256 append_proof_index = bit_count_32(uint32(append_node_index)) + 1;
    bytes32[] memory append_proof = new bytes32[](append_proof_index);
    append_proof[0] = bytes32(append_node_index);
    uint256 scratch;

    while (true) {
      if (proof[2] & bit_check == bit_check) {
        if (proof[1] & bit_check == bit_check) {
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
        bit_check = bit_check << 1;
        continue;
      }
      
      if (read_index_of_append_node == read_index) {
        if (append_node_index & 1 == 1) {
          if (proof[1] & bit_check == bit_check) {
            scratch = (read_index + 1) % update_element_count;

            hashes[update_element_count << 1] = hash_pair(hashes[scratch], hashes[update_element_count << 1]);
            append_proof[--append_proof_index] = hashes[update_element_count + scratch];
          } else {
            scratch = update_element_count << 1;

            hashes[scratch] = hash_pair(proof[proof_index], hashes[scratch]);
            append_proof[--append_proof_index] = proof[proof_index];
          }
        }

        read_index_of_append_node = write_index;
        append_node_index = append_node_index >> 1;
      }

      // TODO: use scratch or hashes[write_index] = hash_pair(hashes[read_index++], hashes[(read_index % update_element_count)]);
      if (proof[1] & bit_check == bit_check) {
        scratch = (read_index + 1) % update_element_count;

        hashes[write_index] = hash_pair(hashes[read_index], hashes[scratch]);
        hashes[update_element_count + write_index] = hash_pair(hashes[update_element_count + read_index], hashes[update_element_count + scratch]);
        
        read_index = read_index + 2;
      } else {
        hashes[write_index] = hash_pair(hashes[read_index], proof[proof_index]);
        hashes[update_element_count + write_index] = hash_pair(hashes[update_element_count + read_index], proof[proof_index++]);
        
        read_index = read_index + 1;
      }

      read_index %= update_element_count;
      write_index = (write_index + 1) % update_element_count;
      bit_check = bit_check << 1;
    }
  }

  function append_many_without_checks(bytes32[] memory new_elements, bytes32[] memory proof) internal {
    uint256 new_elements_count = new_elements.length;
    bytes32[] memory new_hashes = new bytes32[](new_elements_count);
    uint256 write_index;

    while (write_index < new_elements_count) {
      new_hashes[write_index] = hash_node(bytes32(0), new_elements[write_index]);
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

    set_root(new_elements_count, new_hashes[0]);
  }

  function use_and_update_and_append_many(bytes32[] memory elements, bytes32[] memory proof) public {
    require(root != bytes32(0), "LIST_EMPTY");

    uint256 using_element_count = elements.length;
    bytes32[] memory update_elements = new bytes32[](using_element_count);
    bytes32[] memory append_elements = new bytes32[](using_element_count);
    bytes32 some_data = 0x0000000000000000000000000000000000000000000000000000000000000001;
    bytes32 element;

    for (uint256 i; i < using_element_count; ++i) {
      element = elements[i];
      update_elements[i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000002, element);
      append_elements[i] = hash_node(0x0000000000000000000000000000000000000000000000000000000000000003, element);
      some_data = hash_node(some_data, element);
    }

    emit Some_Data(some_data);

    (bytes32 old_element_root, bytes32[] memory append_proof) = get_append_proof_with_update(elements, update_elements, proof);

    validate(uint256(proof[0]), old_element_root);
    append_many_without_checks(update_elements, append_proof);
  }
}
