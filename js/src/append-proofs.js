'use strict';

const { hashNode, bitCount32, to32ByteBuffer, from32ByteBuffer } = require('./utils');

// This is the SingleProof.generate algorithm, using the elementCount as index,
// thereby generating a subset of those same decommitments, but only those
// "to the left" of the index, since all nodes "to the right" are non-existent.
// Also, the left sub-tree's root (always defined as i=2 in the tree), is always
// required, as every single append is "to the right" of it, by definition.
const generate = ({ tree, elementCount }, options = {}) => {
  const { compact = false } = options;
  const decommitments = [];
  const leafCount = tree.length >>> 1;

  for (let i = leafCount + elementCount; i > 1; i >>>= 1) {
    if (i & 1 || i === 2) {
      decommitments.unshift(tree[i - 1]);
    }
  }

  if (compact) return { compactProof: [to32ByteBuffer(elementCount)].concat(decommitments.map(Buffer.from)) };

  return { elementCount, decommitments: decommitments.map(Buffer.from) };
};

// This is the SingleProof.getRoot algorithm, where the amount of decommitments,
// must equal the amount of bits in the elementCount, and we are recovering the
// root that can be built from the decommitments, hashed from "right" to "left".
// Note, it is implied that there is nothing to the right of the "right-most"
// decommitment, explaining the departure from the SingleProof.getRoot algorithm.
const getRoot = ({ compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  let index = bitCount32(elementCount);
  let hash = decommitments[--index];

  while (index > 0) {
    hash = hashFunction(decommitments[--index], hash);
  }

  return { root: hash, elementCount };
};

// This is identical to the above getRoot algorithm, differing only in that the
// new root (due to the appended leaf), is computed along the way.
// Note, it is implied that there is nothing to the right of the leaf being
// appended, explaining the departure from the SingleProof.getNewRoot algorithm.
// See getRoot for relevant inline comments.
const getNewRootSingle = ({ newLeaf, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  let index = bitCount32(elementCount);
  let hash = decommitments[--index];
  let newHash = hashFunction(decommitments[index], newLeaf);

  while (index > 0) {
    newHash = hashFunction(decommitments[--index], newHash);
    hash = hashFunction(decommitments[index], hash);
  }

  return { root: hash, newRoot: newHash, elementCount };
};

// If newHashes[0]'s level-localized index is odd, merge with decommitment at this level. If more
// elements are appended than existed in the tree, newHashes[0]'s level-localized index will tend
// to 0, and no longer be merged with decommitments. If newHashes[0]'s level-localized index is
// even, hash with node to the right. An odd level-localized index is either at newHashes[0] or
// index == upperBound. If upperBound == 0, we got to the new root.
const getNewRootMulti = ({ newLeafs, compactProof, elementCount, decommitments }, options = {}) => {
  const { hashFunction = hashNode } = options;

  if (compactProof) {
    elementCount = from32ByteBuffer(compactProof[0]);
    decommitments = compactProof.slice(1);
  }

  let decommitmentIndex = bitCount32(elementCount) - 1;
  let hash = decommitments[decommitmentIndex];
  let newHashes = Array((newLeafs.length >>> 1) + 1).fill(null);
  let upperBound = elementCount + newLeafs.length - 1;
  let writeIndex = 0;
  let readIndex = 0;
  let offset = elementCount;
  let index = offset;

  while (upperBound > 0) {
    const useLeafs = offset >= elementCount;

    if (writeIndex === 0 && index & 1) {
      newHashes[writeIndex++] = hashFunction(
        decommitments[decommitmentIndex--],
        useLeafs ? newLeafs[readIndex++] : newHashes[readIndex++]
      );

      if (decommitmentIndex >= 0) hash = hashFunction(decommitments[decommitmentIndex], hash);

      index++;
    } else if (index < upperBound) {
      newHashes[writeIndex++] = hashFunction(
        useLeafs ? newLeafs[readIndex++] : newHashes[readIndex++],
        useLeafs ? newLeafs[readIndex++] : newHashes[readIndex++]
      );
      index += 2;
    }

    if (index >= upperBound) {
      if (index === upperBound) newHashes[writeIndex] = useLeafs ? newLeafs[readIndex] : newHashes[readIndex];

      readIndex = 0;
      writeIndex = 0;
      upperBound >>>= 1;
      offset >>>= 1;
      index = offset;
    }
  }

  return { root: hash, newRoot: newHashes[0], elementCount };
};

const getNewRoot = (parameters, options = {}) => {
  return parameters.newLeafs ? getNewRootMulti(parameters, options) : getNewRootSingle(parameters, options);
};

module.exports = { generate, getRoot, getNewRoot };
