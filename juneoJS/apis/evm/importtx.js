"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-ImportTx
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportTx = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const basetx_1 = require("./basetx");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const input_1 = require("../../common/input");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned Import transaction.
 */
class ImportTx extends basetx_1.EVMBaseTx {
    /**
     * Class representing an unsigned Import transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param sourceChainID Optional chainID for the source inputs to import. Default Buffer.alloc(32, 16)
     * @param importIns Optional array of [[TransferableInput]]s used in the transaction
     * @param outs Optional array of the [[EVMOutput]]s
     * @param fee Optional the fee as a BN
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), sourceChainID = buffer_1.Buffer.alloc(32, 16), importIns = undefined, outs = undefined, fee = new bn_js_1.default(0)) {
        super(networkID, blockchainID);
        this._typeName = "ImportTx";
        this._typeID = constants_1.EVMConstants.IMPORTTX;
        this.sourceChain = buffer_1.Buffer.alloc(32);
        this.numIns = buffer_1.Buffer.alloc(4);
        this.importIns = [];
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.outs = [];
        this.sourceChain = sourceChainID;
        let inputsPassed = false;
        let outputsPassed = false;
        if (typeof importIns !== "undefined" &&
            Array.isArray(importIns) &&
            importIns.length > 0) {
            importIns.forEach((importIn) => {
                if (!(importIn instanceof inputs_1.TransferableInput)) {
                    throw new errors_1.TransferableInputError("Error - ImportTx.constructor: invalid TransferableInput in array parameter 'importIns'");
                }
            });
            inputsPassed = true;
            this.importIns = importIns;
        }
        if (typeof outs !== "undefined" && Array.isArray(outs) && outs.length > 0) {
            outs.forEach((out) => {
                if (!(out instanceof outputs_1.EVMOutput)) {
                    throw new errors_1.EVMOutputError("Error - ImportTx.constructor: invalid EVMOutput in array parameter 'outs'");
                }
            });
            if (outs.length > 1) {
                outs = outs.sort(outputs_1.EVMOutput.comparator());
            }
            outputsPassed = true;
            this.outs = outs;
        }
        if (inputsPassed && outputsPassed) {
            this.validateOuts(fee);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sourceChain: serializer.encoder(this.sourceChain, encoding, "Buffer", "cb58"), importIns: this.importIns.map((i) => i.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sourceChain = serializer.decoder(fields["sourceChain"], encoding, "cb58", "Buffer", 32);
        this.importIns = fields["importIns"].map((i) => {
            let ii = new inputs_1.TransferableInput();
            ii.deserialize(i, encoding);
            return ii;
        });
        this.numIns = buffer_1.Buffer.alloc(4);
        this.numIns.writeUInt32BE(this.importIns.length, 0);
    }
    /**
     * Returns the id of the [[ImportTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the source chainid.
     */
    getSourceChain() {
        return this.sourceChain;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it,
     * populates the class, and returns the length of the [[ImportTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
     * @param offset A number representing the byte offset. Defaults to 0.
     *
     * @returns The length of the raw [[ImportTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numIns = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numIns = this.numIns.readUInt32BE(0);
        for (let i = 0; i < numIns; i++) {
            const anIn = new inputs_1.TransferableInput();
            offset = anIn.fromBuffer(bytes, offset);
            this.importIns.push(anIn);
        }
        this.numOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOuts = this.numOuts.readUInt32BE(0);
        for (let i = 0; i < numOuts; i++) {
            const anOut = new outputs_1.EVMOutput();
            offset = anOut.fromBuffer(bytes, offset);
            this.outs.push(anOut);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
     */
    toBuffer() {
        if (typeof this.sourceChain === "undefined") {
            throw new errors_1.ChainIdError("ImportTx.toBuffer -- this.sourceChain is undefined");
        }
        this.numIns.writeUInt32BE(this.importIns.length, 0);
        this.numOuts.writeUInt32BE(this.outs.length, 0);
        let barr = [super.toBuffer(), this.sourceChain, this.numIns];
        let bsize = super.toBuffer().length + this.sourceChain.length + this.numIns.length;
        this.importIns = this.importIns.sort(inputs_1.TransferableInput.comparator());
        this.importIns.forEach((importIn) => {
            bsize += importIn.toBuffer().length;
            barr.push(importIn.toBuffer());
        });
        bsize += this.numOuts.length;
        barr.push(this.numOuts);
        this.outs.forEach((out) => {
            bsize += out.toBuffer().length;
            barr.push(out.toBuffer());
        });
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns an array of [[TransferableInput]]s in this transaction.
     */
    getImportInputs() {
        return this.importIns;
    }
    /**
     * Returns an array of [[EVMOutput]]s in this transaction.
     */
    getOuts() {
        return this.outs;
    }
    clone() {
        let newImportTx = new ImportTx();
        newImportTx.fromBuffer(this.toBuffer());
        return newImportTx;
    }
    create(...args) {
        return new ImportTx(...args);
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const creds = super.sign(msg, kc);
        this.importIns.forEach((importIn) => {
            const cred = (0, credentials_1.SelectCredentialClass)(importIn.getInput().getCredentialID());
            const sigidxs = importIn.getInput().getSigIdxs();
            sigidxs.forEach((sigidx) => {
                const keypair = kc.getKey(sigidx.getSource());
                const signval = keypair.sign(msg);
                const sig = new credentials_2.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            });
            creds.push(cred);
        });
        return creds;
    }
    validateOuts(fee) {
        // This Map enforces uniqueness of pair(address, assetId) for each EVMOutput.
        // For each imported assetID, each ETH-style C-Chain address can
        // have exactly 1 EVMOutput.
        // Map(2) {
        //   '0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC' => [
        //     'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        //     'F4MyJcUvq3Rxbqgd4Zs8sUpvwLHApyrp4yxJXe2bAV86Vvp38'
        //   ],
        //   '0xecC3B2968B277b837a81A7181e0b94EB1Ca54EdE' => [
        //     'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        //     '2Df96yHyhNc3vooieNNhyKwrjEfTsV2ReMo5FKjMpr8vwN4Jqy',
        //     'SfSXBzDb9GZ9R2uH61qZKe8nxQHW9KERW9Kq9WRe4vHJZRN3e'
        //   ]
        // }
        const seenAssetSends = new Map();
        this.outs.forEach((evmOutput) => {
            const address = evmOutput.getAddressString();
            const assetId = bintools.cb58Encode(evmOutput.getAssetID());
            if (seenAssetSends.has(address)) {
                const assetsSentToAddress = seenAssetSends.get(address);
                if (assetsSentToAddress.includes(assetId)) {
                    const errorMessage = `Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x${address}, ${assetId})`;
                    throw new errors_1.EVMOutputError(errorMessage);
                }
                assetsSentToAddress.push(assetId);
            }
            else {
                seenAssetSends.set(address, [assetId]);
            }
        });
        // make sure this transaction pays the required june fee
        const selectedNetwork = this.getNetworkID();
        const feeDiff = new bn_js_1.default(0);
        const juneAssetID = constants_2.Defaults.network[`${selectedNetwork}`].X.juneAssetID;
        // sum incoming JUNE
        this.importIns.forEach((input) => {
            // only check StandardAmountInputs
            if (input.getInput() instanceof input_1.StandardAmountInput &&
                juneAssetID === bintools.cb58Encode(input.getAssetID())) {
                const ui = input.getInput();
                const i = ui;
                feeDiff.iadd(i.getAmount());
            }
        });
        // subtract all outgoing JUNE
        this.outs.forEach((evmOutput) => {
            if (juneAssetID === bintools.cb58Encode(evmOutput.getAssetID())) {
                feeDiff.isub(evmOutput.getAmount());
            }
        });
        if (feeDiff.lt(fee)) {
            const errorMessage = `Error - ${fee} nJUNE required for fee and only ${feeDiff} nJUNE provided`;
            throw new errors_1.EVMFeeError(errorMessage);
        }
    }
}
exports.ImportTx = ImportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vaW1wb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUN0QixvRUFBMkM7QUFDM0MsMkNBQTBDO0FBQzFDLHVDQUFxQztBQUNyQyxxQ0FBNEM7QUFDNUMscUNBQW9DO0FBQ3BDLCtDQUFxRDtBQUNyRCwwREFBd0U7QUFDeEUsOENBQXdEO0FBRXhELHFEQUFrRTtBQUNsRSw2REFBNkU7QUFDN0UsK0NBSzJCO0FBRTNCOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLFVBQVUsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUU3RDs7R0FFRztBQUNILE1BQWEsUUFBUyxTQUFRLGtCQUFTO0lBd0tyQzs7Ozs7Ozs7O09BU0c7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsZ0JBQXdCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUM1QyxZQUFpQyxTQUFTLEVBQzFDLE9BQW9CLFNBQVMsRUFDN0IsTUFBVSxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFbkIsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQTtRQXpMdEIsY0FBUyxHQUFHLFVBQVUsQ0FBQTtRQUN0QixZQUFPLEdBQUcsd0JBQVksQ0FBQyxRQUFRLENBQUE7UUFpQy9CLGdCQUFXLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN0QyxXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNoQyxjQUFTLEdBQXdCLEVB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RyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUE7UUFDdEQsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBd0IsRUFBUSxFQUFFO1lBQ3hELGtDQUFrQztZQUNsQyxJQUNFLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBWSwyQkFBbUI7Z0JBQy9DLFdBQVcsS0FBSyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUN2RDtnQkFDQSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFhLENBQUE7Z0JBQ3RDLE1BQU0sQ0FBQyxHQUFHLEVBQXlCLENBQUE7Z0JBQ25DLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7YUFDNUI7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUNGLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQW9CLEVBQVEsRUFBRTtZQUMvQyxJQUFJLFdBQVcsS0FBSyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFO2dCQUMvRCxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO2FBQ3BDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbkIsTUFBTSxZQUFZLEdBQVcsV0FBVyxHQUFHLG9DQUFvQyxPQUFPLGlCQUFpQixDQUFBO1lBQ3ZHLE1BQU0sSUFBSSxvQkFBVyxDQUFDLFlBQVksQ0FBQyxDQUFBO1NBQ3BDO0lBQ0gsQ0FBQztDQUNGO0FBMVJELDRCQTBSQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cclxuICogQG1vZHVsZSBBUEktRVZNLUltcG9ydFR4XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXHJcbmltcG9ydCB7IEVWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IEVWTU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxyXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXHJcbmltcG9ydCB7IEVWTUJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXHJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHsgU2lnbmF0dXJlLCBTaWdJZHgsIENyZWRlbnRpYWwgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHsgU3RhbmRhcmRBbW91bnRJbnB1dCB9IGZyb20gXCIuLi8uLi9jb21tb24vaW5wdXRcIlxyXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcclxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCwgRGVmYXVsdHMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcclxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxyXG5pbXBvcnQge1xyXG4gIENoYWluSWRFcnJvcixcclxuICBUcmFuc2ZlcmFibGVJbnB1dEVycm9yLFxyXG4gIEVWTU91dHB1dEVycm9yLFxyXG4gIEVWTUZlZUVycm9yXHJcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQGlnbm9yZVxyXG4gKi9cclxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxyXG5jb25zdCBzZXJpYWxpemVyOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXHJcblxyXG4vKipcclxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEltcG9ydCB0cmFuc2FjdGlvbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBJbXBvcnRUeCBleHRlbmRzIEVWTUJhc2VUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiSW1wb3J0VHhcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gRVZNQ29uc3RhbnRzLklNUE9SVFRYXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIHNvdXJjZUNoYWluOiBzZXJpYWxpemVyLmVuY29kZXIoXHJcbiAgICAgICAgdGhpcy5zb3VyY2VDaGFpbixcclxuICAgICAgICBlbmNvZGluZyxcclxuICAgICAgICBcIkJ1ZmZlclwiLFxyXG4gICAgICAgIFwiY2I1OFwiXHJcbiAgICAgICksXHJcbiAgICAgIGltcG9ydEluczogdGhpcy5pbXBvcnRJbnMubWFwKChpKSA9PiBpLnNlcmlhbGl6ZShlbmNvZGluZykpXHJcbiAgICB9XHJcbiAgfVxyXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xyXG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcclxuICAgIHRoaXMuc291cmNlQ2hhaW4gPSBzZXJpYWxpemVyLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcInNvdXJjZUNoYWluXCJdLFxyXG4gICAgICBlbmNvZGluZyxcclxuICAgICAgXCJjYjU4XCIsXHJcbiAgICAgIFwiQnVmZmVyXCIsXHJcbiAgICAgIDMyXHJcbiAgICApXHJcbiAgICB0aGlzLmltcG9ydElucyA9IGZpZWxkc1tcImltcG9ydEluc1wiXS5tYXAoKGk6IG9iamVjdCkgPT4ge1xyXG4gICAgICBsZXQgaWk6IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KClcclxuICAgICAgaWkuZGVzZXJpYWxpemUoaSwgZW5jb2RpbmcpXHJcbiAgICAgIHJldHVybiBpaVxyXG4gICAgfSlcclxuICAgIHRoaXMubnVtSW5zID0gQnVmZmVyLmFsbG9jKDQpXHJcbiAgICB0aGlzLm51bUlucy53cml0ZVVJbnQzMkJFKHRoaXMuaW1wb3J0SW5zLmxlbmd0aCwgMClcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBzb3VyY2VDaGFpbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG4gIHByb3RlY3RlZCBudW1JbnM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gIHByb3RlY3RlZCBpbXBvcnRJbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxyXG4gIHByb3RlY3RlZCBudW1PdXRzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcclxuICBwcm90ZWN0ZWQgb3V0czogRVZNT3V0cHV0W10gPSBbXVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tJbXBvcnRUeF1dXHJcbiAgICovXHJcbiAgZ2V0VHhUeXBlKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBzb3VyY2UgY2hhaW5pZC5cclxuICAgKi9cclxuICBnZXRTb3VyY2VDaGFpbigpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuc291cmNlQ2hhaW5cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0ltcG9ydFR4XV0sIHBhcnNlcyBpdCxcclxuICAgKiBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0ltcG9ydFR4XV0gaW4gYnl0ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbSW1wb3J0VHhdXVxyXG4gICAqIEBwYXJhbSBvZmZzZXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBieXRlIG9mZnNldC4gRGVmYXVsdHMgdG8gMC5cclxuICAgKlxyXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0ltcG9ydFR4XV1cclxuICAgKlxyXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcclxuICAgKi9cclxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICB0aGlzLnNvdXJjZUNoYWluID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXHJcbiAgICBvZmZzZXQgKz0gMzJcclxuICAgIHRoaXMubnVtSW5zID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcclxuICAgIG9mZnNldCArPSA0XHJcbiAgICBjb25zdCBudW1JbnM6IG51bWJlciA9IHRoaXMubnVtSW5zLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bUluczsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGFuSW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KClcclxuICAgICAgb2Zmc2V0ID0gYW5Jbi5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXHJcbiAgICAgIHRoaXMuaW1wb3J0SW5zLnB1c2goYW5JbilcclxuICAgIH1cclxuICAgIHRoaXMubnVtT3V0cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgY29uc3QgbnVtT3V0czogbnVtYmVyID0gdGhpcy5udW1PdXRzLnJlYWRVSW50MzJCRSgwKVxyXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bU91dHM7IGkrKykge1xyXG4gICAgICBjb25zdCBhbk91dDogRVZNT3V0cHV0ID0gbmV3IEVWTU91dHB1dCgpXHJcbiAgICAgIG9mZnNldCA9IGFuT3V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgICAgdGhpcy5vdXRzLnB1c2goYW5PdXQpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2Zmc2V0XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbSW1wb3J0VHhdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXHJcbiAgICAgICAgXCJJbXBvcnRUeC50b0J1ZmZlciAtLSB0aGlzLnNvdXJjZUNoYWluIGlzIHVuZGVmaW5lZFwiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMubnVtSW5zLndyaXRlVUludDMyQkUodGhpcy5pbXBvcnRJbnMubGVuZ3RoLCAwKVxyXG4gICAgdGhpcy5udW1PdXRzLndyaXRlVUludDMyQkUodGhpcy5vdXRzLmxlbmd0aCwgMClcclxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlci50b0J1ZmZlcigpLCB0aGlzLnNvdXJjZUNoYWluLCB0aGlzLm51bUluc11cclxuICAgIGxldCBic2l6ZTogbnVtYmVyID1cclxuICAgICAgc3VwZXIudG9CdWZmZXIoKS5sZW5ndGggKyB0aGlzLnNvdXJjZUNoYWluLmxlbmd0aCArIHRoaXMubnVtSW5zLmxlbmd0aFxyXG4gICAgdGhpcy5pbXBvcnRJbnMgPSB0aGlzLmltcG9ydElucy5zb3J0KFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSlcclxuICAgIHRoaXMuaW1wb3J0SW5zLmZvckVhY2goKGltcG9ydEluOiBUcmFuc2ZlcmFibGVJbnB1dCkgPT4ge1xyXG4gICAgICBic2l6ZSArPSBpbXBvcnRJbi50b0J1ZmZlcigpLmxlbmd0aFxyXG4gICAgICBiYXJyLnB1c2goaW1wb3J0SW4udG9CdWZmZXIoKSlcclxuICAgIH0pXHJcbiAgICBic2l6ZSArPSB0aGlzLm51bU91dHMubGVuZ3RoXHJcbiAgICBiYXJyLnB1c2godGhpcy5udW1PdXRzKVxyXG4gICAgdGhpcy5vdXRzLmZvckVhY2goKG91dDogRVZNT3V0cHV0KSA9PiB7XHJcbiAgICAgIGJzaXplICs9IG91dC50b0J1ZmZlcigpLmxlbmd0aFxyXG4gICAgICBiYXJyLnB1c2gob3V0LnRvQnVmZmVyKCkpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgaW4gdGhpcyB0cmFuc2FjdGlvbi5cclxuICAgKi9cclxuICBnZXRJbXBvcnRJbnB1dHMoKTogVHJhbnNmZXJhYmxlSW5wdXRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5pbXBvcnRJbnNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgW1tFVk1PdXRwdXRdXXMgaW4gdGhpcyB0cmFuc2FjdGlvbi5cclxuICAgKi9cclxuICBnZXRPdXRzKCk6IEVWTU91dHB1dFtdIHtcclxuICAgIHJldHVybiB0aGlzLm91dHNcclxuICB9XHJcblxyXG4gIGNsb25lKCk6IHRoaXMge1xyXG4gICAgbGV0IG5ld0ltcG9ydFR4OiBJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeCgpXHJcbiAgICBuZXdJbXBvcnRUeC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdJbXBvcnRUeCBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcclxuICAgIHJldHVybiBuZXcgSW1wb3J0VHgoLi4uYXJncykgYXMgdGhpc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVGFrZXMgdGhlIGJ5dGVzIG9mIGFuIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xyXG4gICAqXHJcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXHJcbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcclxuICAgKlxyXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xyXG4gICAqL1xyXG4gIHNpZ24obXNnOiBCdWZmZXIsIGtjOiBLZXlDaGFpbik6IENyZWRlbnRpYWxbXSB7XHJcbiAgICBjb25zdCBjcmVkczogQ3JlZGVudGlhbFtdID0gc3VwZXIuc2lnbihtc2csIGtjKVxyXG4gICAgdGhpcy5pbXBvcnRJbnMuZm9yRWFjaCgoaW1wb3J0SW46IFRyYW5zZmVyYWJsZUlucHV0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoXHJcbiAgICAgICAgaW1wb3J0SW4uZ2V0SW5wdXQoKS5nZXRDcmVkZW50aWFsSUQoKVxyXG4gICAgICApXHJcbiAgICAgIGNvbnN0IHNpZ2lkeHM6IFNpZ0lkeFtdID0gaW1wb3J0SW4uZ2V0SW5wdXQoKS5nZXRTaWdJZHhzKClcclxuICAgICAgc2lnaWR4cy5mb3JFYWNoKChzaWdpZHg6IFNpZ0lkeCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4LmdldFNvdXJjZSgpKVxyXG4gICAgICAgIGNvbnN0IHNpZ252YWw6IEJ1ZmZlciA9IGtleXBhaXIuc2lnbihtc2cpXHJcbiAgICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcclxuICAgICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxyXG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcclxuICAgICAgfSlcclxuICAgICAgY3JlZHMucHVzaChjcmVkKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBjcmVkc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEltcG9ydCB0cmFuc2FjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluSUQgT3B0aW9uYWwgY2hhaW5JRCBmb3IgdGhlIHNvdXJjZSBpbnB1dHMgdG8gaW1wb3J0LiBEZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIGltcG9ydElucyBPcHRpb25hbCBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIHVzZWQgaW4gdGhlIHRyYW5zYWN0aW9uXHJcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbRVZNT3V0cHV0XV1zXHJcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbCB0aGUgZmVlIGFzIGEgQk5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXHJcbiAgICBzb3VyY2VDaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcclxuICAgIGltcG9ydEluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIG91dHM6IEVWTU91dHB1dFtdID0gdW5kZWZpbmVkLFxyXG4gICAgZmVlOiBCTiA9IG5ldyBCTigwKVxyXG4gICkge1xyXG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQpXHJcbiAgICB0aGlzLnNvdXJjZUNoYWluID0gc291cmNlQ2hhaW5JRFxyXG4gICAgbGV0IGlucHV0c1Bhc3NlZDogYm9vbGVhbiA9IGZhbHNlXHJcbiAgICBsZXQgb3V0cHV0c1Bhc3NlZDogYm9vbGVhbiA9IGZhbHNlXHJcbiAgICBpZiAoXHJcbiAgICAgIHR5cGVvZiBpbXBvcnRJbnMgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgICAgQXJyYXkuaXNBcnJheShpbXBvcnRJbnMpICYmXHJcbiAgICAgIGltcG9ydElucy5sZW5ndGggPiAwXHJcbiAgICApIHtcclxuICAgICAgaW1wb3J0SW5zLmZvckVhY2goKGltcG9ydEluOiBUcmFuc2ZlcmFibGVJbnB1dCkgPT4ge1xyXG4gICAgICAgIGlmICghKGltcG9ydEluIGluc3RhbmNlb2YgVHJhbnNmZXJhYmxlSW5wdXQpKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHJhbnNmZXJhYmxlSW5wdXRFcnJvcihcclxuICAgICAgICAgICAgXCJFcnJvciAtIEltcG9ydFR4LmNvbnN0cnVjdG9yOiBpbnZhbGlkIFRyYW5zZmVyYWJsZUlucHV0IGluIGFycmF5IHBhcmFtZXRlciAnaW1wb3J0SW5zJ1wiXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICBpbnB1dHNQYXNzZWQgPSB0cnVlXHJcbiAgICAgIHRoaXMuaW1wb3J0SW5zID0gaW1wb3J0SW5zXHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIG91dHMgIT09IFwidW5kZWZpbmVkXCIgJiYgQXJyYXkuaXNBcnJheShvdXRzKSAmJiBvdXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgb3V0cy5mb3JFYWNoKChvdXQ6IEVWTU91dHB1dCkgPT4ge1xyXG4gICAgICAgIGlmICghKG91dCBpbnN0YW5jZW9mIEVWTU91dHB1dCkpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFVk1PdXRwdXRFcnJvcihcclxuICAgICAgICAgICAgXCJFcnJvciAtIEltcG9ydFR4LmNvbnN0cnVjdG9yOiBpbnZhbGlkIEVWTU91dHB1dCBpbiBhcnJheSBwYXJhbWV0ZXIgJ291dHMnXCJcclxuICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIGlmIChvdXRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICBvdXRzID0gb3V0cy5zb3J0KEVWTU91dHB1dC5jb21wYXJhdG9yKCkpXHJcbiAgICAgIH1cclxuICAgICAgb3V0cHV0c1Bhc3NlZCA9IHRydWVcclxuICAgICAgdGhpcy5vdXRzID0gb3V0c1xyXG4gICAgfVxyXG4gICAgaWYgKGlucHV0c1Bhc3NlZCAmJiBvdXRwdXRzUGFzc2VkKSB7XHJcbiAgICAgIHRoaXMudmFsaWRhdGVPdXRzKGZlZSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgdmFsaWRhdGVPdXRzKGZlZTogQk4pOiB2b2lkIHtcclxuICAgIC8vIFRoaXMgTWFwIGVuZm9yY2VzIHVuaXF1ZW5lc3Mgb2YgcGFpcihhZGRyZXNzLCBhc3NldElkKSBmb3IgZWFjaCBFVk1PdXRwdXQuXHJcbiAgICAvLyBGb3IgZWFjaCBpbXBvcnRlZCBhc3NldElELCBlYWNoIEVUSC1zdHlsZSBDLUNoYWluIGFkZHJlc3MgY2FuXHJcbiAgICAvLyBoYXZlIGV4YWN0bHkgMSBFVk1PdXRwdXQuXHJcbiAgICAvLyBNYXAoMikge1xyXG4gICAgLy8gICAnMHg4ZGI5N0M3Y0VjRTI0OWMyYjk4YkRDMDIyNkNjNEMyQTU3QkY1MkZDJyA9PiBbXHJcbiAgICAvLyAgICAgJ0Z2d0VBaG14S2ZlaUc4U25FdnE0MmhjNndoUnlZM0VGWUF2ZWJNcUROREdDZ3hONVonLFxyXG4gICAgLy8gICAgICdGNE15SmNVdnEzUnhicWdkNFpzOHNVcHZ3TEhBcHlycDR5eEpYZTJiQVY4NlZ2cDM4J1xyXG4gICAgLy8gICBdLFxyXG4gICAgLy8gICAnMHhlY0MzQjI5NjhCMjc3YjgzN2E4MUE3MTgxZTBiOTRFQjFDYTU0RWRFJyA9PiBbXHJcbiAgICAvLyAgICAgJ0Z2d0VBaG14S2ZlaUc4U25FdnE0MmhjNndoUnlZM0VGWUF2ZWJNcUROREdDZ3hONVonLFxyXG4gICAgLy8gICAgICcyRGY5NnlIeWhOYzN2b29pZU5OaHlLd3JqRWZUc1YyUmVNbzVGS2pNcHI4dndONEpxeScsXHJcbiAgICAvLyAgICAgJ1NmU1hCekRiOUdaOVIydUg2MXFaS2U4bnhRSFc5S0VSVzlLcTlXUmU0dkhKWlJOM2UnXHJcbiAgICAvLyAgIF1cclxuICAgIC8vIH1cclxuICAgIGNvbnN0IHNlZW5Bc3NldFNlbmRzOiBNYXA8c3RyaW5nLCBzdHJpbmdbXT4gPSBuZXcgTWFwKClcclxuICAgIHRoaXMub3V0cy5mb3JFYWNoKChldm1PdXRwdXQ6IEVWTU91dHB1dCk6IHZvaWQgPT4ge1xyXG4gICAgICBjb25zdCBhZGRyZXNzOiBzdHJpbmcgPSBldm1PdXRwdXQuZ2V0QWRkcmVzc1N0cmluZygpXHJcbiAgICAgIGNvbnN0IGFzc2V0SWQ6IHN0cmluZyA9IGJpbnRvb2xzLmNiNThFbmNvZGUoZXZtT3V0cHV0LmdldEFzc2V0SUQoKSlcclxuICAgICAgaWYgKHNlZW5Bc3NldFNlbmRzLmhhcyhhZGRyZXNzKSkge1xyXG4gICAgICAgIGNvbnN0IGFzc2V0c1NlbnRUb0FkZHJlc3M6IHN0cmluZ1tdID0gc2VlbkFzc2V0U2VuZHMuZ2V0KGFkZHJlc3MpXHJcbiAgICAgICAgaWYgKGFzc2V0c1NlbnRUb0FkZHJlc3MuaW5jbHVkZXMoYXNzZXRJZCkpIHtcclxuICAgICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZTogc3RyaW5nID0gYEVycm9yIC0gSW1wb3J0VHg6IGR1cGxpY2F0ZSAoYWRkcmVzcywgYXNzZXRJZCkgcGFpciBmb3VuZCBpbiBvdXRwdXRzOiAoMHgke2FkZHJlc3N9LCAke2Fzc2V0SWR9KWBcclxuICAgICAgICAgIHRocm93IG5ldyBFVk1PdXRwdXRFcnJvcihlcnJvck1lc3NhZ2UpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFzc2V0c1NlbnRUb0FkZHJlc3MucHVzaChhc3NldElkKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNlZW5Bc3NldFNlbmRzLnNldChhZGRyZXNzLCBbYXNzZXRJZF0pXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvLyBtYWtlIHN1cmUgdGhpcyB0cmFuc2FjdGlvbiBwYXlzIHRoZSByZXF1aXJlZCBqdW5lIGZlZVxyXG4gICAgY29uc3Qgc2VsZWN0ZWROZXR3b3JrOiBudW1iZXIgPSB0aGlzLmdldE5ldHdvcmtJRCgpXHJcbiAgICBjb25zdCBmZWVEaWZmOiBCTiA9IG5ldyBCTigwKVxyXG4gICAgY29uc3QganVuZUFzc2V0SUQ6IHN0cmluZyA9XHJcbiAgICAgIERlZmF1bHRzLm5ldHdvcmtbYCR7c2VsZWN0ZWROZXR3b3JrfWBdLlguanVuZUFzc2V0SURcclxuICAgIC8vIHN1bSBpbmNvbWluZyBKVU5FXHJcbiAgICB0aGlzLmltcG9ydElucy5mb3JFYWNoKChpbnB1dDogVHJhbnNmZXJhYmxlSW5wdXQpOiB2b2lkID0+IHtcclxuICAgICAgLy8gb25seSBjaGVjayBTdGFuZGFyZEFtb3VudElucHV0c1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgaW5wdXQuZ2V0SW5wdXQoKSBpbnN0YW5jZW9mIFN0YW5kYXJkQW1vdW50SW5wdXQgJiZcclxuICAgICAgICBqdW5lQXNzZXRJRCA9PT0gYmludG9vbHMuY2I1OEVuY29kZShpbnB1dC5nZXRBc3NldElEKCkpXHJcbiAgICAgICkge1xyXG4gICAgICAgIGNvbnN0IHVpID0gaW5wdXQuZ2V0SW5wdXQoKSBhcyB1bmtub3duXHJcbiAgICAgICAgY29uc3QgaSA9IHVpIGFzIFN0YW5kYXJkQW1vdW50SW5wdXRcclxuICAgICAgICBmZWVEaWZmLmlhZGQoaS5nZXRBbW91bnQoKSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vIHN1YnRyYWN0IGFsbCBvdXRnb2luZyBKVU5FXHJcbiAgICB0aGlzLm91dHMuZm9yRWFjaCgoZXZtT3V0cHV0OiBFVk1PdXRwdXQpOiB2b2lkID0+IHtcclxuICAgICAgaWYgKGp1bmVBc3NldElEID09PSBiaW50b29scy5jYjU4RW5jb2RlKGV2bU91dHB1dC5nZXRBc3NldElEKCkpKSB7XHJcbiAgICAgICAgZmVlRGlmZi5pc3ViKGV2bU91dHB1dC5nZXRBbW91bnQoKSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGlmIChmZWVEaWZmLmx0KGZlZSkpIHtcclxuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlOiBzdHJpbmcgPSBgRXJyb3IgLSAke2ZlZX0gbkpVTkUgcmVxdWlyZWQgZm9yIGZlZSBhbmQgb25seSAke2ZlZURpZmZ9IG5KVU5FIHByb3ZpZGVkYFxyXG4gICAgICB0aHJvdyBuZXcgRVZNRmVlRXJyb3IoZXJyb3JNZXNzYWdlKVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=