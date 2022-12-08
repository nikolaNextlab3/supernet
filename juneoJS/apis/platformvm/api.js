"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const jrpcapi_1 = require("../../common/jrpcapi");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const constants_2 = require("./constants");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../platformvm/utxos");
const errors_1 = require("../../utils/errors");
const outputs_1 = require("./outputs");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for interacting with a node's PlatformVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Juneo.addAPI]] function to register this interface with Juneo.
 */
class PlatformVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Juneo.addAPI]] method.
     *
     * @param core A reference to the Juneo class
     * @param baseURL Defaults to the string "/ext/P" as the path to blockchain's baseURL
     */
    constructor(core, baseURL = "/ext/bc/P") {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = constants_1.PlatformChainID;
        this.blockchainAlias = undefined;
        this.JUNEAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        this.minValidatorStake = undefined;
        this.minDelegatorStake = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_1.Defaults.network &&
                    this.blockchainID in constants_1.Defaults.network[`${netid}`]) {
                    this.blockchainAlias =
                        constants_1.Defaults.network[`${netid}`][this.blockchainID]["alias"];
                    return this.blockchainAlias;
                }
                else {
                    /* istanbul ignore next */
                    return undefined;
                }
            }
            return this.blockchainAlias;
        };
        /**
         * Sets the alias for the blockchainID.
         *
         * @param alias The alias for the blockchainID.
         *
         */
        this.setBlockchainAlias = (alias) => {
            this.blockchainAlias = alias;
            /* istanbul ignore next */
            return undefined;
        };
        /**
         * Gets the blockchainID and returns it.
         *
         * @returns The blockchainID
         */
        this.getBlockchainID = () => this.blockchainID;
        /**
         * Refresh blockchainID, and if a blockchainID is passed in, use that.
         *
         * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
         *
         * @returns The blockchainID
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netid = this.core.getNetworkID();
            if (typeof blockchainID === "undefined" &&
                typeof constants_1.Defaults.network[`${netid}`] !== "undefined") {
                this.blockchainID = constants_1.PlatformChainID; //default to P-Chain
                return true;
            }
            if (typeof blockchainID === "string") {
                this.blockchainID = blockchainID;
                return true;
            }
            return false;
        };
        /**
         * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
         */
        this.parseAddress = (addr) => {
            const alias = this.getBlockchainAlias();
            const blockchainID = this.getBlockchainID();
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.PlatformVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainid = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            return serialization.bufferToType(address, type, this.core.getHRP(), chainid);
        };
        /**
         * Fetches the JUNE AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the JUNE AssetID
         */
        this.getJUNEAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.JUNEAssetID === "undefined" || refresh) {
                const assetID = yield this.getStakingAssetID();
                this.JUNEAssetID = bintools.cb58Decode(assetID);
            }
            return this.JUNEAssetID;
        });
        /**
         * Overrides the defaults and sets the cache to a specific JUNE AssetID
         *
         * @param juneAssetID A cb58 string or Buffer representing the JUNE AssetID
         *
         * @returns The the provided string representing the JUNE AssetID
         */
        this.setJUNEAssetID = (juneAssetID) => {
            if (typeof juneAssetID === "string") {
                juneAssetID = bintools.cb58Decode(juneAssetID);
            }
            this.JUNEAssetID = juneAssetID;
        };
        /**
         * Gets the default tx fee for this chain.
         *
         * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["txFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the tx fee for this chain.
         *
         * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getTxFee = () => {
            if (typeof this.txFee === "undefined") {
                this.txFee = this.getDefaultTxFee();
            }
            return this.txFee;
        };
        /**
         * Gets the CreateSubnetTx fee.
         *
         * @returns The CreateSubnetTx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreateSubnetTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["createSubnetTx"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the CreateChainTx fee.
         *
         * @returns The CreateChainTx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreateChainTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["createChainTx"])
                : new bn_js_1.default(0);
        };
        /**
         * Sets the tx fee for this chain.
         *
         * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setTxFee = (fee) => {
            this.txFee = fee;
        };
        /**
         * Gets the default creation fee for this chain.
         *
         * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultCreationTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["creationTxFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the creation fee for this chain.
         *
         * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreationTxFee = () => {
            if (typeof this.creationTxFee === "undefined") {
                this.creationTxFee = this.getDefaultCreationTxFee();
            }
            return this.creationTxFee;
        };
        /**
         * Sets the creation fee for this chain.
         *
         * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setCreationTxFee = (fee) => {
            this.creationTxFee = fee;
        };
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         * @ignore
         */
        this.newKeyChain = () => {
            // warning, overwrites the old keychain
            const alias = this.getBlockchainAlias();
            if (alias) {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
            }
            else {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
            }
            return this.keychain;
        };
        /**
         * Helper function which determines if a tx is a goose egg transaction.
         *
         * @param utx An UnsignedTx
         *
         * @returns boolean true if passes goose egg test and false if fails.
         *
         * @remarks
         * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
         */
        this.checkGooseEgg = (utx, outTotal = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const juneAssetID = yield this.getJUNEAssetID();
            let outputTotal = outTotal.gt(new bn_js_1.default(0))
                ? outTotal
                : utx.getOutputTotal(juneAssetID);
            const fee = utx.getBurn(juneAssetID);
            if (fee.lte(constants_1.ONEJUNE.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
         * Retrieves an assetID for a subnet"s staking assset.
         *
         * @returns Returns a Promise string with cb58 encoded value of the assetID.
         */
        this.getStakingAssetID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getStakingAssetID");
            return response.data.result.assetID;
        });
        /**
         * Creates a new blockchain.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the SubnetID or its alias.
         * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
         * @param fxIDs The ids of the FXs the VM is running.
         * @param name A human-readable name for the new blockchain
         * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
         * @param chainAssetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the chainAssetID or its alias.
         *
         * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the Subnet’s control keys and by the account paying the transaction fee.
         */
        this.createBlockchain = (username, password, subnetID = undefined, vmID, fxIDs, name, genesis, chainAssetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                fxIDs,
                vmID,
                name,
                genesisData: genesis
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            if (typeof chainAssetID === "string") {
                params.chainAssetID = chainAssetID;
            }
            else if (typeof chainAssetID !== "undefined") {
                params.chainAssetID = bintools.cb58Encode(chainAssetID);
            }
            const response = yield this.callMethod("platform.createBlockchain", params);
            return response.data.result.txID;
        });
        /**
         * Gets the status of a blockchain.
         *
         * @param blockchainID The blockchainID requesting a status update
         *
         * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
         */
        this.getBlockchainStatus = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("platform.getBlockchainStatus", params);
            return response.data.result.status;
        });
        /**
         * Get the validators and their weights of a subnet or the Primary Network at a given P-Chain height.
         *
         * @param height The P-Chain height to get the validator set at.
         * @param subnetID Optional. A cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise GetValidatorsAtResponse
         */
        this.getValidatorsAt = (height, subnetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                height
            };
            if (typeof subnetID !== "undefined") {
                params.subnetID = subnetID;
            }
            const response = yield this.callMethod("platform.getValidatorsAt", params);
            return response.data.result;
        });
        /**
         * Create an address in the node's keystore.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         *
         * @returns Promise for a string of the newly created account address.
         */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("platform.createAddress", params);
            return response.data.result.address;
        });
        /**
         * Gets the balance of a particular asset.
         *
         * @param address The address to pull the asset balance from
         *
         * @returns Promise with the balance as a {@link https://github.com/indutny/bn.js/|BN} on the provided address.
         */
        this.getBalance = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - PlatformVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address
            };
            const response = yield this.callMethod("platform.getBalance", params);
            return response.data.result;
        });
        /**
         * List the addresses controlled by the user.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         *
         * @returns Promise for an array of addresses.
         */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("platform.listAddresses", params);
            return response.data.result.addresses;
        });
        /**
         * Lists the set of current validators.
         *
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the SubnetID or its alias.
         * @param nodeIDs Optional. An array of strings
         *
         * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.june.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
         *
         */
        this.getCurrentValidators = (subnetID = undefined, nodeIDs = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
                params.nodeIDs = nodeIDs;
            }
            const response = yield this.callMethod("platform.getCurrentValidators", params);
            return response.data.result;
        });
        /**
         * Lists the set of pending validators.
         *
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer}
         * or a cb58 serialized string for the SubnetID or its alias.
         * @param nodeIDs Optional. An array of strings
         *
         * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.june.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
         *
         */
        this.getPendingValidators = (subnetID = undefined, nodeIDs = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
                params.nodeIDs = nodeIDs;
            }
            const response = yield this.callMethod("platform.getPendingValidators", params);
            return response.data.result;
        });
        /**
         * Samples `Size` validators from the current validator set.
         *
         * @param sampleSize Of the total universe of validators, select this many at random
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of validator"s stakingIDs.
         */
        this.sampleValidators = (sampleSize, subnetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                size: sampleSize.toString()
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.sampleValidators", params);
            return response.data.result.validators;
        });
        /**
         * Add a validator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param stakeAmount The amount of nJUNE the validator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address the validator reward will go to, if there is one.
         * @param delegationFeeRate Optional. A {@link https://github.com/indutny/bn.js/|BN} for the percent fee this validator
         * charges when others delegate stake to them. Up to 4 decimal places allowed additional decimal places are ignored.
         * Must be between 0 and 100, inclusive. For example, if delegationFeeRate is 1.2345 and someone delegates to this
         * validator, then when the delegation period is over, 1.2345% of the reward goes to the validator and the rest goes
         * to the delegator.
         *
         * @returns Promise for a base58 string of the unsigned transaction.
         */
        this.addValidator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress, delegationFeeRate = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress
            };
            if (typeof delegationFeeRate !== "undefined") {
                params.delegationFeeRate = delegationFeeRate.toString(10);
            }
            const response = yield this.callMethod("platform.addValidator", params);
            return response.data.result.txID;
        });
        /**
         * Add a validator to a Subnet other than the Primary Network. The validator must validate the Primary Network for the entire duration they validate this Subnet.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 serialized string for the SubnetID or its alias.
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param weight The validator’s weight used for sampling
         *
         * @returns Promise for the unsigned transaction. It must be signed (using sign) by the proper number of the Subnet’s control keys and by the key of the account paying the transaction fee before it can be issued.
         */
        this.addSubnetValidator = (username, password, nodeID, subnetID, startTime, endTime, weight) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                weight
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.addSubnetValidator", params);
            return response.data.result.txID;
        });
        /**
         * Add a delegator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the delegatee
         * @param startTime Javascript Date object for when the delegator starts delegating
         * @param endTime Javascript Date object for when the delegator starts delegating
         * @param stakeAmount The amount of nJUNE the delegator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address of the account the staked JUNE and validation reward
         * (if applicable) are sent to at endTime
         *
         * @returns Promise for an array of validator"s stakingIDs.
         */
        this.addDelegator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress
            };
            const response = yield this.callMethod("platform.addDelegator", params);
            return response.data.result.txID;
        });
        /**
         * Create an unsigned transaction to create a new Subnet. The unsigned transaction must be
         * signed with the key of the account paying the transaction fee. The Subnet’s ID is the ID of the transaction that creates it (ie the response from issueTx when issuing the signed transaction).
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param controlKeys Array of platform addresses as strings
         * @param threshold To add a validator to this Subnet, a transaction must have threshold
         * signatures, where each signature is from a key whose address is an element of `controlKeys`
         *
         * @returns Promise for a string with the unsigned transaction encoded as base58.
         */
        this.createSubnet = (username, password, controlKeys, threshold) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                controlKeys,
                threshold
            };
            const response = yield this.callMethod("platform.createSubnet", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Get the Subnet that validates a given blockchain.
         *
         * @param blockchainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58
         * encoded string for the blockchainID or its alias.
         *
         * @returns Promise for a string of the subnetID that validates the blockchain.
         */
        this.validatedBy = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("platform.validatedBy", params);
            return response.data.result.subnetID;
        });
        /**
         * Get the IDs of the blockchains a Subnet validates.
         *
         * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or an JUNE
         * serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of blockchainIDs the subnet validates.
         */
        this.validates = (subnetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                subnetID
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.validates", params);
            return response.data.result.blockchainIDs;
        });
        /**
         * Get all the blockchains that exist (excluding the P-Chain).
         *
         * @returns Promise for an array of objects containing fields "id", "subnetID", and "vmID".
         */
        this.getBlockchains = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getBlockchains");
            return response.data.result.blockchains;
        });
        /**
         * Send JUNE from an account on the P-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the JUNE is sent from and which pays the
         * transaction fee. After issuing this transaction, you must call the X-Chain’s importJUNE
         * method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address on the X-Chain to send the JUNE to. Do not include X- in the address
         * @param amount Amount of JUNE to export as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns Promise for an unsigned transaction to be signed by the account the the JUNE is
         * sent from and pays the transaction fee.
         */
        this.exportJUNE = (username, password, amount, to) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                amount: amount.toString(10)
            };
            const response = yield this.callMethod("platform.exportAVAX", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send JUNE from an account on the P-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the JUNE is sent from and which pays
         * the transaction fee. After issuing this transaction, you must call the X-Chain’s
         * importJUNE method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The ID of the account the JUNE is sent to. This must be the same as the to
         * argument in the corresponding call to the X-Chain’s exportJUNE
         * @param sourceChain The chainID where the funds are coming from.
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.importJUNE = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password
            };
            const response = yield this.callMethod("platform.importAVAX", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
         *
         * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
         *
         * @returns A Promise string representing the transaction ID of the posted transaction.
         */
        this.issueTx = (tx) => __awaiter(this, void 0, void 0, function* () {
            let Transaction = "";
            if (typeof tx === "string") {
                Transaction = tx;
            }
            else if (tx instanceof buffer_1.Buffer) {
                const txobj = new tx_1.Tx();
                txobj.fromBuffer(tx);
                Transaction = txobj.toStringHex();
            }
            else if (tx instanceof tx_1.Tx) {
                Transaction = tx.toStringHex();
            }
            else {
                /* istanbul ignore next */
                throw new errors_1.TransactionError("Error - platform.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString(),
                encoding: "hex"
            };
            const response = yield this.callMethod("platform.issueTx", params);
            return response.data.result.txID;
        });
        /**
         * Returns an upper bound on the amount of tokens that exist. Not monotonically increasing because this number can go down if a staker"s reward is denied.
         */
        this.getCurrentSupply = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getCurrentSupply");
            return new bn_js_1.default(response.data.result.supply, 10);
        });
        /**
         * Returns the height of the platform chain.
         */
        this.getHeight = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getHeight");
            return new bn_js_1.default(response.data.result.height, 10);
        });
        /**
         * Gets the minimum staking amount.
         *
         * @param refresh A boolean to bypass the local cached value of Minimum Stake Amount, polling the node instead.
         */
        this.getMinStake = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (refresh !== true &&
                typeof this.minValidatorStake !== "undefined" &&
                typeof this.minDelegatorStake !== "undefined") {
                return {
                    minValidatorStake: this.minValidatorStake,
                    minDelegatorStake: this.minDelegatorStake
                };
            }
            const response = yield this.callMethod("platform.getMinStake");
            this.minValidatorStake = new bn_js_1.default(response.data.result.minValidatorStake, 10);
            this.minDelegatorStake = new bn_js_1.default(response.data.result.minDelegatorStake, 10);
            return {
                minValidatorStake: this.minValidatorStake,
                minDelegatorStake: this.minDelegatorStake
            };
        });
        /**
         * getTotalStake() returns the total amount staked on the Primary Network
         *
         * @returns A big number representing total staked by validators on the primary network
         */
        this.getTotalStake = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getTotalStake");
            return new bn_js_1.default(response.data.result.stake, 10);
        });
        /**
         * getMaxStakeAmount() returns the maximum amount of nJUNE staking to the named node during the time period.
         *
         * @param subnetID A Buffer or cb58 string representing subnet
         * @param nodeID A string representing ID of the node whose stake amount is required during the given duration
         * @param startTime A big number denoting start time of the duration during which stake amount of the node is required.
         * @param endTime A big number denoting end time of the duration during which stake amount of the node is required.
         * @returns A big number representing total staked by validators on the primary network
         */
        this.getMaxStakeAmount = (subnetID, nodeID, startTime, endTime) => __awaiter(this, void 0, void 0, function* () {
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.gt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("PlatformVMAPI.getMaxStakeAmount -- startTime must be in the past and endTime must come after startTime");
            }
            const params = {
                nodeID,
                startTime,
                endTime
            };
            if (typeof subnetID === "string") {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== "undefined") {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            const response = yield this.callMethod("platform.getMaxStakeAmount", params);
            return new bn_js_1.default(response.data.result.amount, 10);
        });
        /**
         * Sets the minimum stake cached in this class.
         * @param minValidatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum stake amount cached in this class.
         * @param minDelegatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum delegation amount cached in this class.
         */
        this.setMinStake = (minValidatorStake = undefined, minDelegatorStake = undefined) => {
            if (typeof minValidatorStake !== "undefined") {
                this.minValidatorStake = minValidatorStake;
            }
            if (typeof minDelegatorStake !== "undefined") {
                this.minDelegatorStake = minDelegatorStake;
            }
        };
        /**
         * Gets the total amount staked for an array of addresses.
         */
        this.getStake = (addresses, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                addresses,
                encoding
            };
            const response = yield this.callMethod("platform.getStake", params);
            return {
                staked: new bn_js_1.default(response.data.result.staked, 10),
                stakedOutputs: response.data.result.stakedOutputs.map((stakedOutput) => {
                    const transferableOutput = new outputs_1.TransferableOutput();
                    let buf;
                    if (encoding === "cb58") {
                        buf = bintools.cb58Decode(stakedOutput);
                    }
                    else {
                        buf = buffer_1.Buffer.from(stakedOutput.replace(/0x/g, ""), "hex");
                    }
                    transferableOutput.fromBuffer(buf, 2);
                    return transferableOutput;
                })
            };
        });
        /**
         * Get all the subnets that exist.
         *
         * @param ids IDs of the subnets to retrieve information about. If omitted, gets all subnets
         *
         * @returns Promise for an array of objects containing fields "id",
         * "controlKeys", and "threshold".
         */
        this.getSubnets = (ids = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof ids !== undefined) {
                params.ids = ids;
            }
            const response = yield this.callMethod("platform.getSubnets", params);
            return response.data.result.subnets;
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("platform.exportKey", params);
            return response.data.result.privateKey
                ? response.data.result.privateKey
                : response.data.result;
        });
        /**
         * Give a user control over an address by providing the private key that controls the address.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm"s format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey
            };
            const response = yield this.callMethod("platform.importKey", params);
            return response.data.result.address
                ? response.data.result.address
                : response.data.result;
        });
        /**
         * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
         *
         * @param txID The string representation of the transaction ID
         * @param encoding sets the format of the returned transaction. Can be, "cb58", "hex" or "json". Defaults to "cb58".
         *
         * @returns Returns a Promise string or object containing the bytes retrieved from the node
         */
        this.getTx = (txID, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("platform.getTx", params);
            return response.data.result.tx
                ? response.data.result.tx
                : response.data.result;
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txid The string representation of the transaction ID
         * @param includeReason Return the reason tx was dropped, if applicable. Defaults to true
         *
         * @returns Returns a Promise string containing the status retrieved from the node and the reason a tx was dropped, if applicable.
         */
        this.getTxStatus = (txid, includeReason = true) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
                includeReason: includeReason
            };
            const response = yield this.callMethod("platform.getTxStatus", params);
            return response.data.result;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO"s. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit,
                encoding
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            const response = yield this.callMethod("platform.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            let data = response.data.result.utxos;
            if (persistOpts && typeof persistOpts === "object") {
                if (this.db.has(persistOpts.getName())) {
                    const selfArray = this.db.get(persistOpts.getName());
                    if (Array.isArray(selfArray)) {
                        utxos.addArray(data);
                        const self = new utxos_1.UTXOSet();
                        self.addArray(selfArray);
                        self.mergeByRule(utxos, persistOpts.getMergeRule());
                        data = self.getAllUTXOStrings();
                    }
                }
                this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
            }
            if (data.length > 0 && data[0].substring(0, 2) === "0x") {
                const cb58Strs = [];
                data.forEach((str) => {
                    cb58Strs.push(bintools.cb58Encode(new buffer_1.Buffer(str.slice(2), "hex")));
                });
                utxos.addArray(cb58Strs, false);
            }
            else {
                utxos.addArray(data, false);
            }
            response.data.result.utxos = utxos;
            response.data.result.numFetched = parseInt(response.data.result.numFetched);
            return response.data.result;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, ownerAddresses, sourceChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, "buildImportTx").map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, "buildImportTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildImportTx").map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildImportTx: Invalid destinationChain type: " +
                    typeof sourceChain);
            }
            const atomicUTXOs = yield (yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined)).utxos;
            const juneAssetID = yield this.getJUNEAssetID();
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const atomics = atomicUTXOs.getAllUTXOs();
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), juneAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            let prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_1.AddressError("Error - PlatformVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildExportTx: Invalid destinationChain type: " +
                    typeof destinationChain);
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            /*
            if(bintools.cb58Encode(destinationChain) !== Defaults.network[this.core.getNetworkID()].X["blockchainID"]) {
              throw new Error("Error - PlatformVMAPI.buildExportTx: Destination ChainID must The X-Chain ID in the current version of JuneoJS.")
            }*/
            let to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const from = this._cleanAddressArray(fromAddresses, "buildExportTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildExportTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const juneAssetID = yield this.getJUNEAssetID();
            const builtUnsignedTx = utxoset.buildExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, juneAssetID, to, from, change, destinationChain, this.getTxFee(), juneAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddSubnetValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddSubnetValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on.
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in JUNE
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
         * @param weight The amount of weight for this subnet validator.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddSubnetValidatorTx = (utxoset, fromAddresses, changeAddresses, nodeID, startTime, endTime, weight, subnetID, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), subnetAuthCredentials = []) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildAddSubnetValidatorTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildAddSubnetValidatorTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const juneAssetID = yield this.getJUNEAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("PlatformVMAPI.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddSubnetValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, weight, subnetID, this.getDefaultTxFee(), juneAssetID, memo, asOf, subnetAuthCredentials);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddDelegatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddDelegatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in JUNE
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
         * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
         * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
         * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddDelegatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, rewardLocktime = new bn_js_1.default(0), rewardThreshold = 1, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, "buildAddDelegatorTx").map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, "buildAddDelegatorTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildAddDelegatorTx").map((a) => bintools.stringToAddress(a));
            const rewards = this._cleanAddressArray(rewardAddresses, "buildAddDelegatorTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minDelegatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_1.StakeError("PlatformVMAPI.buildAddDelegatorTx -- stake amount must be at least " +
                    minStake.toString(10));
            }
            const juneAssetID = yield this.getJUNEAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("PlatformVMAPI.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddDelegatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), juneAssetID, to, from, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, new bn_js_1.default(0), juneAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in JUNE
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked JUNE is returned).
         * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
         * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
         * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
         * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddValidatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, delegationFee, rewardLocktime = new bn_js_1.default(0), rewardThreshold = 1, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            const rewards = this._cleanAddressArray(rewardAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minValidatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_1.StakeError("PlatformVMAPI.buildAddValidatorTx -- stake amount must be at least " +
                    minStake.toString(10));
            }
            if (typeof delegationFee !== "number" ||
                delegationFee > 100 ||
                delegationFee < 0) {
                throw new errors_1.DelegationFeeError("PlatformVMAPI.buildAddValidatorTx -- delegationFee must be a number between 0 and 100");
            }
            const juneAssetID = yield this.getJUNEAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("PlatformVMAPI.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), juneAssetID, to, from, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, delegationFee, new bn_js_1.default(0), juneAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Class representing an unsigned [[CreateSubnetTx]] transaction.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param subnetOwnerAddresses An array of addresses for owners of the new subnet
         * @param subnetOwnerThreshold A number indicating the amount of signatures required to add validators to a subnet
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateSubnetTx = (utxoset, fromAddresses, changeAddresses, subnetOwnerAddresses, subnetOwnerThreshold, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildCreateSubnetTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildCreateSubnetTx").map((a) => bintools.stringToAddress(a));
            const owners = this._cleanAddressArray(subnetOwnerAddresses, "buildCreateSubnetTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const juneAssetID = yield this.getJUNEAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getCreateSubnetTxFee();
            const builtUnsignedTx = utxoset.buildCreateSubnetTx(networkID, blockchainID, from, change, owners, subnetOwnerThreshold, fee, juneAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[CreateChainTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param subnetID Optional ID of the Subnet that validates this blockchain
         * @param chainName Optional A human readable name for the chain; need not be unique
         * @param vmID Optional ID of the VM running on the new chain
         * @param fxIDs Optional IDs of the feature extensions running on the new chain
         * @param genesisData Optional Byte representation of genesis state of the new chain
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
         * @param chainAssetID Optional ID of the ChainAssetID that is used to pay fees in this blockchain (defaults to JUNE if empty)
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateChainTx = (utxoset, fromAddresses, changeAddresses, subnetID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), subnetAuthCredentials = [], chainAssetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildCreateChainTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildCreateChainTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const juneAssetID = yield this.getJUNEAssetID();
            fxIDs = fxIDs.sort();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getCreateChainTxFee();
            const builtUnsignedTx = utxoset.buildCreateChainTx(networkID, blockchainID, from, change, subnetID, chainName, vmID, fxIDs, genesisData, fee, juneAssetID, memo, asOf, subnetAuthCredentials, chainAssetID);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * @returns the current timestamp on chain.
         */
        this.getTimestamp = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getTimestamp");
            return response.data.result.timestamp;
        });
        /**
         * @returns the UTXOs that were rewarded after the provided transaction"s staking or delegation period ended.
         */
        this.getRewardUTXOs = (txID, encoding) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("platform.getRewardUTXOs", params);
            return response.data.result;
        });
        this.blockchainID = constants_1.PlatformChainID;
        const netID = core.getNetworkID();
        if (netID in constants_1.Defaults.network &&
            this.blockchainID in constants_1.Defaults.network[`${netID}`]) {
            const alias = constants_1.Defaults.network[`${netID}`][this.blockchainID]["alias"];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
        }
    }
    /**
     * @ignore
     */
    _cleanAddressArray(addresses, caller) {
        const addrs = [];
        const chainid = this.getBlockchainAlias()
            ? this.getBlockchainAlias()
            : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    if (typeof this.parseAddress(addresses[`${i}`]) ===
                        "undefined") {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - Invalid address format");
                    }
                    addrs.push(addresses[`${i}`]);
                }
                else {
                    const bech32 = "bech32";
                    addrs.push(serialization.bufferToType(addresses[`${i}`], bech32, this.core.getHRP(), chainid));
                }
            }
        }
        return addrs;
    }
}
exports.PlatformVMAPI = PlatformVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUV0QixrREFBOEM7QUFPOUMsb0VBQTJDO0FBQzNDLHlDQUFxQztBQUNyQyxxREFBMEU7QUFDMUUsMkNBQWlEO0FBQ2pELDZCQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsaUVBQTJFO0FBQzNFLCtDQUFtRDtBQUVuRCwrQ0FTMkI7QUErQjNCLHVDQUE4QztBQUM5Qyx1Q0FBMkQ7QUFJM0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQixxQkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNILE1BQWEsYUFBYyxTQUFRLGlCQUFPO0lBbTJEeEM7Ozs7OztPQU1HO0lBQ0gsWUFBWSxJQUFlLEVBQUUsVUFBa0IsV0FBVztRQUN4RCxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBMTJEdEI7O1dBRUc7UUFDTyxhQUFRLEdBQWEsSUFBSSxtQkFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUV6QyxpQkFBWSxHQUFXLDJCQUFlLENBQUE7UUFFdEMsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFFbkMsZ0JBQVcsR0FBVyxTQUFTLENBQUE7UUFFL0IsVUFBSyxHQUFPLFNBQVMsQ0FBQTtRQUVyQixrQkFBYSxHQUFPLFNBQVMsQ0FBQTtRQUU3QixzQkFBaUIsR0FBTyxTQUFTLENBQUE7UUFFakMsc0JBQWlCLEdBQU8sU0FBUyxDQUFBO1FBRTNDOzs7O1dBSUc7UUFDSCx1QkFBa0IsR0FBRyxHQUFXLEVBQUU7WUFDaEMsSUFBSSxPQUFPLElBQUksQ0FBQyxlQUFl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O1lBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDMUIsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2pELElBQUksT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFFBQVEsRUFBRTtvQkFDekMsSUFDRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsQ0FBQzt3QkFDckQsV0FBVyxFQUNYO3dCQUNBLDBCQUEwQjt3QkFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQUMsZ0NBQWdDLENBQUMsQ0FBQTtxQkFDekQ7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUE7aUJBQ3hDO3FCQUFNO29CQUNMLE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7b0JBQ3ZDLEtBQUssQ0FBQyxJQUFJLENBQ1IsYUFBYSxDQUFDLFlBQVksQ0FDeEIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsRUFDM0IsTUFBTSxFQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ2xCLE9BQU8sQ0FDUixDQUNGLENBQUE7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBb0RGO0FBcjVERCxzQ0FxNURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNXHJcbiAqL1xyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxyXG5pbXBvcnQgSnVuZW9Db3JlIGZyb20gXCIuLi8uLi9qdW5lb1wiXHJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxyXG5pbXBvcnQgeyBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGliYXNlXCJcclxuaW1wb3J0IHtcclxuICBFcnJvclJlc3BvbnNlT2JqZWN0LFxyXG4gIFN1Ym5ldE93bmVyRXJyb3IsXHJcbiAgU3VibmV0VGhyZXNob2xkRXJyb3JcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxyXG5pbXBvcnQgeyBEZWZhdWx0cywgUGxhdGZvcm1DaGFpbklELCBPTkVKVU5FIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBVbnNpZ25lZFR4LCBUeCB9IGZyb20gXCIuL3R4XCJcclxuaW1wb3J0IHsgUGF5bG9hZEJhc2UgfSBmcm9tIFwiLi4vLi4vdXRpbHMvcGF5bG9hZFwiXHJcbmltcG9ydCB7IFVuaXhOb3csIE5vZGVJRFN0cmluZ1RvQnVmZmVyIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXHJcbmltcG9ydCB7IFVUWE8sIFVUWE9TZXQgfSBmcm9tIFwiLi4vcGxhdGZvcm12bS91dHhvc1wiXHJcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gXCIuLi8uLi91dGlscy9wZXJzaXN0ZW5jZW9wdGlvbnNcIlxyXG5pbXBvcnQge1xyXG4gIEFkZHJlc3NFcnJvcixcclxuICBUcmFuc2FjdGlvbkVycm9yLFxyXG4gIENoYWluSWRFcnJvcixcclxuICBHb29zZUVnZ0NoZWNrRXJyb3IsXHJcbiAgVGltZUVycm9yLFxyXG4gIFN0YWtlRXJyb3IsXHJcbiAgRGVsZWdhdGlvbkZlZUVycm9yLFxyXG4gIENoYWluQXNzZXRJZEVycm9yXHJcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcbmltcG9ydCB7XHJcbiAgR2V0Q3VycmVudFZhbGlkYXRvcnNQYXJhbXMsXHJcbiAgR2V0UGVuZGluZ1ZhbGlkYXRvcnNQYXJhbXMsXHJcbiAgR2V0UmV3YXJkVVRYT3NQYXJhbXMsXHJcbiAgR2V0UmV3YXJkVVRYT3NSZXNwb25zZSxcclxuICBHZXRTdGFrZVBhcmFtcyxcclxuICBHZXRTdGFrZVJlc3BvbnNlLFxyXG4gIFN1Ym5ldCxcclxuICBHZXRWYWxpZGF0b3JzQXRQYXJhbXMsXHJcbiAgR2V0VmFsaWRhdG9yc0F0UmVzcG9uc2UsXHJcbiAgQ3JlYXRlQWRkcmVzc1BhcmFtcyxcclxuICBHZXRVVFhPc1BhcmFtcyxcclxuICBHZXRCYWxhbmNlUmVzcG9uc2UsXHJcbiAgR2V0VVRYT3NSZXNwb25zZSxcclxuICBMaXN0QWRkcmVzc2VzUGFyYW1zLFxyXG4gIFNhbXBsZVZhbGlkYXRvcnNQYXJhbXMsXHJcbiAgQWRkVmFsaWRhdG9yUGFyYW1zLFxyXG4gIEFkZERlbGVnYXRvclBhcmFtcyxcclxuICBDcmVhdGVTdWJuZXRQYXJhbXMsXHJcbiAgRXhwb3J0SlVORVBhcmFtcyxcclxuICBFeHBvcnRLZXlQYXJhbXMsXHJcbiAgSW1wb3J0S2V5UGFyYW1zLFxyXG4gIEltcG9ydEpVTkVQYXJhbXMsXHJcbiAgQ3JlYXRlQmxvY2tjaGFpblBhcmFtcyxcclxuICBCbG9ja2NoYWluLFxyXG4gIEdldFR4U3RhdHVzUGFyYW1zLFxyXG4gIEdldFR4U3RhdHVzUmVzcG9uc2UsXHJcbiAgR2V0TWluU3Rha2VSZXNwb25zZSxcclxuICBHZXRNYXhTdGFrZUFtb3VudFBhcmFtc1xyXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxyXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcclxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZFR5cGUgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIlxyXG5pbXBvcnQgeyBTdWJuZXRBdXRoIH0gZnJvbSBcIi5cIlxyXG5pbXBvcnQgeyBHZW5lc2lzRGF0YSB9IGZyb20gXCIuLi9qdm1cIlxyXG5cclxuLyoqXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcclxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxyXG5cclxuLyoqXHJcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIFBsYXRmb3JtVk1BUElcclxuICpcclxuICogQGNhdGVnb3J5IFJQQ0FQSXNcclxuICpcclxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0p1bmVvLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggSnVuZW8uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1WTUFQSSBleHRlbmRzIEpSUENBUEkge1xyXG4gIC8qKlxyXG4gICAqIEBpZ25vcmVcclxuICAgKi9cclxuICBwcm90ZWN0ZWQga2V5Y2hhaW46IEtleUNoYWluID0gbmV3IEtleUNoYWluKFwiXCIsIFwiXCIpXHJcblxyXG4gIHByb3RlY3RlZCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IFBsYXRmb3JtQ2hhaW5JRFxyXG5cclxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOiBzdHJpbmcgPSB1bmRlZmluZWRcclxuXHJcbiAgcHJvdGVjdGVkIEpVTkVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWRcclxuXHJcbiAgcHJvdGVjdGVkIHR4RmVlOiBCTiA9IHVuZGVmaW5lZFxyXG5cclxuICBwcm90ZWN0ZWQgY3JlYXRpb25UeEZlZTogQk4gPSB1bmRlZmluZWRcclxuXHJcbiAgcHJvdGVjdGVkIG1pblZhbGlkYXRvclN0YWtlOiBCTiA9IHVuZGVmaW5lZFxyXG5cclxuICBwcm90ZWN0ZWQgbWluRGVsZWdhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgYHVuZGVmaW5lZGAuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcclxuICAgKi9cclxuICBnZXRCbG9ja2NoYWluQWxpYXMgPSAoKTogc3RyaW5nID0+IHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5ibG9ja2NoYWluQWxpYXMgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgY29uc3QgbmV0aWQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgbmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxyXG4gICAgICAgIHRoaXMuYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0aWR9YF1cclxuICAgICAgKSB7XHJcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPVxyXG4gICAgICAgICAgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXVt0aGlzLmJsb2NrY2hhaW5JRF1bXCJhbGlhc1wiXVxyXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGFsaWFzIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cclxuICAgKlxyXG4gICAqL1xyXG4gIHNldEJsb2NrY2hhaW5BbGlhcyA9IChhbGlhczogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuICAgIHRoaXMuYmxvY2tjaGFpbkFsaWFzID0gYWxpYXNcclxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBibG9ja2NoYWluSUQgYW5kIHJldHVybnMgaXQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXHJcbiAgICovXHJcbiAgZ2V0QmxvY2tjaGFpbklEID0gKCk6IHN0cmluZyA9PiB0aGlzLmJsb2NrY2hhaW5JRFxyXG5cclxuICAvKipcclxuICAgKiBSZWZyZXNoIGJsb2NrY2hhaW5JRCwgYW5kIGlmIGEgYmxvY2tjaGFpbklEIGlzIHBhc3NlZCBpbiwgdXNlIHRoYXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gT3B0aW9uYWwuIEJsb2NrY2hhaW5JRCB0byBhc3NpZ24sIGlmIG5vbmUsIHVzZXMgdGhlIGRlZmF1bHQgYmFzZWQgb24gbmV0d29ya0lELlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxyXG4gICAqL1xyXG4gIHJlZnJlc2hCbG9ja2NoYWluSUQgPSAoYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB1bmRlZmluZWQpOiBib29sZWFuID0+IHtcclxuICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcclxuICAgIGlmIChcclxuICAgICAgdHlwZW9mIGJsb2NrY2hhaW5JRCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICB0eXBlb2YgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEID0gUGxhdGZvcm1DaGFpbklEIC8vZGVmYXVsdCB0byBQLUNoYWluXHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGJsb2NrY2hhaW5JRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cclxuICAgKi9cclxuICBwYXJzZUFkZHJlc3MgPSAoYWRkcjogc3RyaW5nKTogQnVmZmVyID0+IHtcclxuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXHJcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcclxuICAgIHJldHVybiBiaW50b29scy5wYXJzZUFkZHJlc3MoXHJcbiAgICAgIGFkZHIsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgYWxpYXMsXHJcbiAgICAgIFBsYXRmb3JtVk1Db25zdGFudHMuQUREUkVTU0xFTkdUSFxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczogQnVmZmVyKTogc3RyaW5nID0+IHtcclxuICAgIGNvbnN0IGNoYWluaWQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcclxuICAgICAgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXHJcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxyXG4gICAgY29uc3QgdHlwZTogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXHJcbiAgICByZXR1cm4gc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUoXHJcbiAgICAgIGFkZHJlc3MsXHJcbiAgICAgIHR5cGUsXHJcbiAgICAgIHRoaXMuY29yZS5nZXRIUlAoKSxcclxuICAgICAgY2hhaW5pZFxyXG4gICAgKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2hlcyB0aGUgSlVORSBBc3NldElEIGFuZCByZXR1cm5zIGl0IGluIGEgUHJvbWlzZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgSlVORSBBc3NldElEXHJcbiAgICovXHJcbiAgZ2V0SlVORUFzc2V0SUQgPSBhc3luYyAocmVmcmVzaDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxCdWZmZXI+ID0+IHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy5KVU5FQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIiB8fCByZWZyZXNoKSB7XHJcbiAgICAgIGNvbnN0IGFzc2V0SUQ6IHN0cmluZyA9IGF3YWl0IHRoaXMuZ2V0U3Rha2luZ0Fzc2V0SUQoKVxyXG4gICAgICB0aGlzLkpVTkVBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuSlVORUFzc2V0SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIE92ZXJyaWRlcyB0aGUgZGVmYXVsdHMgYW5kIHNldHMgdGhlIGNhY2hlIHRvIGEgc3BlY2lmaWMgSlVORSBBc3NldElEXHJcbiAgICpcclxuICAgKiBAcGFyYW0ganVuZUFzc2V0SUQgQSBjYjU4IHN0cmluZyBvciBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBKVU5FIEFzc2V0SURcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgSlVORSBBc3NldElEXHJcbiAgICovXHJcbiAgc2V0SlVORUFzc2V0SUQgPSAoanVuZUFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBqdW5lQXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBqdW5lQXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoanVuZUFzc2V0SUQpXHJcbiAgICB9XHJcbiAgICB0aGlzLkpVTkVBc3NldElEID0ganVuZUFzc2V0SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBnZXREZWZhdWx0VHhGZWUgPSAoKTogQk4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSBpbiBEZWZhdWx0cy5uZXR3b3JrXHJcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlBcIl1bXCJ0eEZlZVwiXSlcclxuICAgICAgOiBuZXcgQk4oMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGdldFR4RmVlID0gKCk6IEJOID0+IHtcclxuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aGlzLnR4RmVlID0gdGhpcy5nZXREZWZhdWx0VHhGZWUoKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMudHhGZWVcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIENyZWF0ZVN1Ym5ldFR4IGZlZS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVTdWJuZXRUeCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGdldENyZWF0ZVN1Ym5ldFR4RmVlID0gKCk6IEJOID0+IHtcclxuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xyXG4gICAgICA/IG5ldyBCTihcclxuICAgICAgICAgIERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlBcIl1bXCJjcmVhdGVTdWJuZXRUeFwiXVxyXG4gICAgICAgIClcclxuICAgICAgOiBuZXcgQk4oMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIENyZWF0ZUNoYWluVHggZmVlLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgVGhlIENyZWF0ZUNoYWluVHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKi9cclxuICBnZXRDcmVhdGVDaGFpblR4RmVlID0gKCk6IEJOID0+IHtcclxuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xyXG4gICAgICA/IG5ldyBCTihEZWZhdWx0cy5uZXR3b3JrW3RoaXMuY29yZS5nZXROZXR3b3JrSUQoKV1bXCJQXCJdW1wiY3JlYXRlQ2hhaW5UeFwiXSlcclxuICAgICAgOiBuZXcgQk4oMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBmZWUgVGhlIHR4IGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICovXHJcbiAgc2V0VHhGZWUgPSAoZmVlOiBCTikgPT4ge1xyXG4gICAgdGhpcy50eEZlZSA9IGZlZVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGdldERlZmF1bHRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcclxuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xyXG4gICAgICA/IG5ldyBCTihEZWZhdWx0cy5uZXR3b3JrW3RoaXMuY29yZS5nZXROZXR3b3JrSUQoKV1bXCJQXCJdW1wiY3JlYXRpb25UeEZlZVwiXSlcclxuICAgICAgOiBuZXcgQk4oMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIGdldENyZWF0aW9uVHhGZWUgPSAoKTogQk4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLmNyZWF0aW9uVHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5jcmVhdGlvblR4RmVlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gZmVlIFRoZSBjcmVhdGlvbiBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqL1xyXG4gIHNldENyZWF0aW9uVHhGZWUgPSAoZmVlOiBCTikgPT4ge1xyXG4gICAgdGhpcy5jcmVhdGlvblR4RmVlID0gZmVlXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIGEgcmVmZXJlbmNlIHRvIHRoZSBrZXljaGFpbiBmb3IgdGhpcyBjbGFzcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBbW11dIGZvciB0aGlzIGNsYXNzXHJcbiAgICovXHJcbiAga2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4gdGhpcy5rZXljaGFpblxyXG5cclxuICAvKipcclxuICAgKiBAaWdub3JlXHJcbiAgICovXHJcbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xyXG4gICAgLy8gd2FybmluZywgb3ZlcndyaXRlcyB0aGUgb2xkIGtleWNoYWluXHJcbiAgICBjb25zdCBhbGlhcyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcclxuICAgIGlmIChhbGlhcykge1xyXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5rZXljaGFpblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHggQW4gVW5zaWduZWRUeFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgYm9vbGVhbiB0cnVlIGlmIHBhc3NlcyBnb29zZSBlZ2cgdGVzdCBhbmQgZmFsc2UgaWYgZmFpbHMuXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIEEgXCJHb29zZSBFZ2cgVHJhbnNhY3Rpb25cIiBpcyB3aGVuIHRoZSBmZWUgZmFyIGV4Y2VlZHMgYSByZWFzb25hYmxlIGFtb3VudFxyXG4gICAqL1xyXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAoXHJcbiAgICB1dHg6IFVuc2lnbmVkVHgsXHJcbiAgICBvdXRUb3RhbDogQk4gPSBuZXcgQk4oMClcclxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgIGNvbnN0IGp1bmVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEpVTkVBc3NldElEKClcclxuICAgIGxldCBvdXRwdXRUb3RhbDogQk4gPSBvdXRUb3RhbC5ndChuZXcgQk4oMCkpXHJcbiAgICAgID8gb3V0VG90YWxcclxuICAgICAgOiB1dHguZ2V0T3V0cHV0VG90YWwoanVuZUFzc2V0SUQpXHJcbiAgICBjb25zdCBmZWU6IEJOID0gdXR4LmdldEJ1cm4oanVuZUFzc2V0SUQpXHJcbiAgICBpZiAoZmVlLmx0ZShPTkVKVU5FLm11bChuZXcgQk4oMTApKSkgfHwgZmVlLmx0ZShvdXRwdXRUb3RhbCkpIHtcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0cmlldmVzIGFuIGFzc2V0SUQgZm9yIGEgc3VibmV0XCJzIHN0YWtpbmcgYXNzc2V0LlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIHdpdGggY2I1OCBlbmNvZGVkIHZhbHVlIG9mIHRoZSBhc3NldElELlxyXG4gICAqL1xyXG4gIGdldFN0YWtpbmdBc3NldElEID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRTdGFraW5nQXNzZXRJRFwiXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBibG9ja2NoYWluLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcclxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXHJcbiAgICogQHBhcmFtIHZtSUQgVGhlIElEIG9mIHRoZSBWaXJ0dWFsIE1hY2hpbmUgdGhlIGJsb2NrY2hhaW4gcnVucy4gQ2FuIGFsc28gYmUgYW4gYWxpYXMgb2YgdGhlIFZpcnR1YWwgTWFjaGluZS5cclxuICAgKiBAcGFyYW0gZnhJRHMgVGhlIGlkcyBvZiB0aGUgRlhzIHRoZSBWTSBpcyBydW5uaW5nLlxyXG4gICAqIEBwYXJhbSBuYW1lIEEgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG5ldyBibG9ja2NoYWluXHJcbiAgICogQHBhcmFtIGdlbmVzaXMgVGhlIGJhc2UgNTggKHdpdGggY2hlY2tzdW0pIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnZW5lc2lzIHN0YXRlIG9mIHRoZSBuZXcgYmxvY2tjaGFpbi4gVmlydHVhbCBNYWNoaW5lcyBzaG91bGQgaGF2ZSBhIHN0YXRpYyBBUEkgbWV0aG9kIG5hbWVkIGJ1aWxkR2VuZXNpcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGdlbmVzaXNEYXRhLlxyXG4gICAqIEBwYXJhbSBjaGFpbkFzc2V0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBjaGFpbkFzc2V0SUQgb3IgaXRzIGFsaWFzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSB0aGlzIGJsb2NrY2hhaW4uIE11c3QgYmUgc2lnbmVkIGJ5IGEgc3VmZmljaWVudCBudW1iZXIgb2YgdGhlIFN1Ym5ldOKAmXMgY29udHJvbCBrZXlzIGFuZCBieSB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZS5cclxuICAgKi9cclxuICBjcmVhdGVCbG9ja2NoYWluID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgdm1JRDogc3RyaW5nLFxyXG4gICAgZnhJRHM6IG51bWJlcltdLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgZ2VuZXNpczogc3RyaW5nLFxyXG4gICAgY2hhaW5Bc3NldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWRcclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVCbG9ja2NoYWluUGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIGZ4SURzLFxyXG4gICAgICB2bUlELFxyXG4gICAgICBuYW1lLFxyXG4gICAgICBnZW5lc2lzRGF0YTogZ2VuZXNpc1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgY2hhaW5Bc3NldElEID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHBhcmFtcy5jaGFpbkFzc2V0SUQgPSBjaGFpbkFzc2V0SURcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGNoYWluQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBwYXJhbXMuY2hhaW5Bc3NldElEID0gYmludG9vbHMuY2I1OEVuY29kZShjaGFpbkFzc2V0SUQpXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5jcmVhdGVCbG9ja2NoYWluXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIHN0YXR1cyBvZiBhIGJsb2NrY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSBibG9ja2NoYWluSUQgcmVxdWVzdGluZyBhIHN0YXR1cyB1cGRhdGVcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIG9uZSBvZjogXCJWYWxpZGF0aW5nXCIsIFwiQ3JlYXRlZFwiLCBcIlByZWZlcnJlZFwiLCBcIlVua25vd25cIi5cclxuICAgKi9cclxuICBnZXRCbG9ja2NoYWluU3RhdHVzID0gYXN5bmMgKGJsb2NrY2hhaW5JRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xyXG4gICAgICBibG9ja2NoYWluSURcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmdldEJsb2NrY2hhaW5TdGF0dXNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIHZhbGlkYXRvcnMgYW5kIHRoZWlyIHdlaWdodHMgb2YgYSBzdWJuZXQgb3IgdGhlIFByaW1hcnkgTmV0d29yayBhdCBhIGdpdmVuIFAtQ2hhaW4gaGVpZ2h0LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIGhlaWdodCBUaGUgUC1DaGFpbiBoZWlnaHQgdG8gZ2V0IHRoZSB2YWxpZGF0b3Igc2V0IGF0LlxyXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gQSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBHZXRWYWxpZGF0b3JzQXRSZXNwb25zZVxyXG4gICAqL1xyXG4gIGdldFZhbGlkYXRvcnNBdCA9IGFzeW5jIChcclxuICAgIGhlaWdodDogbnVtYmVyLFxyXG4gICAgc3VibmV0SUQ/OiBzdHJpbmdcclxuICApOiBQcm9taXNlPEdldFZhbGlkYXRvcnNBdFJlc3BvbnNlPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEdldFZhbGlkYXRvcnNBdFBhcmFtcyA9IHtcclxuICAgICAgaGVpZ2h0XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRWYWxpZGF0b3JzQXRcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhbiBhZGRyZXNzIGluIHRoZSBub2RlJ3Mga2V5c3RvcmUuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYWNjb3VudCBhZGRyZXNzLlxyXG4gICAqL1xyXG4gIGNyZWF0ZUFkZHJlc3MgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZUFkZHJlc3NQYXJhbXMgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZFxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uY3JlYXRlQWRkcmVzc1wiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBiYWxhbmNlIG9mIGEgcGFydGljdWxhciBhc3NldC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIHB1bGwgdGhlIGFzc2V0IGJhbGFuY2UgZnJvbVxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MuXHJcbiAgICovXHJcbiAgZ2V0QmFsYW5jZSA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPEdldEJhbGFuY2VSZXNwb25zZT4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcclxuICAgICAgYWRkcmVzc1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uZ2V0QmFsYW5jZVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlzdCB0aGUgYWRkcmVzc2VzIGNvbnRyb2xsZWQgYnkgdGhlIHVzZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxyXG4gICAqL1xyXG4gIGxpc3RBZGRyZXNzZXMgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogTGlzdEFkZHJlc3Nlc1BhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5saXN0QWRkcmVzc2VzXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3Nlc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlzdHMgdGhlIHNldCBvZiBjdXJyZW50IHZhbGlkYXRvcnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuXHJcbiAgICogY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cclxuICAgKiBAcGFyYW0gbm9kZUlEcyBPcHRpb25hbC4gQW4gYXJyYXkgb2Ygc3RyaW5nc1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyB0aGF0IGFyZSBjdXJyZW50bHkgc3Rha2luZywgc2VlOiB7QGxpbmsgaHR0cHM6Ly9kb2NzLmp1bmUubmV0d29yay92MS4wL2VuL2FwaS9wbGF0Zm9ybS8jcGxhdGZvcm1nZXRjdXJyZW50dmFsaWRhdG9yc3xwbGF0Zm9ybS5nZXRDdXJyZW50VmFsaWRhdG9ycyBkb2N1bWVudGF0aW9ufS5cclxuICAgKlxyXG4gICAqL1xyXG4gIGdldEN1cnJlbnRWYWxpZGF0b3JzID0gYXN5bmMgKFxyXG4gICAgc3VibmV0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuICAgIG5vZGVJRHM6IHN0cmluZ1tdID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxvYmplY3Q+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogR2V0Q3VycmVudFZhbGlkYXRvcnNQYXJhbXMgPSB7fVxyXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2Ygbm9kZUlEcyAhPSBcInVuZGVmaW5lZFwiICYmIG5vZGVJRHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBwYXJhbXMubm9kZUlEcyA9IG5vZGVJRHNcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmdldEN1cnJlbnRWYWxpZGF0b3JzXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaXN0cyB0aGUgc2V0IG9mIHBlbmRpbmcgdmFsaWRhdG9ycy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBvciBhIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXHJcbiAgICogQHBhcmFtIG5vZGVJRHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIHN0cmluZ3NcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIHZhbGlkYXRvcnMgdGhhdCBhcmUgcGVuZGluZyBzdGFraW5nLCBzZWU6IHtAbGluayBodHRwczovL2RvY3MuanVuZS5uZXR3b3JrL3YxLjAvZW4vYXBpL3BsYXRmb3JtLyNwbGF0Zm9ybWdldHBlbmRpbmd2YWxpZGF0b3JzfHBsYXRmb3JtLmdldFBlbmRpbmdWYWxpZGF0b3JzIGRvY3VtZW50YXRpb259LlxyXG4gICAqXHJcbiAgICovXHJcbiAgZ2V0UGVuZGluZ1ZhbGlkYXRvcnMgPSBhc3luYyAoXHJcbiAgICBzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxyXG4gICAgbm9kZUlEczogc3RyaW5nW10gPSB1bmRlZmluZWRcclxuICApOiBQcm9taXNlPG9iamVjdD4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRQZW5kaW5nVmFsaWRhdG9yc1BhcmFtcyA9IHt9XHJcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBub2RlSURzICE9IFwidW5kZWZpbmVkXCIgJiYgbm9kZUlEcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHBhcmFtcy5ub2RlSURzID0gbm9kZUlEc1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmdldFBlbmRpbmdWYWxpZGF0b3JzXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBTYW1wbGVzIGBTaXplYCB2YWxpZGF0b3JzIGZyb20gdGhlIGN1cnJlbnQgdmFsaWRhdG9yIHNldC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzYW1wbGVTaXplIE9mIHRoZSB0b3RhbCB1bml2ZXJzZSBvZiB2YWxpZGF0b3JzLCBzZWxlY3QgdGhpcyBtYW55IGF0IHJhbmRvbVxyXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW5cclxuICAgKiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9yXCJzIHN0YWtpbmdJRHMuXHJcbiAgICovXHJcbiAgc2FtcGxlVmFsaWRhdG9ycyA9IGFzeW5jIChcclxuICAgIHNhbXBsZVNpemU6IG51bWJlcixcclxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWRcclxuICApOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IFNhbXBsZVZhbGlkYXRvcnNQYXJhbXMgPSB7XHJcbiAgICAgIHNpemU6IHNhbXBsZVNpemUudG9TdHJpbmcoKVxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLnNhbXBsZVZhbGlkYXRvcnNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudmFsaWRhdG9yc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgdmFsaWRhdG9yIHRvIHRoZSBQcmltYXJ5IE5ldHdvcmsuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvclxyXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIHN0YXJ0IHRpbWUgdG8gdmFsaWRhdGVcclxuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgZW5kIHRpbWUgdG8gdmFsaWRhdGVcclxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBvZiBuSlVORSB0aGUgdmFsaWRhdG9yIGlzIHN0YWtpbmcgYXNcclxuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3MgVGhlIGFkZHJlc3MgdGhlIHZhbGlkYXRvciByZXdhcmQgd2lsbCBnbyB0bywgaWYgdGhlcmUgaXMgb25lLlxyXG4gICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlUmF0ZSBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHBlcmNlbnQgZmVlIHRoaXMgdmFsaWRhdG9yXHJcbiAgICogY2hhcmdlcyB3aGVuIG90aGVycyBkZWxlZ2F0ZSBzdGFrZSB0byB0aGVtLiBVcCB0byA0IGRlY2ltYWwgcGxhY2VzIGFsbG93ZWQgYWRkaXRpb25hbCBkZWNpbWFsIHBsYWNlcyBhcmUgaWdub3JlZC5cclxuICAgKiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLCBpbmNsdXNpdmUuIEZvciBleGFtcGxlLCBpZiBkZWxlZ2F0aW9uRmVlUmF0ZSBpcyAxLjIzNDUgYW5kIHNvbWVvbmUgZGVsZWdhdGVzIHRvIHRoaXNcclxuICAgKiB2YWxpZGF0b3IsIHRoZW4gd2hlbiB0aGUgZGVsZWdhdGlvbiBwZXJpb2QgaXMgb3ZlciwgMS4yMzQ1JSBvZiB0aGUgcmV3YXJkIGdvZXMgdG8gdGhlIHZhbGlkYXRvciBhbmQgdGhlIHJlc3QgZ29lc1xyXG4gICAqIHRvIHRoZSBkZWxlZ2F0b3IuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJhc2U1OCBzdHJpbmcgb2YgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uLlxyXG4gICAqL1xyXG4gIGFkZFZhbGlkYXRvciA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgbm9kZUlEOiBzdHJpbmcsXHJcbiAgICBzdGFydFRpbWU6IERhdGUsXHJcbiAgICBlbmRUaW1lOiBEYXRlLFxyXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxyXG4gICAgcmV3YXJkQWRkcmVzczogc3RyaW5nLFxyXG4gICAgZGVsZWdhdGlvbkZlZVJhdGU6IEJOID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQWRkVmFsaWRhdG9yUGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIG5vZGVJRCxcclxuICAgICAgc3RhcnRUaW1lOiBzdGFydFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcclxuICAgICAgZW5kVGltZTogZW5kVGltZS5nZXRUaW1lKCkgLyAxMDAwLFxyXG4gICAgICBzdGFrZUFtb3VudDogc3Rha2VBbW91bnQudG9TdHJpbmcoMTApLFxyXG4gICAgICByZXdhcmRBZGRyZXNzXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIGRlbGVnYXRpb25GZWVSYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtcy5kZWxlZ2F0aW9uRmVlUmF0ZSA9IGRlbGVnYXRpb25GZWVSYXRlLnRvU3RyaW5nKDEwKVxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uYWRkVmFsaWRhdG9yXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZCBhIHZhbGlkYXRvciB0byBhIFN1Ym5ldCBvdGhlciB0aGFuIHRoZSBQcmltYXJ5IE5ldHdvcmsuIFRoZSB2YWxpZGF0b3IgbXVzdCB2YWxpZGF0ZSB0aGUgUHJpbWFyeSBOZXR3b3JrIGZvciB0aGUgZW50aXJlIGR1cmF0aW9uIHRoZXkgdmFsaWRhdGUgdGhpcyBTdWJuZXQuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvclxyXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXHJcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgc3RhcnQgdGltZSB0byB2YWxpZGF0ZVxyXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBlbmQgdGltZSB0byB2YWxpZGF0ZVxyXG4gICAqIEBwYXJhbSB3ZWlnaHQgVGhlIHZhbGlkYXRvcuKAmXMgd2VpZ2h0IHVzZWQgZm9yIHNhbXBsaW5nXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgc2lnbmVkICh1c2luZyBzaWduKSBieSB0aGUgcHJvcGVyIG51bWJlciBvZiB0aGUgU3VibmV04oCZcyBjb250cm9sIGtleXMgYW5kIGJ5IHRoZSBrZXkgb2YgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgYmVmb3JlIGl0IGNhbiBiZSBpc3N1ZWQuXHJcbiAgICovXHJcbiAgYWRkU3VibmV0VmFsaWRhdG9yID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBub2RlSUQ6IHN0cmluZyxcclxuICAgIHN1Ym5ldElEOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICBzdGFydFRpbWU6IERhdGUsXHJcbiAgICBlbmRUaW1lOiBEYXRlLFxyXG4gICAgd2VpZ2h0OiBudW1iZXJcclxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XHJcbiAgICAgIHVzZXJuYW1lLFxyXG4gICAgICBwYXNzd29yZCxcclxuICAgICAgbm9kZUlELFxyXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS5nZXRUaW1lKCkgLyAxMDAwLFxyXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXHJcbiAgICAgIHdlaWdodFxyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmFkZFN1Ym5ldFZhbGlkYXRvclwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGQgYSBkZWxlZ2F0b3IgdG8gdGhlIFByaW1hcnkgTmV0d29yay5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgZGVsZWdhdGVlXHJcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB3aGVuIHRoZSBkZWxlZ2F0b3Igc3RhcnRzIGRlbGVnYXRpbmdcclxuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB3aGVuIHRoZSBkZWxlZ2F0b3Igc3RhcnRzIGRlbGVnYXRpbmdcclxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBvZiBuSlVORSB0aGUgZGVsZWdhdG9yIGlzIHN0YWtpbmcgYXNcclxuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIHN0YWtlZCBKVU5FIGFuZCB2YWxpZGF0aW9uIHJld2FyZFxyXG4gICAqIChpZiBhcHBsaWNhYmxlKSBhcmUgc2VudCB0byBhdCBlbmRUaW1lXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JcInMgc3Rha2luZ0lEcy5cclxuICAgKi9cclxuICBhZGREZWxlZ2F0b3IgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIG5vZGVJRDogc3RyaW5nLFxyXG4gICAgc3RhcnRUaW1lOiBEYXRlLFxyXG4gICAgZW5kVGltZTogRGF0ZSxcclxuICAgIHN0YWtlQW1vdW50OiBCTixcclxuICAgIHJld2FyZEFkZHJlc3M6IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEFkZERlbGVnYXRvclBhcmFtcyA9IHtcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkLFxyXG4gICAgICBub2RlSUQsXHJcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXHJcbiAgICAgIGVuZFRpbWU6IGVuZFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcclxuICAgICAgc3Rha2VBbW91bnQ6IHN0YWtlQW1vdW50LnRvU3RyaW5nKDEwKSxcclxuICAgICAgcmV3YXJkQWRkcmVzc1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uYWRkRGVsZWdhdG9yXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBjcmVhdGUgYSBuZXcgU3VibmV0LiBUaGUgdW5zaWduZWQgdHJhbnNhY3Rpb24gbXVzdCBiZVxyXG4gICAqIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUuIFRoZSBTdWJuZXTigJlzIElEIGlzIHRoZSBJRCBvZiB0aGUgdHJhbnNhY3Rpb24gdGhhdCBjcmVhdGVzIGl0IChpZSB0aGUgcmVzcG9uc2UgZnJvbSBpc3N1ZVR4IHdoZW4gaXNzdWluZyB0aGUgc2lnbmVkIHRyYW5zYWN0aW9uKS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXHJcbiAgICogQHBhcmFtIGNvbnRyb2xLZXlzIEFycmF5IG9mIHBsYXRmb3JtIGFkZHJlc3NlcyBhcyBzdHJpbmdzXHJcbiAgICogQHBhcmFtIHRocmVzaG9sZCBUbyBhZGQgYSB2YWxpZGF0b3IgdG8gdGhpcyBTdWJuZXQsIGEgdHJhbnNhY3Rpb24gbXVzdCBoYXZlIHRocmVzaG9sZFxyXG4gICAqIHNpZ25hdHVyZXMsIHdoZXJlIGVhY2ggc2lnbmF0dXJlIGlzIGZyb20gYSBrZXkgd2hvc2UgYWRkcmVzcyBpcyBhbiBlbGVtZW50IG9mIGBjb250cm9sS2V5c2BcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIHdpdGggdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGVuY29kZWQgYXMgYmFzZTU4LlxyXG4gICAqL1xyXG4gIGNyZWF0ZVN1Ym5ldCA9IGFzeW5jIChcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXHJcbiAgICBwYXNzd29yZDogc3RyaW5nLFxyXG4gICAgY29udHJvbEtleXM6IHN0cmluZ1tdLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXJcclxuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlU3VibmV0UGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIGNvbnRyb2xLZXlzLFxyXG4gICAgICB0aHJlc2hvbGRcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmNyZWF0ZVN1Ym5ldFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlIFN1Ym5ldCB0aGF0IHZhbGlkYXRlcyBhIGdpdmVuIGJsb2NrY2hhaW4uXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgY2I1OFxyXG4gICAqIGVuY29kZWQgc3RyaW5nIGZvciB0aGUgYmxvY2tjaGFpbklEIG9yIGl0cyBhbGlhcy5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIHRoZSBzdWJuZXRJRCB0aGF0IHZhbGlkYXRlcyB0aGUgYmxvY2tjaGFpbi5cclxuICAgKi9cclxuICB2YWxpZGF0ZWRCeSA9IGFzeW5jIChibG9ja2NoYWluSUQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcclxuICAgICAgYmxvY2tjaGFpbklEXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS52YWxpZGF0ZWRCeVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWJuZXRJRFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBJRHMgb2YgdGhlIGJsb2NrY2hhaW5zIGEgU3VibmV0IHZhbGlkYXRlcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBKVU5FXHJcbiAgICogc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBibG9ja2NoYWluSURzIHRoZSBzdWJuZXQgdmFsaWRhdGVzLlxyXG4gICAqL1xyXG4gIHZhbGlkYXRlcyA9IGFzeW5jIChzdWJuZXRJRDogQnVmZmVyIHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XHJcbiAgICAgIHN1Ym5ldElEXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKVxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0udmFsaWRhdGVzXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJsb2NrY2hhaW5JRHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhbGwgdGhlIGJsb2NrY2hhaW5zIHRoYXQgZXhpc3QgKGV4Y2x1ZGluZyB0aGUgUC1DaGFpbikuXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgZmllbGRzIFwiaWRcIiwgXCJzdWJuZXRJRFwiLCBhbmQgXCJ2bUlEXCIuXHJcbiAgICovXHJcbiAgZ2V0QmxvY2tjaGFpbnMgPSBhc3luYyAoKTogUHJvbWlzZTxCbG9ja2NoYWluW10+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmdldEJsb2NrY2hhaW5zXCJcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5ibG9ja2NoYWluc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VuZCBKVU5FIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgUC1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBYLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXHJcbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEpVTkUgaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzIHRoZVxyXG4gICAqIHRyYW5zYWN0aW9uIGZlZS4gQWZ0ZXIgaXNzdWluZyB0aGlzIHRyYW5zYWN0aW9uLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZcyBpbXBvcnRKVU5FXHJcbiAgICogbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvbiB0aGUgWC1DaGFpbiB0byBzZW5kIHRoZSBKVU5FIHRvLiBEbyBub3QgaW5jbHVkZSBYLSBpbiB0aGUgYWRkcmVzc1xyXG4gICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIEpVTkUgdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGJlIHNpZ25lZCBieSB0aGUgYWNjb3VudCB0aGUgdGhlIEpVTkUgaXNcclxuICAgKiBzZW50IGZyb20gYW5kIHBheXMgdGhlIHRyYW5zYWN0aW9uIGZlZS5cclxuICAgKi9cclxuICBleHBvcnRKVU5FID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBhbW91bnQ6IEJOLFxyXG4gICAgdG86IHN0cmluZ1xyXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRKVU5FUGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIHRvLFxyXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygxMClcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmV4cG9ydEFWQVhcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxyXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2VuZCBKVU5FIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgUC1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBYLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXHJcbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEpVTkUgaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzXHJcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS4gQWZ0ZXIgaXNzdWluZyB0aGlzIHRyYW5zYWN0aW9uLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZc1xyXG4gICAqIGltcG9ydEpVTkUgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxyXG4gICAqIEBwYXJhbSB0byBUaGUgSUQgb2YgdGhlIGFjY291bnQgdGhlIEpVTkUgaXMgc2VudCB0by4gVGhpcyBtdXN0IGJlIHRoZSBzYW1lIGFzIHRoZSB0b1xyXG4gICAqIGFyZ3VtZW50IGluIHRoZSBjb3JyZXNwb25kaW5nIGNhbGwgdG8gdGhlIFgtQ2hhaW7igJlzIGV4cG9ydEpVTkVcclxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluSUQgd2hlcmUgdGhlIGZ1bmRzIGFyZSBjb21pbmcgZnJvbS5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXHJcbiAgICogYnkgY2FsbGluZyBpc3N1ZVR4LlxyXG4gICAqL1xyXG4gIGltcG9ydEpVTkUgPSBhc3luYyAoXHJcbiAgICB1c2VybmFtZTogc3RyaW5nLFxyXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIHRvOiBzdHJpbmcsXHJcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nXHJcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEpVTkVQYXJhbXMgPSB7XHJcbiAgICAgIHRvLFxyXG4gICAgICBzb3VyY2VDaGFpbixcclxuICAgICAgdXNlcm5hbWUsXHJcbiAgICAgIHBhc3N3b3JkXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5pbXBvcnRBVkFYXCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXHJcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgaXNzdWVUeCBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gSUQgYXMgYSBzdHJpbmcuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcG9zdGVkIHRyYW5zYWN0aW9uLlxyXG4gICAqL1xyXG4gIGlzc3VlVHggPSBhc3luYyAodHg6IHN0cmluZyB8IEJ1ZmZlciB8IFR4KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGxldCBUcmFuc2FjdGlvbiA9IFwiXCJcclxuICAgIGlmICh0eXBlb2YgdHggPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgVHJhbnNhY3Rpb24gPSB0eFxyXG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xyXG4gICAgICBjb25zdCB0eG9iajogVHggPSBuZXcgVHgoKVxyXG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KVxyXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4b2JqLnRvU3RyaW5nSGV4KClcclxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xyXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4LnRvU3RyaW5nSGV4KClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBwbGF0Zm9ybS5pc3N1ZVR4OiBwcm92aWRlZCB0eCBpcyBub3QgZXhwZWN0ZWQgdHlwZSBvZiBzdHJpbmcsIEJ1ZmZlciwgb3IgVHhcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcclxuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKCksXHJcbiAgICAgIGVuY29kaW5nOiBcImhleFwiXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5pc3N1ZVR4XCIsXHJcbiAgICAgIHBhcmFtc1xyXG4gICAgKVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gdXBwZXIgYm91bmQgb24gdGhlIGFtb3VudCBvZiB0b2tlbnMgdGhhdCBleGlzdC4gTm90IG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyBiZWNhdXNlIHRoaXMgbnVtYmVyIGNhbiBnbyBkb3duIGlmIGEgc3Rha2VyXCJzIHJld2FyZCBpcyBkZW5pZWQuXHJcbiAgICovXHJcbiAgZ2V0Q3VycmVudFN1cHBseSA9IGFzeW5jICgpOiBQcm9taXNlPEJOPiA9PiB7XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRDdXJyZW50U3VwcGx5XCJcclxuICAgIClcclxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VwcGx5LCAxMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGUgcGxhdGZvcm0gY2hhaW4uXHJcbiAgICovXHJcbiAgZ2V0SGVpZ2h0ID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmdldEhlaWdodFwiXHJcbiAgICApXHJcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LmhlaWdodCwgMTApXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBtaW5pbXVtIHN0YWtpbmcgYW1vdW50LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHJlZnJlc2ggQSBib29sZWFuIHRvIGJ5cGFzcyB0aGUgbG9jYWwgY2FjaGVkIHZhbHVlIG9mIE1pbmltdW0gU3Rha2UgQW1vdW50LCBwb2xsaW5nIHRoZSBub2RlIGluc3RlYWQuXHJcbiAgICovXHJcbiAgZ2V0TWluU3Rha2UgPSBhc3luYyAoXHJcbiAgICByZWZyZXNoOiBib29sZWFuID0gZmFsc2VcclxuICApOiBQcm9taXNlPEdldE1pblN0YWtlUmVzcG9uc2U+ID0+IHtcclxuICAgIGlmIChcclxuICAgICAgcmVmcmVzaCAhPT0gdHJ1ZSAmJlxyXG4gICAgICB0eXBlb2YgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgICB0eXBlb2YgdGhpcy5taW5EZWxlZ2F0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgbWluVmFsaWRhdG9yU3Rha2U6IHRoaXMubWluVmFsaWRhdG9yU3Rha2UsXHJcbiAgICAgICAgbWluRGVsZWdhdG9yU3Rha2U6IHRoaXMubWluRGVsZWdhdG9yU3Rha2VcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uZ2V0TWluU3Rha2VcIlxyXG4gICAgKVxyXG4gICAgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSA9IG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5taW5WYWxpZGF0b3JTdGFrZSwgMTApXHJcbiAgICB0aGlzLm1pbkRlbGVnYXRvclN0YWtlID0gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0Lm1pbkRlbGVnYXRvclN0YWtlLCAxMClcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG1pblZhbGlkYXRvclN0YWtlOiB0aGlzLm1pblZhbGlkYXRvclN0YWtlLFxyXG4gICAgICBtaW5EZWxlZ2F0b3JTdGFrZTogdGhpcy5taW5EZWxlZ2F0b3JTdGFrZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogZ2V0VG90YWxTdGFrZSgpIHJldHVybnMgdGhlIHRvdGFsIGFtb3VudCBzdGFrZWQgb24gdGhlIFByaW1hcnkgTmV0d29ya1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0b3RhbCBzdGFrZWQgYnkgdmFsaWRhdG9ycyBvbiB0aGUgcHJpbWFyeSBuZXR3b3JrXHJcbiAgICovXHJcbiAgZ2V0VG90YWxTdGFrZSA9IGFzeW5jICgpOiBQcm9taXNlPEJOPiA9PiB7XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRUb3RhbFN0YWtlXCJcclxuICAgIClcclxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3Rha2UsIDEwKVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogZ2V0TWF4U3Rha2VBbW91bnQoKSByZXR1cm5zIHRoZSBtYXhpbXVtIGFtb3VudCBvZiBuSlVORSBzdGFraW5nIHRvIHRoZSBuYW1lZCBub2RlIGR1cmluZyB0aGUgdGltZSBwZXJpb2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gc3VibmV0SUQgQSBCdWZmZXIgb3IgY2I1OCBzdHJpbmcgcmVwcmVzZW50aW5nIHN1Ym5ldFxyXG4gICAqIEBwYXJhbSBub2RlSUQgQSBzdHJpbmcgcmVwcmVzZW50aW5nIElEIG9mIHRoZSBub2RlIHdob3NlIHN0YWtlIGFtb3VudCBpcyByZXF1aXJlZCBkdXJpbmcgdGhlIGdpdmVuIGR1cmF0aW9uXHJcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBBIGJpZyBudW1iZXIgZGVub3Rpbmcgc3RhcnQgdGltZSBvZiB0aGUgZHVyYXRpb24gZHVyaW5nIHdoaWNoIHN0YWtlIGFtb3VudCBvZiB0aGUgbm9kZSBpcyByZXF1aXJlZC5cclxuICAgKiBAcGFyYW0gZW5kVGltZSBBIGJpZyBudW1iZXIgZGVub3RpbmcgZW5kIHRpbWUgb2YgdGhlIGR1cmF0aW9uIGR1cmluZyB3aGljaCBzdGFrZSBhbW91bnQgb2YgdGhlIG5vZGUgaXMgcmVxdWlyZWQuXHJcbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0b3RhbCBzdGFrZWQgYnkgdmFsaWRhdG9ycyBvbiB0aGUgcHJpbWFyeSBuZXR3b3JrXHJcbiAgICovXHJcbiAgZ2V0TWF4U3Rha2VBbW91bnQgPSBhc3luYyAoXHJcbiAgICBzdWJuZXRJRDogc3RyaW5nIHwgQnVmZmVyLFxyXG4gICAgbm9kZUlEOiBzdHJpbmcsXHJcbiAgICBzdGFydFRpbWU6IEJOLFxyXG4gICAgZW5kVGltZTogQk5cclxuICApOiBQcm9taXNlPEJOPiA9PiB7XHJcbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXHJcbiAgICBpZiAoc3RhcnRUaW1lLmd0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xyXG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxyXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5nZXRNYXhTdGFrZUFtb3VudCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgcGFzdCBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhcmFtczogR2V0TWF4U3Rha2VBbW91bnRQYXJhbXMgPSB7XHJcbiAgICAgIG5vZGVJRCxcclxuICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICBlbmRUaW1lXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBzdWJuZXRJRFxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRNYXhTdGFrZUFtb3VudFwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuYW1vdW50LCAxMClcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIG1pbmltdW0gc3Rha2UgY2FjaGVkIGluIHRoaXMgY2xhc3MuXHJcbiAgICogQHBhcmFtIG1pblZhbGlkYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIHN0YWtlIGFtb3VudCBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cclxuICAgKiBAcGFyYW0gbWluRGVsZWdhdG9yU3Rha2UgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSB0byBzZXQgdGhlIG1pbmltdW0gZGVsZWdhdGlvbiBhbW91bnQgY2FjaGVkIGluIHRoaXMgY2xhc3MuXHJcbiAgICovXHJcbiAgc2V0TWluU3Rha2UgPSAoXHJcbiAgICBtaW5WYWxpZGF0b3JTdGFrZTogQk4gPSB1bmRlZmluZWQsXHJcbiAgICBtaW5EZWxlZ2F0b3JTdGFrZTogQk4gPSB1bmRlZmluZWRcclxuICApOiB2b2lkID0+IHtcclxuICAgIGlmICh0eXBlb2YgbWluVmFsaWRhdG9yU3Rha2UgIT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSA9IG1pblZhbGlkYXRvclN0YWtlXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIG1pbkRlbGVnYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRoaXMubWluRGVsZWdhdG9yU3Rha2UgPSBtaW5EZWxlZ2F0b3JTdGFrZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgdG90YWwgYW1vdW50IHN0YWtlZCBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxyXG4gICAqL1xyXG4gIGdldFN0YWtlID0gYXN5bmMgKFxyXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiXHJcbiAgKTogUHJvbWlzZTxHZXRTdGFrZVJlc3BvbnNlPiA9PiB7XHJcbiAgICBjb25zdCBwYXJhbXM6IEdldFN0YWtlUGFyYW1zID0ge1xyXG4gICAgICBhZGRyZXNzZXMsXHJcbiAgICAgIGVuY29kaW5nXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRTdGFrZVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN0YWtlZDogbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YWtlZCwgMTApLFxyXG4gICAgICBzdGFrZWRPdXRwdXRzOiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGFrZWRPdXRwdXRzLm1hcChcclxuICAgICAgICAoc3Rha2VkT3V0cHV0OiBzdHJpbmcpOiBUcmFuc2ZlcmFibGVPdXRwdXQgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPVxyXG4gICAgICAgICAgICBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcclxuICAgICAgICAgIGxldCBidWY6IEJ1ZmZlclxyXG4gICAgICAgICAgaWYgKGVuY29kaW5nID09PSBcImNiNThcIikge1xyXG4gICAgICAgICAgICBidWYgPSBiaW50b29scy5jYjU4RGVjb2RlKHN0YWtlZE91dHB1dClcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKHN0YWtlZE91dHB1dC5yZXBsYWNlKC8weC9nLCBcIlwiKSwgXCJoZXhcIilcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRyYW5zZmVyYWJsZU91dHB1dC5mcm9tQnVmZmVyKGJ1ZiwgMilcclxuICAgICAgICAgIHJldHVybiB0cmFuc2ZlcmFibGVPdXRwdXRcclxuICAgICAgICB9XHJcbiAgICAgIClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhbGwgdGhlIHN1Ym5ldHMgdGhhdCBleGlzdC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBpZHMgSURzIG9mIHRoZSBzdWJuZXRzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0LiBJZiBvbWl0dGVkLCBnZXRzIGFsbCBzdWJuZXRzXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgZmllbGRzIFwiaWRcIixcclxuICAgKiBcImNvbnRyb2xLZXlzXCIsIGFuZCBcInRocmVzaG9sZFwiLlxyXG4gICAqL1xyXG4gIGdldFN1Ym5ldHMgPSBhc3luYyAoaWRzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCk6IFByb21pc2U8U3VibmV0W10+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge31cclxuICAgIGlmICh0eXBlb2YgaWRzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgcGFyYW1zLmlkcyA9IGlkc1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uZ2V0U3VibmV0c1wiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWJuZXRzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB3aXRoIHRoZSBwcml2YXRlIGtleVxyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxyXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHdob3NlIHByaXZhdGUga2V5IHNob3VsZCBiZSBleHBvcnRlZFxyXG4gICAqXHJcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXHJcbiAgICovXHJcbiAgZXhwb3J0S2V5ID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBhZGRyZXNzOiBzdHJpbmdcclxuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0S2V5UGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIGFkZHJlc3NcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmV4cG9ydEtleVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5XHJcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQucHJpdmF0ZUtleVxyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHaXZlIGEgdXNlciBjb250cm9sIG92ZXIgYW4gYWRkcmVzcyBieSBwcm92aWRpbmcgdGhlIHByaXZhdGUga2V5IHRoYXQgY29udHJvbHMgdGhlIGFkZHJlc3MuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gc3RvcmUgdGhlIHByaXZhdGUga2V5XHJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB0aGF0IHVubG9ja3MgdGhlIHVzZXJcclxuICAgKiBAcGFyYW0gcHJpdmF0ZUtleSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IGluIHRoZSB2bVwicyBmb3JtYXRcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBhZGRyZXNzIGZvciB0aGUgaW1wb3J0ZWQgcHJpdmF0ZSBrZXkuXHJcbiAgICovXHJcbiAgaW1wb3J0S2V5ID0gYXN5bmMgKFxyXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcclxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXHJcbiAgICBwcml2YXRlS2V5OiBzdHJpbmdcclxuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0S2V5UGFyYW1zID0ge1xyXG4gICAgICB1c2VybmFtZSxcclxuICAgICAgcGFzc3dvcmQsXHJcbiAgICAgIHByaXZhdGVLZXlcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmltcG9ydEtleVwiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xyXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcclxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdHJlYW5zYWN0aW9uIGRhdGEgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4YCBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHhJRCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxyXG4gICAqIEBwYXJhbSBlbmNvZGluZyBzZXRzIHRoZSBmb3JtYXQgb2YgdGhlIHJldHVybmVkIHRyYW5zYWN0aW9uLiBDYW4gYmUsIFwiY2I1OFwiLCBcImhleFwiIG9yIFwianNvblwiLiBEZWZhdWx0cyB0byBcImNiNThcIi5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBvciBvYmplY3QgY29udGFpbmluZyB0aGUgYnl0ZXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcclxuICAgKi9cclxuICBnZXRUeCA9IGFzeW5jIChcclxuICAgIHR4SUQ6IHN0cmluZyxcclxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiXHJcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBvYmplY3Q+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xyXG4gICAgICB0eElELFxyXG4gICAgICBlbmNvZGluZ1xyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uZ2V0VHhcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhcclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eFxyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBzdGF0dXMgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4U3RhdHVzYCBtZXRob2QuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdHhpZCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxyXG4gICAqIEBwYXJhbSBpbmNsdWRlUmVhc29uIFJldHVybiB0aGUgcmVhc29uIHR4IHdhcyBkcm9wcGVkLCBpZiBhcHBsaWNhYmxlLiBEZWZhdWx0cyB0byB0cnVlXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgc3RhdHVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlIGFuZCB0aGUgcmVhc29uIGEgdHggd2FzIGRyb3BwZWQsIGlmIGFwcGxpY2FibGUuXHJcbiAgICovXHJcbiAgZ2V0VHhTdGF0dXMgPSBhc3luYyAoXHJcbiAgICB0eGlkOiBzdHJpbmcsXHJcbiAgICBpbmNsdWRlUmVhc29uOiBib29sZWFuID0gdHJ1ZVxyXG4gICk6IFByb21pc2U8c3RyaW5nIHwgR2V0VHhTdGF0dXNSZXNwb25zZT4gPT4ge1xyXG4gICAgY29uc3QgcGFyYW1zOiBHZXRUeFN0YXR1c1BhcmFtcyA9IHtcclxuICAgICAgdHhJRDogdHhpZCxcclxuICAgICAgaW5jbHVkZVJlYXNvbjogaW5jbHVkZVJlYXNvblxyXG4gICAgfVxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uZ2V0VHhTdGF0dXNcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHJpZXZlcyB0aGUgVVRYT3MgcmVsYXRlZCB0byB0aGUgYWRkcmVzc2VzIHByb3ZpZGVkIGZyb20gdGhlIG5vZGUncyBgZ2V0VVRYT3NgIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIGNiNTggc3RyaW5ncyBvciBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXHJcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEgc3RyaW5nIGZvciB0aGUgY2hhaW4gdG8gbG9vayBmb3IgdGhlIFVUWE9cInMuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cclxuICAgKiBAcGFyYW0gbGltaXQgT3B0aW9uYWwuIFJldHVybnMgYXQgbW9zdCBbbGltaXRdIGFkZHJlc3Nlcy4gSWYgW2xpbWl0XSA9PSAwIG9yID4gW21heFVUWE9zVG9GZXRjaF0sIGZldGNoZXMgdXAgdG8gW21heFVUWE9zVG9GZXRjaF0uXHJcbiAgICogQHBhcmFtIHN0YXJ0SW5kZXggT3B0aW9uYWwuIFtTdGFydEluZGV4XSBkZWZpbmVzIHdoZXJlIHRvIHN0YXJ0IGZldGNoaW5nIFVUWE9zIChmb3IgcGFnaW5hdGlvbi4pXHJcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXHJcbiAgICogRm9yIGFkZHJlc3MgW1N0YXJ0SW5kZXguQWRkcmVzc10sIG9ubHkgVVRYT3Mgd2l0aCBJRHMgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LlV0eG9dIHdpbGwgYmUgcmV0dXJuZWQuXHJcbiAgICogQHBhcmFtIHBlcnNpc3RPcHRzIE9wdGlvbnMgYXZhaWxhYmxlIHRvIHBlcnNpc3QgdGhlc2UgVVRYT3MgaW4gbG9jYWwgc3RvcmFnZVxyXG4gICAqIEBwYXJhbSBlbmNvZGluZyBPcHRpb25hbC4gIGlzIHRoZSBlbmNvZGluZyBmb3JtYXQgdG8gdXNlIGZvciB0aGUgcGF5bG9hZCBhcmd1bWVudC4gQ2FuIGJlIGVpdGhlciBcImNiNThcIiBvciBcImhleFwiLiBEZWZhdWx0cyB0byBcImhleFwiLlxyXG4gICAqXHJcbiAgICogQHJlbWFya3NcclxuICAgKiBwZXJzaXN0T3B0cyBpcyBvcHRpb25hbCBhbmQgbXVzdCBiZSBvZiB0eXBlIFtbUGVyc2lzdGFuY2VPcHRpb25zXV1cclxuICAgKlxyXG4gICAqL1xyXG4gIGdldFVUWE9zID0gYXN5bmMgKFxyXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcclxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcclxuICAgIHN0YXJ0SW5kZXg6IHsgYWRkcmVzczogc3RyaW5nOyB1dHhvOiBzdHJpbmcgfSA9IHVuZGVmaW5lZCxcclxuICAgIHBlcnNpc3RPcHRzOiBQZXJzaXN0YW5jZU9wdGlvbnMgPSB1bmRlZmluZWQsXHJcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxyXG4gICk6IFByb21pc2U8R2V0VVRYT3NSZXNwb25zZT4gPT4ge1xyXG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgYWRkcmVzc2VzID0gW2FkZHJlc3Nlc11cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJhbXM6IEdldFVUWE9zUGFyYW1zID0ge1xyXG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcclxuICAgICAgbGltaXQsXHJcbiAgICAgIGVuY29kaW5nXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggIT09IFwidW5kZWZpbmVkXCIgJiYgc3RhcnRJbmRleCkge1xyXG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXhcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHBhcmFtcy5zb3VyY2VDaGFpbiA9IHNvdXJjZUNoYWluXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXHJcbiAgICAgIFwicGxhdGZvcm0uZ2V0VVRYT3NcIixcclxuICAgICAgcGFyYW1zXHJcbiAgICApXHJcblxyXG4gICAgY29uc3QgdXR4b3M6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXHJcbiAgICBsZXQgZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zXHJcbiAgICBpZiAocGVyc2lzdE9wdHMgJiYgdHlwZW9mIHBlcnNpc3RPcHRzID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgIGlmICh0aGlzLmRiLmhhcyhwZXJzaXN0T3B0cy5nZXROYW1lKCkpKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZkFycmF5OiBzdHJpbmdbXSA9IHRoaXMuZGIuZ2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSlcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmQXJyYXkpKSB7XHJcbiAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKVxyXG4gICAgICAgICAgY29uc3Qgc2VsZjogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcclxuICAgICAgICAgIHNlbGYuYWRkQXJyYXkoc2VsZkFycmF5KVxyXG4gICAgICAgICAgc2VsZi5tZXJnZUJ5UnVsZSh1dHhvcywgcGVyc2lzdE9wdHMuZ2V0TWVyZ2VSdWxlKCkpXHJcbiAgICAgICAgICBkYXRhID0gc2VsZi5nZXRBbGxVVFhPU3RyaW5ncygpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZGIuc2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSwgZGF0YSwgcGVyc2lzdE9wdHMuZ2V0T3ZlcndyaXRlKCkpXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRhdGEubGVuZ3RoID4gMCAmJiBkYXRhWzBdLnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKSB7XHJcbiAgICAgIGNvbnN0IGNiNThTdHJzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICAgIGRhdGEuZm9yRWFjaCgoc3RyOiBzdHJpbmcpOiB2b2lkID0+IHtcclxuICAgICAgICBjYjU4U3Rycy5wdXNoKGJpbnRvb2xzLmNiNThFbmNvZGUobmV3IEJ1ZmZlcihzdHIuc2xpY2UoMiksIFwiaGV4XCIpKSlcclxuICAgICAgfSlcclxuXHJcbiAgICAgIHV0eG9zLmFkZEFycmF5KGNiNThTdHJzLCBmYWxzZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEsIGZhbHNlKVxyXG4gICAgfVxyXG4gICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3MgPSB1dHhvc1xyXG4gICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQubnVtRmV0Y2hlZCA9IHBhcnNlSW50KHJlc3BvbnNlLmRhdGEucmVzdWx0Lm51bUZldGNoZWQpXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cclxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxyXG4gICAqIEBwYXJhbSBvd25lckFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gaW1wb3J0XHJcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgaW1wb3J0IGlzIGNvbWluZyBmcm9tLlxyXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXHJcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcclxuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXHJcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0ltcG9ydFR4XV0uXHJcbiAgICpcclxuICAgKiBAcmVtYXJrc1xyXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXHJcbiAgICovXHJcbiAgYnVpbGRJbXBvcnRUeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICBvd25lckFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxyXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxyXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcclxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxyXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xyXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIHRvQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkSW1wb3J0VHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkSW1wb3J0VHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcclxuICAgICAgXCJidWlsZEltcG9ydFR4XCJcclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxyXG5cclxuICAgIGxldCBzcmNDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkXHJcblxyXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkSW1wb3J0VHg6IFNvdXJjZSBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxyXG4gICAgICApXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICBzcmNDaGFpbiA9IHNvdXJjZUNoYWluXHJcbiAgICAgIHNvdXJjZUNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShzb3VyY2VDaGFpbilcclxuICAgIH0gZWxzZSBpZiAoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEltcG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xyXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gYXdhaXQgKFxyXG4gICAgICBhd2FpdCB0aGlzLmdldFVUWE9zKG93bmVyQWRkcmVzc2VzLCBzcmNDaGFpbiwgMCwgdW5kZWZpbmVkKVxyXG4gICAgKS51dHhvc1xyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0SlVORUFzc2V0SUQoKVxyXG5cclxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcclxuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxyXG5cclxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRJbXBvcnRUeChcclxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxyXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcclxuICAgICAgdG8sXHJcbiAgICAgIGZyb20sXHJcbiAgICAgIGNoYW5nZSxcclxuICAgICAgYXRvbWljcyxcclxuICAgICAgc291cmNlQ2hhaW4sXHJcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcclxuICAgICAganVuZUFzc2V0SUQsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIGFzT2YsXHJcbiAgICAgIGxvY2t0aW1lLFxyXG4gICAgICB0aHJlc2hvbGRcclxuICAgIClcclxuXHJcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBFeHBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXHJcbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cclxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgYXNzZXRzIHdpbGwgYmUgc2VudC5cclxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xyXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cclxuICAgKi9cclxuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxyXG4gICAgdXR4b3NldDogVVRYT1NldCxcclxuICAgIGFtb3VudDogQk4sXHJcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXHJcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxyXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXHJcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XHJcbiAgICBsZXQgcHJlZml4ZXM6IG9iamVjdCA9IHt9XHJcbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGE6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgICBwcmVmaXhlc1thLnNwbGl0KFwiLVwiKVswXV0gPSB0cnVlXHJcbiAgICB9KVxyXG4gICAgaWYgKE9iamVjdC5rZXlzKHByZWZpeGVzKS5sZW5ndGggIT09IDEpIHtcclxuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxyXG4gICAgICApXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKGRlc3RpbmF0aW9uQ2hhaW4pIC8vXHJcbiAgICB9IGVsc2UgaWYgKCEoZGVzdGluYXRpb25DaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcclxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xyXG4gICAgICAgICAgdHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW5cclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgaWYgKGRlc3RpbmF0aW9uQ2hhaW4ubGVuZ3RoICE9PSAzMikge1xyXG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxyXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG4gICAgLypcclxuICAgIGlmKGJpbnRvb2xzLmNiNThFbmNvZGUoZGVzdGluYXRpb25DaGFpbikgIT09IERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXS5YW1wiYmxvY2tjaGFpbklEXCJdKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIG11c3QgVGhlIFgtQ2hhaW4gSUQgaW4gdGhlIGN1cnJlbnQgdmVyc2lvbiBvZiBKdW5lb0pTLlwiKVxyXG4gICAgfSovXHJcblxyXG4gICAgbGV0IHRvOiBCdWZmZXJbXSA9IFtdXHJcbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGE6IHN0cmluZyk6IHZvaWQgPT4ge1xyXG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuICAgIH0pXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkRXhwb3J0VHhcIlxyXG4gICAgKS5tYXAoKGEpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxyXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXHJcbiAgICAgIFwiYnVpbGRFeHBvcnRUeFwiXHJcbiAgICApLm1hcCgoYSk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBqdW5lQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcblxyXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEV4cG9ydFR4KFxyXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXHJcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxyXG4gICAgICBhbW91bnQsXHJcbiAgICAgIGp1bmVBc3NldElELFxyXG4gICAgICB0byxcclxuICAgICAgZnJvbSxcclxuICAgICAgY2hhbmdlLFxyXG4gICAgICBkZXN0aW5hdGlvbkNoYWluLFxyXG4gICAgICB0aGlzLmdldFR4RmVlKCksXHJcbiAgICAgIGp1bmVBc3NldElELFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBhc09mLFxyXG4gICAgICBsb2NrdGltZSxcclxuICAgICAgdGhyZXNob2xkXHJcbiAgICApXHJcblxyXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxyXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5IGFuZCBpbXBvcnQgdGhlIFtbQWRkU3VibmV0VmFsaWRhdG9yVHhdXSBjbGFzcyBkaXJlY3RseS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uLlxyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcGF5cyB0aGUgZmVlcyBpbiBKVU5FXHJcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cclxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXHJcbiAgICogQHBhcmFtIGVuZFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEpVTkUgaXMgcmV0dXJuZWQpLlxyXG4gICAqIEBwYXJhbSB3ZWlnaHQgVGhlIGFtb3VudCBvZiB3ZWlnaHQgZm9yIHRoaXMgc3VibmV0IHZhbGlkYXRvci5cclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICogQHBhcmFtIHN1Ym5ldEF1dGhDcmVkZW50aWFscyBPcHRpb25hbC4gQW4gYXJyYXkgb2YgaW5kZXggYW5kIGFkZHJlc3MgdG8gc2lnbiBmb3IgZWFjaCBTdWJuZXRBdXRoLlxyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cclxuICAgKi9cclxuXHJcbiAgYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBub2RlSUQ6IHN0cmluZyxcclxuICAgIHN0YXJ0VGltZTogQk4sXHJcbiAgICBlbmRUaW1lOiBCTixcclxuICAgIHdlaWdodDogQk4sXHJcbiAgICBzdWJuZXRJRDogc3RyaW5nLFxyXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcclxuICAgIHN1Ym5ldEF1dGhDcmVkZW50aWFsczogW251bWJlciwgQnVmZmVyXVtdID0gW11cclxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcclxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgIFwiYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBqdW5lQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcblxyXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxyXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHgoXHJcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcclxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXHJcbiAgICAgIGZyb20sXHJcbiAgICAgIGNoYW5nZSxcclxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcclxuICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICBlbmRUaW1lLFxyXG4gICAgICB3ZWlnaHQsXHJcbiAgICAgIHN1Ym5ldElELFxyXG4gICAgICB0aGlzLmdldERlZmF1bHRUeEZlZSgpLFxyXG4gICAgICBqdW5lQXNzZXRJRCxcclxuICAgICAgbWVtbyxcclxuICAgICAgYXNPZixcclxuICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxzXHJcbiAgICApXHJcblxyXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZERlbGVnYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXHJcbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgYW5kIGltcG9ydCB0aGUgW1tBZGREZWxlZ2F0b3JUeF1dIGNsYXNzIGRpcmVjdGx5LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cclxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNlaXZlZCB0aGUgc3Rha2VkIHRva2VucyBhdCB0aGUgZW5kIG9mIHRoZSBzdGFraW5nIHBlcmlvZFxyXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3duIHRoZSBzdGFraW5nIFVUWE9zIHRoZSBmZWVzIGluIEpVTkVcclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XHJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxyXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cclxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgSlVORSBpcyByZXR1cm5lZCkuXHJcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZGVsZWdhdGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgd2hpY2ggd2lsbCByZWNpZXZlIHRoZSByZXdhcmRzIGZyb20gdGhlIGRlbGVnYXRlZCBzdGFrZS5cclxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcclxuICAgKiBAcGFyYW0gcmV3YXJkVGhyZXNob2xkIE9waW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCByZXdhcmQgVVRYTy4gRGVmYXVsdCAxLlxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXHJcbiAgICovXHJcbiAgYnVpbGRBZGREZWxlZ2F0b3JUeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBub2RlSUQ6IHN0cmluZyxcclxuICAgIHN0YXJ0VGltZTogQk4sXHJcbiAgICBlbmRUaW1lOiBCTixcclxuICAgIHN0YWtlQW1vdW50OiBCTixcclxuICAgIHJld2FyZEFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICByZXdhcmRMb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXHJcbiAgICByZXdhcmRUaHJlc2hvbGQ6IG51bWJlciA9IDEsXHJcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXHJcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XHJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgdG9BZGRyZXNzZXMsXHJcbiAgICAgIFwiYnVpbGRBZGREZWxlZ2F0b3JUeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgIFwiYnVpbGRBZGREZWxlZ2F0b3JUeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQWRkRGVsZWdhdG9yVHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBjb25zdCByZXdhcmRzOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXHJcbiAgICAgIFwiYnVpbGRBZGREZWxlZ2F0b3JUeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuXHJcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XHJcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG1pblN0YWtlOiBCTiA9IChhd2FpdCB0aGlzLmdldE1pblN0YWtlKCkpW1wibWluRGVsZWdhdG9yU3Rha2VcIl1cclxuICAgIGlmIChzdGFrZUFtb3VudC5sdChtaW5TdGFrZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IFN0YWtlRXJyb3IoXHJcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkRGVsZWdhdG9yVHggLS0gc3Rha2UgYW1vdW50IG11c3QgYmUgYXQgbGVhc3QgXCIgK1xyXG4gICAgICAgICAgbWluU3Rha2UudG9TdHJpbmcoMTApXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBqdW5lQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcblxyXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxyXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcclxuICAgICAgdGhyb3cgbmV3IFRpbWVFcnJvcihcclxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGREZWxlZ2F0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEFkZERlbGVnYXRvclR4KFxyXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXHJcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxyXG4gICAgICBqdW5lQXNzZXRJRCxcclxuICAgICAgdG8sXHJcbiAgICAgIGZyb20sXHJcbiAgICAgIGNoYW5nZSxcclxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcclxuICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICBlbmRUaW1lLFxyXG4gICAgICBzdGFrZUFtb3VudCxcclxuICAgICAgcmV3YXJkTG9ja3RpbWUsXHJcbiAgICAgIHJld2FyZFRocmVzaG9sZCxcclxuICAgICAgcmV3YXJkcyxcclxuICAgICAgbmV3IEJOKDApLFxyXG4gICAgICBqdW5lQXNzZXRJRCxcclxuICAgICAgbWVtbyxcclxuICAgICAgYXNPZlxyXG4gICAgKVxyXG5cclxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIFtbQWRkVmFsaWRhdG9yVHhdXS4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cclxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZFZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxyXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2VpdmVkIHRoZSBzdGFrZWQgdG9rZW5zIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXHJcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd24gdGhlIHN0YWtpbmcgVVRYT3MgdGhlIGZlZXMgaW4gSlVORVxyXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgZmVlIHBheW1lbnRcclxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXHJcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxyXG4gICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBKVU5FIGlzIHJldHVybmVkKS5cclxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBiZWluZyBkZWxlZ2F0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxyXG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxyXG4gICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlIEEgbnVtYmVyIGZvciB0aGUgcGVyY2VudGFnZSBvZiByZXdhcmQgdG8gYmUgZ2l2ZW4gdG8gdGhlIHZhbGlkYXRvciB3aGVuIHNvbWVvbmUgZGVsZWdhdGVzIHRvIHRoZW0uIE11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAuXHJcbiAgICogQHBhcmFtIHJld2FyZExvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXHJcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIGJ1aWxkQWRkVmFsaWRhdG9yVHggPSBhc3luYyAoXHJcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxyXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgbm9kZUlEOiBzdHJpbmcsXHJcbiAgICBzdGFydFRpbWU6IEJOLFxyXG4gICAgZW5kVGltZTogQk4sXHJcbiAgICBzdGFrZUFtb3VudDogQk4sXHJcbiAgICByZXdhcmRBZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgZGVsZWdhdGlvbkZlZTogbnVtYmVyLFxyXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxyXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIgPSAxLFxyXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXHJcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxyXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xyXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIHRvQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcclxuICAgICAgXCJidWlsZEFkZFZhbGlkYXRvclR4XCJcclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxyXG4gICAgY29uc3QgcmV3YXJkczogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgcmV3YXJkQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtaW5TdGFrZTogQk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pblZhbGlkYXRvclN0YWtlXCJdXHJcbiAgICBpZiAoc3Rha2VBbW91bnQubHQobWluU3Rha2UpKSB7XHJcbiAgICAgIHRocm93IG5ldyBTdGFrZUVycm9yKFxyXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFZhbGlkYXRvclR4IC0tIHN0YWtlIGFtb3VudCBtdXN0IGJlIGF0IGxlYXN0IFwiICtcclxuICAgICAgICAgIG1pblN0YWtlLnRvU3RyaW5nKDEwKVxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICB0eXBlb2YgZGVsZWdhdGlvbkZlZSAhPT0gXCJudW1iZXJcIiB8fFxyXG4gICAgICBkZWxlZ2F0aW9uRmVlID4gMTAwIHx8XHJcbiAgICAgIGRlbGVnYXRpb25GZWUgPCAwXHJcbiAgICApIHtcclxuICAgICAgdGhyb3cgbmV3IERlbGVnYXRpb25GZWVFcnJvcihcclxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBkZWxlZ2F0aW9uRmVlIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDBcIlxyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0SlVORUFzc2V0SUQoKVxyXG5cclxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcclxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXHJcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRBZGRWYWxpZGF0b3JUeChcclxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxyXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcclxuICAgICAganVuZUFzc2V0SUQsXHJcbiAgICAgIHRvLFxyXG4gICAgICBmcm9tLFxyXG4gICAgICBjaGFuZ2UsXHJcbiAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksXHJcbiAgICAgIHN0YXJ0VGltZSxcclxuICAgICAgZW5kVGltZSxcclxuICAgICAgc3Rha2VBbW91bnQsXHJcbiAgICAgIHJld2FyZExvY2t0aW1lLFxyXG4gICAgICByZXdhcmRUaHJlc2hvbGQsXHJcbiAgICAgIHJld2FyZHMsXHJcbiAgICAgIGRlbGVnYXRpb25GZWUsXHJcbiAgICAgIG5ldyBCTigwKSxcclxuICAgICAganVuZUFzc2V0SUQsXHJcbiAgICAgIG1lbW8sXHJcbiAgICAgIGFzT2ZcclxuICAgIClcclxuXHJcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tDcmVhdGVTdWJuZXRUeF1dIHRyYW5zYWN0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcclxuICAgKiBAcGFyYW0gc3VibmV0T3duZXJBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGZvciBvd25lcnMgb2YgdGhlIG5ldyBzdWJuZXRcclxuICAgKiBAcGFyYW0gc3VibmV0T3duZXJUaHJlc2hvbGQgQSBudW1iZXIgaW5kaWNhdGluZyB0aGUgYW1vdW50IG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gYWRkIHZhbGlkYXRvcnMgdG8gYSBzdWJuZXRcclxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xyXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIGJ1aWxkQ3JlYXRlU3VibmV0VHggPSBhc3luYyAoXHJcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxyXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgc3VibmV0T3duZXJBZGRyZXNzZXM6IHN0cmluZ1tdLFxyXG4gICAgc3VibmV0T3duZXJUaHJlc2hvbGQ6IG51bWJlcixcclxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcclxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcclxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIGZyb21BZGRyZXNzZXMsXHJcbiAgICAgIFwiYnVpbGRDcmVhdGVTdWJuZXRUeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQ3JlYXRlU3VibmV0VHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcbiAgICBjb25zdCBvd25lcnM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQ3JlYXRlU3VibmV0VHhcIlxyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXHJcblxyXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xyXG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBqdW5lQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRKVU5FQXNzZXRJRCgpXHJcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxyXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0Q3JlYXRlU3VibmV0VHhGZWUoKVxyXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZENyZWF0ZVN1Ym5ldFR4KFxyXG4gICAgICBuZXR3b3JrSUQsXHJcbiAgICAgIGJsb2NrY2hhaW5JRCxcclxuICAgICAgZnJvbSxcclxuICAgICAgY2hhbmdlLFxyXG4gICAgICBvd25lcnMsXHJcbiAgICAgIHN1Ym5ldE93bmVyVGhyZXNob2xkLFxyXG4gICAgICBmZWUsXHJcbiAgICAgIGp1bmVBc3NldElELFxyXG4gICAgICBtZW1vLFxyXG4gICAgICBhc09mXHJcbiAgICApXHJcblxyXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSkge1xyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbQ3JlYXRlQ2hhaW5UeF1dLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cclxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cclxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcclxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwgSUQgb2YgdGhlIFN1Ym5ldCB0aGF0IHZhbGlkYXRlcyB0aGlzIGJsb2NrY2hhaW5cclxuICAgKiBAcGFyYW0gY2hhaW5OYW1lIE9wdGlvbmFsIEEgaHVtYW4gcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNoYWluOyBuZWVkIG5vdCBiZSB1bmlxdWVcclxuICAgKiBAcGFyYW0gdm1JRCBPcHRpb25hbCBJRCBvZiB0aGUgVk0gcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXHJcbiAgICogQHBhcmFtIGZ4SURzIE9wdGlvbmFsIElEcyBvZiB0aGUgZmVhdHVyZSBleHRlbnNpb25zIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxyXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBPcHRpb25hbCBCeXRlIHJlcHJlc2VudGF0aW9uIG9mIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBjaGFpblxyXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXHJcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cclxuICAgKiBAcGFyYW0gc3VibmV0QXV0aENyZWRlbnRpYWxzIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBpbmRleCBhbmQgYWRkcmVzcyB0byBzaWduIGZvciBlYWNoIFN1Ym5ldEF1dGguXHJcbiAgICogQHBhcmFtIGNoYWluQXNzZXRJRCBPcHRpb25hbCBJRCBvZiB0aGUgQ2hhaW5Bc3NldElEIHRoYXQgaXMgdXNlZCB0byBwYXkgZmVlcyBpbiB0aGlzIGJsb2NrY2hhaW4gKGRlZmF1bHRzIHRvIEpVTkUgaWYgZW1wdHkpXHJcbiAgICpcclxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG4gIGJ1aWxkQ3JlYXRlQ2hhaW5UeCA9IGFzeW5jIChcclxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXHJcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcclxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXHJcbiAgICBzdWJuZXRJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxyXG4gICAgY2hhaW5OYW1lOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICB2bUlEOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcbiAgICBmeElEczogc3RyaW5nW10gPSB1bmRlZmluZWQsXHJcbiAgICBnZW5lc2lzRGF0YTogc3RyaW5nIHwgR2VuZXNpc0RhdGEgPSB1bmRlZmluZWQsXHJcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcclxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxyXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzOiBbbnVtYmVyLCBCdWZmZXJdW10gPSBbXSxcclxuICAgIGNoYWluQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkXHJcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XHJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxyXG4gICAgICBmcm9tQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQ3JlYXRlQ2hhaW5UeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcclxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxyXG4gICAgICBcImJ1aWxkQ3JlYXRlQ2hhaW5UeFwiXHJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcclxuXHJcbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XHJcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGp1bmVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEpVTkVBc3NldElEKClcclxuICAgIGZ4SURzID0gZnhJRHMuc29ydCgpXHJcblxyXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcclxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcclxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldENyZWF0ZUNoYWluVHhGZWUoKVxyXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZENyZWF0ZUNoYWluVHgoXHJcbiAgICAgIG5ldHdvcmtJRCxcclxuICAgICAgYmxvY2tjaGFpbklELFxyXG4gICAgICBmcm9tLFxyXG4gICAgICBjaGFuZ2UsXHJcbiAgICAgIHN1Ym5ldElELFxyXG4gICAgICBjaGFpbk5hbWUsXHJcbiAgICAgIHZtSUQsXHJcbiAgICAgIGZ4SURzLFxyXG4gICAgICBnZW5lc2lzRGF0YSxcclxuICAgICAgZmVlLFxyXG4gICAgICBqdW5lQXNzZXRJRCxcclxuICAgICAgbWVtbyxcclxuICAgICAgYXNPZixcclxuICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxzLFxyXG4gICAgICBjaGFpbkFzc2V0SURcclxuICAgIClcclxuXHJcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpKSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGlnbm9yZVxyXG4gICAqL1xyXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzQXJyYXkoXHJcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgQnVmZmVyW10sXHJcbiAgICBjYWxsZXI6IHN0cmluZ1xyXG4gICk6IHN0cmluZ1tdIHtcclxuICAgIGNvbnN0IGFkZHJzOiBzdHJpbmdbXSA9IFtdXHJcbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXHJcbiAgICAgID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxyXG4gICAgICA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcclxuICAgIGlmIChhZGRyZXNzZXMgJiYgYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzW2Ake2l9YF0gPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgdHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3Nlc1tgJHtpfWBdIGFzIHN0cmluZykgPT09XHJcbiAgICAgICAgICAgIFwidW5kZWZpbmVkXCJcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhZGRycy5wdXNoKGFkZHJlc3Nlc1tgJHtpfWBdIGFzIHN0cmluZylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgYmVjaDMyOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcclxuICAgICAgICAgIGFkZHJzLnB1c2goXHJcbiAgICAgICAgICAgIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKFxyXG4gICAgICAgICAgICAgIGFkZHJlc3Nlc1tgJHtpfWBdIGFzIEJ1ZmZlcixcclxuICAgICAgICAgICAgICBiZWNoMzIsXHJcbiAgICAgICAgICAgICAgdGhpcy5jb3JlLmdldEhSUCgpLFxyXG4gICAgICAgICAgICAgIGNoYWluaWRcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFkZHJzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LlxyXG4gICAqIEluc3RlYWQgdXNlIHRoZSBbW0p1bmVvLmFkZEFQSV1dIG1ldGhvZC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBKdW5lbyBjbGFzc1xyXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L1BcIiBhcyB0aGUgcGF0aCB0byBibG9ja2NoYWluJ3MgYmFzZVVSTFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEp1bmVvQ29yZSwgYmFzZVVSTDogc3RyaW5nID0gXCIvZXh0L2JjL1BcIikge1xyXG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcclxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gUGxhdGZvcm1DaGFpbklEXHJcbiAgICBjb25zdCBuZXRJRDogbnVtYmVyID0gY29yZS5nZXROZXR3b3JrSUQoKVxyXG4gICAgaWYgKFxyXG4gICAgICBuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXHJcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1cclxuICAgICkge1xyXG4gICAgICBjb25zdCBhbGlhczogc3RyaW5nID1cclxuICAgICAgICBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldElEfWBdW3RoaXMuYmxvY2tjaGFpbklEXVtcImFsaWFzXCJdXHJcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcylcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCB0aGlzLmJsb2NrY2hhaW5JRClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEByZXR1cm5zIHRoZSBjdXJyZW50IHRpbWVzdGFtcCBvbiBjaGFpbi5cclxuICAgKi9cclxuICBnZXRUaW1lc3RhbXAgPSBhc3luYyAoKTogUHJvbWlzZTxudW1iZXI+ID0+IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxyXG4gICAgICBcInBsYXRmb3JtLmdldFRpbWVzdGFtcFwiXHJcbiAgICApXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudGltZXN0YW1wXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAcmV0dXJucyB0aGUgVVRYT3MgdGhhdCB3ZXJlIHJld2FyZGVkIGFmdGVyIHRoZSBwcm92aWRlZCB0cmFuc2FjdGlvblwicyBzdGFraW5nIG9yIGRlbGVnYXRpb24gcGVyaW9kIGVuZGVkLlxyXG4gICAqL1xyXG4gIGdldFJld2FyZFVUWE9zID0gYXN5bmMgKFxyXG4gICAgdHhJRDogc3RyaW5nLFxyXG4gICAgZW5jb2Rpbmc/OiBzdHJpbmdcclxuICApOiBQcm9taXNlPEdldFJld2FyZFVUWE9zUmVzcG9uc2U+ID0+IHtcclxuICAgIGNvbnN0IHBhcmFtczogR2V0UmV3YXJkVVRYT3NQYXJhbXMgPSB7XHJcbiAgICAgIHR4SUQsXHJcbiAgICAgIGVuY29kaW5nXHJcbiAgICB9XHJcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcclxuICAgICAgXCJwbGF0Zm9ybS5nZXRSZXdhcmRVVFhPc1wiLFxyXG4gICAgICBwYXJhbXNcclxuICAgIClcclxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxyXG4gIH1cclxufVxyXG4iXX0=