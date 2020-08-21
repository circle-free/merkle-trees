# merkle-trees-eth (A set of smart contracts and libraries compatible with `merkle-trees/js`)

## The Goal ##

A Merkle Tree library that enabled compact multi-proofs to update and append elements to roots of unbalanced trees. Can greatly reduce gas costs of storing lists, when compared to simple storage, especially when appending.
Effectively, this reduces SLOADs and SSTOREs to once per contract call, regardless of the operation (read, update, insert), and the cost of more calldata (elements and proof) and significantly more on-chain logic.
Ideally, this structure and library can be used to roll up and entire object, into one root, using recursive compact proofs to use its children, and add to it.


## Status ##

While the merkle-storage contract is a working and tested example, the merkle-storage library needs to be tested, and could be optimized further.


## Various TODOs (mostly dependent on `merkle-trees/js`) ##

- [ ] support indexed multi-proofs
- [ ] support index-less single-proofs
- [ ] support deleting elements
- [ ] recursive proofs (arrays of arrays)
- [ ] recursive proofs (objects of objects)
- [ ] some optimizations and more assembly wouldn't hurt
- [ ] benchmark break-evens
- [ ] bit_count_256
- [ ] support proofs that require more than 255 hashes (a bit excessive)
- [ ] implement use_many_and_append_many in merkle-storage.sol
- [ ] an example using the library contract
- [ ] testing of the library contract
- [ ] support for arbitrary size elements (currently, each element must be 32-bytes)
- [ ] security review
- [ ] ensure logical shift right (to prevent leading bit-flags from propagating down)


## Tests ##

```console
foo@bar:~$ nvm use 14.8.0
Now using node v14.8.0 (npm v6.14.7)
foo@bar:~$ yarn install
...
Done in 0.16s.
foo@bar:~$ ganache-cli
...
foo@bar:~$ yarn test
...
29 passing (42s)
```
