const MS_ICBSH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Sorted_Hash');
const MS_ICBS = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes_Standard');
const MS_ICB32SH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Sorted_Hash');
const MS_ICB32S = artifacts.require('Merkle_Storage_Using_Internal_Lib_Calldata_Bytes32_Standard');
const MS_IMBSH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Sorted_Hash');
const MS_IMBS = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes_Standard');
const MS_IMB32SH = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Sorted_Hash');
const MS_IMB32S = artifacts.require('Merkle_Storage_Using_Internal_Lib_Memory_Bytes32_Standard');

const EXT_M_LIB_SH = artifacts.require('External_Merkle_Library_Sorted_Hash');
const EXT_M_LIB = artifacts.require('External_Merkle_Library');

const MS_DCBSH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes_Sorted_Hash');
const MS_DCBS = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes_Standard');
const MS_DCB32SH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes32_Sorted_Hash');
const MS_DCB32S = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Calldata_Bytes32_Standard');
const MS_DMBSH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes_Sorted_Hash');
const MS_DMBS = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes_Standard');
const MS_DMB32SH = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes32_Sorted_Hash');
const MS_DMB32S = artifacts.require('Merkle_Storage_Using_Deployable_Lib_Memory_Bytes32_Standard');

const deploy = (deployer, artifact) =>
  deployer.deploy(artifact)
    .then(() => artifact.deployed());

const deployWithLink = (deployer, artifact, libraryArtifact) =>
  deployer.link(libraryArtifact, artifact)
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
    .then(() => deploy(deployer, EXT_M_LIB_SH))
    .then(() => deploy(deployer, EXT_M_LIB))
    .then(() => deployWithLink(deployer, MS_DCBSH, EXT_M_LIB_SH))
    .then(() => deployWithLink(deployer, MS_DCBS, EXT_M_LIB))
    .then(() => deployWithLink(deployer, MS_DCB32SH, EXT_M_LIB_SH))
    .then(() => deployWithLink(deployer, MS_DCB32S, EXT_M_LIB))
    .then(() => deployWithLink(deployer, MS_DMBSH, EXT_M_LIB_SH))
    .then(() => deployWithLink(deployer, MS_DMBS, EXT_M_LIB))
    .then(() => deployWithLink(deployer, MS_DMB32SH, EXT_M_LIB_SH))
    .then(() => deployWithLink(deployer, MS_DMB32S, EXT_M_LIB));
};
