'use strict';

const generateRandomLeaf = () => {
  return crypto.randomBytes(32);
};

const generateRandomLeafs = (leafCount) => {
  const leafs = [];

  for (i = 0; i < leafCount; i++) {
    leafs.push(generateRandomLeaf());
  }

  return leafs;
};

module.exports = {
  generateRandomLeaf,
  generateRandomLeafs,
};
