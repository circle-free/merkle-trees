const assert = require('assert');
const { rightShift, and } = require('bitwise-buffer');
const { hashNode, sortHashNode, to32ByteBuffer, bitCount32, to32ByteBoolBuffer } = require('./utils');

const generateAppendProofRecursivelyWith = (tree, leafCount, decommitments = []) => {
  const depth = getDepthFromLeafCount(leafCount);

  if (depth <= 1) return decommitments;

  const newDecommitments = leafCount & 1 ? [tree[Math.pow(2, depth) + leafCount - 1]] : [];

  return generateAppendProofRecursivelyWith(
    tree,
    Math.ceil((leafCount + 1) / 2 - 1),
    newDecommitments.concat(decommitments)
  );
};

const generateAppendProofRecursively = (tree, elementCount) => {
  const decommitments = generateAppendProofRecursivelyWith(tree, elementCount);

  return {
    mixedRoot: tree[0],
    root: tree[1],
    elementCount,
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

    if (numBranchesOnNodes === 0) {
      return {
        mixedRoot: tree[0],
        root: tree[1],
        elementCount,
        decommitments,
      };
    }

    if (appendIndex >= numBranchesOnNodes) {
      // appendIndex is in the right subtree
      decommitments.push(tree[(1 << level) + offset]);
      offset += 1;
    }

    level += 1;
  }
};

// Note: Indices must be sorted in ascending order
const generateFlagMultiProof = (tree, elementCount, indices, options = {}) => {
  const { unbalanced = false, bitFLag = false } = options;

  assert(indices.every((i) => i < elementCount));

  let ids = indices.map((i) => i);
  const nodes = [];
  const tested = [];
  const flags = [];
  const skips = [];
  let decommitmentIndices = [];
  let nextIds = [];
  const treeDepth = MerkleTree.getDepthFromElementCount(elementCount);

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

  assert(!bitFLag || flags.length <= 256, 'Proof too large for bit flags.');

  return {
    mixedRoot: tree[0],
    root: tree[1],
    elementCount: elementCount,
    elements: indices.map((i) => tree[(1 << treeDepth) + i]),
    decommitments: decommitmentIndices.map((i) => tree[i]).filter((d) => d),
    flags: bitFLag ? to32ByteBoolBuffer(flags) : flags,
    flagCount: flags.length,
    skips: bitFLag ? to32ByteBoolBuffer(skips) : skips,
  };
};

// TODO: implement and test for unbalanced trees
// NOTE: indices must be in descending order
const generateIndexedMultiProof = (tree, elementCount, indices) => {
  const leafCount = MerkleTree.getLeafCountFromElementCount(elementCount);
  const nodeCount = leafCount << 1;
  const known = Array(nodeCount).fill(false);
  const elements = [];
  const decommitments = [];

  for (let i = 0; i < indices.length; i++) {
    assert(i === 0 || indices[i - 1] > indices[i], 'indices must be in descending order');
    known[leafCount + indices[i]] = true;
    elements.push(tree[leafCount + indices[i]]);
  }

  for (let i = leafCount - 1; i > 0; i--) {
    const left = known[2 * i];
    const right = known[2 * i + 1];

    if (left ^ right) decommitments.push(tree[2 * i + left]);

    known[i] = left || right;
  }

  return {
    mixedRoot: tree[0],
    root: tree[1],
    elementCount,
    indices,
    elements,
    decommitments,
  };
};

const verifyFlagMultiProof = ({ mixedRoot, root, elementCount, flags, elements, decommitments = [], skips }) => {
  if (!MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount })) return false;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const totalFlags = flags.length;
  const totalElements = elements.length;
  const hashes = new Array(totalElements);
  let elementIndex = 0;
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < totalFlags; i++) {
    hashReadIndex %= totalElements;
    hashWriteIndex %= totalElements;

    const useElements = elementIndex < totalElements;

    if (skips && skips[i]) {
      hashes[hashWriteIndex++] = useElements ? elements[elementIndex++] : hashes[hashReadIndex++];
      continue;
    }

    const left = flags[i]
      ? useElements
        ? elements[elementIndex++]
        : hashes[hashReadIndex++]
      : decommitments[decommitmentIndex++];

    hashReadIndex %= totalElements;
    const right = useElements ? elements[elementIndex++] : hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = sortHashNode(left, right);
  }

  return hashes[(hashWriteIndex === 0 ? totalElements : hashWriteIndex) - 1].equals(root);
};

// NOTE: indices must be in descending order
const verifyIndexedMultiProof = ({ mixedRoot, root, elementCount, indices, elements, decommitments = [] }) => {
  if (!MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount })) return false;

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);
  const queue = elements.map((element, i) => ({ index: elementCount + indices[i], element }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, element } = queue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      return element.equals(root);
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      queue.push({ index: index >> 1, element: hashNode(element, decommits.shift()) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can ne hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, element: hashNode(queue.shift().element, element) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      queue.push({ index: index >> 1, element: hashNode(decommits.shift(), element) });
    }
  }
};

const verifyBitFlagMultiProof = ({
  mixedRoot,
  root,
  elementCount,
  flags,
  totalFlags,
  elements,
  decommitments = [],
  skips,
}) => {
  if (!MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount })) return false;

  // Keep verification minimal by using circular hashes queue with separate read and write heads
  const totalElements = elements.length;
  const hashes = new Array(totalElements);
  let elementIndex = 0;
  let hashReadIndex = 0;
  let hashWriteIndex = 0;
  let decommitmentIndex = 0;
  const oneBuffer = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');

  for (let i = 0; i < totalFlags; i++) {
    hashReadIndex %= totalElements;
    hashWriteIndex %= totalElements;

    const useElements = elementIndex < totalElements;
    const skip = skips && and(rightShift(skips, i), oneBuffer).equals(oneBuffer);

    if (skip) {
      hashes[hashWriteIndex++] = useElements ? elements[elementIndex++] : hashes[hashReadIndex++];
      continue;
    }

    const flag = and(rightShift(flags, i), oneBuffer).equals(oneBuffer);

    const left = flag
      ? useElements
        ? elements[elementIndex++]
        : hashes[hashReadIndex++]
      : decommitments[decommitmentIndex++];

    hashReadIndex %= totalElements;
    const right = useElements ? elements[elementIndex++] : hashes[hashReadIndex++];
    hashes[hashWriteIndex++] = sortHashNode(left, right);
  }

  return hashes[(hashWriteIndex === 0 ? totalElements : hashWriteIndex) - 1].equals(root);
};

// TODO: test this function
const updateRootWithFlagMultiProof = ({
  mixedRoot,
  root,
  elementCount,
  flags,
  elements,
  newElements,
  decommitments = [],
}) => {
  assert(MerkleTree.verifyMixedRoot(mixedRoot, root, elementCount), 'Invalid root parameters.');

  const totalElements = elements.length;
  const totalHashes = flags.length;
  const hashes = new Array(totalHashes);
  const newHashes = new Array(totalHashes);
  let elementIndex = 0;
  let hashIndex = 0;
  let decommitmentIndex = 0;

  for (let i = 0; i < totalHashes; i++) {
    const useElements = elementIndex < totalElements;

    const left = flags[i]
      ? useElements
        ? elements[elementIndex]
        : hashes[hashIndex]
      : decommitments[decommitmentIndex];

    const right = useElements ? elements[elementIndex] : hashes[hashIndex];
    hashes[i] = sortHashNode(left, right);

    const newLeft = flags[i]
      ? useElements
        ? newElements[elementIndex++]
        : newHashes[hashIndex++]
      : decommitments[decommitmentIndex++];

    const newRight = useElements ? newElements[elementIndex++] : newHashes[hashIndex++];
    newHashes[i] = sortHashNode(newLeft, newRight);
  }

  assert(hashes[totalHashes - 1].equals(root), 'Invalid proof.');

  return {
    mixedRoot: computeMixedRoot({ root: newHashes[totalHashes - 1], elementCount }),
    root: newHashes[totalHashes - 1],
  };
};

// TODO: implement
const updateRootWithBitFlagMultiProof = ({
  mixedRoot,
  root,
  elementCount,
  flags,
  elements,
  newElements,
  decommitments = [],
}) => {};

// TODO: test this function
// NOTE: indices must be in descending order
const updateRootWithIndexedMultiProof = ({
  mixedRoot,
  root,
  elementCount,
  indices,
  elements,
  newElements,
  decommitments = [],
}) => {
  assert(MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount }), 'Invalid root parameters');

  // Clone decommitments so we don't destroy/consume it (when when shift the array)
  const decommits = decommitments.map((decommitment) => decommitment);

  const queue = elements.map((element, i) => ({ index: elementCount + indices[i], element }));
  const newQueue = newElements.map((element, i) => ({ index: elementCount + indices[i], element }));

  while (true) {
    assert(queue.length >= 1, 'Something went wrong.');

    const { index, element } = queue.shift();
    const { element: newElement } = newQueue.shift();

    if (index === 1) {
      // tree index 1, so check against the root
      assert(element.equals(root), 'Invalid proof.');

      return {
        mixedRoot: MerkleTree.computeMixedRoot({ root: newElement, elementCount }),
        root: newElement,
      };
    } else if ((index & 1) === 0) {
      // Even nodes hashed with decommitment on right
      queue.push({ index: index >> 1, value: hashNode(element, decommits.shift()) });
      newQueue.push({ index: index >> 1, value: hashNode(newElement, decommits.shift()) });
    } else if (queue.length > 0 && queue[0].index === index - 1) {
      // Odd nodes can ne hashed with neighbor on left (hash stack)
      queue.push({ index: index >> 1, value: hashNode(queue.shift().value, element) });
      newQueue.push({ index: index >> 1, value: hashNode(newQueue.shift().value, newElement) });
    } else {
      // Remaining odd nodes hashed with decommitment on the left
      queue.push({ index: index >> 1, value: hashNode(decommits.shift(), element) });
      newQueue.push({ index: index >> 1, value: hashNode(decommits.shift(), newElement) });
    }
  }
};

// TODO: consider a Proof class

class MerkleTree {
  constructor(elements, options = {}) {
    const { sortedHash = true, unbalanced = true } = options;
    this._sortedHash = sortedHash;
    this._unbalanced = unbalanced;

    const hashPair = this._sortedHash ? sortHashNode : hashNode;

    this._elementCount = elements.length;
    this._depth = MerkleTree.getDepthFromElements(elements);
    this._leafCount = MerkleTree.getLeafCountFromDepth(this._depth);

    assert(this._unbalanced || this._elementCount === this._leafCount, 'Incorrect element count for balanced tree');

    const nodeCount = 2 * this._leafCount;
    this._tree = Array(nodeCount).fill(null);

    for (let i = 0; i < this._elementCount; i++) {
      // Unless explicit, do not allow a elements to be null
      // TODO: maybe we can. likely we could.
      assert(elements[i], 'Cannot holes between elements.');
      this._tree[this._leafCount + i] = elements[i];
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

    // Mix in element count to prevent second pre-image attack
    // This means the true Merkle Root is the Mixed Root at tree[0]
    this._tree[0] = MerkleTree.computeMixedRoot({ root: this._tree[1], elementCount: this._elementCount });

    this._mixedRoot = this._tree[0];
    this._root = this._tree[1];
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

  static computeMixedRoot({ root, elementCount }, options = {}) {
    const { sortedHash = false } = options;
    const hashPair = sortedHash ? sortHashNode : hashNode;
    return hashPair(to32ByteBuffer(elementCount), root);
  }

  static verifyMixedRoot({ mixedRoot, root, elementCount }, options = {}) {
    return MerkleTree.computeMixedRoot({ root, elementCount }, options).equals(mixedRoot);
  }

  // TODO: test and make work with unbalanced trees
  // TODO: implement and test as flag method
  static verifySingleProof({ mixedRoot, root, elementCount, index, element, decommitments = [] }, options = {}) {
    const { sortedHash = false } = options;
    const hashPair = sortedHash ? sortHashNode : hashNode;

    if (!MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount })) return false;

    if (elementCount === 1 && element.equals(root)) return true;

    let hash = element;

    for (let i = decommitments.length - 1; i >= 0; i--) {
      hash = index & 1 ? hashPair(decommitments[i], hash) : hashPair(hash, decommitments[i]);
      index >>= 1; // integer divide index by 2
    }

    return hash.equals(root);
  }

  // TODO: test and make work with unbalanced trees
  static updateWithSingleProof(
    { mixedRoot, root, elementCount, index, element, newElement, decommitments = [] },
    options = {}
  ) {
    const { sortedHash = false } = options;
    const hashPair = sortedHash ? sortHashNode : hashNode;

    assert(MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount }), 'Invalid root parameters.');

    if (elementCount === 1 && element.equals(root)) {
      return {
        mixedRoot: MerkleTree.computeMixedRoot({ root: newElement, elementCount }),
        root: newElement,
        elementCount,
      };
    }

    let hash = element;
    let newHash = newElement;

    for (let i = decommitments.length - 1; i >= 0; i--) {
      hash = index & 1 ? hashPair(decommitments[i], hash) : hashPair(hash, decommitments[i]);
      newHash = index & 1 ? hashPair(decommitments[i], newHash) : hashPair(newHash, decommitments[i]);
      index >>= 1; // integer divide index by 2
    }

    assert(hash.equals(root), 'Invalid proof.');

    return {
      mixedRoot: MerkleTree.computeMixedRoot({ root: newHash, elementCount }),
      root: newHash,
      elementCount,
    };
  }

  static appendElementWithProof({ element, mixedRoot, root, elementCount, decommitments = [] }, options = {}) {
    const { sortedHash = false } = options;
    const hashPair = sortedHash ? sortHashNode : hashNode;

    // NOTE: The number of decommitments (from the left) needed to append to an unbalanced, appendable tree
    //       are equal to the number of set bits in the elementCount
    const bitCount = bitCount32(elementCount);
    assert(bitCount === 1 || bitCount === decommitments.length, 'Unexpected number of decommitments.');
    assert(MerkleTree.verifyMixedRoot({ mixedRoot, root, elementCount }), 'Invalid root parameters.');

    let newRoot;
    let newElementCount = elementCount + 1;

    // Appending to a unbalanced, appendable Merkle Tree is equally trivial
    if ((elementCount & (elementCount - 1)) === 0) {
      newRoot = hashPair(root, element);

      return {
        mixedRoot: MerkleTree.computeMixedRoot({ root: newRoot, elementCount: elementCount + 1 }),
        root: newRoot,
        elementCount: newElementCount,
      };
    }

    // Clone decommitments so we don't destroy/consume it
    const queue = decommitments.map((decommitment) => decommitment);
    const n = queue.length - 1;

    // As we verify the proof, we'll build the new root in parallel, since the
    // verification loop will consume the queue/stack
    newRoot = hashPair(queue[n], element);

    for (let i = n; i > 0; i--) {
      newRoot = hashPair(queue[i - 1], newRoot);
      queue[i - 1] = hashPair(queue[i - 1], queue[i]);

      if (i === 1) {
        assert(queue[0].equals(root), 'Invalid Proof');

        return {
          mixedRoot: MerkleTree.computeMixedRoot({ root: newRoot, elementCount: elementCount + 1 }),
          root: newRoot,
          elementCount: newElementCount,
        };
      }
    }
  }

  // TODO: implement
  static appendElementsWithProof({ elements, mixedRoot, root, elementCount, decommitments = [] }, options = {}) {}

  // TODO: test this with unbalanced trees
  static verifyMultiProof(parameters) {
    const verify = parameters.indices
      ? verifyIndexedMultiProof
      : Buffer.isBuffer(parameters.flags)
      ? verifyBitFlagMultiProof
      : verifyFlagMultiProof;
    return verify(parameters);
  }

  // TODO: test this function
  static updateWithMultiProof(parameters) {
    const update = parameters.indices
      ? updateRootWithIndexedMultiProof
      : Buffer.isBuffer(parameters.flags)
      ? updateRootWithBitFlagMultiProof
      : updateRootWithFlagMultiProof;
    return update(parameters);
  }

  get mixedRoot() {
    return this._mixedRoot;
  }

  get root() {
    return this._root;
  }

  get depth() {
    return this._depth;
  }

  get leafs() {
    return this._tree.slice(this._leafCount);
  }

  get elements() {
    return this._tree.slice(this._leafCount, this._leafCount + this._elementCount);
  }

  // TODO: test and make work with unbalanced trees
  // TODO: consider splitting up proof method into
  //       - proving that an element in the set (flag based)
  //       - proving that an element exist at specific index (index based)
  generateSingleProof(index) {
    assert(index < this._elementCount, 'Index out of range.');

    const decommitments = [];

    if (this._elementCount === 1) {
      return {
        mixedRoot: this._mixedRoot,
        root: this._root,
        elementCount: this._elementCount,
        index,
        element: this._tree[1],
        decommitments,
      };
    }

    for (let i = this._leafCount + index; i > 1; i = i >> 1) {
      decommitments.unshift(i & 1 ? this._tree[i - 1] : this._tree[i + 1]);
    }

    return {
      mixedRoot: this._mixedRoot,
      root: this._root,
      elementCount: this._elementCount,
      index,
      element: this._tree[this._leafCount + index],
      decommitments,
    };
  }

  generateUpdateProof(index, element) {
    return Object.assign({ newElement: element }, this.generateSingleProof(index));
  }

  updateOne(index, element) {
    assert(index < this._elementCount, 'Index out of range.');

    const newElements = this.elements.map((e, i) => (i === index ? element : e));

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
    };

    return new MerkleTree(newElements, options);
  }

  updateMany(indices, elements) {
    indices.forEach((index) => {
      assert(index < this._elementCount, 'Index out of range.');
    });

    const newElements = this.elements.map((e, i) => {
      const index = indices.indexOf(i);

      return index >= 0 ? elements[index] : e;
    });

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
    };

    return new MerkleTree(newElements, options);
  }

  generateAppendProof(options = {}) {
    const { recursively = false } = options;
    const generate = recursively ? generateAppendProofRecursively : generateAppendProofLoop;

    return generate(this._tree, ths._elementCount);
  }

  appendOne(element) {
    const newElements = this.elements.map((e) => e);
    newElements.push(element);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
    };

    return new MerkleTree(newElements, options);
  }

  appendMany(elements) {
    const newElements = this.elements.map((e) => e).concat(elements);

    const options = {
      sortedHash: this._sortedHash,
      unbalanced: this._unbalanced,
    };

    return new MerkleTree(newElements, options);
  }

  // TODO: consider splitting up multi proof method into
  //       - proving that elements are in the set (flag based)
  //       - proving that elements exist at specific indices (index based)
  generateMultiProof(indices, options = {}) {
    const { indexed = false } = options;
    const generate = indexed ? generateIndexedMultiProof : generateFlagMultiProof;
    return generate(this._tree, elementCount, indices, { unbalanced: this.unbalanced });
  }
}

module.exports = MerkleTree;
