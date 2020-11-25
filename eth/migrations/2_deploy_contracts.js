const MS_ICBSH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Sorted_Hash');
const MS_ICBS = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Standard');
const MS_ICB32SH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Sorted_Hash');
const MS_ICB32S = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Standard');
const MS_IMBSH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Sorted_Hash');
const MS_IMBS = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Standard');
const MS_IMB32SH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Sorted_Hash');
const MS_IMB32S = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Standard');

const DCBSH = artifacts.require('Merkle_Library_DCBSH');
const MS_DCBSH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes_Sorted_Hash');

const DCBS = artifacts.require('Merkle_Library_DCBS');
const MS_DCBS = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes_Standard');

const DCB32SH = artifacts.require('Merkle_Library_DCB32SH');
const MS_DCB32SH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes32_Sorted_Hash');

const DCB32S = artifacts.require('Merkle_Library_DCB32S');
const MS_DCB32S = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes32_Standard');

const DMBSH = artifacts.require('Merkle_Library_DMBSH');
const MS_DMBSH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes_Sorted_Hash');

const DMBS = artifacts.require('Merkle_Library_DMBS');
const MS_DMBS = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes_Standard');

const DMB32SH = artifacts.require('Merkle_Library_DMB32SH');
const MS_DMB32SH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes32_Sorted_Hash');

const DMB32S = artifacts.require('Merkle_Library_DMB32S');
const MS_DMB32S = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes32_Standard');

const deploy = (deployer, artifact) =>
  deployer.deploy(artifact)
    .then(() => artifact.deployed());

const deployWithLink = (deployer, artifact, libraryArtifact) =>
  deploy(deployer, libraryArtifact)
    .then(() => deployer.link(libraryArtifact, artifact))
    .then(() => deploy(deployer, artifact));

module.exports = function(deployer) {
  deploy(deployer, MS_ICBSH)
    .then(() => deploy(deployer, MS_ICBS))
    .then(() => deploy(deployer, MS_ICB32SH))
    .then(() => deploy(deployer, MS_ICB32S))
    .then(() => deploy(deployer, MS_IMBSH))
    .then(() => deploy(deployer, MS_IMBS))
    .then(() => deploy(deployer, MS_IMB32SH))
    .then(() => deploy(deployer, MS_IMB32S))
    .then(() => deployWithLink(deployer, MS_DCBSH, DCBSH))
    .then(() => deployWithLink(deployer, MS_DCBS, DCBS))
    .then(() => deployWithLink(deployer, MS_DCB32SH, DCB32SH))
    .then(() => deployWithLink(deployer, MS_DCB32S, DCB32S))
    .then(() => deployWithLink(deployer, MS_DMBSH, DMBSH))
    .then(() => deployWithLink(deployer, MS_DMBS, DMBS))
    .then(() => deployWithLink(deployer, MS_DMB32SH, DMB32SH))
    .then(() => deployWithLink(deployer, MS_DMB32S, DMB32S));
};
