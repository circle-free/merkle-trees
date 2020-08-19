// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract Merkle_Storage {
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

  function round_up_to_power_of_2(uint32 n) internal pure returns (uint32) {
    if (bit_count_32(n) == 1) return n;

    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;

    return n + 1;
  }

  function build_root_with_one(bytes32 element) internal {
    root = hash_node(bytes32(uint256(1)), hash_node(bytes32(0), element));
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

    root = hash_node(bytes32(total_element_count), hashes[0]);
  }

  function verify_one(bytes32 _root, uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) internal pure returns (bool) {
    uint256 decommitment_index = decommitments.length;
    bytes32 hash = hash_node(bytes32(0), element);
    uint256 upperBound = total_element_count - 1;

    while(decommitment_index > 0) {
      if (index != upperBound || (index & 1 == 1)) hash = hash_pair(decommitments[--decommitment_index], hash);

      index = index >> 1;
      upperBound = upperBound >> 1;
    }

    return hash_node(bytes32(total_element_count), hash) == _root;
  }

  function verify_many(bytes32 _root, uint256 total_element_count, bytes32[] memory elements, uint256 hash_count, bytes32 flags, bytes32 skips, bytes32[] memory decommitments) internal pure returns (bool) {
    if (flags.length != hash_count && skips.length != hash_count) return false;
    
    uint256 verifying_element_count = elements.length;
    bytes32[] memory hashes = new bytes32[](verifying_element_count);

    uint256 read_index;
    uint256 write_index;
    uint256 decommitment_index;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;

    for(; write_index < verifying_element_count; ++write_index) {
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
    }

    write_index = 0;
    
    for (uint256 i; i < hash_count; i++) {
      if (skips & bit_check == bit_check) {
        hashes[write_index++] = hashes[read_index++];

        read_index %= verifying_element_count;
        write_index %= verifying_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      bytes32 left = (flags & bit_check == bit_check) ? hashes[read_index++] : decommitments[decommitment_index++];
      read_index %= verifying_element_count;
      hashes[write_index++] = hash_pair(left, hashes[read_index++]);

      read_index %= verifying_element_count;
      write_index %= verifying_element_count;
      bit_check = bit_check << 1;
    }

    return hash_node(bytes32(total_element_count), hashes[(write_index == 0 ? verifying_element_count : write_index) - 1]) == _root;
  }

  function verify_append(bytes32 _root, uint256 total_element_count, bytes32[] memory decommitments) internal pure returns (bool) {
    uint256 decommitment_index = bit_count_32(uint32(total_element_count));
    bytes32 hash = decommitments[--decommitment_index];

    while (decommitment_index > 0) {
      hash = hash_node(decommitments[--decommitment_index], hash);
    }

    return hash_node(bytes32(total_element_count), hash) == _root;
  }

  function append_one(uint256 total_element_count, bytes32 new_element, bytes32[] memory decommitments) public {
    if (root == bytes32(0)) {
      build_root_with_one(new_element);
      return;
    }

    uint256 decommitment_index = bit_count_32(uint32(total_element_count));
    bytes32 hash = decommitments[--decommitment_index];
    bytes32 new_hash = hash_pair(decommitments[decommitment_index], hash_node(bytes32(0), new_element));

    while (decommitment_index > 0) {
      new_hash = hash_pair(decommitments[--decommitment_index], new_hash);
      hash = hash_pair(decommitments[decommitment_index], hash);
    }

    require(hash_node(bytes32(total_element_count), hash) == root, "INVALID_PROOF");

    root = hash_node(bytes32(total_element_count + 1), new_hash);
  }

  function append_many(uint256 total_element_count, bytes32[] memory new_elements, bytes32[] memory decommitments) public {
    if (root == bytes32(0)) {
      build_root_with_many(new_elements);
      return;
    }
    
    uint256 new_total_leaf_count = round_up_to_power_of_2(uint32(total_element_count + new_elements.length));
    bytes32[] memory hashes = new bytes32[](new_elements.length);
    uint256 bit_count = bit_count_32(uint32(total_element_count));
    uint256 decommitment_index = bit_count;
    hashes[0] = decommitments[--decommitment_index];

    while (decommitment_index > 0) {
      hashes[0] = hash_pair(decommitments[--decommitment_index], hashes[0]);
    }

    require(hash_node(bytes32(total_element_count), hashes[0]) == root, "INVALID_PROOF");

    uint256 write_index;

    for(; write_index < new_elements.length; ++write_index) {
      hashes[write_index] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    decommitment_index = bit_count;
    uint256 lower_bound = new_total_leaf_count + total_element_count;
    uint256 upper_bound = lower_bound + new_elements.length - 1;
    uint256 offset = new_total_leaf_count + total_element_count;
    uint256 i;
    uint256 index;

    while (true) {
      index = offset + i;

      if (index == 1) {
        root = hash_node(bytes32(total_element_count + new_elements.length), hashes[0]);
        return;
      }

      if ((index == lower_bound) && (index & 1 == 1)) {
        hashes[write_index++] = hash_pair(decommitments[--decommitment_index], hashes[i++]);
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

      hashes[write_index++] = hash_pair(hashes[i++], hashes[i++]);
    }
  }

  function use_one(uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) public {
    emit Data_Used(hash_node(bytes32(0), element));

    require(verify_one(root, total_element_count, index, element, decommitments), "INVALID_PROOF");
  }

  function use_many(uint256 total_element_count, bytes32[] memory elements, uint256 hash_count, bytes32 flags, bytes32 skips, bytes32[] memory decommitments) public {
    uint256 using_element_count = elements.length;
    bytes32 data_used;

    for(uint256 i; i < using_element_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
    }

    emit Data_Used(data_used);

    require(verify_many(root, total_element_count, elements, hash_count, flags, skips, decommitments), "INVALID_PROOF");
  }

  function update_one(uint256 total_element_count, uint256 index, bytes32 element, bytes32 new_element, bytes32[] memory decommitments) public {
    uint256 decommitment_index = decommitments.length;
    bytes32 hash = hash_node(bytes32(0), element);
    bytes32 new_hash = hash_node(bytes32(0), new_element);
    uint256 upperBound = total_element_count - 1;

    while(decommitment_index > 0) {
      if ((index != upperBound) || (index & 1 == 1)) {
        hash = hash_pair(decommitments[--decommitment_index], hash);
        new_hash = hash_pair(decommitments[decommitment_index], new_hash);
      }

      index = index >> 1;
      upperBound = upperBound >> 1;
    }

    require(hash_node(bytes32(total_element_count), hash) == root, "INVALID_PROOF");

    root = hash_node(bytes32(total_element_count), new_hash);
  }

  function update_many(uint256 total_element_count, bytes32[] memory elements, bytes32[] memory new_elements, uint256 hash_count, bytes32 flags, bytes32 skips, bytes32[] memory decommitments) public {
    uint256 new_element_count = new_elements.length;
    require(elements.length == new_element_count, "LENGTH_MISMATCH");
    
    bytes32[] memory hashes = new bytes32[](new_element_count);
    bytes32[] memory new_hashes = new bytes32[](new_element_count);

    uint256 read_index;
    uint256 write_index;
    uint256 decommitment_index;
    bytes32 bit_check = 0x0000000000000000000000000000000000000000000000000000000000000001;

    for(; write_index < new_element_count; ++write_index) {
      hashes[write_index] = hash_node(bytes32(0), elements[write_index]);
      new_hashes[write_index] = hash_node(bytes32(0), new_elements[write_index]);
    }

    write_index = 0;
    
    for (uint256 i; i < hash_count; i++) {
      if (skips & bit_check == bit_check) {
        hashes[write_index] = hashes[read_index];
        new_hashes[write_index++] = new_hashes[read_index++];

        read_index %= new_element_count;
        write_index %= new_element_count;
        bit_check = bit_check << 1;
        continue;
      }

      bool flag = flags & bit_check == bit_check;
      bytes32 left = flag ? hashes[read_index] : decommitments[decommitment_index];
      bytes32 new_left = flag ? hashes[read_index++] : decommitments[decommitment_index++];
      read_index %= new_element_count;

      hashes[write_index] = hash_pair(left, hashes[read_index]);
      new_hashes[write_index++] = hash_pair(new_left, new_hashes[read_index++]);

      read_index %= new_element_count;
      write_index %= new_element_count;
      bit_check = bit_check << 1;
    }

    read_index = (write_index == 0 ? new_element_count : write_index) - 1;

    require(hash_node(bytes32(total_element_count), hashes[read_index]) == root, "INVALID_PROOF");
        
    root = hash_node(bytes32(total_element_count), new_hashes[read_index]);
  }

  function use_and_update_one(uint256 total_element_count, uint256 index, bytes32 element, bytes32[] memory decommitments) public {
    bytes32 new_element = hash_node(bytes32(0), element);

    emit Data_Used(new_element);

    update_one(total_element_count, index, element, new_element, decommitments);
  }

  function use_and_update_many(uint256 total_element_count, bytes32[] memory elements, uint256 hash_count, bytes32 flags, bytes32 skips, bytes32[] memory decommitments) public {
    uint256 using_element_count = elements.length;
    bytes32[] memory new_elements = new bytes32[](using_element_count);
    bytes32 data_used;

    for(uint256 i; i < using_element_count; ++i) {
      data_used = hash_node(data_used, elements[i]);
      new_elements[i] = data_used;
    }

    emit Data_Used(data_used);

    update_many(total_element_count, elements, new_elements, hash_count, flags, skips, decommitments);
  }

  function use_and_update_and_append_one() public {}

  function use_and_update_and_append_many() public {}
}
