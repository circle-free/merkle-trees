'use strict';

// TODO: implement append multi
// TODO: test how this works with null elements/leafs before the append index

const assert = require('assert');

const { bitCount32, roundUpToPowerOf2 } = require('./utils');

// TODO: implement getNewRootMulti (append multiple)

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

const getRoot = ({ elementCount, decommitments, hashFunction }) => {
  const n = bitCount32(elementCount) - 1;
  let hash = decommitments[n];

  for (let i = n; i > 0; i--) {
    hash = hashFunction(decommitments[i - 1], hash);
  }

  return { root: hash };
};

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

const getNewRootMultiMemoryLarge = ({ newLeafs, elementCount, decommitments, hashFunction }) => {
  const newLeafCount = newLeafs.length;
  const totalElementCount = elementCount + newLeafCount;
  const totalLeafCount = roundUpToPowerOf2(totalElementCount);
  const tree = Array(totalLeafCount << 1).fill(null);

  // Fill the empty tree with the the leafs that we are adding
  for (let i = 0; i < newLeafCount; i++) {
    tree[totalLeafCount + elementCount + i] = newLeafs[i];
  }

  console.log(tree.map((n, i) => `${i} ${n ? n.toString('hex').slice(0, 8) : null}`));

  let n = bitCount32(elementCount) - 1;
  let hash = decommitments[n];

  for (let i = (totalLeafCount + totalElementCount - 1) >> 1; i > 0; i--) {
    const index = i << 1;
    const left = tree[index];
    const right = tree[index + 1];

    if (!left && !right) {
      console.log(`Skipping ${i}.`);
      continue;
    }

    if (!right) {
      console.log(`Right is null. Setting ${index} ${tree[index].toString('hex').slice(0, 8)} to ${i}.`);
      tree[i] = tree[index];
      continue;
    }

    if (!left) {
      console.log(
        `Left is null. Hashing decommitment ${n} (${decommitments[n].toString('hex').slice(0, 8)}) with ${
          index + 1
        } (${right.toString('hex').slice(0, 8)}) to ${i} (${hashFunction(left, right).toString('hex').slice(0, 8)}).`
      );
      tree[i] = hashFunction(decommitments[n--], right);
      hash = hashFunction(decommitments[n], hash);
      continue;
    }

    console.log(
      `Hashing ${index} (${left.toString('hex').slice(0, 8)}) with ${index + 1} (${right
        .toString('hex')
        .slice(0, 8)}) to ${i} (${hashFunction(left, right).toString('hex').slice(0, 8)}).`
    );

    tree[i] = hashFunction(left, right);
  }

  console.log(tree.map((n, i) => `${i} ${n ? n.toString('hex').slice(0, 8) : null}`));

  return { root: hash, newRoot: tree[1] };
};

const getNewRootMultiDocumented = ({ newLeafs, elementCount, decommitments, hashFunction }) => {
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
  let level = 0;

  while (true) {
    console.log(hashes.map((n) => n && n.toString('hex').slice(0, 8)));

    // ((totalLeafCount + elementCount) >> level) can be defined outside so it's not recalculated every time
    const index = ((totalLeafCount + elementCount) >> level) + i;

    if (index === 1) {
      return { root: hash, newRoot: hashes[0] };
    }

    const useLeafs = index >= totalLeafCount;

    // This section can be merged with another somehow
    if (index > upperBound) {
      console.log(`index ${index} > upperBound ${upperBound}. Resetting.`);
      i = 0;
      level += 1;
      writeIndex = 0;
      lowerBound >>= 1;
      upperBound >>= 1;
      continue;
    }

    // if lower bound and odd, merge with decommitment on left, i++
    if (index === lowerBound && index & 1) {
      const right = useLeafs ? newLeafs[i] : hashes[i];
      console.log(
        `Index ${index} === lowerBound ${lowerBound} and odd. Hashing decommitment ${n} (${decommitments[n]
          .toString('hex')
          .slice(0, 8)}) with ${index} (${right.toString('hex').slice(0, 8)}) to hashes[${writeIndex}] (${hashFunction(
          decommitments[n],
          right
        )
          .toString('hex')
          .slice(0, 8)}).`
      );
      hashes[writeIndex++] = hashFunction(decommitments[n--], right);
      hash = hashFunction(decommitments[n], hash);
      i += 1;
      continue;
    }

    // should never be here since even handling logic below should result in a skip of odds
    if (index & 1) {
      console.log('Should not be here.');
    }

    // if upper bound and even, bubble up directly, reset i and level++
    if (index === upperBound && !(index & 1)) {
      console.log(
        `Index ${index} === upperBound ${upperBound}. Writing ${index} (${hashes[i]
          .toString('hex')
          .slice(0, 8)}) to hashes[${writeIndex}].`
      );
      hashes[writeIndex++] = hashes[i];
      i = 0;
      level += 1;
      writeIndex = 0;
      lowerBound >>= 1;
      upperBound >>= 1;
      continue;
    }

    // if even, merge with right
    if (!(index & 1)) {
      const left = useLeafs ? newLeafs[i] : hashes[i];
      const right = useLeafs ? newLeafs[i + 1] : hashes[i + 1];
      console.log(
        `Index ${index} even. Hashing ${index} (${left.toString('hex').slice(0, 8)}) with ${
          index + 1
        } (${right.toString('hex').slice(0, 8)}) to hashes[${writeIndex}] (${hashFunction(left, right)
          .toString('hex')
          .slice(0, 8)}).`
      );
      hashes[writeIndex++] = hashFunction(left, right);
      i += 2;
      continue;
    }
  }
};

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

    if (index === lowerBound && index & 1) {
      hashes[writeIndex++] = hashFunction(decommitments[n--], useLeafs ? newLeafs[i++] : hashes[i++]);
      hash = hashFunction(decommitments[n], hash);
      continue;
    }

    if (index === upperBound) hashes[writeIndex++] = hashes[i];

    if (index >= upperBound) {
      i = 0;
      offset >>= 1;
      writeIndex = 0;
      lowerBound >>= 1;
      upperBound >>= 1;
      continue;
    }

    if (!(index & 1)) {
      hashes[writeIndex++] = useLeafs
        ? hashFunction(newLeafs[i++], newLeafs[i++])
        : hashFunction(hashes[i++], hashes[i++]);
      continue;
    }
  }
};

const getNewRoot = (parameters) => {
  return parameters.newLeafs ? getNewRootMulti(parameters) : getNewRootSingle(parameters);
};

module.exports = { generate, getRoot, getNewRoot };
