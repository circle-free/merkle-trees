'use strict';

const crypto = require('crypto');
const { xor } = require('bitwise-buffer');
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
    seed = seed ? leaf : seed;
    leafs.push(leaf);
  }

  return leafs;
};

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

const swap = (array, i, j) => {
  array[i] = xor(array[i], array[j]);
  array[j] = xor(array[j], array[i]);
  array[i] = xor(array[i], array[j]);
};

module.exports = {
  generateRandomLeaf,
  generateLeafs,
  shuffle,
  swap,
};
