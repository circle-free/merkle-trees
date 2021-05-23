import * as chai from 'chai'
import { expect } from 'chai'
import { generateElements } from './helpers'
import { MerkleTree } from '../index'


describe('Merkle Trees', () => {
  describe('Merkle Tree Construction', () => {
    describe('Balanced', () => {
      it('should build a 8-element Merkle Tree.', () => {
        const expected = {
          root: 'd2fa9d47845f1571f1318afaaabc63a55cc57af3f511e42fc30e05f171d6853d',
          elementRoot: '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4',
          depth: 3,
        };

        testBuildTree(8, 'ff', expected, { unbalanced: false, sortedHash: false });
      });

      it('should build a 1-element Merkle Tree.', () => {
        const expected = {
          root: 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8',
          elementRoot: '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
          depth: 0,
        };

        testBuildTree(1, 'ff', expected, { unbalanced: false, sortedHash: false });
      });

      it('should build a balanced sorted-hash 8-element Merkle Tree.', () => {
        const expected = {
          root: '6764fd6d226590b844285c3d0f1e12bbd19cb7d1ee8277b0fb5b9b45efbbffb6',
          elementRoot: '7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221',
          depth: 3,
        };

        testBuildTree(8, 'ff', expected, { unbalanced: false, sortedHash: true });
      });

      it('should build a balanced sorted-hash 1-element Merkle Tree.', () => {
        const expected = {
          root: 'c83b51dc238800a2852366108ab7df1e32b35e99905c5d845ff5a652f0fb58a8',
          elementRoot: '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
          depth: 0,
        };

        testBuildTree(1, 'ff', expected, { unbalanced: false, sortedHash: true });
      });
    });

    describe('Unbalanced', () => {
      it('should build an 9-element Merkle Tree.', () => {
        const expected = {
          root: '743605bc7fcb07d66ecf3f2b5fcea24bfb27901bfbdb7baf6a194aa45d62461d',
          elementRoot: '5449a839359e08115bbc14ed1795892a3a8562d583744e1a1fa146d273ff1f55',
          depth: 4,
        };

        testBuildTree(9, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should build a sorted-hash 9-element Merkle Tree.', () => {
        const expected = {
          root: '4c10104ea544f26190809c1117a092b18c8d7ab892f23c30a0f0cdb2c5242c48',
          elementRoot: '86620d93d22f2d06344f81166356ed881cfdc36c8b35a7115e8b0daad4d56ee4',
          depth: 4,
        };

        testBuildTree(9, 'ff', expected, { unbalanced: true, sortedHash: true });
      });

      it('should build a 28-element Merkle Tree.', () => {
        const expected = {
          root: 'c50d9f940bf3e7267d2c4645ef2b99d774a91582253af1d086377fb219b59e45',
          elementRoot: '99d034409decb2fd31237dac23d2e037faf7d4dd896940ebb0ea580c9ffeb0af',
          depth: 5,
        };

        testBuildTree(28, 'ff', expected, { unbalanced: true, sortedHash: false });
      });

      it('should build a sorted-hash 28-element Merkle Tree.', () => {
        const expected = {
          root: 'a5920c89398aa2837b8ad511c217dba2379e4e8b1a360de7ec00b9017fcc5f78',
          elementRoot: 'cad3ecd38ce3a9ea9dd091b06889fac4b2bde73270406064582d54ed84c31087',
          depth: 5,
        };

        testBuildTree(28, 'ff', expected, { unbalanced: true, sortedHash: true });
      });
    });

    describe('Balanced/Unbalanced Overlapping Cases', () => {
      it('should build the same 8-element Merkle Tree.', () => {
        compareTrees(8, { unbalanced: false, sortedHash: false }, { unbalanced: true, sortedHash: false });
      });

      it('should build the same sorted-hash 8-element Merkle Tree.', () => {
        compareTrees(8, { unbalanced: false, sortedHash: true }, { unbalanced: true, sortedHash: true });
      });
    });

    describe('Empty', () => {
      it('should build a 0-element Merkle Tree.', () => {
        const expected = {
          root: '0000000000000000000000000000000000000000000000000000000000000000',
          elementRoot: '0000000000000000000000000000000000000000000000000000000000000000',
          depth: 0,
        };

        testBuildTree(0, 'ff', expected, { unbalanced: true, sortedHash: false });
      });
    });
  });

  describe('Single Proofs', () => {
    describe('Single Proof Generation', () => {
      describe('Balanced', () => {
        it('should generate a Single Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };

          const expected = {
            decommitments: [
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
            ],
          };

          testSingleProofGeneration(8, 'ff', 2, expected, options);
        });

        it('should generate a Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };

          const expected = {
            decommitments: [],
          };

          testSingleProofGeneration(1, 'ff', 0, expected, options);
        });

        it('should generate a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, compact: false };

          const expected = {
            decommitments: [
              'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
            ],
          };

          testSingleProofGeneration(8, 'ff', 2, expected, options);
        });

        it('should generate a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, compact: false };

          const expected = {
            decommitments: [],
          };

          testSingleProofGeneration(1, 'ff', 0, expected, options);
        });

        it('should generate a compact Single Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000008',
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
            ],
          };

          testSingleProofGeneration(8, 'ff', 2, expected, options);
        });

        it('should generate a compact Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: true };

          const expected = {
            compactProof: ['0000000000000000000000000000000000000000000000000000000000000001'],
          };

          testSingleProofGeneration(1, 'ff', 0, expected, options);
        });
      });

      describe('Unbalanced', () => {
        it('should generate a Single Proof for a 9-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };

          const expected = {
            decommitments: ['0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4'],
          };

          testSingleProofGeneration(9, 'ff', 8, expected, options);
        });

        it('should generate a Single Proof for a 27-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };

          const expected = {
            decommitments: [
              'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
              '88d2a11c3b0935fc6a30e3b0a69fa58a84de08ea333248f23e5d747613fc04f9',
              '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b',
              'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a',
            ],
          };

          testSingleProofGeneration(27, 'ff', 25, expected, options);
        });

        it('should generate a Single Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };

          const expected = {
            decommitments: [
              'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5',
              '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203',
              'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681',
              '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c',
            ],
          };

          testSingleProofGeneration(100, 'ff', 97, expected, options);
        });

        it('should generate a Single Proof for a sorted-hash 9-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };

          const expected = {
            decommitments: ['7f8dc34b7b4e06eff546283358ff8d7a988b62bc266f6337f8234c9a84778221'],
          };

          testSingleProofGeneration(9, 'ff', 8, expected, options);
        });

        it('should generate a Single Proof for a sorted-hash 27-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };

          const expected = {
            decommitments: [
              '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9',
              'c62e1d7cf122111fa068da94e48ecd21cb02bba4bd41d56e9f4b69a4509a2962',
              '289b3d65643b54739112fa7df258736b511ed1b5611e4f9ce681ae39fbd5fd8b',
              'c43e6f0c51c26c040dc4a40e372839ccc4a53c1762504da451819ae9e93d239a',
            ],
          };

          testSingleProofGeneration(27, 'ff', 25, expected, options);
        });

        it('should generate a Single Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };

          const expected = {
            decommitments: [
              'bb9a6e5787ae741c6a0e75a360aefe75ee06284ece1edddc1573ac9462945e7f',
              '904afce76e0f7ccead463e22aec76018c1450afd3deb4f387e0617ef39721685',
              'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681',
              '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c',
            ],
          };

          testSingleProofGeneration(100, 'ff', 97, expected, options);
        });

        it('should generate a compact Single Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000064',
              'eb98df4415ff9a93976bb26b84f3819662fe31939e022cfa52d9061de351f6d5',
              '06f8f83483a72750b8ba34cbe8fd54cc1243479b12f7b659075311dc54800203',
              'bbc26fa1ff8c9f841d4f4758cccac1def0f9929c30c949451d4e71e4ded0a681',
              '4ac05d0ec2e247aad1065f712d3d6934938e4709f224a0466f558bdf2e4cbf9c',
            ],
          };

          testSingleProofGeneration(100, 'ff', 97, expected, options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should generate the same Single Proof for a 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: false, compact: false };
          const unbalancedOptions = { unbalanced: true, sortedHash: false, compact: false };
          compareSingleProofs(8, 2, balancedOptions, unbalancedOptions);
        });

        it('should generate the same Compact Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: true, compact: true };
          const unbalancedOptions = { unbalanced: true, sortedHash: true, compact: true };
          compareSingleProofs(8, 2, balancedOptions, unbalancedOptions);
        });
      });
    });

    describe('Single Proof Verification', () => {
      describe('Balanced', () => {
        it('should verify a Single Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };
          testSingleProofVerification(8, 2, options);
        });

        it('should verify a Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };
          testSingleProofVerification(1, 0, options);
        });

        it('should verify a Single Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, compact: false };
          testSingleProofVerification(8, 2, options);
        });

        it('should verify a Single Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, compact: false };
          testSingleProofVerification(1, 0, options);
        });

        it('should verify a compact Single Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: true };
          testSingleProofVerification(8, 2, options);
        });

        it('should verify a compact Single Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: true };
          testSingleProofVerification(1, 0, options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Single Proof for a 9-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleProofVerification(9, 8, options);
        });

        it('should verify a Single Proof for a 27-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleProofVerification(27, 25, options);
        });

        it('should verify a Single Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleProofVerification(100, 97, options);
        });

        it('should verify a Single Proof for a sorted-hash 9-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };
          testSingleProofVerification(9, 8, options);
        });

        it('should verify a Single Proof for a sorted-hash 27-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };
          testSingleProofVerification(27, 25, options);
        });

        it('should verify a Single Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };
          testSingleProofVerification(100, 97, options);
        });

        it('should verify a compact Single Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: true };
          testSingleProofVerification(100, 97, options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should verify a Single Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleProofVerification(8, 2, options);
        });

        it('should verify a Compact Single Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: true };
          testSingleProofVerification(8, 2, options);
        });
      });
    });

    describe('Single Proof Update', () => {
      describe('Balanced', () => {
        it('should use a Single Proof for a 8-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };
          testSingleUpdate(8, 2, options);
        });

        it('should use a Single Proof for a 1-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };
          testSingleUpdate(1, 0, options);
        });

        it('should use a Single Proof for a sorted-hash 8-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: true, compact: false };
          testSingleUpdate(8, 2, options);
        });

        it('should use a Single Proof for a sorted-hash 1-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: true, compact: false };
          testSingleUpdate(1, 0, options);
        });

        it('should use a compact Single Proof for a 8-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: true };
          testSingleUpdate(8, 2, options);
        });

        it('should use a compact Single Proof for a 1-element Merkle Tree to update an element.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: true };
          testSingleUpdate(1, 0, options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Single Proof for a 9-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleUpdate(9, 8, options);
        });

        it('should verify a Single Proof for a 27-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleUpdate(27, 25, options);
        });

        it('should verify a Single Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleUpdate(100, 97, options);
        });

        it('should verify a Single Proof for a sorted-hash 9-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };
          testSingleUpdate(9, 8, options);
        });

        it('should verify a Single Proof for a sorted-hash 27-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };
          testSingleUpdate(27, 25, options);
        });

        it('should verify a Single Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: false };
          testSingleUpdate(100, 97, options);
        });

        it('should verify a compact Single Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: true, compact: false };
          testSingleUpdate(100, 97, options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should use a Single Proof for a 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          const options = { unbalanced: true, sortedHash: false, compact: false };
          testSingleUpdate(8, 2, options);
        });

        it('should use a Compact Single Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: true };
          testSingleUpdate(8, 2, options);
        });
      });
    });

    describe('Single Proof Update Consecutive Uses', () => {
      describe('Balanced', () => {
        it('should use 100 Single Proofs for a 16-element Merkle Tree, to update an 100 elements consecutively.', () => {
          const options = { unbalanced: false, sortedHash: false, compact: false };
          testConsecutiveSingleUpdate(100, 16, options);
        });
      });

      describe('Unbalanced', () => {
        it('should use 100 Compact Single Proofs for a 25-element sorted-hash Merkle Tree, to update an 100 elements consecutively.', () => {
          const options = { unbalanced: true, sortedHash: true, compact: true };
          testConsecutiveSingleUpdate(100, 25, options);
        });
      });
    });
  });

  describe('Index and Existence Multi Proofs', () => {
    describe('Index and Existence Multi Proof Generation', () => {
      describe('Balanced', () => {
        it('should generate a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };

          const expected = {
            decommitments: [
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };

          const expected = {
            decommitments: [],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };

          const expected = {
            decommitments: [
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };

          const expected = {
            decommitments: [],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });

        it('should generate a compact Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000008',
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a compact Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };

          const expected = {
            compactProof: ['0000000000000000000000000000000000000000000000000000000000000001'],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });
      });

      describe('Unbalanced', () => {
        it('should generate a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };

          const expected = {
            decommitments: [
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
            ],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };

          const expected = {
            decommitments: [
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };

          const expected = {
            decommitments: [
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
            ],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };

          const expected = {
            decommitments: [
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });

        it('should generate a Compact Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };

          const expected = {
            compactProof: [
              '000000000000000000000000000000000000000000000000000000000000000c',
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
            ],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a Compact Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000013',
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: false, indexed: true };
          const unbalancedOptions = { unbalanced: true, sortedHash: false, indexed: true };
          compareMultiProofs(8, [1, 4, 5], balancedOptions, unbalancedOptions);
        });

        it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: true, indexed: true };
          const unbalancedOptions = { unbalanced: true, sortedHash: true, indexed: true };
          compareMultiProofs(8, [1, 4, 5], balancedOptions, unbalancedOptions);
        });
      });
    });

    describe('Index and Existence Multi Proof Verification', () => {
      describe('Balanced', () => {
        it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
          testMultiProofVerification(1, [0], options);
        });

        it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };
          testMultiProofVerification(1, [0], options);
        });

        it('should verify a compact Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a compact Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };
          testMultiProofVerification(1, [0], options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });

        it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });

        it('should verify a Compact Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Compact Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should verify a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });
      });
    });

    describe('Index and Existence Multi Proof Update', () => {
      describe('Balanced', () => {
        it('should use a Multi Proof for a 8-element Merkle Tree to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a 1-element Merkle Tree to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
          testMultiUpdate(1, [0], options);
        });

        it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree to update elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree to update elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: false };
          testMultiUpdate(1, [0], options);
        });

        it('should use a compact Multi Proof for a 8-element Merkle Tree to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a compact Multi Proof for a 1-element Merkle Tree to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: true };
          testMultiUpdate(1, [0], options);
        });
      });

      describe('Unbalanced', () => {
        it('should use a Multi Proof for a 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Multi Proof for a 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });

        it('should use a Multi Proof for a sorted-hash 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Multi Proof for a sorted-hash 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: false };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });

        it('should use a Compact Multi Proof for a 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Compact Multi Proof for a 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should use a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update an element.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });
      });
    });

    describe('Index and Existence Multi Proof Update Consecutive Uses', () => {
      describe('Balanced', () => {
        it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: true, compact: false };
          testConsecutiveMultiUpdate(100, 16, 6, options);
        });

        it('should use 100 Compact Multi Proofs for a 16-element sorted-hash Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: true, compact: true };
          testConsecutiveMultiUpdate(100, 16, 6, options);
        });
      });

      describe('Unbalanced', () => {
        it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: true, compact: false };
          testConsecutiveMultiUpdate(100, 19, 6, options);
        });

        it('should use 100 Compact Multi Proofs for a sorted-hash 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: true, compact: true };
          testConsecutiveMultiUpdate(100, 19, 6, options);
        });
      });
    });
  });

  describe('Existence-Only Boolean-Array Multi Proofs', () => {
    describe('Existence-Only Boolean-Array Multi Proof Generation', () => {
      describe('Balanced', () => {
        it('should generate a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };

          const expected = {
            decommitments: [
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
            flags: [true, false, false, false, true],
            skips: [false, false, false, false, false],
            orders: [true, false, true, true, true],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };

          const expected = {
            decommitments: [],
            flags: [],
            skips: [],
            orders: [],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };

          const expected = {
            decommitments: [
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
            flags: [true, false, false, false, true],
            skips: [false, false, false, false, false],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };

          const expected = {
            decommitments: [],
            flags: [],
            skips: [],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });
      });

      describe('Unbalanced', () => {
        it('should generate a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };

          const expected = {
            decommitments: [
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
            ],
            flags: [false, false, true, true, false, false, false, true],
            skips: [false, false, false, false, false, true, false, false],
            orders: [false, true, true, true, false, true, true, true],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };

          const expected = {
            decommitments: [
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
            flags: [
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              true,
              true,
              false,
              true,
              true,
            ],
            skips: [
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              true,
              false,
              false,
              true,
              false,
              false,
            ],
            orders: [false, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };

          const expected = {
            decommitments: [
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
            ],
            flags: [false, false, true, true, false, false, false, true],
            skips: [false, false, false, false, false, true, false, false],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };

          const expected = {
            decommitments: [
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
            flags: [
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              true,
              true,
              false,
              true,
              true,
            ],
            skips: [
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
              true,
              false,
              false,
              true,
              false,
              false,
            ],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          const unbalancedOptions = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          compareMultiProofs(8, [1, 4, 5], balancedOptions, unbalancedOptions);
        });

        it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: true, indexed: false, compact: false };
          const unbalancedOptions = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          compareMultiProofs(8, [1, 4, 5], balancedOptions, unbalancedOptions);
        });
      });
    });

    describe('Existence-Only Boolean-Array Multi Proof Verification', () => {
      describe('Balanced', () => {
        it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiProofVerification(1, [0], options);
        });

        it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };
          testMultiProofVerification(1, [0], options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });

        it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should verify a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiProofVerification(8, [1, 4, 5], options);
        });
      });
    });

    describe('Existence-Only Boolean-Array Multi Indices Inferring', () => {
      describe('Balanced', () => {
        it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiProofIndicesInferring(1, [0], options);
        });

        it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiProofIndicesInferring(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a 64-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiProofIndicesInferring(64, [0, 1, 7, 13, 15, 26, 34, 35, 36, 50, 62], options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiProofIndicesInferring(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiProofIndicesInferring(19, [2, 4, 9, 12, 17], options);
        });

        it('should verify a Multi Proof for a 85-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiProofIndicesInferring(85, [5, 6, 20, 36, 37, 65, 78, 83], options);
        });
      });
    });

    describe('Existence-Only Boolean-Array Multi Proof Update', () => {
      describe('Balanced', () => {
        it('should use a Multi Proof for a 8-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a 1-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testMultiUpdate(1, [0], options);
        });

        it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };
          testMultiUpdate(1, [0], options);
        });
      });

      describe('Unbalanced', () => {
        it('should use a Multi Proof for a 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Multi Proof for a 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });

        it('should use a Multi Proof for a sorted-hash 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Multi Proof for a sorted-hash 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should use a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdate(8, [1, 4, 5], options);
        });
      });
    });

    describe('Existence-Only Boolean-Array Multi Proof Update Consecutive Uses', () => {
      describe('Balanced', () => {
        it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: false };
          testConsecutiveMultiUpdate(100, 16, 6, options);
        });

        it('should use 100 Multi Proofs for a sorted-hash 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: false };
          testConsecutiveMultiUpdate(100, 16, 6, options);
        });
      });

      describe('Unbalanced', () => {
        it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testConsecutiveMultiUpdate(100, 19, 6, options);
        });

        it('should use 100 Multi Proofs for a sorted-hash 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testConsecutiveMultiUpdate(100, 19, 6, options);
        });
      });
    });
  });

  describe('Existence-Only Boolean-Bit (Compact) Multi Proofs', () => {
    describe('Existence-Only Boolean-Bit Multi Proof Generation', () => {
      describe('Balanced', () => {
        it('should generate a compact Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000008',
              '0000000000000000000000000000000000000000000000000000000000000031',
              '0000000000000000000000000000000000000000000000000000000000000020',
              '000000000000000000000000000000000000000000000000000000000000001d',
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a compact Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000001',
              '0000000000000000000000000000000000000000000000000000000000000001',
              '0000000000000000000000000000000000000000000000000000000000000001',
              '0000000000000000000000000000000000000000000000000000000000000000',
            ],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000008',
              '0000000000000000000000000000000000000000000000000000000000000031',
              '0000000000000000000000000000000000000000000000000000000000000020',
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'e868cc58247970644e689c7c207cdbbe6db49bec4953c7ba28527799056f07e9',
            ],
          };

          testMultiProofGeneration(8, 'ff', [1, 4, 5], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000001',
              '0000000000000000000000000000000000000000000000000000000000000001',
              '0000000000000000000000000000000000000000000000000000000000000001',
            ],
          };

          testMultiProofGeneration(1, 'ff', [0], expected, options);
        });
      });

      describe('Unbalanced', () => {
        it('should generate a compact Multi Proof for a 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000003',
              '000000000000000000000000000000000000000000000000000000000000000e',
              '0000000000000000000000000000000000000000000000000000000000000009',
              '0000000000000000000000000000000000000000000000000000000000000007',
            ],
          };

          testMultiProofGeneration(3, 'ff', [0, 1, 2], expected, options);
        });

        it('should generate a compact Multi Proof for a 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000003',
              '000000000000000000000000000000000000000000000000000000000000000c',
              '0000000000000000000000000000000000000000000000000000000000000009',
              '0000000000000000000000000000000000000000000000000000000000000005',
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
            ],
          };

          testMultiProofGeneration(3, 'ff', [1, 2], expected, options);
        });

        it('should generate a compact Multi Proof for a 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000003',
              '0000000000000000000000000000000000000000000000000000000000000004',
              '0000000000000000000000000000000000000000000000000000000000000005',
              '0000000000000000000000000000000000000000000000000000000000000001',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(3, 'ff', [2], expected, options);
        });

        it('should generate a compact Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '000000000000000000000000000000000000000000000000000000000000000c',
              '000000000000000000000000000000000000000000000000000000000000018c',
              '0000000000000000000000000000000000000000000000000000000000000120',
              '00000000000000000000000000000000000000000000000000000000000000ee',
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'babbf2a0bca3f1360d7706d6d175f3380c5973df4b2d1bb19a9496792891697d',
            ],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a compact Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000013',
              '000000000000000000000000000000000000000000000000000000000001d800',
              '0000000000000000000000000000000000000000000000000000000000012400',
              '000000000000000000000000000000000000000000000000000000000000fdfa',
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'd1c7a0741902e7210c324ee399555decfb24a0281c42d0a690a84acae5a1cfd2',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              '55e76a40d8624a05e93c6bbdd36ed61989ef5f0903cea080e9968b590ba30c39',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000003',
              '000000000000000000000000000000000000000000000000000000000000000e',
              '0000000000000000000000000000000000000000000000000000000000000009',
            ],
          };

          testMultiProofGeneration(3, 'ff', [0, 1, 2], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000003',
              '000000000000000000000000000000000000000000000000000000000000000c',
              '0000000000000000000000000000000000000000000000000000000000000009',
              '0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60',
            ],
          };

          testMultiProofGeneration(3, 'ff', [1, 2], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000003',
              '0000000000000000000000000000000000000000000000000000000000000004',
              '0000000000000000000000000000000000000000000000000000000000000005',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(3, 'ff', [2], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          const expected = {
            compactProof: [
              '000000000000000000000000000000000000000000000000000000000000000c',
              '000000000000000000000000000000000000000000000000000000000000018c',
              '0000000000000000000000000000000000000000000000000000000000000120',
              '4847e055cdb073d232313d8bf813dd31b7a3626d8e7881304d3bc41a848bf964',
              'f9c38f9fec674389962b1b4cb3e26191be58cf5850ee58e4fe170b94de04d3d7',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
              'bc481a454a66b25fd1adf8b6b88cbcac3783d39d5ab1e4c45d114846da10274c',
            ],
          };

          testMultiProofGeneration(12, 'ff', [2, 3, 8, 11], expected, options);
        });

        it('should generate a compact Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };

          const expected = {
            compactProof: [
              '0000000000000000000000000000000000000000000000000000000000000013',
              '000000000000000000000000000000000000000000000000000000000001d800',
              '0000000000000000000000000000000000000000000000000000000000012400',
              '9a2ac3e4dd11303cc187ad6cbcfb99bcb955f3a242e14001a940a360d41abaa9',
              '9c14306519dcde45d6985845e9af155bc2431d1ad6fde29a957eaf464f7ed1ec',
              'c3ed5f33f97f302e5667c4cf731a7dca902aa88b1520976d37b79e2f614d839f',
              '731017481bc7111f6621c3d3f5511e941e264077817c1939403ec0e16f24d24d',
              'c91b0c977258a25a3803b772c6229444bdca5f73995a108cf36439fdbb30d82e',
              'df30b2c34f6b8879381b45dcc32c84248dc5119ecc364f00939660bbf5430445',
              'c83c0742945e25d8ea750b433deb383bd3c68c5e415398cb3a1bf7ebd760fe85',
              '23d7e3b895db705a5867f3e2d747351226d34734b355fdbcf3a7e99e688c6cb2',
              'df00f936e8f696ef3929c73d2176f2012336b0fd4fa5ae504bb3053a44993b94',
              'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            ],
          };

          testMultiProofGeneration(19, 'ff', [2, 4, 9, 12, 17], expected, options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should generate the same Multi Proof for a 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          const unbalancedOptions = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          compareMultiProofs(8, [1, 4, 5], balancedOptions, unbalancedOptions);
        });

        it('should generate the same Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const balancedOptions = { unbalanced: false, sortedHash: true, indexed: false, compact: true };
          const unbalancedOptions = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          compareMultiProofs(8, [1, 4, 5], balancedOptions, unbalancedOptions);
        });
      });
    });

    describe('Existence-Only Boolean-Bit Multi Proof Verification', () => {
      describe('Balanced', () => {
        it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(1, [0], options);
        });

        it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(1, [0], options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Multi Proof for a 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(3, [0, 1, 2], options);
        });

        it('should verify a Multi Proof for a 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(3, [1, 2], options);
        });

        it('should verify a Multi Proof for a 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(3, [2], options);
        });

        it('should verify a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });

        it('should verify a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(3, [0, 1, 2], options);
        });

        it('should verify a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(3, [1, 2], options);
        });

        it('should verify a Multi Proof for a sorted-hash 3-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(3, [2], options);
        });

        it('should verify a Multi Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a sorted-hash 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(19, [2, 4, 9, 12, 17], options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should verify a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiProofVerification(8, [1, 4, 5], options);
        });
      });
    });

    describe('Existence-Only Boolean-Bit Multi Indices Inferring', () => {
      describe('Balanced', () => {
        it('should verify a Multi Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiProofIndicesInferring(1, [0], options);
        });

        it('should verify a Multi Proof for a 8-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiProofIndicesInferring(8, [1, 4, 5], options);
        });

        it('should verify a Multi Proof for a 64-element Merkle Tree.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiProofIndicesInferring(64, [0, 1, 7, 13, 15, 26, 34, 35, 36, 50, 62], options);
        });
      });

      describe('Unbalanced', () => {
        it('should verify a Multi Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofIndicesInferring(12, [2, 3, 8, 11], options);
        });

        it('should verify a Multi Proof for a 19-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofIndicesInferring(19, [2, 4, 9, 12, 17], options);
        });

        it('should verify a Multi Proof for a 85-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiProofIndicesInferring(85, [5, 6, 20, 36, 37, 65, 78, 83], options);
        });
      });
    });

    describe('Existence-Only Boolean-Bit Multi Proof Update', () => {
      describe('Balanced', () => {
        it('should use a Multi Proof for a 8-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a 1-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(1, [0], options);
        });

        it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a sorted-hash 1-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(1, [0], options);
        });
      });

      describe('Unbalanced', () => {
        it('should use a Multi Proof for a 3-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(3, [0, 1, 2], options);
        });

        it('should use a Multi Proof for a 3-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(3, [1, 2], options);
        });

        it('should use a Multi Proof for a 3-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(3, [2], options);
        });

        it('should use a Multi Proof for a 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Multi Proof for a 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });

        it('should use a Multi Proof for a sorted-hash 3-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(3, [0, 1, 2], options);
        });

        it('should use a Multi Proof for a sorted-hash 3-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(3, [1, 2], options);
        });

        it('should use a Multi Proof for a sorted-hash 3-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(3, [2], options);
        });

        it('should use a Multi Proof for a sorted-hash 12-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(12, [2, 3, 8, 11], options);
        });

        it('should use a Multi Proof for a sorted-hash 19-element Merkle Tree, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(19, [2, 4, 9, 12, 17], options);
        });
      });

      describe('Balanced/Unbalanced Overlapping Cases', () => {
        it('should use a Multi Proof for a 8-element Merkle Tree, built with the unbalanced option, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });

        it('should use a Multi Proof for a sorted-hash 8-element Merkle Tree, built with the unbalanced option, to update elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdate(8, [1, 4, 5], options);
        });
      });
    });

    describe('Existence-Only Boolean-Bit Multi Proof Update Consecutive Uses', () => {
      describe('Balanced', () => {
        it('should use 100 Multi Proofs for a 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: false, sortedHash: false, indexed: false, compact: true };
          testConsecutiveMultiUpdate(100, 16, 6, options);
        });

        it('should use 100 Multi Proofs for a sorted-hash 16-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: false, sortedHash: true, indexed: false, compact: true };
          testConsecutiveMultiUpdate(100, 16, 6, options);
        });
      });

      describe('Unbalanced', () => {
        it('should use 100 Multi Proofs for a 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveMultiUpdate(100, 19, 6, options);
        });

        it('should use 50 Multi Proofs for a 89-element Merkle Tree, to perform 50 updates of up to 13 random elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveMultiUpdate(50, 89, 13, options);
        });

        it('should use 100 Multi Proofs for a sorted-hash 19-element Merkle Tree, to perform 100 updates of up to 6 random elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testConsecutiveMultiUpdate(100, 19, 6, options);
        });

        it('should use 50 Multi Proofs for a sorted-hash 89-element Merkle Tree, to perform 50 updates of up to 13 random elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testConsecutiveMultiUpdate(50, 89, 13, options);
        });
      });
    });
  });

  describe('Append Proofs', () => {
    describe('Append Proof Generation', () => {
      it('should generate an Append Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: [],
        };

        testAppendProofGeneration(0, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: ['0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60'],
        };

        testAppendProofGeneration(1, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: ['a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27'],
        };

        testAppendProofGeneration(2, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: [
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b',
          ],
        };

        testAppendProofGeneration(3, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: ['0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4'],
        };

        testAppendProofGeneration(8, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 15-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: [
            '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4',
            'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b',
            '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6',
            'e481ff292c1b323f27dd2e7b0da511947e0d349a0616a739ea628a3a5888c529',
          ],
        };

        testAppendProofGeneration(15, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };

        const expected = {
          decommitments: [
            'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
            'febc2d558e22b7e32db3a5dd0b4d8ac3dac5835493955c53e3eb0f8fdb2f4954',
          ],
        };

        testAppendProofGeneration(20, 'ff', expected, options);
      });

      it('should generate an Append Proof for a 20-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };

        const expected = {
          decommitments: [
            '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9',
            'b1b7aca080829feceb8c4da79c5552b533f4f1542667ca689217d04230f835b0',
          ],
        };

        testAppendProofGeneration(20, 'ff', expected, options);
      });

      it('should generate a compact Append Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };

        const expected = {
          compactProof: ['0000000000000000000000000000000000000000000000000000000000000000'],
        };

        testAppendProofGeneration(0, 'ff', expected, options);
      });

      it('should generate a compact Append Proof for a 20-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: true };

        const expected = {
          compactProof: [
            '0000000000000000000000000000000000000000000000000000000000000014',
            '2c2cdc952c9d537709959cd357f6268fff33e5e21147f1a23db6cae78fb91eb9',
            'b1b7aca080829feceb8c4da79c5552b533f4f1542667ca689217d04230f835b0',
          ],
        };

        testAppendProofGeneration(20, 'ff', expected, options);
      });

      it('should generate a compact Append Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };

        const expected = {
          compactProof: [
            '0000000000000000000000000000000000000000000000000000000000000014',
            'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
            'febc2d558e22b7e32db3a5dd0b4d8ac3dac5835493955c53e3eb0f8fdb2f4954',
          ],
        };

        testAppendProofGeneration(20, 'ff', expected, options);
      });
    });

    describe('Append Proof Verification', () => {
      it('should verify an Append Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(0, options);
      });

      it('should verify an Append Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(1, options);
      });

      it('should verify an Append Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(2, options);
      });

      it('should verify an Append Proof for a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(3, options);
      });

      it('should verify an Append Proof for a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(8, options);
      });

      it('should verify an Append Proof for a 15-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(15, options);
      });

      it('should verify an Append Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testAppendProofVerification(20, options);
      });

      it('should verify an Append Proof for a 0-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(0, options);
      });

      it('should verify an Append Proof for a 1-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(1, options);
      });

      it('should verify an Append Proof for a 2-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(2, options);
      });

      it('should verify an Append Proof for a 3-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(3, options);
      });

      it('should verify an Append Proof for a 8-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(8, options);
      });

      it('should verify an Append Proof for a 15-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(15, options);
      });

      it('should verify an Append Proof for a 20-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testAppendProofVerification(20, options);
      });

      it('should verify a compact Append Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testAppendProofVerification(0, options);
      });

      it('should verify a compact Append Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testAppendProofVerification(20, options);
      });
    });

    describe('Append Proof Single Append', () => {
      it('should use an Append Proof for a 0-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(0, options);
      });

      it('should use an Append Proof for a 1-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(1, options);
      });

      it('should use an Append Proof for a 2-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(2, options);
      });

      it('should use an Append Proof for a 3-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(3, options);
      });

      it('should use an Append Proof for a 8-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(8, options);
      });

      it('should use an Append Proof for a 15-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(15, options);
      });

      it('should use an Append Proof for a 20-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testSingleAppend(20, options);
      });

      it('should use an Append Proof for a 0-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(0, options);
      });

      it('should use an Append Proof for a 1-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(1, options);
      });

      it('should use an Append Proof for a 2-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(2, options);
      });

      it('should use an Append Proof for a 3-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(3, options);
      });

      it('should use an Append Proof for a 8-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(8, options);
      });

      it('should use an Append Proof for a 15-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(15, options);
      });

      it('should use an Append Proof for a 20-element sorted-hash Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testSingleAppend(20, options);
      });

      it('should use a compact Append Proof for a 0-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testSingleAppend(0, options);
      });

      it('should use a compact Append Proof for a 20-element Merkle Tree, to append an element.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testSingleAppend(20, options);
      });
    });

    describe('Append Proof Single Append Consecutive Uses', () => {
      it('should use 100 Append Proofs for a 0-element Merkle Tree, to append an 100 elements consecutively.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testConsecutiveSingleAppend(100, 0, options);
      });

      it('should use 50 Compact Append Proofs for a 160-element Merkle Tree, to append an 50 elements consecutively.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testConsecutiveSingleAppend(50, 160, options);
      });
    });

    describe('Append Proof Multi Append', () => {
      it('should use a Multi Append Proof for a 0-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(0, 5, options);
      });

      it('should use a Multi Append Proof for a 1-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(1, 5, options);
      });

      it('should use a Multi Append Proof for a 2-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(2, 5, options);
      });

      it('should use a Multi Append Proof for a 3-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(3, 5, options);
      });

      it('should use a Multi Append Proof for a 8-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(8, 5, options);
      });

      it('should use a Multi Append Proof for a 15-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(15, 5, options);
      });

      it('should use a Multi Append Proof for a 19-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(19, 5, options);
      });

      it('should use a Multi Append Proof for a 20-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(20, 5, options);
      });

      it('should use a Multi Append Proof for a 49-element Merkle Tree, to append 17 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(49, 17, options);
      });

      it('should use a Multi Append Proof for a 120-element Merkle Tree, to append 8 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testMultiAppend(120, 8, options);
      });

      it('should use a Multi Append Proof for a 0-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(0, 5, options);
      });

      it('should use a Multi Append Proof for a 1-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(1, 5, options);
      });

      it('should use a Multi Append Proof for a 2-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(2, 5, options);
      });

      it('should use a Multi Append Proof for a 3-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(3, 5, options);
      });

      it('should use a Multi Append Proof for a 8-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(8, 5, options);
      });

      it('should use a Multi Append Proof for a 15-element sorted-hash Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(15, 5, options);
      });

      it('should use a Multi Append Proof for a sorted-hash 19-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(19, 5, options);
      });

      it('should use a Multi Append Proof for a sorted-hash 20-element Merkle Tree, to append 5 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(20, 5, options);
      });

      it('should use a Multi Append Proof for a sorted-hash 49-element Merkle Tree, to append 17 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(49, 17, options);
      });

      it('should use a Multi Append Proof for a sorted-hash 120-element Merkle Tree, to append 8 elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false };
        testMultiAppend(120, 8, options);
      });

      it('should use a compact Multi Append Proof for a 0-element Merkle Tree, to append 8 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testMultiAppend(0, 8, options);
      });

      it('should use a compact Multi Append Proof for a 120-element Merkle Tree, to append 8 elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testMultiAppend(120, 8, options);
      });
    });

    describe('Append Proof Multi Append Consecutive Uses', () => {
      it('should use 100 Multi Append Proofs for a 0-element Merkle Tree, to perform 100 appends of up to 4 random elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testConsecutiveMultiAppend(100, 0, 4, options);
      });

      it('should use 25 Multi Append Proofs for a 1-element Merkle Tree, to perform 100 appends of up to 9 random elements.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testConsecutiveMultiAppend(25, 1, 9, options);
      });

      it('should use 50 Compact Multi Append Proofs for a 160-element sorted-hash Merkle Tree, to perform 50 appends of up to 3 random elements.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: true };
        testConsecutiveMultiAppend(50, 160, 3, options);
      });
    });
  });

  describe('Combined Proof Common', () => {
    describe('Get Minimum Element Index for Combined Proof', () => {
      it('should get the minimum element index to be included in a Combined Proof a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(1, { minimumIndex: 0 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(2, { minimumIndex: 0 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(3, { minimumIndex: 2 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 4-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(4, { minimumIndex: 0 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 5-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(5, { minimumIndex: 4 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 6-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(6, { minimumIndex: 4 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 7-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(7, { minimumIndex: 6 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(8, { minimumIndex: 0 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 23-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(23, { minimumIndex: 22 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 48-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(48, { minimumIndex: 32 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 365-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(365, { minimumIndex: 364 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 384-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(384, { minimumIndex: 256 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 580-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(580, { minimumIndex: 576 }, options);
      });

      it('should get the minimum element index to be included in a Combined Proof a 1792-element Merkle Tree.', () => {
        const options = { unbalanced: true };
        testCombinedProofMinimumIndex(1792, { minimumIndex: 1536 }, options);
      });
    });

    describe('Boolean-Array Combined Proof Verification (Single Update, Single Append)', () => {
      it('should verify a Combined Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(1, 0, options);
      });

      it('should verify a Combined Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(2, 1, options);
      });

      it('should verify a Combined Proof for a 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(128, 127, options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(100, 99, options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(101, 100, options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, 11, options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, 10, options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, 8, options);
      });
    });

    describe('Boolean-Array Combined Proof Verification (Multi Update, Multi Append)', () => {
      it('should verify a Combined Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(1, [0], options);
      });

      it('should verify a Combined Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(2, [1], options);
      });

      it('should verify a Combined Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(2, [0, 1], options);
      });

      it('should verify a Combined Proof for a 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(128, [2, 4, 12, 15, 127], options);
      });

      it('should verify a Combined Proof for a 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(128, [2, 4, 12, 15, 126, 127], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(100, [99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 98, 99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 98, 99], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(101, [100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 99, 100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 99, 100], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 11], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 10], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 9], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 8], options);
      });

      it('should verify a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(1, [0], options);
      });

      it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(2, [1], options);
      });

      it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(2, [0, 1], options);
      });

      it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(128, [2, 4, 12, 15, 127], options);
      });

      it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(128, [2, 4, 12, 15, 126, 127], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(100, [99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 98, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 98, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(101, [100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 99, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 99, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 11], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 10], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 9], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
        testCombinedProofVerification(12, [7, 8], options);
      });
    });

    describe('Boolean-Bit Combined Proof Verification (Single Update, Single Append)', () => {
      it('should verify a Combined Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(1, 0, options);
      });

      it('should verify a Combined Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(2, 1, options);
      });

      it('should verify a Combined Proof for a 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(128, 127, options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(100, 99, options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(101, 100, options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, 11, options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, 10, options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, 8, options);
      });
    });

    describe('Boolean-Bit Combined Proof Verification (Multi Update, Multi Append)', () => {
      it('should verify a Combined Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(1, [0], options);
      });

      it('should verify a Combined Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(2, [1], options);
      });

      it('should verify a Combined Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(2, [0, 1], options);
      });

      it('should verify a Combined Proof for a 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(128, [2, 4, 12, 15, 127], options);
      });

      it('should verify a Combined Proof for a 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(128, [2, 4, 12, 15, 126, 127], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(100, [99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 98, 99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 99], options);
      });

      it('should verify a Combined Proof for a 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 98, 99], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(101, [100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 99, 100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 100], options);
      });

      it('should verify a Combined Proof for a 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 99, 100], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 11], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 10], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 9], options);
      });

      it('should verify a Combined Proof for a 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 8], options);
      });

      it('should verify a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(1, [0], options);
      });

      it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(2, [1], options);
      });

      it('should verify a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(2, [0, 1], options);
      });

      it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(128, [2, 4, 12, 15, 127], options);
      });

      it('should verify a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(128, [2, 4, 12, 15, 126, 127], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(100, [99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 98, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(100, [2, 4, 12, 15, 97, 98, 99], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(101, [100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 99, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(101, [2, 4, 12, 15, 98, 99, 100], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 11], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 10], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 9], options);
      });

      it('should verify a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
        testCombinedProofVerification(12, [7, 8], options);
      });
    });
  });

  describe('Combined Proof (Updates with Appends)', () => {
    describe('Boolean-Array Combined Proofs (Single Update, Single Append)', () => {
      describe('Boolean-Array Combined Proof Generation (Single Update, Single Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(1, 'ff', 0, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(2, 'ff', 1, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(128, 'ff', 127, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(100, 'ff', 99, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(101, 'ff', 100, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(12, 'ff', 11, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(12, 'ff', 10, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppendProofGeneration(12, 'ff', 8, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute (Single Update, Single Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(1, 0, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(2, 1, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(128, 127, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(100, 99, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(101, 100, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(12, 11, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(12, 10, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUpdateSingleAppend(12, 8, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute Consecutively (Single Update, Single Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 single updates and single appends.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testConsecutiveSingleUpdateSingleAppend(100, 1, options);
        });
      });
    });

    describe.skip('Boolean-Array Combined Proofs (Single Update, Multi Append)', () => { });

    describe.skip('Boolean-Array Combined Proofs (Multi Update, Single Append)', () => { });

    describe('Boolean-Array Combined Proofs (Multi Update, Multi Append)', () => {
      describe('Boolean-Array Combined Proof Generation (Multi Update, Multi Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [0, 1], 5, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 127], 5, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 11], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 10], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 9], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 8], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [0, 1], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 127], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 11], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 10], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 9], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 8], 5, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute (Multi Update, Multi Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(2, [0, 1], 5, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 127], 5, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 11], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 10], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 9], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 8], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(2, [0, 1], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 127], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 11], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 10], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 9], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testMultiUpdateMultiAppend(12, [7, 8], 5, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute Consecutively (Multi Update, Multi Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 updates and appends of up to 6 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testConsecutiveMultiUpdateMultiAppend(100, 1, 6, 6, options);
        });

        it('should use 50 Combined Proofs for a 3-element Merkle Tree, to perform 50 updates and appends of up to 12 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testConsecutiveMultiUpdateMultiAppend(50, 3, 12, 12, options);
        });

        it('should use 100 Combined Proofs for a sorted-hash 1-element Merkle Tree, to perform 100 updates and appends of up to 6 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testConsecutiveMultiUpdateMultiAppend(100, 1, 6, 6, options);
        });

        it('should use 50 Combined Proofs for a sorted-hash 3-element Merkle Tree, to perform 50 updates and appends of up to 12 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: false };
          testConsecutiveMultiUpdateMultiAppend(50, 3, 12, 12, options);
        });
      });
    });

    describe('Boolean-Bit Combined Proofs (Single Update, Single Append)', () => {
      describe('Boolean-Bit Combined Proof Generation (Single Update, Single Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(1, 'ff', 0, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(2, 'ff', 1, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(128, 'ff', 127, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(100, 'ff', 99, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(101, 'ff', 100, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(12, 'ff', 11, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(12, 'ff', 10, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppendProofGeneration(12, 'ff', 8, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute (Single Update, Single Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(1, 0, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(2, 1, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(128, 127, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(100, 99, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(101, 100, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(12, 11, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(12, 10, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUpdateSingleAppend(12, 8, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute Consecutively (Single Update, Single Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 single updates and single appends.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveSingleUpdateSingleAppend(100, 1, options);
        });
      });
    });

    describe.skip('Boolean-Bit Combined Proofs (Single Update, Multi Append)', () => { });

    describe.skip('Boolean-Bit Combined Proofs (Multi Update, Single Append)', () => { });

    describe('Boolean-Bit (Compact) Combined Proofs (Multi Update, Multi Append)', () => {
      describe('Boolean-Bit Combined Proof Generation (Multi Update, Multi Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [0, 1], 5, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 127], 5, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 11], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 10], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 9], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 8], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(2, 'ff', [0, 1], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 127], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(100, 'ff', [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(101, 'ff', [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 11], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 10], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 9], 5, options);
        });

        it('should generate a Combined Proof for a sorted-hash 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppendProofGeneration(12, 'ff', [7, 8], 5, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute (Multi Update, Multi Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(2, [0, 1], 5, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 127], 5, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 11], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 10], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 9], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 8], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 1-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 2-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(2, [0, 1], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 127], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 128-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(128, [2, 4, 12, 15, 126, 127], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 100-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(100, [2, 4, 12, 15, 97, 98, 99], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 101-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(101, [2, 4, 12, 15, 98, 99, 100], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 11], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 10], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 9], 5, options);
        });

        it('should use a Combined Proof for a sorted-hash 12-element Merkle Tree, to update and append elements.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testMultiUpdateMultiAppend(12, [7, 8], 5, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute Consecutively (Multi Update, Multi Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 updates and appends of up to 6 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveMultiUpdateMultiAppend(100, 1, 6, 6, options);
        });

        it('should use 50 Combined Proofs for a 3-element Merkle Tree, to perform 50 updates and appends of up to 12 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveMultiUpdateMultiAppend(50, 3, 12, 12, options);
        });

        it('should use 100 Combined Proofs for a sorted-hash 1-element Merkle Tree, to perform 100 updates and appends of up to 6 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testConsecutiveMultiUpdateMultiAppend(100, 1, 6, 6, options);
        });

        it('should use 50 Combined Proofs for a sorted-hash 3-element Merkle Tree, to perform 50 updates and appends of up to 12 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: true, indexed: false, compact: true };
          testConsecutiveMultiUpdateMultiAppend(50, 3, 12, 12, options);
        });
      });
    });
  });

  describe('Combined Proof (Uses with Appends)', () => {
    describe('Boolean-Array Combined Proofs (Single Use, Single Append)', () => {
      describe('Boolean-Array Combined Proof Generation (Single Use, Single Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(1, 'ff', 0, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(2, 'ff', 1, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(128, 'ff', 127, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(100, 'ff', 99, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(101, 'ff', 100, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(12, 'ff', 11, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(12, 'ff', 10, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppendProofGeneration(12, 'ff', 8, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute (Single Use, Single Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(1, 0, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(2, 1, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(128, 127, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(100, 99, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(101, 100, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(12, 11, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(12, 10, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testSingleUseSingleAppend(12, 8, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute Consecutively (Single Use, Single Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 single uses and single appends.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testConsecutiveSingleUseSingleAppend(100, 1, options);
        });
      });
    });

    describe.skip('Boolean-Array Combined Proofs (Single Use, Multi Append)', () => { });

    describe.skip('Boolean-Array Combined Proofs (Multi Use, Single Append)', () => { });

    describe('Boolean-Array Combined Proofs (Multi Use, Multi Append)', () => {
      describe('Boolean-Array Combined Proof Generation (Multi Use, Multi Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppendProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppendProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 127], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppendProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppendProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppendProofGeneration(12, 'ff', [7, 11], 5, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute (Multi Use, Multi Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppend(128, [2, 4, 12, 15, 127], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testMultiUseMultiAppend(12, [7, 11], 5, options);
        });
      });

      describe('Boolean-Array Combined Proof Execute Consecutively (Multi Use, Multi Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 uses and appends of up to 6 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
          testConsecutiveMultiUseMultiAppend(100, 1, 6, 6, options);
        });
      });
    });

    describe('Boolean-Bit Combined Proofs (Single Use, Single Append)', () => {
      describe('Boolean-Bit Combined Proof Generation (Single Use, Single Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(1, 'ff', 0, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(2, 'ff', 1, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(128, 'ff', 127, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(100, 'ff', 99, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(101, 'ff', 100, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(12, 'ff', 11, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(12, 'ff', 10, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppendProofGeneration(12, 'ff', 8, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute (Single Use, Single Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(1, 0, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(2, 1, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(128, 127, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(100, 99, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(101, 100, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(12, 11, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(12, 10, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use 1 and append 1 element.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testSingleUseSingleAppend(12, 8, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute Consecutively (Single Use, Single Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 single uses and single appends.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveSingleUseSingleAppend(100, 1, options);
        });
      });
    });

    describe.skip('Boolean-Bit Combined Proofs (Single Use, Multi Append)', () => { });

    describe.skip('Boolean-Bit Combined Proofs (Multi Use, Single Append)', () => { });

    describe('Boolean-Bit (Compact) Combined Proofs (Multi Use, Multi Append)', () => {
      describe('Boolean-Bit Combined Proof Generation (Multi Use, Multi Append)', () => {
        it('should generate a Combined Proof for a 1-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppendProofGeneration(1, 'ff', [0], 5, options);
        });

        it('should generate a Combined Proof for a 2-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppendProofGeneration(2, 'ff', [1], 5, options);
        });

        it('should generate a Combined Proof for a 128-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppendProofGeneration(128, 'ff', [2, 4, 12, 15, 127], 5, options);
        });

        it('should generate a Combined Proof for a 100-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppendProofGeneration(100, 'ff', [99], 5, options);
        });

        it('should generate a Combined Proof for a 101-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppendProofGeneration(101, 'ff', [100], 5, options);
        });

        it('should generate a Combined Proof for a 12-element Merkle Tree.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppendProofGeneration(12, 'ff', [7, 11], 5, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute (Multi Use, Multi Append)', () => {
        it('should use a Combined Proof for a 1-element Merkle Tree, to use and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppend(1, [0], 5, options);
        });

        it('should use a Combined Proof for a 2-element Merkle Tree, to use and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppend(2, [1], 5, options);
        });

        it('should use a Combined Proof for a 128-element Merkle Tree, to use and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppend(128, [2, 4, 12, 15, 127], 5, options);
        });

        it('should use a Combined Proof for a 100-element Merkle Tree, to use and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppend(100, [99], 5, options);
        });

        it('should use a Combined Proof for a 101-element Merkle Tree, to use and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppend(101, [100], 5, options);
        });

        it('should use a Combined Proof for a 12-element Merkle Tree, to use and append elements.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testMultiUseMultiAppend(12, [7, 11], 5, options);
        });
      });

      describe('Boolean-Bit Combined Proof Execute Consecutively (Multi Use, Multi Append)', () => {
        it('should use 100 Combined Proofs for a 1-element Merkle Tree, to perform 100 uses and appends of up to 6 random elements respectively.', () => {
          const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
          testConsecutiveMultiUseMultiAppend(100, 1, 6, 6, options);
        });
      });
    });
  });

  describe('Size Proofs', () => {
    describe('Size Proof Generation', () => {
      it('should generate a Size Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: [],
        };

        testSizeProofGeneration(0, 'ff', expected, options);
      });

      it('should generate a Size Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: ['0e3ba1c61ffe3e984a50346034613b3b7368e64dafd5ea3d2ac05fc5ada33a60'],
        };

        testSizeProofGeneration(1, 'ff', expected, options);
      });

      it('should generate a Size Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: ['a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27'],
        };

        testSizeProofGeneration(2, 'ff', expected, options);
      });

      it('should generate a Size Proof for a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: [
            'a3ce89c3f749bfd79ce683054de83f70e40e847cef70e5389167871c4dd4af27',
            'a7220cb76d040b2fdf4e25b319539c769eb77147fcb92b6ea8962cd04096c27b',
          ],
        };

        testSizeProofGeneration(3, 'ff', expected, options);
      });

      it('should generate a Size Proof for a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: ['0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4'],
        };

        testSizeProofGeneration(8, 'ff', expected, options);
      });

      it('should generate a Size Proof for a 15-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: [
            '0c67c6340449c320fb4966988f319713e0610c40237a05fdef8e5da8c66db8a4',
            'd9df67e21f45396a2739193be4bb49cefb1ebac44dd283c07519b6de6f154f5b',
            '712ed55abe1946b941876a6230b3135edadc400a18897e029ffdbff6900503e6',
            'e481ff292c1b323f27dd2e7b0da511947e0d349a0616a739ea628a3a5888c529',
          ],
        };

        testSizeProofGeneration(15, 'ff', expected, options);
      });

      it('should generate a Size Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };

        const expected = {
          decommitments: [
            'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
            'febc2d558e22b7e32db3a5dd0b4d8ac3dac5835493955c53e3eb0f8fdb2f4954',
          ],
        };

        testSizeProofGeneration(20, 'ff', expected, options);
      });

      it('should generate a compact Size Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true, simple: false };

        const expected = {
          compactProof: [],
        };

        testSizeProofGeneration(0, 'ff', expected, options);
      });

      it('should generate a compact Size Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true, simple: false };

        const expected = {
          compactProof: [
            'c7ec3e428ae2869b12c1b8e12a84e56f0d7f3cbe752cd1c3775158cf846412be',
            'febc2d558e22b7e32db3a5dd0b4d8ac3dac5835493955c53e3eb0f8fdb2f4954',
          ],
        };

        testSizeProofGeneration(20, 'ff', expected, options);
      });

      it('should generate a simple Size Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: true };

        const expected = {
          elementRoot: '0000000000000000000000000000000000000000000000000000000000000000',
        };

        testSizeProofGeneration(0, 'ff', expected, options);
      });

      it('should generate a simple Size Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: true };

        const expected = {
          elementRoot: '56afa93d33699c72a6989f3b114b1b474d3ec202164549fe3d616cca61fb071b',
        };

        testSizeProofGeneration(20, 'ff', expected, options);
      });

      it('should generate a simple Size Proof for a 20-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false, simple: true };

        const expected = {
          elementRoot: '5944736c577a3a171994fca82f54afa1cd102dd1a0b3c3bd9e71c82038a2172e',
        };

        testSizeProofGeneration(20, 'ff', expected, options);
      });
    });

    describe('Size Proof Verification', () => {
      it('should verify a Size Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(0, options);
      });

      it('should verify a Size Proof for a 1-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(1, options);
      });

      it('should verify a Size Proof for a 2-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(2, options);
      });

      it('should verify a Size Proof for a 3-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(3, options);
      });

      it('should verify a Size Proof for a 8-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(8, options);
      });

      it('should verify a Size Proof for a 15-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(15, options);
      });

      it('should verify a Size Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: false };
        testSizeProofVerification(20, options);
      });

      it('should verify a compact Size Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true, simple: false };
        testSizeProofVerification(0, options);
      });

      it('should verify a compact Size Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true, simple: false };
        testSizeProofVerification(20, options);
      });

      it('should verify a simple Size Proof for a 0-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: true };
        testSizeProofVerification(0, options);
      });

      it('should verify a simple Size Proof for a 20-element Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false, simple: true };
        testSizeProofVerification(20, options);
      });

      it('should verify a simple Size Proof for a 20-element sorted-hash Merkle Tree.', () => {
        const options = { unbalanced: true, sortedHash: true, compact: false, simple: true };
        testSizeProofVerification(20, options);
      });
    });
  });

  describe('Arbitrary Element Sizes', () => {
    describe('Merkle Tree Construction', () => {
      it('should build a 28-element Merkle Tree of 10-byte elements.', () => {
        const expected = {
          root: 'f22ea9dce286a16f532002cfee669d6755131095e310e2414460cf05173bf970',
          elementRoot: 'c6e8dab5e6d43912a996048145f94af81fc5314c61e74ed93eb2143189fe13ba',
          depth: 5,
        };

        testBuildTree(28, 'ff', expected, { unbalanced: true, sortedHash: false }, { elementSize: 10 });
      });

      it('should build a 28-element Merkle Tree of 100-byte elements.', () => {
        const expected = {
          root: 'd341738448ea99be1cbb5d9709dc49e9c55e7ca903971fa4f57650aa7c55067a',
          elementRoot: '55b732cbfaedd53e9244ed2dc1059c8e0534ce03cbb71effec5fd666ad2c5835',
          depth: 5,
        };

        testBuildTree(28, 'ff', expected, { unbalanced: true, sortedHash: false }, { elementSize: 100 });
      });

      it('should build a 28-element Merkle Tree of random size elements.', () => {
        const expected = {
          root: 'f3d9d28abdf4024da0b75f98cf0cf3dbb5de429e4cddb69e8affebff325d53d0',
          elementRoot: '9675e208b3b3207d4e76237ce5606d221f430b85ba193cec69fe84888a07cecc',
          depth: 5,
        };

        testBuildTree(28, 'ff', expected, { unbalanced: true, sortedHash: false }, { elementSize: 'random' });
      });
    });

    describe('Single Proof Update Consecutive Uses', () => {
      it('should use 10 Compact Single Proofs for a 25-element, of random size, Merkle Tree, to update an 10 elements consecutively.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testConsecutiveSingleUpdate(10, 25, options, { elementSize: 'random' });
      });
    });

    describe('Index and Existence Multi Proof Update Consecutive Uses', () => {
      it('should use 10 Compact Multi Proofs for a 19-element, of random size, Merkle Tree, to perform 10 updates of up to 6 random elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: true, compact: true };
        testConsecutiveMultiUpdate(10, 19, 6, options, { elementSize: 'random' });
      });
    });

    describe('Existence-Only Boolean-Array Multi Proof Update Consecutive Uses', () => {
      it('should use 10 Multi Proofs for a 19-element, of random size, Merkle Tree, to perform 10 updates of up to 6 random elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: false };
        testConsecutiveMultiUpdate(10, 19, 6, options, { elementSize: 'random' });
      });
    });

    describe('Existence-Only Boolean-Bit Multi Proof Update Consecutive Uses', () => {
      it('should use 10 Multi Proofs for a 19-element, of random size, Merkle Tree, to perform 10 updates of up to 6 random elements.', () => {
        const options = { unbalanced: true, sortedHash: false, indexed: false, compact: true };
        testConsecutiveMultiUpdate(10, 19, 6, options, { elementSize: 'random' });
      });
    });

    describe('Append Proof Append Consecutive Uses', () => {
      it('should use 10 Compact Single Append Proofs for a 160-element, of random size, Merkle Tree, to append an 10 elements consecutively.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: true };
        testConsecutiveSingleAppend(10, 160, options, { elementSize: 'random' });
      });

      it('should use 10 Multi Append Proofs for a 0-element Merkle Tree, to perform 10 appends of up to 4 random elements, of random size.', () => {
        const options = { unbalanced: true, sortedHash: false, compact: false };
        testConsecutiveMultiAppend(10, 0, 4, options, { elementSize: 'random' });
      });
    });
  });
});
