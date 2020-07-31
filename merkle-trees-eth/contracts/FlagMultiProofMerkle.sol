// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.7.0;

contract FlagMultiProofMerkle {
  bytes32 public root;

  event Test(bytes32 event_data);

  constructor(bytes32 _root) public {
    root = _root;
  }

  function hash_pair(bytes32 a, bytes32 b) internal pure returns (bytes32){
    return a < b ? hash_node(a, b) : hash_node(b, a);
  }

  function hash_node(bytes32 left, bytes32 right) internal pure returns (bytes32 hash) {
    assembly {
      mstore(0x00, left)
      mstore(0x20, right)
      hash := keccak256(0x00, 0x40)
    }
    return hash;
  }

  function verify(bytes32[] memory values, bytes32[] memory decommitments, bool[] memory proofFlag) public view {
    uint256 totalValues = values.length;
    uint256 totalHashes = proofFlag.length;
    bytes32[] memory hashes = new bytes32[](totalHashes);
    uint valueIndex = 0;
    uint hashIndex = 0;
    uint proofIndex = 0;

    for(uint256 i = 0; i < totalHashes; i++) {
      hashes[i] = hash_pair(
        proofFlag[i] ? (valueIndex < totalValues ? values[valueIndex++] : hashes[hashIndex++]) : decommitments[proofIndex++],
        valueIndex < totalValues ? values[valueIndex++] : hashes[hashIndex++]
      );
    }

    require(hashes[totalHashes-1] == root, "INVALID_MERKLE_PROOF");
  }
}