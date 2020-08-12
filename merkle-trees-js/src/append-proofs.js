'use strict';

const { bitCount32, roundUpToPowerOf2 } = require('./utils');

// This is the SingleProof.generate algorithm, using the elementCount as index,
// thereby generating a subset of those same decommitments, but only those
// "to the left" of the index, since all nodes "to the right" are non-existent.
// Also, the left sub-tree's root (always defined as i=2 in the tree), is always
// required, as every single append is "to the right" of it, by definition.
const generate = ({ tree, elementCount }) => {
  const decommitments = [];
  const leafCount = tree.length >> 1;

  for (let i = leafCount + elementCount; i > 1; i >>= 1) {
    if (i & 1 || i === 2) {
      decommitments.unshift(tree[i - 1]);
    }
  }

  return { elementCount, decommitments: decommitments.map(Buffer.from) };
};

// This is the SingleProof.getRoot algorithm, where the amount of decommitments,
// must equal the amount of bits in the elementCount, and we are recovering the
// root that can be built from the decommitments, hashed from "right" to "left".
// Note, it is implied that there is nothing to the right of the "right-most"
// decommitment, explaining the departure from the SingleProof.getRoot algorithm.
const getRoot = ({ elementCount, decommitments, hashFunction }) => {
  const n = bitCount32(elementCount) - 1;
  let hash = decommitments[n];

  for (let i = n; i > 0; i--) {
    hash = hashFunction(decommitments[i - 1], hash);
  }

  return { root: hash };
};

// This is identical to the above getRoot algorithm, differing only in that the
// new root (due to the appended leaf), is computed along the way.
// Note, it is implied that there is nothing to the right of the leaf being
// appended, explaining the departure from the SingleProof.getNewRoot algorithm.
// See getRoot for relevant inline comments.
const getNewRootSingle = ({ newLeaf, elementCount, decommitments, hashFunction }) => {
  const n = bitCount32(elementCount) - 1;
  let hash = decommitments[n];
  let newHash = hashFunction(decommitments[n], newLeaf);

  for (let i = n; i > 0; i--) {
    newHash = hashFunction(decommitments[i - 1], newHash);
    hash = hashFunction(decommitments[i - 1], hash);
  }

  return { root: hash, newRoot: newHash };
};

// Unlike the above getNewRootSingle algorithm, it is not trivial to computed the
// new root along the way, given appending of am arbitrary set of leafs. Thus, we
// compute the new root by following the Common.buildTree algorithm, which requires
// creating a serialized tree in memory, but instead, fills only the slots for the
// leafs being appended. Then, computing the parent node slots based on the values
// of the children, either the appending leaf slots or decommitments. Any null value
// in the tree can be skipped, as it indicates a parent decommitments already exists.
// Along the way, decommitments are also used to compute the existing root, much in
// the same way as done in the above getNewRootSingle.
// Note, this code is left here as a clearer explanation of the algorithm, made
// simpler by the getNewRootMulti below, which maintains the sparse tree compactly.
const getNewRootMultiMemoryLarge = ({ newLeafs, elementCount, decommitments, hashFunction }) => {
  const newLeafCount = newLeafs.length;
  const totalElementCount = elementCount + newLeafCount;
  const totalLeafCount = roundUpToPowerOf2(totalElementCount);
  const tree = Array(totalLeafCount << 1).fill(null);

  // Fill the empty tree with the the leafs that we are adding. it will be sparse.
  for (let i = 0; i < newLeafCount; i++) {
    tree[totalLeafCount + elementCount + i] = newLeafs[i];
  }

  let n = bitCount32(elementCount) - 1;
  let hash = decommitments[n];

  // Start at the "right-most" element, since nothing exists "to the right".
  for (let i = (totalLeafCount + totalElementCount - 1) >> 1; i > 0; i--) {
    const index = i << 1;
    const left = tree[index];
    const right = tree[index + 1];

    // Children both "null", so their hash is moot as we have that decommitment.
    if (!left && !right) continue;

    // Sibling to the "right" does not exist, so the parent is the child existing.
    if (!right) {
      tree[i] = tree[index];
      continue;
    }

    // Sibling to the "left" does not exist, so use the decommitment.
    // Also, continue building the exiting root.
    if (!left) {
      tree[i] = hashFunction(decommitments[n--], right);
      hash = hashFunction(decommitments[n], hash);
      continue;
    }

    tree[i] = hashFunction(left, right);
  }

  return { root: hash, newRoot: tree[1] };
};

// This is similar to the above getNewRootMultiMemoryLarge, but instead of maintaining
// a sparse serialized tree of double the size of the amount of balanced leafs, it uses
// a stack where the accumulated nodes are maintained. The side of this stack is at
// most n/2 + 1, there n is the amount of leafs being appended.
const getNewRootMulti = ({ newLeafs, elementCount, decommitments, hashFunction }) => {
  const newLeafCount = newLeafs.length;
  const totalElementCount = elementCount + newLeafCount;
  const totalLeafCount = roundUpToPowerOf2(totalElementCount);
  const hashes = Array((newLeafCount >> 1) + 1).fill(null);

  let n = bitCount32(elementCount) - 1;
  let hash = decommitments[n];
  let lowerBound = totalLeafCount + elementCount;
  let upperBound = totalLeafCount + totalElementCount - 1;
  let i = 0;
  let writeIndex = 0;
  let offset = totalLeafCount + elementCount;

  while (true) {
    const index = offset + i;

    if (index === 1) return { root: hash, newRoot: hashes[0] };

    const useLeafs = index >= totalLeafCount;

    // Odd node must be merged with decommitment on its "left", as hashes does not contain its
    // sibling. Note that this is the only case where index could be odd, since a previously even index
    // would have resulted in a double incrementing of i. In other words, the only odd index we expect
    // is possibly when i = 0, such that it is the first node being appended/touched.
    // Also, continue building the exiting root.
    if (index === lowerBound && index & 1) {
      hashes[writeIndex++] = hashFunction(decommitments[n--], useLeafs ? newLeafs[i++] : hashes[i++]);
      hash = hashFunction(decommitments[n], hash);
      continue;
    }

    // if upper bound (and implicitly even), there is no sibling to the "right"
    if (index === upperBound) hashes[writeIndex++] = hashes[i];

    // if upper bound (or greater, due to over-incrementing in next step), reset and level up
    if (index >= upperBound) {
      i = 0;
      offset >>= 1;
      writeIndex = 0;
      lowerBound >>= 1;
      upperBound >>= 1;
      continue;
    }

    // index is implicitly even and neither of the bounds, so just hash siblings normally
    hashes[writeIndex++] = useLeafs
      ? hashFunction(newLeafs[i++], newLeafs[i++])
      : hashFunction(hashes[i++], hashes[i++]);
  }
};

const getNewRoot = (parameters) => {
  return parameters.newLeafs ? getNewRootMulti(parameters) : getNewRootSingle(parameters);
};

module.exports = { generate, getRoot, getNewRoot };

// TODO: test how this handles null elements/leafs before the append index
// TODO: test how this fails for incorrect element counts (and ths bit counts)
