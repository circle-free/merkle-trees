'use strict'
const { Keccak } = require('sha3');
const assert = require('assert');

// TODO: mix in leafCount with root to get mixed root to prevent second pre-image attack
//       This is necessary since leafs are not being hashed and are used as is

// NOTE: arguments must already be buffers, preferably 32 bytes
const hashNode = (leftHash, rightHash) => {
    const hash = new Keccak(256);
    return hash.update(Buffer.concat([leftHash, rightHash])).digest();
};

const getDepthFromTree = tree => {
    return Math.log2(tree.length) - 1;
};

const getDepthFromLeafs = leafs => {
    return Math.log2(leafs.length);
};

const getRoot = tree => {
    return tree[1];
};

// NOTE: leafs must already be buffers, preferably 32 bytes
const makeTree = leafs => {
    const leafCount = leafs.length;
    const depth = getDepthFromLeafs(leafs);

    assert(leafCount == (1 << depth), `${leafCount} leafs will not produce a perfect Merkle Tree.`);

    const nodeCount = 2 * leafCount;
    const tree = Array(nodeCount).fill(null);

    for (let i = 0; i < leafCount; i++) {
        tree[(1 << depth) + i] = leafs[i];
    }

    for (let i = (1 << depth) - 1; i > 0; i--) {
        tree[i] = hashNode(tree[2*i], tree[2*i + 1]);
    }

    tree[0] = depth;    // tree[0] is unused, so trying to make use of it

    // TODO: return object with depth, leafCount, root, and mixed root

    return tree;
};

const generateMultiProof = (tree, indices) => {
    const depth = getDepthFromTree(tree);
    const leafCount = 1 << depth;
    const nodeCount = 2*leafCount;
    const known = Array(nodeCount).fill(false);
    const decommitments = [];

    for (let i = 0; i < indices.length; i++) {
        known[(1 << depth) + indices[i]] = true;
    }

    for (let i = (1 << depth) - 1; i > 0; i--) {
        const left = known[2*i];
        const right = known[2*i + 1];

        if (left && !right) decommitments.push(tree[2*i + 1]);

        if (right && !left) decommitments.push(tree[2*i]);

        known[i] = left || right;
    }

    return decommitments;
};

// NOTE: indices must be in descending order
const verifyMultiProof = (root, depth, indices, values, decommitments) => {
    // Clone decommitments so we don't destroy/consume it
    const decommits = decommitments.map(decommitment => decommitment);
    
    const queue = [];
    values.forEach((value, i) => {
        queue.push({ index: (1 << depth) + indices[i], value });
    });

    while (true) {
        assert(queue.length >= 1, 'Something went wrong.');

        const { index, value } = queue.shift();

        if (index === 1) {
            // This Merkle root has tree index 1, but later, leafCount-mixed root may be at 0
            return value.equals(root);
        } else if (index % 2 === 0) {
            // Merge even nodes with a decommitment hash on right
            queue.push({ index: index >> 1, value: hashNode(value, decommits.shift()) });
        } else if ((queue.length > 0) && (queue[0].index === index - 1)) {
            // If relevant, merge odd nodes with their neighbor on left (from the scratch stack)
            queue.push({ index: index >> 1, value: hashNode(queue.shift().value, value) });
        } else {
            // Remaining odd nodes are merged with decommitment on the left
            queue.push({ index: index >> 1, value: hashNode(decommits.shift(), value) });
        }
    }
};

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
const tree = makeTree(buffers);
const indices = [5, 3, 1];
const decommitments = generateMultiProof(tree, indices);
const values = [buffers[5], buffers[3], buffers[1]];
const verification = verifyMultiProof(tree[1], tree[0], indices, values, decommitments)

console.log(verification);
