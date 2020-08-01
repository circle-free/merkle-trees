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

  function verify(bytes32[] memory values, uint8 totalFlags, bytes32 flags, bytes32[] memory decommitments) public view {
    uint256 totalValues = values.length;
    bytes32[] memory hashes = new bytes32[](totalValues);
    uint256 valueIndex = 0;
    uint256 hashReadIndex = 0;
    uint256 hashWriteIndex = 0;
    uint256 decommitmentIndex = 0;
    bytes32 one = bytes32(0x0000000000000000000000000000000000000000000000000000000000000001);

    for(uint256 i = 0; i < totalFlags; i++) {
      hashReadIndex %= totalValues;
      hashWriteIndex %= totalValues;

      bool useValues = valueIndex < totalValues;
      bool flag = ((flags >> i) & one) == one;

      bytes32 left = flag
        ? (useValues ? values[valueIndex++] : hashes[hashReadIndex++])
        : decommitments[decommitmentIndex++];

      hashReadIndex %= totalValues;

      bytes32 right = useValues ? values[valueIndex++] : hashes[hashReadIndex++];

      hashes[hashWriteIndex++] = hash_pair(left, right);
    }

    require(hashes[(hashWriteIndex == 0 ? totalValues : hashWriteIndex) - 1] == root, "INVALID_MERKLE_PROOF");
  }
}
