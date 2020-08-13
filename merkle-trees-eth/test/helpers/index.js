'use strict';

const crypto = require('crypto');
const { Keccak } = require('sha3');
const { xor } = require('bitwise-buffer');

const leftPad = (num, size, char = '0') => {
  let s = num + '';

  while (s.length < size) s = char + s;

  return s;
};

const to32ByteBuffer = (number) => {
  return Buffer.from(leftPad(number.toString(16), 64), 'hex');
};

const hash = (buffer) => {
  return new Keccak(256).update(buffer).digest();
};

// NOTE: arguments must already be buffers, preferably 32 bytes
const hashNode = (leftHash, rightHash) => {
  return hash(Buffer.concat([leftHash, rightHash]));
};

const generateRandomElement = () => {
  return crypto.randomBytes(32);
};

const generateElements = (elementCount, options = {}) => {
  const { seed, random = false } = options;
  const elements = [];
  let seedBuffer = seed ? to32ByteBuffer(seed) : null;
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
