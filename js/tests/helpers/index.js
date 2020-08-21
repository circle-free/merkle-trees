'use strict';

const crypto = require('crypto');
const { xor } = require('bitwise-buffer');
const { hashNode, to32ByteBuffer } = require('../../src/utils');

const generateRandomElement = () => {
  return crypto.randomBytes(32);
};

const generateElements = (elementCount, options = {}) => {
  const { seed, random = false } = options;
  const elements = [];
  let seedBuffer = seed ? Buffer.from(seed, 'hex') : null;
  let element = seedBuffer;

  for (let i = 0; i < elementCount; i++) {
    element = random ? generateRandomElement() : seed ? hashNode(seedBuffer, element) : to32ByteBuffer(i);
    seedBuffer = seed ? element : seedBuffer;
    elements.push(element);
  }

  return elements;
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
  generateRandomElement,
  generateElements,
  shuffle,
  swap,
};
