// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

// TODO: vulnerable to second pre-image attack. Consider mixing in depth.

contract MultiProofMerkle {
  bytes32 public root;

  event Test(bytes32 event_data);

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

  // Indices are required to be sorted highest to lowest.
  function verify(uint16 depth, uint256[] memory indices, bytes32[] memory values, bytes32[] memory decommitments) public view {
    require(indices.length == values.length, "LENGTH_MISMATCH");
    uint256 n = indices.length;
    uint256 cache_size = n + 1;

    // Dynamically allocate index and hash queue
    uint256[] memory tree_indices = new uint256[](cache_size);
    bytes32[] memory hashes = new bytes32[](cache_size);
    uint256 head = 0;
    uint256 tail = 0;
    uint256 di = 0;

    // Queue the leafs
    for(; tail < n; ++tail) {
        tree_indices[tail] = (uint256(1) << uint256(depth)) + indices[tail];
        hashes[tail] = values[tail];
    }

    // Itterate the queue until we hit the root
    while (true) {
      uint256 index = tree_indices[head];
      bytes32 hash = hashes[head];
      head = (head + 1) % cache_size;

      // Merkle root
      if (index == 1) {
        require(hash == root, "INVALID_MERKLE_PROOF");

        return;
      } else if (index & 1 == 0) {                                    // Even node, take sibbling from decommitments
        hash = hash_node(hash, decommitments[di++]);
      } else if (head != tail && tree_indices[head] == index - 1) {   // Odd node with sibbling in the queue
        hash = hash_node(hashes[head], hash);
        head = (head + 1) % cache_size;
      } else {                                                        // Odd node with sibbling from decommitments
        hash = hash_node(decommitments[di++], hash);
      }

      tree_indices[tail] = index >> 1;
      hashes[tail] = hash;
      tail = (tail + 1) % cache_size;
    }
  }

  // Indices are required to be sorted highest to lowest.
  function verify_and_use(uint16 depth, uint256[] memory indices, bytes32[] memory values, bytes32[] memory decommitments) public {
    require(indices.length == values.length, "LENGTH_MISMATCH");
    uint256 n = indices.length;
    uint256 cache_size = n + 1;

    // Dynamically allocate index and hash queue
    uint256[] memory tree_indices = new uint256[](cache_size);
    bytes32[] memory hashes = new bytes32[](cache_size);
    uint256 head = 0;
    uint256 tail = 0;
    uint256 di = 0;

    bytes32 event_data = bytes32(0);

    // Queue the leafs
    for(; tail < n; ++tail) {
      tree_indices[tail] = (uint256(1) << uint256(depth)) + indices[tail];
      hashes[tail] = values[tail];
      event_data = hash_node(event_data, values[tail]);
    }

    // Itterate the queue until we hit the root
    while (true) {
      uint256 index = tree_indices[head];
      bytes32 hash = hashes[head];
      head = (head + 1) % cache_size;

      // Merkle root
      if (index == 1) {
        require(hash == root, "INVALID_MERKLE_PROOF");
        emit Test(event_data);

        return;
      } else if (index & 1 == 0) {                                    // Even node, take sibbling from decommitments
        hash = hash_node(hash, decommitments[di++]);
      } else if (head != tail && tree_indices[head] == index - 1) {   // Odd node with sibbling in the queue
        hash = hash_node(hashes[head], hash);
        head = (head + 1) % cache_size;
      } else {                                                        // Odd node with sibbling from decommitments
        hash = hash_node(decommitments[di++], hash);
      }

      tree_indices[tail] = index >> 1;
      hashes[tail] = hash;
      tail = (tail + 1) % cache_size;
    }
  }

  // Indices are required to be sorted highest to lowest.
  function update(uint16 depth, uint256[] memory indices, bytes32[] memory oldValues, bytes32[] memory newValues, bytes32[] memory decommitments) public {
    require(indices.length == oldValues.length, "LENGTH_MISMATCH");
    uint256 n = indices.length;
    uint256 cache_size = n + 1;

    // Dynamically allocate index and hash queue
    uint256[] memory tree_indices = new uint256[](cache_size);
    bytes32[] memory old_hashes = new bytes32[](cache_size);
    bytes32[] memory new_hashes = new bytes32[](cache_size);
    uint256 head = 0;
    uint256 tail = 0;
    uint256 di = 0;

    // Queue the leafs
    for(; tail < n; ++tail) {
      tree_indices[tail] = (uint256(1) << uint256(depth)) + indices[tail];
      old_hashes[tail] = oldValues[tail];
      new_hashes[tail] = newValues[tail];
    }

    // Itterate the queue until we hit the root
    while (true) {
      uint256 index = tree_indices[head];
      bytes32 old_hash = old_hashes[head];
      bytes32 new_hash = new_hashes[head];
      head = (head + 1) % cache_size;

      // Merkle root
      if (index == 1) {
        require(old_hash == root, "INVALID_MERKLE_PROOF");
        root = new_hash;

        return;
      } else if (index & 1 == 0) {                                    // Even node, take sibbling from decommitments
        bytes32 decommitment = decommitments[di++];
        old_hash = hash_node(old_hash, decommitment);
        new_hash = hash_node(new_hash, decommitment);
      } else if (head != tail && tree_indices[head] == index - 1) {   // Odd node with sibbling in the queue
        old_hash = hash_node(old_hashes[head], old_hash);
        new_hash = hash_node(new_hashes[head], new_hash);
        head = (head + 1) % cache_size;
      } else {                                                        // Odd node with sibbling from decommitments
        bytes32 decommitment = decommitments[di++];
        old_hash = hash_node(decommitment, old_hash);
        new_hash = hash_node(decommitment, new_hash);
      }

      tree_indices[tail] = index >> 1;
      old_hashes[tail] = old_hash;
      new_hashes[tail] = new_hash;
      tail = (tail + 1) % cache_size;
    }
  }

  // Indices are required to be sorted highest to lowest.
  function useAndUpdate(uint16 depth, uint256[] memory indices, bytes32[] memory oldValues, bytes32[] memory newValues, bytes32[] memory decommitments) public {
    require(indices.length == oldValues.length, "LENGTH_MISMATCH");
    uint256 n = indices.length;
    uint256 cache_size = n + 1;

    // Dynamically allocate index and hash queue
    uint256[] memory tree_indices = new uint256[](cache_size);
    bytes32[] memory old_hashes = new bytes32[](cache_size);
    bytes32[] memory new_hashes = new bytes32[](cache_size);
    uint256 head = 0;
    uint256 tail = 0;
    uint256 di = 0;

    bytes32 event_data = bytes32(0);

    // Queue the leafs
    for(; tail < n; ++tail) {
      tree_indices[tail] = (uint256(1) << uint256(depth)) + indices[tail];
      old_hashes[tail] = oldValues[tail];
      new_hashes[tail] = newValues[tail];
      event_data = hash_node(event_data, oldValues[tail]);
    }

    // Itterate the queue until we hit the root
    while (true) {
      uint256 index = tree_indices[head];
      bytes32 old_hash = old_hashes[head];
      bytes32 new_hash = new_hashes[head];
      head = (head + 1) % cache_size;

      // Merkle root
      if (index == 1) {
        require(old_hash == root, "INVALID_MERKLE_PROOF");
        root = new_hash;
        emit Test(event_data);

        return;
      } else if (index & 1 == 0) {                                    // Even node, take sibbling from decommitments
        bytes32 decommitment = decommitments[di++];
        old_hash = hash_node(old_hash, decommitment);
        new_hash = hash_node(new_hash, decommitment);
      } else if (head != tail && tree_indices[head] == index - 1) {   // Odd node with sibbling in the queue
        old_hash = hash_node(old_hashes[head], old_hash);
        new_hash = hash_node(new_hashes[head], new_hash);
        head = (head + 1) % cache_size;
      } else {                                                        // Odd node with sibbling from decommitments
        bytes32 decommitment = decommitments[di++];
        old_hash = hash_node(decommitment, old_hash);
        new_hash = hash_node(decommitment, new_hash);
      }

      tree_indices[tail] = index >> 1;
      old_hashes[tail] = old_hash;
      new_hashes[tail] = new_hash;
      tail = (tail + 1) % cache_size;
    }
  }
}
