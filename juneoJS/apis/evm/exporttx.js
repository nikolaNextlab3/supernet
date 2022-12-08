"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-ExportTx
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportTx = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const basetx_1 = require("./basetx");
const credentials_1 = require("./credentials");
const credentials_2 = require("../../common/credentials");
const inputs_1 = require("./inputs");
const serialization_1 = require("../../utils/serialization");
const outputs_1 = require("./outputs");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
class ExportTx extends basetx_1.EVMBaseTx {
    /**
     * Class representing a ExportTx.
     *
     * @param networkID Optional networkID
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param destinationChain Optional destinationChain, default Buffer.alloc(32, 16)
     * @param inputs Optional array of the [[EVMInputs]]s
     * @param exportedOutputs Optional array of the [[EVMOutputs]]s
     */
    constructor(networkID = undefined, blockchainID = buffer_1.Buffer.alloc(32, 16), destinationChain = buffer_1.Buffer.alloc(32, 16), inputs = undefined, exportedOutputs = undefined) {
        super(networkID, blockchainID);
        this._typeName = "ExportTx";
        this._typeID = constants_1.EVMConstants.EXPORTTX;
        this.destinationChain = buffer_1.Buffer.alloc(32);
        this.numInputs = buffer_1.Buffer.alloc(4);
        this.inputs = [];
        this.numExportedOutputs = buffer_1.Buffer.alloc(4);
        this.exportedOutputs = [];
        this.destinationChain = destinationChain;
        if (typeof inputs !== "undefined" && Array.isArray(inputs)) {
            inputs.forEach((input) => {
                if (!(input instanceof inputs_1.EVMInput)) {
                    throw new errors_1.EVMInputError("Error - ExportTx.constructor: invalid EVMInput in array parameter 'inputs'");
                }
            });
            if (inputs.length > 1) {
                inputs = inputs.sort(inputs_1.EVMInput.comparator());
            }
            this.inputs = inputs;
        }
        if (typeof exportedOutputs !== "undefined" &&
            Array.isArray(exportedOutputs)) {
            exportedOutputs.forEach((exportedOutput) => {
                if (!(exportedOutput instanceof outputs_1.TransferableOutput)) {
                    throw new errors_1.TransferableOutputError("Error - ExportTx.constructor: TransferableOutput EVMInput in array parameter 'exportedOutputs'");
                }
            });
            this.exportedOutputs = exportedOutputs;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { destinationChain: serializer.encoder(this.destinationChain, encoding, "Buffer", "cb58"), exportedOutputs: this.exportedOutputs.map((i) => i.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.destinationChain = serializer.decoder(fields["destinationChain"], encoding, "cb58", "Buffer", 32);
        this.exportedOutputs = fields["exportedOutputs"].map((i) => {
            let eo = new outputs_1.TransferableOutput();
            eo.deserialize(i, encoding);
            return eo;
        });
        this.numExportedOutputs = buffer_1.Buffer.alloc(4);
        this.numExportedOutputs.writeUInt32BE(this.exportedOutputs.length, 0);
    }
    /**
     * Returns the destinationChain as a {@link https://github.com/feross/buffer|Buffer}
     */
    getDestinationChain() {
        return this.destinationChain;
    }
    /**
     * Returns the inputs as an array of [[EVMInputs]]
     */
    getInputs() {
        return this.inputs;
    }
    /**
     * Returns the outs as an array of [[EVMOutputs]]
     */
    getExportedOutputs() {
        return this.exportedOutputs;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
     */
    toBuffer() {
        if (typeof this.destinationChain === "undefined") {
            throw new errors_1.ChainIdError("ExportTx.toBuffer -- this.destinationChain is undefined");
        }
        this.numInputs.writeUInt32BE(this.inputs.length, 0);
        this.numExportedOutputs.writeUInt32BE(this.exportedOutputs.length, 0);
        let barr = [
            super.toBuffer(),
            this.destinationChain,
            this.numInputs
        ];
        let bsize = super.toBuffer().length +
            this.destinationChain.length +
            this.numInputs.length;
        this.inputs.forEach((importIn) => {
            bsize += importIn.toBuffer().length;
            barr.push(importIn.toBuffer());
        });
        bsize += this.numExportedOutputs.length;
        barr.push(this.numExportedOutputs);
        this.exportedOutputs.forEach((out) => {
            bsize += out.toBuffer().length;
            barr.push(out.toBuffer());
        });
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Decodes the [[ExportTx]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numInputs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numInputs = this.numInputs.readUInt32BE(0);
        for (let i = 0; i < numInputs; i++) {
            const anIn = new inputs_1.EVMInput();
            offset = anIn.fromBuffer(bytes, offset);
            this.inputs.push(anIn);
        }
        this.numExportedOutputs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numExportedOutputs = this.numExportedOutputs.readUInt32BE(0);
        for (let i = 0; i < numExportedOutputs; i++) {
            const anOut = new outputs_1.TransferableOutput();
            offset = anOut.fromBuffer(bytes, offset);
            this.exportedOutputs.push(anOut);
        }
        return offset;
    }
    /**
     * Returns a base-58 representation of the [[ExportTx]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
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
        this.inputs.forEach((input) => {
            const cred = (0, credentials_1.SelectCredentialClass)(input.getCredentialID());
            const sigidxs = input.getSigIdxs();
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
}
exports.ExportTx = ExportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vZXhwb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBMEM7QUFFMUMscUNBQW9DO0FBQ3BDLCtDQUFxRDtBQUNyRCwwREFBd0U7QUFDeEUscUNBQW1DO0FBQ25DLDZEQUE2RTtBQUM3RSx1Q0FBOEM7QUFDOUMsK0NBSTJCO0FBRTNCOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLFVBQVUsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUU3RCxNQUFhLFFBQVMsU0FBUSxrQkFBUztJQXlKckM7Ozs7Ozs7O09BUUc7SUFDSCxZQUNFLFlBQW9CLFNBQVMsRUFDN0IsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLG1CQUEyQixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDL0MsU0FBcUIsU0FBUyxFQUM5QixrQkFBd0MsU0FBUztRQUVqRCxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBeEt0QixjQUFTLEdBQUcsVUFBVSxDQUFBO1FBQ3RCLFlBQU8sR0FBRyx3QkFBWSxDQUFDLFFBQVEsQ0FBQTtRQWlDL0IscUJBQWdCLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUMzQyxjQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuQyxXQUFNLEdBQWUsRUFBRSxDQUFBO1FBQ3ZCLHVCQUFrQixHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDNUMsb0JBQWUsR0FBeUIsRUFBRSxDQUFB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QyxNQUFNLEdBQUcsR0FBYyxJQUFJLHVCQUFTLEVBQUUsQ0FBQTtnQkFDdEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN4QixDQUFDLENBQUMsQ0FBQTtZQUNGLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDbEIsQ0FBQyxDQUFDLENBQUE7UUFDRixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7Q0ErQ0Y7QUF0TUQsNEJBc01DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1FVk0tRXhwb3J0VHhcclxuICovXHJcblxyXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXHJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxyXG5pbXBvcnQgeyBFVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcclxuaW1wb3J0IHsgRVZNQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcclxuaW1wb3J0IHsgU2VsZWN0Q3JlZGVudGlhbENsYXNzIH0gZnJvbSBcIi4vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBTaWduYXR1cmUsIFNpZ0lkeCwgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxyXG5pbXBvcnQgeyBFVk1JbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXHJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcclxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXHJcbmltcG9ydCB7XHJcbiAgQ2hhaW5JZEVycm9yLFxyXG4gIEVWTUlucHV0RXJyb3IsXHJcbiAgVHJhbnNmZXJhYmxlT3V0cHV0RXJyb3JcclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbi8qKlxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXHJcbmNvbnN0IHNlcmlhbGl6ZXI6IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcclxuXHJcbmV4cG9ydCBjbGFzcyBFeHBvcnRUeCBleHRlbmRzIEVWTUJhc2VUeCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiRXhwb3J0VHhcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gRVZNQ29uc3RhbnRzLkVYUE9SVFRYXHJcblxyXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XHJcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAuLi5maWVsZHMsXHJcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW46IHNlcmlhbGl6ZXIuZW5jb2RlcihcclxuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sXHJcbiAgICAgICAgZW5jb2RpbmcsXHJcbiAgICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgICBcImNiNThcIlxyXG4gICAgICApLFxyXG4gICAgICBleHBvcnRlZE91dHB1dHM6IHRoaXMuZXhwb3J0ZWRPdXRwdXRzLm1hcCgoaSkgPT4gaS5zZXJpYWxpemUoZW5jb2RpbmcpKVxyXG4gICAgfVxyXG4gIH1cclxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcclxuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXHJcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBzZXJpYWxpemVyLmRlY29kZXIoXHJcbiAgICAgIGZpZWxkc1tcImRlc3RpbmF0aW9uQ2hhaW5cIl0sXHJcbiAgICAgIGVuY29kaW5nLFxyXG4gICAgICBcImNiNThcIixcclxuICAgICAgXCJCdWZmZXJcIixcclxuICAgICAgMzJcclxuICAgIClcclxuICAgIHRoaXMuZXhwb3J0ZWRPdXRwdXRzID0gZmllbGRzW1wiZXhwb3J0ZWRPdXRwdXRzXCJdLm1hcCgoaTogb2JqZWN0KSA9PiB7XHJcbiAgICAgIGxldCBlbzogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXHJcbiAgICAgIGVvLmRlc2VyaWFsaXplKGksIGVuY29kaW5nKVxyXG4gICAgICByZXR1cm4gZW9cclxuICAgIH0pXHJcbiAgICB0aGlzLm51bUV4cG9ydGVkT3V0cHV0cyA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gICAgdGhpcy5udW1FeHBvcnRlZE91dHB1dHMud3JpdGVVSW50MzJCRSh0aGlzLmV4cG9ydGVkT3V0cHV0cy5sZW5ndGgsIDApXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG4gIHByb3RlY3RlZCBudW1JbnB1dHM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gIHByb3RlY3RlZCBpbnB1dHM6IEVWTUlucHV0W10gPSBbXVxyXG4gIHByb3RlY3RlZCBudW1FeHBvcnRlZE91dHB1dHM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxyXG4gIHByb3RlY3RlZCBleHBvcnRlZE91dHB1dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgZGVzdGluYXRpb25DaGFpbiBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XHJcbiAgICovXHJcbiAgZ2V0RGVzdGluYXRpb25DaGFpbigpOiBCdWZmZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuZGVzdGluYXRpb25DaGFpblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgaW5wdXRzIGFzIGFuIGFycmF5IG9mIFtbRVZNSW5wdXRzXV1cclxuICAgKi9cclxuICBnZXRJbnB1dHMoKTogRVZNSW5wdXRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5pbnB1dHNcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG91dHMgYXMgYW4gYXJyYXkgb2YgW1tFVk1PdXRwdXRzXV1cclxuICAgKi9cclxuICBnZXRFeHBvcnRlZE91dHB1dHMoKTogVHJhbnNmZXJhYmxlT3V0cHV0W10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZXhwb3J0ZWRPdXRwdXRzXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbRXhwb3J0VHhdXS5cclxuICAgKi9cclxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xyXG4gICAgaWYgKHR5cGVvZiB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcclxuICAgICAgICBcIkV4cG9ydFR4LnRvQnVmZmVyIC0tIHRoaXMuZGVzdGluYXRpb25DaGFpbiBpcyB1bmRlZmluZWRcIlxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgICB0aGlzLm51bUlucHV0cy53cml0ZVVJbnQzMkJFKHRoaXMuaW5wdXRzLmxlbmd0aCwgMClcclxuICAgIHRoaXMubnVtRXhwb3J0ZWRPdXRwdXRzLndyaXRlVUludDMyQkUodGhpcy5leHBvcnRlZE91dHB1dHMubGVuZ3RoLCAwKVxyXG4gICAgbGV0IGJhcnI6IEJ1ZmZlcltdID0gW1xyXG4gICAgICBzdXBlci50b0J1ZmZlcigpLFxyXG4gICAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sXHJcbiAgICAgIHRoaXMubnVtSW5wdXRzXHJcbiAgICBdXHJcbiAgICBsZXQgYnNpemU6IG51bWJlciA9XHJcbiAgICAgIHN1cGVyLnRvQnVmZmVyKCkubGVuZ3RoICtcclxuICAgICAgdGhpcy5kZXN0aW5hdGlvbkNoYWluLmxlbmd0aCArXHJcbiAgICAgIHRoaXMubnVtSW5wdXRzLmxlbmd0aFxyXG4gICAgdGhpcy5pbnB1dHMuZm9yRWFjaCgoaW1wb3J0SW46IEVWTUlucHV0KSA9PiB7XHJcbiAgICAgIGJzaXplICs9IGltcG9ydEluLnRvQnVmZmVyKCkubGVuZ3RoXHJcbiAgICAgIGJhcnIucHVzaChpbXBvcnRJbi50b0J1ZmZlcigpKVxyXG4gICAgfSlcclxuICAgIGJzaXplICs9IHRoaXMubnVtRXhwb3J0ZWRPdXRwdXRzLmxlbmd0aFxyXG4gICAgYmFyci5wdXNoKHRoaXMubnVtRXhwb3J0ZWRPdXRwdXRzKVxyXG4gICAgdGhpcy5leHBvcnRlZE91dHB1dHMuZm9yRWFjaCgob3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQpID0+IHtcclxuICAgICAgYnNpemUgKz0gb3V0LnRvQnVmZmVyKCkubGVuZ3RoXHJcbiAgICAgIGJhcnIucHVzaChvdXQudG9CdWZmZXIoKSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlY29kZXMgdGhlIFtbRXhwb3J0VHhdXSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIHRoZSBzaXplLlxyXG4gICAqL1xyXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxyXG4gICAgb2Zmc2V0ICs9IDMyXHJcbiAgICB0aGlzLm51bUlucHV0cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgY29uc3QgbnVtSW5wdXRzOiBudW1iZXIgPSB0aGlzLm51bUlucHV0cy5yZWFkVUludDMyQkUoMClcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1JbnB1dHM7IGkrKykge1xyXG4gICAgICBjb25zdCBhbkluOiBFVk1JbnB1dCA9IG5ldyBFVk1JbnB1dCgpXHJcbiAgICAgIG9mZnNldCA9IGFuSW4uZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxyXG4gICAgICB0aGlzLmlucHV0cy5wdXNoKGFuSW4pXHJcbiAgICB9XHJcbiAgICB0aGlzLm51bUV4cG9ydGVkT3V0cHV0cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXHJcbiAgICBvZmZzZXQgKz0gNFxyXG4gICAgY29uc3QgbnVtRXhwb3J0ZWRPdXRwdXRzOiBudW1iZXIgPSB0aGlzLm51bUV4cG9ydGVkT3V0cHV0cy5yZWFkVUludDMyQkUoMClcclxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1FeHBvcnRlZE91dHB1dHM7IGkrKykge1xyXG4gICAgICBjb25zdCBhbk91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXHJcbiAgICAgIG9mZnNldCA9IGFuT3V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcclxuICAgICAgdGhpcy5leHBvcnRlZE91dHB1dHMucHVzaChhbk91dClcclxuICAgIH1cclxuICAgIHJldHVybiBvZmZzZXRcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0V4cG9ydFR4XV0uXHJcbiAgICovXHJcbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cclxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xyXG4gICAqXHJcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXHJcbiAgICovXHJcbiAgc2lnbihtc2c6IEJ1ZmZlciwga2M6IEtleUNoYWluKTogQ3JlZGVudGlhbFtdIHtcclxuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBzdXBlci5zaWduKG1zZywga2MpXHJcbiAgICB0aGlzLmlucHV0cy5mb3JFYWNoKChpbnB1dDogRVZNSW5wdXQpID0+IHtcclxuICAgICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhpbnB1dC5nZXRDcmVkZW50aWFsSUQoKSlcclxuICAgICAgY29uc3Qgc2lnaWR4czogU2lnSWR4W10gPSBpbnB1dC5nZXRTaWdJZHhzKClcclxuICAgICAgc2lnaWR4cy5mb3JFYWNoKChzaWdpZHg6IFNpZ0lkeCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4LmdldFNvdXJjZSgpKVxyXG4gICAgICAgIGNvbnN0IHNpZ252YWw6IEJ1ZmZlciA9IGtleXBhaXIuc2lnbihtc2cpXHJcbiAgICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcclxuICAgICAgICBzaWcuZnJvbUJ1ZmZlcihzaWdudmFsKVxyXG4gICAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcclxuICAgICAgfSlcclxuICAgICAgY3JlZHMucHVzaChjcmVkKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBjcmVkc1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgRXhwb3J0VHguXHJcbiAgICpcclxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRFxyXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXHJcbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwgZGVzdGluYXRpb25DaGFpbiwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxyXG4gICAqIEBwYXJhbSBpbnB1dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbRVZNSW5wdXRzXV1zXHJcbiAgICogQHBhcmFtIGV4cG9ydGVkT3V0cHV0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tFVk1PdXRwdXRzXV1zXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IHVuZGVmaW5lZCxcclxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXHJcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcclxuICAgIGlucHV0czogRVZNSW5wdXRbXSA9IHVuZGVmaW5lZCxcclxuICAgIGV4cG9ydGVkT3V0cHV0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWRcclxuICApIHtcclxuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklEKVxyXG4gICAgdGhpcy5kZXN0aW5hdGlvbkNoYWluID0gZGVzdGluYXRpb25DaGFpblxyXG4gICAgaWYgKHR5cGVvZiBpbnB1dHMgIT09IFwidW5kZWZpbmVkXCIgJiYgQXJyYXkuaXNBcnJheShpbnB1dHMpKSB7XHJcbiAgICAgIGlucHV0cy5mb3JFYWNoKChpbnB1dDogRVZNSW5wdXQpID0+IHtcclxuICAgICAgICBpZiAoIShpbnB1dCBpbnN0YW5jZW9mIEVWTUlucHV0KSkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVWTUlucHV0RXJyb3IoXHJcbiAgICAgICAgICAgIFwiRXJyb3IgLSBFeHBvcnRUeC5jb25zdHJ1Y3RvcjogaW52YWxpZCBFVk1JbnB1dCBpbiBhcnJheSBwYXJhbWV0ZXIgJ2lucHV0cydcIlxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgaWYgKGlucHV0cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgaW5wdXRzID0gaW5wdXRzLnNvcnQoRVZNSW5wdXQuY29tcGFyYXRvcigpKVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuaW5wdXRzID0gaW5wdXRzXHJcbiAgICB9XHJcbiAgICBpZiAoXHJcbiAgICAgIHR5cGVvZiBleHBvcnRlZE91dHB1dHMgIT09IFwidW5kZWZpbmVkXCIgJiZcclxuICAgICAgQXJyYXkuaXNBcnJheShleHBvcnRlZE91dHB1dHMpXHJcbiAgICApIHtcclxuICAgICAgZXhwb3J0ZWRPdXRwdXRzLmZvckVhY2goKGV4cG9ydGVkT3V0cHV0OiBUcmFuc2ZlcmFibGVPdXRwdXQpID0+IHtcclxuICAgICAgICBpZiAoIShleHBvcnRlZE91dHB1dCBpbnN0YW5jZW9mIFRyYW5zZmVyYWJsZU91dHB1dCkpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXRFcnJvcihcclxuICAgICAgICAgICAgXCJFcnJvciAtIEV4cG9ydFR4LmNvbnN0cnVjdG9yOiBUcmFuc2ZlcmFibGVPdXRwdXQgRVZNSW5wdXQgaW4gYXJyYXkgcGFyYW1ldGVyICdleHBvcnRlZE91dHB1dHMnXCJcclxuICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIHRoaXMuZXhwb3J0ZWRPdXRwdXRzID0gZXhwb3J0ZWRPdXRwdXRzXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==