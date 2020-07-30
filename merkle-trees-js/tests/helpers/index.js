'use strict';

const crypto = require('crypto');
const { hashNode, to32ByteBuffer } = require('../../src/utils');

const generateRandomLeaf = () => {
  return crypto.randomBytes(32);
};

const generateLeafs = (leafCount, options = {}) => {
  let { seed, random = false } = options;
  const leafs = [];
  let leaf = seed;

  for (let i = 0; i < leafCount; i++) {
    leaf = random ? generateRandomLeaf() : seed ? hashNode(seed, leaf) : to32ByteBuffer(i);
    seed = leaf;
    leafs.push(leaf);
  }

  return leafs;
};

module.exports = {
  generateRandomLeaf,
  generateLeafs,
};
