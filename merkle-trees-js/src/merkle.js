const assert = require('assert');
const { rightShift, and } = require('bitwise-buffer');
const { hashNode, sortHashNode, to32ByteBoolBuffer } = require('./utils');

const generateAppendProofRecursivelyWith = (tree, leafCount, decommitments = []) => {
  const depth = getDepthFromLeafCount(leafCount);

  if (depth <= 1) return decommitments;

  const newDecommitments = leafCount & 1 ? [tree[(1 << depth) + leafCount - 1]] : [];

  return generateAppendProofRecursivelyWith(tree, leafCount >> 1, newDecommitments.concat(decommitments));
};

const generateAppendProofRecursively = (tree, elementCount) => {
  const decommitments = generateAppendProofRecursivelyWith(tree, elementCount).map(Buffer.from);

  return {
    root: Buffer.from(tree[1]),
    decommitments: decommitments.length === 0 ? [] : [tree[2], ...decommitments],
  };
};

const generateAppendProofLoop = (tree, elementCount) => {
  // The idea here is that we only need nodes/proof from the left of the append index
  // since there are no real nodes/leafs to the right of the append index
  // (i.e. a lone rightmost 9th leafs is its parent, grandparent, and great grandparent)
  // So, we start at the top level (2 nodes) and determine the subtree of the append index.
  // If it is on the right (hint, at level 1 it always is, by definition) then we pull in the
  // left subtrees hash, track the offset in the serialized tree structure, and move down a
  // level. Note that when we move down a level, the offset doubles.
  const decommitments = [];

  let numBranchesOnNodes = tree.length >> 1;
  let appendIndex = elementCount;
  let level = 1;
  let offset = 0;

  while (true) {
    // appendIndex must always be localized to given subtree
    appendIndex = appendIndex % numBranchesOnNodes;
    numBranchesOnNodes >>= 1; // divide by 2
    offset <<= 1; // multiply by 2

    if (numBranchesOnNodes === 0) return { root: tree[1], decommitments };

    if (appendIndex >= numBranchesOnNodes) {
      // appendIndex is in the right subtree
      decommitments.push(tree[(1 << level) + offset]);
      offset += 1;
    }

    level += 1;
  }
};

// TODO: implement and test for unbalanced trees
// NOTE: indices must be in descending order
const generateIndexedMultiProof = (tree, indices) => {
  const leafCount = tree.length >> 1;
  const depth = MerkleTree.getDepthFromElementCount(leafCount);
  const known = Array(tree.length).fill(false);
  const decommitments = [];

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'Indices must be in descending order');
    known[leafCount + indices[i]] = true;
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const left = known[2 * i];
    const right = known[2 * i + 1];

    if (left ^ right) decommitments.push(tree[2 * i + left]);

    known[i] = left || right;
  }

  return {
    root: Buffer.from(tree[1]),
    depth,
    indices,
    decommitments: decommitments.map(Buffer.from),
  };
};

// Note: Indices must be sorted in ascending order
const generateFlagMultiProof = (tree, indices, options = {}) => {
  const { unbalanced = false, bitFlag = false } = options;

  let ids = indices.slice();
  const nodes = [];
  const tested = [];
  const flags = [];
  const skips = [];
  let decommitmentIndices = [];
  let nextIds = [];
  const leafCount = tree.length >> 1;
  const treeDepth = MerkleTree.getDepthFromElementCount(leafCount);

  for (let depth = treeDepth; depth > 0; depth--) {
    // For each node we're interested in proving, add it to the list of nodes and
    // add it's sibling/pair to list of decommitments. Push half the node's level
    // index to the list of next ids, for the next (higher) depth iteration
    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;
      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);
      const pairNode = tree[pairIndex];

      assert(unbalanced || pairNode, 'Cannot create proof for unbalanced tree by default');

      nodes.push(nodeIndex);
      decommitmentIndices.push(pairIndex);
      nextIds.push(id >> 1);
    }

    // Filter out decommitments that are themselves being proved
    decommitmentIndices = decommitmentIndices.filter((decommitment) => !nodes.includes(decommitment));

    // For each node we're interested in proving, check if its sibling/pair is in the
    // list of decommitments, and push the flag (proof NOT used) to the list of flags.
    // Also, keep track of indices already tested (and its pairs), so we can skip over them.
    for (let j = 0; j < ids.length; j++) {
      const id = ids[j];
      const nodeIndex = (1 << depth) + id;

      if (tested.includes(nodeIndex)) continue;

      const pairIndex = nodeIndex + (id & 1 ? -1 : 1);
      const proofUsed = decommitmentIndices.includes(pairIndex);
      flags.push(!proofUsed);
      skips.push(!tree[pairIndex]);
      tested.push(nodeIndex);
      tested.push(pairIndex);
    }

    // Filter out duplicate ids (since 3 >> 1 and 4 >> 1 are redundant)
    ids = nextIds.filter((index, i) => nextIds.indexOf(index) === i);
    nextIds = [];
  }

  assert(!bitFlag || flags.length <= 256, 'Proof too large for bit flags.');

  return {
    root: tree[1],
    decommitments: decommitmentIndices
      .map((i) => tree[i])
      .filter((d) => d)
      .map(Buffer.from),
    flags: bitFlag ? to32ByteBoolBuffer(flags) : flags,
    flagCount: flags.length,
    skips: bitFlag ? to32ByteBoolBuffer(skips) : skips,
  };
};

// TODO: test if this works with sortedHash
// NOTE: indices must be in descending order
const verifyIndexedMultiProof = ({ root, depth, indices, elements, decommitments = [] }, options = {}) => {
  const { sortedHash = true, elementPrefix = '00' } = options;
  const prefixBuffer = Buffer.from(elementPrefix, 'hex');
  const hashPair = sortedHash ? sortHashNode : hashNode;

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map(Buffer.from);

  const queue = elements.map((element, i) => ({
    index: (1 << depth) + indices[i],
    node: hashNode(prefixBuffer, element),
  }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, node } = queue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      return node.equals(root);
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      queue.push({ index: index >> 1, node: hashPair(node, decommits.shift()) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can be hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, node: hashPair(queue.shift().node, node) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      queue.push({ index: index >> 1, node: hashPair(decommits.shift(), node) });
    }
  }
};

// TODO: use separate set of flags for left/right hash order, allowing this to work for non-sorted-hash trees
//       Should be able to infer indices of elements based on proof hash order and flags
const verifyFlagMultiProof = ({ root, flags, elements, decommitments = [], skips }, options = {}) => {
  const { elementPrefix = '00' } = options;
  const prefixBuffer = Buffer.from(elementPrefix, 'hex');

  const flagCount = flags.length;
  const totalElements = elements.length;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = elements.map(element => hashNode(prefixBuffer, element));
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < flagCount; i++) {
    hashReadIndex %= totalElements;
    hashWriteIndex %= totalElements;

    if (skips && skips[i]) {
      // TODO: check if this next line can be skipped. I don't think it can.
      hashes[hashWriteIndex++] = hashes[hashReadIndex++];
      continue;
    }

    const left = flags[i] ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= totalElements;
    const right = hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = sortHashNode(left, right);
  }

  return hashes[(hashWriteIndex === 0 ? totalElements : hashWriteIndex) - 1].equals(root);
};

// TODO: use separate set of flags for left/right hash order, allowing this to work for non-sorted-hash trees
//       Should be able to infer indices of elements based on proof hash order and flags
const verifyBitFlagMultiProof = ({ root, flags, flagCount, elements, decommitments = [], skips }, options = {}) => {
  const { elementPrefix = '00' } = options;
  const prefixBuffer = Buffer.from(elementPrefix, 'hex');

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const totalElements = elements.length;
  const hashes = elements.map(element => hashNode(prefixBuffer, element));
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;
  const oneBuffer = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

  for (let i = 0; i < flagCount; i++) {
    hashReadIndex %= totalElements;
    hashWriteIndex %= totalElements;

    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      // TODO: check if this next line can be skipped. I don't think it can.
      hashes[hashWriteIndex++] = hashes[hashReadIndex++];
      continue;
    }

    const flag = and(rightShift(flags, i), oneBuffer).equals(oneBuffer);
    const left = flag ? hashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= totalElements;
    const right = hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = sortHashNode(left, right);
  }

  return hashes[(hashWriteIndex === 0 ? totalElements : hashWriteIndex) - 1].equals(root);
};

// TODO: test if this works with sortedHash
// NOTE: indices must be in descending order
const updateRootWithIndexedMultiProof = (
  { root, depth, indices, elements, newElements, decommitments = [] },
  options = {}
) => {
  const { sortedHash = true, elementPrefix = '00' } = options;
  const prefixBuffer = Buffer.from(elementPrefix, 'hex');
  const hashPair = sortedHash ? sortHashNode : hashNode;

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map(Buffer.from);

  const queue = elements.map((element, i) => ({
    index: (1 << depth) + indices[i],
    node: hashNode(prefixBuffer, element),
  }));

  const newQueue = newElements.map((element, i) => ({
    index: (1 << depth) + indices[i],
    node: hashNode(prefixBuffer, element),
  }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, node } = queue.shift();
    const { node: newNode } = newQueue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      assert(node.equals(root), 'Invalid proof.');

      return { root: newNode };
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      const decommitment = decommits.shift();
      queue.push({ index: index >> 1, node: hashPair(node, decommitment) });
      newQueue.push({ index: index >> 1, node: hashPair(newNode, decommitment) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can be hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, node: hashPair(queue.shift().node, node) });
      newQueue.push({ index: index >> 1, node: hashPair(newQueue.shift().node, newNode) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      const decommitment = decommits.shift();
      queue.push({ index: index >> 1, node: hashPair(decommitment, node) });
      newQueue.push({ index: index >> 1, node: hashPair(decommitment, newNode) });
    }
  }
};

// TODO: use separate set of flags for left/right hash order, allowing this to work for non-sorted-hash trees
//       Should be able to infer indices of elements based on proof hash order and flags
const updateRootWithFlagMultiProof = ({ root, flags, elements, newElements, decommitments = [], skips }, options = {}) => {
  const { elementPrefix = '00' } = options;
  const prefixBuffer = Buffer.from(elementPrefix, 'hex');

  const flagCount = flags.length;
  const totalElements = elements.length;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const hashes = elements.map(element => hashNode(prefixBuffer, element));
  const newHashes = newElements.map(element => hashNode(prefixBuffer, element));
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < flagCount; i++) {
    hashReadIndex %= totalElements;
    hashWriteIndex %= totalElements;

    if (skips && skips[i]) {
      // TODO: check if these next lines can be skipped. I don't think they can.
      hashes[hashWriteIndex] = hashes[hashReadIndex];
      newHashes[hashWriteIndex++] = newHashes[hashReadIndex++];
      continue;
    }

    const left = flags[i] ? hashes[hashReadIndex] : decommitments[decommitmentIndex];
    const newLeft = flags[i] ? newHashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= totalElements;
    const right = hashes[hashReadIndex];
    const newRight = newHashes[hashReadIndex++];
    hashes[hashWriteIndex] = sortHashNode(left, right);
    newHashes[hashWriteIndex++] = sortHashNode(newLeft, newRight);
  }

  const rootIndex = (hashWriteIndex === 0 ? totalElements : hashWriteIndex) - 1;

  assert(hashes[rootIndex].equals(root), 'Invalid Proof.');

  return { root: newHashes[rootIndex] };
};

// TODO: use separate set of flags for left/right hash order, allowing this to work for non-sorted-hash trees
//       Should be able to infer indices of elements based on proof hash order and flags
const updateRootWithBitFlagMultiProof = ({ root, flags, flagCount, elements, newElements, decommitments = [], skips }, options = {}) => {
  const { elementPrefix = '00' } = options;
  const prefixBuffer = Buffer.from(elementPrefix, 'hex');

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const totalElements = elements.length;
  const hashes = elements.map(element => hashNode(prefixBuffer, element));
  const newHashes = newElements.map(element => hashNode(prefixBuffer, element));
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;
  const oneBuffer = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

  for (let i = 0; i < flagCount; i++) {
    hashReadIndex %= totalElements;
    hashWriteIndex %= totalElements;

    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      // TODO: check if these next lines can be skipped. I don't think they can.
      hashes[hashWriteIndex] = hashes[hashReadIndex];
      newHashes[hashWriteIndex++] = newHashes[hashReadIndex++];
      continue;
    }

    const flag = and(rightShift(flags, i), oneBuffer).equals(oneBuffer);
    const left = flag ? hashes[hashReadIndex] : decommitments[decommitmentIndex];
    const newLeft = flag ? newHashes[hashReadIndex++] : decommitments[decommitmentIndex++];
    hashReadIndex %= totalElements;
    const right = hashes[hashReadIndex];
    const newRight = newHashes[hashReadIndex++];
    hashes[hashWriteIndex] = sortHashNode(left, right);
    newHashes[hashWriteIndex++] = sortHashNode(newLeft, newRight);
  }

  const rootIndex = (hashWriteIndex === 0 ? totalElements : hashWriteIndex) - 1;

  assert(hashes[rootIndex].equals(root), 'Invalid Proof.')

  return { root: newHashes[rootIndex] };
};

// TODO: consider a Proof class

class MerkleTree {
  constructor(elements, options = {}) {
    const { sortedHash = true, unbalanced = true, elementPrefix = '00' } = options;
    this._sortedHash = sortedHash;
    this._unbalanced = unbalanced;
    this._elementPrefix = Buffer.from(elementPrefix, 'hex');
    const hashPair = this._sortedHash ? sortHashNode : hashNode;

    this._elements = elements.map(Buffer.from);
    this._depth = MerkleTree.getDepthFromElements(this._elements);
    this._leafCount = MerkleTree.getLeafCountFromDepth(this._depth);

    assert(this._unbalanced || this._elements.length === this._leafCount, 'Incorrect element count for balanced tree');

    const nodeCount = 2 * this._leafCount;
    this._tree = Array(nodeCount).fill(null);

    for (let i = 0; i < this._elements.length; i++) {
      // Unless explicit, do not allow a elements to be null
      // TODO: maybe we can. likely we could.
      assert(this._elements[i], 'Cannot have null elements.');
      this._tree[this._leafCount + i] = hashNode(this._elementPrefix, this._elements[i]);
    }

    for (let i = this._leafCount - 1; i > 0; i--) {
      if (this._tree[2 * i] && this._tree[2 * i + 1]) {
        // Only bother hashing if left and right are real nodes
        this._tree[i] = hashPair(this._tree[2 * i], this._tree[2 * i + 1]);
        continue;
      }

      if (this._tree[2 * i]) {
        // NOTE: If a node is real, all nodes to the left are real
        // Don't bother hashing (i.e. H(A,B)=A where B is 0)
        this._tree[i] = this._tree[2 * i];
        continue;
      }
    }
  }

  static getDepthFromElementCount(elementCount) {
    return Math.ceil(Math.log2(elementCount));
  }

  static getDepthFromElements(elements) {
    return MerkleTree.getDepthFromElementCount(elements.length);
  }

  static getLeafCountFromElementCount(elementCount) {
    return 1 << MerkleTree.getDepthFromElementCount(elementCount);
  }

  static getLeafCountFromElements(elements) {
    return MerkleTree.getLeafCountFromElementCount(elements.length);
  }

  static getLeafCountFromDepth(depth) {
    return 1 << depth;
  }

  // TODO: make work with unbalanced trees
  // TODO: implement and test as flag method
  static verifySingleProof({ root, index, element, decommitments = [] }, options = {}) {
    const { sortedHash = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashPair = sortedHash ? sortHashNode : hashNode;

    let hash = hashNode(prefixBuffer, element);

    for (let i = decommitments.length - 1; i >= 0; i--) {
      hash = index & 1 ? hashPair(decommitments[i], hash) : hashPair(hash, decommitments[i]);
      index >>= 1; // integer divide index by 2
    }

    return hash.equals(root);
  }

  // TODO: make work with unbalanced trees
  static updateWithSingleProof({ root, index, element, newElement, decommitments = [] }, options = {}) {
    const { sortedHash = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashPair = sortedHash ? sortHashNode : hashNode;

    let hash = hashNode(prefixBuffer, element);
    let newHash = hashNode(prefixBuffer, newElement);

    for (let i = decommitments.length - 1; i >= 0; i--) {
      hash = index & 1 ? hashPair(decommitments[i], hash) : hashPair(hash, decommitments[i]);
      newHash = index & 1 ? hashPair(decommitments[i], newHash) : hashPair(newHash, decommitments[i]);
      index >>= 1; // integer divide index by 2
    }

    assert(hash.equals(root), 'Invalid proof.');

    return { root: newHash };
  }

  static appendElementWithProof({ element, root, decommitments = [] }, options = {}) {
    assert(decommitments.length, 'Unexpected number of decommitments.');

    const { sortedHash = false, elementPrefix = '00' } = options;
    const prefixBuffer = Buffer.from(elementPrefix, 'hex');
    const hashPair = sortedHash ? sortHashNode : hashNode;

    // Clone decommitments so we don't destroy/consume it
    const queue = decommitments.map(Buffer.from);
    const n = queue.length - 1;

    // As we verify the proof, we'll build the new root in parallel, since the
    // verification loop will consume the queue/stack
    let newRoot = hashPair(queue[n], hashNode(prefixBuffer, element));

    for (let i = n; i > 0; i--) {
      newRoot = hashPair(queue[i - 1], newRoot);
      queue[i - 1] = hashPair(queue[i - 1], queue[i]);
    }

    assert(queue[0].equals(root), 'Invalid Proof');

    return { root: newRoot };
  }

  static verifyAppendProof({ root, decommitments = [] }, options = {}) {
    assert(decommitments.length, 'Unexpected number of decommitments.');

    const { sortedHash = false } = options;
    const hashPair = sortedHash ? sortHashNode : hashNode;

    // Clone decommitments so we don't destroy/consume it
    const queue = decommitments.map(Buffer.from);
    const n = queue.length - 1;

    for (let i = n; i > 0; i--) {
      queue[i - 1] = hashPair(queue[i - 1], queue[i]);
    }

    return queue[0].equals(root);
  }

  // TODO: implement
  static appendElementsWithProof({ elements, root, decommitments = [] }, options = {}) {}

  // TODO: test this with unbalanced trees
  static verifyMultiProof(parameters, options = {}) {
    const verify = parameters.indices
      ? verifyIndexedMultiProof
      : Buffer.isBuffer(parameters.flags)
      ? verifyBitFlagMultiProof
      : verifyFlagMultiProof;
    return verify(parameters, options);
  }

  static updateWithMultiProof(parameters, options = {}) {
    const update = parameters.indices
      ? updateRootWithIndexedMultiProof
      : Buffer.isBuffer(parameters.flags)
      ? updateRootWithBitFlagMultiProof
      : updateRootWithFlagMultiProof;
    return update(parameters, options);
  }

  get root() {
    return Buffer.from(this._tree[1]);
  }

  get depth() {
    return this._depth;
  }

  get elements() {
    return this._elements.map(Buffer.from);
  }

  // TODO: make work with unbalanced trees
  // TODO: consider splitting up proof method into
  //       - proving that an element in the set (flag based)
  //       - proving that an element exist at specific index (index based)
  generateSingleProof(index) {
    assert(index < this._elements.length, 'Index out of range.');

    const decommitments = [];

    for (let i = this._leafCount + index; i > 1; i = i >> 1) {
      decommitments.unshift(i & 1 ? this._tree[i - 1] : this._tree[i + 1]);
    }

    return {
      root: Buffer.from(this._tree[1]),
      index,
      element: Buffer.from(this._elements[index]),
      decommitments: decommitments.map(Buffer.from),
    };
  }

  generateSingleUpdateProof(index, element) {
    return Object.assign({ newElement: Buffer.from(element) }, this.generateSingleProof(index));
  }

  updateSingle(index, element) {
    assert(index < this._elements.length, 'Index out of range.');

    const newElements = this._elements.map((e, i) => (i === index ? element : e));

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }

  generateAppendProof(options = {}) {
    const { recursively = false } = options;
    const generate = recursively ? generateAppendProofRecursively : generateAppendProofLoop;

    return generate(this._tree, this._elements.length);
  }

  appendSingle(element) {
    const newElements = this.elements.map((e) => e);
    newElements.push(element);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }

  appendMulti(elements) {
    const newElements = this.elements.map((e) => e).concat(elements);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }

  // TODO: consider splitting up multi proof method into
  //       - proving that elements are in the set (flag based)
  //       - proving that elements exist at specific indices (index based)
  generateMultiProof(indices, options = {}) {
    const { indexed = false, bitFlag = false } = options;
    const generate = indexed ? generateIndexedMultiProof : generateFlagMultiProof;
    const proof = generate(this._tree, indices, { unbalanced: this._unbalanced, bitFlag });
    const elements = indices.map((index) => Buffer.from(this.elements[index]));

    return Object.assign({ elements }, proof);
  }

  generateMultiUpdateProof(indices, elements, options = {}) {
    const newElements = elements.map(Buffer.from);
    return Object.assign({ newElements }, this.generateMultiProof(indices, options));
  }

  updateMulti(indices, elements) {
    // TODO: Filter or throw on duplicate indices
    indices.forEach((index) => {
      assert(index < this._elements.length, 'Index out of range.');
    });

    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i);

      return index >= 0 ? elements[index] : e;
    });

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
      elementPrefix: this._elementPrefix,
    };

    return new MerkleTree(newElements, options);
  }
}

module.exports = MerkleTree;

// TODO: serialize method
// TODO: update/append methods can return proof and new Merkle Tree
// TODO: match paramter lengths on multi methods
