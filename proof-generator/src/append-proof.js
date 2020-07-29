'use strict'
const { Keccak } = require('sha3');
const assert = require('assert');

const pad = (num, size) => {
    let s = num + '';

    while (s.length < size) s = '0' + s;

    return s;
}

const to32ByteBuffer = number => {
    return Buffer.from(pad(number.toString(16), 64), 'hex');
}

const bitCount32 = n => {
    let m = n - ((n >> 1) & 0x55555555);
    m = (m & 0x33333333) + ((m >> 2) & 0x33333333);

    return ((m + (m >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
};

// NOTE: arguments must already be buffers, preferably 32 bytes
const hashNode = (leftHash, rightHash) => {
    const hash = new Keccak(256);
    return hash.update(Buffer.concat([leftHash, rightHash])).digest();
};

const getMixedRoot = tree => {
    return tree[0];
};

const getRoot = tree => {
    return tree[1];
};

const validateMixedRoot = (root, realLeafCount, mixedRoot) => {
    return hashNode(to32ByteBuffer(realLeafCount), root).equals(mixedRoot);
};

// NOTE: Real Leafs are those left of the append index
const getRealLeafsFromTreeMixin = tree => {
    return tree[0];
};

// NOTE: This is still valid since an imperfect Merkle Tree will still be serialized normally
const getDepthFromTree = tree => {
    return Math.log2(tree.length) - 1;
};

// NOTE: Given an imperfect Merkle Tree (leaf count is not power of 2)
const getEffectiveDepthFromLeafs = leafs => {
    return Math.ceil(Math.log2(leafs.length));
}

// TODO: consider using zero-filled buffers as 'nulls'
const makeTree = leafs => {
    const realLeafCount = leafs.length;
    const depth = getEffectiveDepthFromLeafs(leafs);
    const effectiveLeafs = leafs.concat(Array((1 << depth) - realLeafCount).fill(null));
    const effectiveLeafCount = effectiveLeafs.length;
    const nodeCount = 2 * effectiveLeafCount;
    const tree = Array(nodeCount).fill(null);

    for (let i = 0; i < effectiveLeafCount; i++) {
        tree[(1 << depth) + i] = leafs[i];
    }

    for (let i = (1 << depth) - 1; i > 0; i--) {
        if (tree[2*i] && tree[2*i + 1]) {
            // Only bother hashing if left and right are real leafs
            tree[i] = hashNode(tree[2*i], tree[2*i + 1]);
        } else if (tree[2*i]) {
            // NOTE: If a leaf is real, all leafs to the left are real
            // Don't bother hashing (i.e. H(A,B)=A where B is 0)
            tree[i] = tree[2*i];
        }
    }

    // Mix in real leaf count to prevent second pre-image attack
    // This means the true Merkle Root is the Mixed Root at tree[0]
    tree[0] = hashNode(to32ByteBuffer(realLeafCount), tree[1]);

    return { realLeafCount, tree, mixedRoot: tree[0], root: tree[1] };
};

const generateAppendProofRecursivelyWith = (tree, leafCount, decommitments = []) => {
    const depth = Math.ceil(Math.log2(leafCount));

    if (depth <= 1) return decommitments;

    const newDecommitments = (leafCount % 2) === 1 ? [tree[Math.pow(2, depth) + leafCount - 1]] : [];
    
    return generateAppendProofRecursivelyWith(tree, Math.ceil((leafCount + 1) / 2 - 1), newDecommitments.concat(decommitments));
};
  
const generateAppendProofRecursively = (tree, realLeafCount) => {
    const decommitments = generateAppendProofRecursivelyWith(tree, realLeafCount);
    return decommitments.length === 0 ? [] : [2, ...decommitments];
};

const generateAppendProofLoop = (tree, realLeafCount) => {
    // The idea here is that we only need nodes/proof from the left of the append index
    // since there are no real nodes/leafs to the right of the append index
    // (i.e. a lone rightmost 9th leafs is its parent, grandparent, and great grandparent)
    // So, we start at the top level (2 nodes) and determine the subtree of the append index.
    // If it is on the right (hint, at level 1 it always is, by definition) then we pull in the
    // left subtrees hash, track the offset in the serialized tree structure, and move down a
    // level. Note that when we move down a level, the offset doubles.
    const decommitments = [];

    let numBranchesOnNodes = 1 << Math.ceil(Math.log2(realLeafCount));
    let appendIndex = realLeafCount;
    let level = 1;
    let offset = 0;

    while (true) {
        // appendIndex must always be localized to given subtree 
        appendIndex = appendIndex % numBranchesOnNodes;
        numBranchesOnNodes >>= 1;       // divide by 2
        offset <<= 1;                   // multiply by 2

        if (numBranchesOnNodes === 0) return decommitments;

        if (appendIndex >= numBranchesOnNodes) {
            // appendIndex is in the right subtree
            decommitments.push(tree[Math.pow(2, level) + offset]);
            offset += 1;
        }

        level += 1;
    }
};

// Option available to use the recursive algorithm
const generateAppendProof = (tree, realLeafCount, options = {}) => {
    const { recursively = false } = options;

    if (recursively) return generateAppendProofRecursively(tree, realLeafCount);

    return generateAppendProofLoop(tree, realLeafCount);
};

// TODO: test if this still works with Append Merkle Trees (it should)
// NOTE: indices must be in descending order
const verifyMultiProof = (root, depth, indices, values, decommitments) => {
    const queue = [];

    values.forEach((value, i) => {
        queue.push({ index: (1 << depth) + indices[i], value });
    });

    while (true) {
        assert(queue.length >= 1, 'Something went wrong.');

        const { index, value } = queue.shift();

        if (index === 1) {
            return value.equals(root);
        } else if (index % 2 === 0) {
            queue.push({ index: index >> 1, value: hashNode(value, decommitments.shift()) });
        } else if ((queue.length > 0) && (queue[0].index === index - 1)) {
            queue.push({ index: index >> 1, value: hashNode(queue.shift().value, value) });
        } else {
            queue.push({ index: index >> 1, value: hashNode(decommitments.shift(), value) });
        }
    }
};

// NOTE: appending to a null tree/root is effectively going to create one
// NOTE: decommitments need to be ordered from left to right
const appendLeaf = (value, mixedRoot = null, root = null, realLeafCount = 0, decommitments = []) => {
    // NOTE: The number of decommitments (from the left) needed are equal to the number of set bits in the realLeafCount
    assert(bitCount32(realLeafCount) === decommitments.length, 'Unexpected number of decommitments.');
    assert((mixedRoot && root && realLeafCount) ||(!mixedRoot && !root && !realLeafCount), 'Tree parameter mismatch.');
    assert(hashNode(to32ByteBuffer(realLeafCount), root).equals(mixedRoot), 'Mixed root mismatched.');

    // Appending to an empty Merkle Tree is trivial
    if (!realLeafCount) return hashNode(to32ByteBuffer(1), value);

    // Appending to a perfect Merkle Tree is equally trivial
    if (realLeafCount & (realLeafCount-1) === 0) {
        return hashNode(to32ByteBuffer(realLeafCount + 1), hashNode(root, value));
    };

    // Clone decommitments so we don't destroy/consume it
    const queue = decommitments.map(decommitment => decommitment);
    const n = queue.length - 1;

    // As we verify the proof, we'll build the new root in parallel, since the
    // verification loop will consume the queue/stack
    let newRoot = hashNode(queue[n], value);

    for (let i = n; i > 0; i--) {
        newRoot = hashNode(queue[i-1], newRoot);
        queue[i-1] = hashNode(queue[i-1], queue[i]);
        
        if (i === 1) {
            // Must compare against mixed root, not root
            assert(hashNode(to32ByteBuffer(realLeafCount), queue[0]).equals(mixedRoot), 'Invalid Decommitments');

            return {
                root: newRoot,
                mixedRoot: hashNode(to32ByteBuffer(realLeafCount + 1), newRoot),
                realLeafCount: realLeafCount + 1
            };
        }
    }
};

// TODO: create function to append several leafs in batch (should be trivial)
const appendLeafs = () => {};

// TODO: create root update function taking root, indices, value(s), and proof as input
const updateRoot = () => {};

// TODO: create tree update function taking tree, indices, and values(s)
const updateTree = () => {};

// Sample/Testing

const items = [
    '0000000000000000000000000000000000000000000000000000000000000001',
    '0000000000000000000000000000000000000000000000000000000000000002',
    '0000000000000000000000000000000000000000000000000000000000000003',
    '0000000000000000000000000000000000000000000000000000000000000004',
    '0000000000000000000000000000000000000000000000000000000000000005',
    '0000000000000000000000000000000000000000000000000000000000000006',
    '0000000000000000000000000000000000000000000000000000000000000007',
    '0000000000000000000000000000000000000000000000000000000000000008'];

const buffers = items.map(item => Buffer.from(item, 'hex'));
const { realLeafCount, tree, mixedRoot, root } = makeTree(buffers.slice(0,7));
console.log(`Tree has ${realLeafCount} real leafs, with root ${root.toString('hex')} and mixed root ${mixedRoot.toString('hex')}.`);

const decommitments = generateAppendProof(tree, realLeafCount);
const { mixedRoot: newMixedRoot, root: newRoot, realLeafCount: newRealLeafCount } = appendLeaf(buffers[7], mixedRoot, root, realLeafCount, decommitments);
console.log(`Tree now has ${newRealLeafCount} real leafs, with root ${newRoot.toString('hex')} and mixed root ${newMixedRoot.toString('hex')}.`);

const { mixedRoot: rebuiltMixedRoot, root: rebuiltRoot } = makeTree(buffers.slice(0,8));

if (rebuiltMixedRoot.equals(newMixedRoot) && rebuiltRoot.equals(newRoot)) {
    console.log('Root and mixed root matches with freshly built 8-leaf tree.');
} else {
    console.error('Root and mixed root does not match with freshly built 8-leaf tree.');
}