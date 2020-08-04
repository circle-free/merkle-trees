# Merkle Tree Class


## Generic Merkle Tree Construction ##

Will construct a Merkle Tree object from a set of elements with the following options:

* balanced or unbalanced (default), such that Hash ( i , j ) = i when j = unset/null;
* ordered or sorted hashing for pairs
* hash prefix for hashing elements into nodes (reducing to 32 bytes and preventing the second pre-image attack)


## Single Element Poofs ##

Can currently prove the existence of an element at a specific index given a Merkle root.
Proof of existence without index will be implemented soon.
Proofs can be used to update the Merkle root with a proof and a new element.


## Multi Element Poofs ##

Can currently prove the existence of several element at specific indices given a Merkle root.
Can currently prove the existence of several elements, regardless of indices, given a Merkle root.
Proofs can be used to update the Merkle root with a proof and a set of new elements.


## Append Poofs ##

For allowably unbalanced Merkle Tree, can prove a set of nodes required to compute the new root when appending a single element to the end/right tree.
Implementation for appending several elements to end/right of the tree is coming soon.


## Unbalanced Tree Optimizations ##

Given an unbalanced tree, where we know elements to the right of the append index do not exist, there may be some single and multi proof optimizations, particularly with the verifications.


## Multi Proof Update and Append ##

Going to attempt a single verification step to prove elements, update them/some, and append some others.


## The Goal ##

A robust and well tested class to be used as the basis for nested objects to roll up to one on-chain merkle root. For example, to represent some player's entire state, with respect to a single smart contract, as a root, such that all function calls require the player to provide the proof of their state variables they ar using, as well as additional proof to allow the appending of additional state, ultimately resulting in one SLOAD and one SSTORE for that call.
