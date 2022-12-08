"use strict";
/**
 * @packageDocumentation
 * @module Common-AssetAmount
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardAssetAmountDestination = exports.AssetAmount = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const errors_1 = require("../utils/errors");
/**
 * Class for managing asset amounts in the UTXOSet fee calcuation
 */
class AssetAmount {
    constructor(assetID, amount, burn) {
        // assetID that is amount is managing.
        this.assetID = buffer_1.Buffer.alloc(32);
        // amount of this asset that should be sent.
        this.amount = new bn_js_1.default(0);
        // burn is the amount of this asset that should be burned.
        this.burn = new bn_js_1.default(0);
        // spent is the total amount of this asset that has been consumed.
        this.spent = new bn_js_1.default(0);
        // stakeableLockSpent is the amount of this asset that has been consumed that
        // was locked.
        this.stakeableLockSpent = new bn_js_1.default(0);
        // change is the excess amount of this asset that was consumed over the amount
        // requested to be consumed(amount + burn).
        this.change = new bn_js_1.default(0);
        // stakeableLockChange is a flag to mark if the input that generated the
        // change was locked.
        this.stakeableLockChange = false;
        // finished is a convenience flag to track "spent >= amount + burn"
        this.finished = false;
        this.getAssetID = () => {
            return this.assetID;
        };
        this.getAssetIDString = () => {
            return this.assetID.toString("hex");
        };
        this.getAmount = () => {
            return this.amount;
        };
        this.getSpent = () => {
            return this.spent;
        };
        this.getBurn = () => {
            return this.burn;
        };
        this.getChange = () => {
            return this.change;
        };
        this.getStakeableLockSpent = () => {
            return this.stakeableLockSpent;
        };
        this.getStakeableLockChange = () => {
            return this.stakeableLockChange;
        };
        this.isFinished = () => {
            return this.finished;
        };
        // spendAmount should only be called if this asset is still awaiting more
        // funds to consume.
        this.spendAmount = (amt, stakeableLocked = false) => {
            if (this.finished) {
                /* istanbul ignore next */
                throw new errors_1.InsufficientFundsError("Error - AssetAmount.spendAmount: attempted to spend " + "excess funds");
            }
            this.spent = this.spent.add(amt);
            if (stakeableLocked) {
                this.stakeableLockSpent = this.stakeableLockSpent.add(amt);
            }
            const total = this.amount.add(this.burn);
            if (this.spent.gte(total)) {
                this.change = this.spent.sub(total);
                if (stakeableLocked) {
                    this.stakeableLockChange = true;
                }
                this.finished = true;
            }
            return this.finished;
        };
        this.assetID = assetID;
        this.amount = typeof amount === "undefined" ? new bn_js_1.default(0) : amount;
        this.burn = typeof burn === "undefined" ? new bn_js_1.default(0) : burn;
        this.spent = new bn_js_1.default(0);
        this.stakeableLockSpent = new bn_js_1.default(0);
        this.stakeableLockChange = false;
    }
}
exports.AssetAmount = AssetAmount;
class StandardAssetAmountDestination {
    constructor(destinations, senders, changeAddresses) {
        this.amounts = [];
        this.destinations = [];
        this.senders = [];
        this.changeAddresses = [];
        this.amountkey = {};
        this.inputs = [];
        this.outputs = [];
        this.change = [];
        // TODO: should this function allow for repeated calls with the same
        //       assetID?
        this.addAssetAmount = (assetID, amount, burn) => {
            let aa = new AssetAmount(assetID, amount, burn);
            this.amounts.push(aa);
            this.amountkey[aa.getAssetIDString()] = aa;
        };
        this.addInput = (input) => {
            this.inputs.push(input);
        };
        this.addOutput = (output) => {
            this.outputs.push(output);
        };
        this.addChange = (output) => {
            this.change.push(output);
        };
        this.getAmounts = () => {
            return this.amounts;
        };
        this.getDestinations = () => {
            return this.destinations;
        };
        this.getSenders = () => {
            return this.senders;
        };
        this.getChangeAddresses = () => {
            return this.changeAddresses;
        };
        this.getAssetAmount = (assetHexStr) => {
            return this.amountkey[`${assetHexStr}`];
        };
        this.assetExists = (assetHexStr) => {
            return assetHexStr in this.amountkey;
        };
        this.getInputs = () => {
            return this.inputs;
        };
        this.getOutputs = () => {
            return this.outputs;
        };
        this.getChangeOutputs = () => {
            return this.change;
        };
        this.getAllOutputs = () => {
            return this.outputs.concat(this.change);
        };
        this.canComplete = () => {
            for (let i = 0; i < this.amounts.length; i++) {
                if (!this.amounts[`${i}`].isFinished()) {
                    return false;
                }
            }
            return true;
        };
        this.destinations = destinations;
        this.changeAddresses = changeAddresses;
        this.senders = senders;
    }
}
exports.StandardAssetAmountDestination = StandardAssetAmountDestination;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRhbW91bnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2Fzc2V0YW1vdW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7OztBQUVILG9DQUFnQztBQUNoQyxrREFBc0I7QUFHdEIsNENBQXdEO0FBRXhEOztHQUVHO0FBQ0gsTUFBYSxXQUFXO0lBcUZ0QixZQUFZLE9BQWUsRUFBRSxNQUFVLEVBQUUsSUFBUTtRQXBGakQsc0NBQXNDO1FBQzVCLFlBQU8sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzVDLDRDQUE0QztRQUNsQyxXQUFNLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMsMERBQTBEO1FBQ2hELFNBQUksR0FBTyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUU5QixrRUFBa0U7UUFDeEQsVUFBSyxHQUFPLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQy9CLDZFQUE2RTtRQUM3RSxjQUFjO1FBQ0osdUJBQWtCLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFNUMsOEVBQThFO1FBQzlFLDJDQUEyQztRQUNqQyxXQUFNLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDaEMsd0VBQXdFO1FBQ3hFLHFCQUFxQjtRQUNYLHdCQUFtQixHQUFZLEtBQUssQ0FBQTtRQUU5QyxtRUFBbUU7UUFDekQsYUFBUSxHQUFZLEtBQUssQ0FBQTtRQUVuQyxlQUFVLEdBQUcsR0FBVyxFQUFFO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtRQUNyQixDQUFDLENBQUE7UUFFRCxxQkFBZ0IsR0FBRyxHQUFXLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNyQyxDQUFDLENBQUE7UUFFRCxj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QUNiLENBQUMsQ0FBQTtRQU9DLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBO1FBQ2hDLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFBO1FBQ3RDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO0lBQ3hCLENBQUM7Q0FDRjtBQTNGRCx3RUEyRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXHJcbiAqIEBtb2R1bGUgQ29tbW9uLUFzc2V0QW1vdW50XHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxyXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcclxuaW1wb3J0IHsgU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRcIlxyXG5pbXBvcnQgeyBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRcIlxyXG5pbXBvcnQgeyBJbnN1ZmZpY2llbnRGdW5kc0Vycm9yIH0gZnJvbSBcIi4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogQ2xhc3MgZm9yIG1hbmFnaW5nIGFzc2V0IGFtb3VudHMgaW4gdGhlIFVUWE9TZXQgZmVlIGNhbGN1YXRpb25cclxuICovXHJcbmV4cG9ydCBjbGFzcyBBc3NldEFtb3VudCB7XHJcbiAgLy8gYXNzZXRJRCB0aGF0IGlzIGFtb3VudCBpcyBtYW5hZ2luZy5cclxuICBwcm90ZWN0ZWQgYXNzZXRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxyXG4gIC8vIGFtb3VudCBvZiB0aGlzIGFzc2V0IHRoYXQgc2hvdWxkIGJlIHNlbnQuXHJcbiAgcHJvdGVjdGVkIGFtb3VudDogQk4gPSBuZXcgQk4oMClcclxuICAvLyBidXJuIGlzIHRoZSBhbW91bnQgb2YgdGhpcyBhc3NldCB0aGF0IHNob3VsZCBiZSBidXJuZWQuXHJcbiAgcHJvdGVjdGVkIGJ1cm46IEJOID0gbmV3IEJOKDApXHJcblxyXG4gIC8vIHNwZW50IGlzIHRoZSB0b3RhbCBhbW91bnQgb2YgdGhpcyBhc3NldCB0aGF0IGhhcyBiZWVuIGNvbnN1bWVkLlxyXG4gIHByb3RlY3RlZCBzcGVudDogQk4gPSBuZXcgQk4oMClcclxuICAvLyBzdGFrZWFibGVMb2NrU3BlbnQgaXMgdGhlIGFtb3VudCBvZiB0aGlzIGFzc2V0IHRoYXQgaGFzIGJlZW4gY29uc3VtZWQgdGhhdFxyXG4gIC8vIHdhcyBsb2NrZWQuXHJcbiAgcHJvdGVjdGVkIHN0YWtlYWJsZUxvY2tTcGVudDogQk4gPSBuZXcgQk4oMClcclxuXHJcbiAgLy8gY2hhbmdlIGlzIHRoZSBleGNlc3MgYW1vdW50IG9mIHRoaXMgYXNzZXQgdGhhdCB3YXMgY29uc3VtZWQgb3ZlciB0aGUgYW1vdW50XHJcbiAgLy8gcmVxdWVzdGVkIHRvIGJlIGNvbnN1bWVkKGFtb3VudCArIGJ1cm4pLlxyXG4gIHByb3RlY3RlZCBjaGFuZ2U6IEJOID0gbmV3IEJOKDApXHJcbiAgLy8gc3Rha2VhYmxlTG9ja0NoYW5nZSBpcyBhIGZsYWcgdG8gbWFyayBpZiB0aGUgaW5wdXQgdGhhdCBnZW5lcmF0ZWQgdGhlXHJcbiAgLy8gY2hhbmdlIHdhcyBsb2NrZWQuXHJcbiAgcHJvdGVjdGVkIHN0YWtlYWJsZUxvY2tDaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZVxyXG5cclxuICAvLyBmaW5pc2hlZCBpcyBhIGNvbnZlbmllbmNlIGZsYWcgdG8gdHJhY2sgXCJzcGVudCA+PSBhbW91bnQgKyBidXJuXCJcclxuICBwcm90ZWN0ZWQgZmluaXNoZWQ6IGJvb2xlYW4gPSBmYWxzZVxyXG5cclxuICBnZXRBc3NldElEID0gKCk6IEJ1ZmZlciA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5hc3NldElEXHJcbiAgfVxyXG5cclxuICBnZXRBc3NldElEU3RyaW5nID0gKCk6IHN0cmluZyA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5hc3NldElELnRvU3RyaW5nKFwiaGV4XCIpXHJcbiAgfVxyXG5cclxuICBnZXRBbW91bnQgPSAoKTogQk4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuYW1vdW50XHJcbiAgfVxyXG5cclxuICBnZXRTcGVudCA9ICgpOiBCTiA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5zcGVudFxyXG4gIH1cclxuXHJcbiAgZ2V0QnVybiA9ICgpOiBCTiA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5idXJuXHJcbiAgfVxyXG5cclxuICBnZXRDaGFuZ2UgPSAoKTogQk4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlXHJcbiAgfVxyXG5cclxuICBnZXRTdGFrZWFibGVMb2NrU3BlbnQgPSAoKTogQk4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuc3Rha2VhYmxlTG9ja1NwZW50XHJcbiAgfVxyXG5cclxuICBnZXRTdGFrZWFibGVMb2NrQ2hhbmdlID0gKCk6IGJvb2xlYW4gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuc3Rha2VhYmxlTG9ja0NoYW5nZVxyXG4gIH1cclxuXHJcbiAgaXNGaW5pc2hlZCA9ICgpOiBib29sZWFuID0+IHtcclxuICAgIHJldHVybiB0aGlzLmZpbmlzaGVkXHJcbiAgfVxyXG5cclxuICAvLyBzcGVuZEFtb3VudCBzaG91bGQgb25seSBiZSBjYWxsZWQgaWYgdGhpcyBhc3NldCBpcyBzdGlsbCBhd2FpdGluZyBtb3JlXHJcbiAgLy8gZnVuZHMgdG8gY29uc3VtZS5cclxuICBzcGVuZEFtb3VudCA9IChhbXQ6IEJOLCBzdGFrZWFibGVMb2NrZWQ6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4gPT4ge1xyXG4gICAgaWYgKHRoaXMuZmluaXNoZWQpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICAgICAgdGhyb3cgbmV3IEluc3VmZmljaWVudEZ1bmRzRXJyb3IoXHJcbiAgICAgICAgXCJFcnJvciAtIEFzc2V0QW1vdW50LnNwZW5kQW1vdW50OiBhdHRlbXB0ZWQgdG8gc3BlbmQgXCIgKyBcImV4Y2VzcyBmdW5kc1wiXHJcbiAgICAgIClcclxuICAgIH1cclxuICAgIHRoaXMuc3BlbnQgPSB0aGlzLnNwZW50LmFkZChhbXQpXHJcbiAgICBpZiAoc3Rha2VhYmxlTG9ja2VkKSB7XHJcbiAgICAgIHRoaXMuc3Rha2VhYmxlTG9ja1NwZW50ID0gdGhpcy5zdGFrZWFibGVMb2NrU3BlbnQuYWRkKGFtdClcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0b3RhbDogQk4gPSB0aGlzLmFtb3VudC5hZGQodGhpcy5idXJuKVxyXG4gICAgaWYgKHRoaXMuc3BlbnQuZ3RlKHRvdGFsKSkge1xyXG4gICAgICB0aGlzLmNoYW5nZSA9IHRoaXMuc3BlbnQuc3ViKHRvdGFsKVxyXG4gICAgICBpZiAoc3Rha2VhYmxlTG9ja2VkKSB7XHJcbiAgICAgICAgdGhpcy5zdGFrZWFibGVMb2NrQ2hhbmdlID0gdHJ1ZVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuZmluaXNoZWQgPSB0cnVlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5maW5pc2hlZFxyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IoYXNzZXRJRDogQnVmZmVyLCBhbW91bnQ6IEJOLCBidXJuOiBCTikge1xyXG4gICAgdGhpcy5hc3NldElEID0gYXNzZXRJRFxyXG4gICAgdGhpcy5hbW91bnQgPSB0eXBlb2YgYW1vdW50ID09PSBcInVuZGVmaW5lZFwiID8gbmV3IEJOKDApIDogYW1vdW50XHJcbiAgICB0aGlzLmJ1cm4gPSB0eXBlb2YgYnVybiA9PT0gXCJ1bmRlZmluZWRcIiA/IG5ldyBCTigwKSA6IGJ1cm5cclxuICAgIHRoaXMuc3BlbnQgPSBuZXcgQk4oMClcclxuICAgIHRoaXMuc3Rha2VhYmxlTG9ja1NwZW50ID0gbmV3IEJOKDApXHJcbiAgICB0aGlzLnN0YWtlYWJsZUxvY2tDaGFuZ2UgPSBmYWxzZVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbjxcclxuICBUTyBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0LFxyXG4gIFRJIGV4dGVuZHMgU3RhbmRhcmRUcmFuc2ZlcmFibGVJbnB1dFxyXG4+IHtcclxuICBwcm90ZWN0ZWQgYW1vdW50czogQXNzZXRBbW91bnRbXSA9IFtdXHJcbiAgcHJvdGVjdGVkIGRlc3RpbmF0aW9uczogQnVmZmVyW10gPSBbXVxyXG4gIHByb3RlY3RlZCBzZW5kZXJzOiBCdWZmZXJbXSA9IFtdXHJcbiAgcHJvdGVjdGVkIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10gPSBbXVxyXG4gIHByb3RlY3RlZCBhbW91bnRrZXk6IG9iamVjdCA9IHt9XHJcbiAgcHJvdGVjdGVkIGlucHV0czogVElbXSA9IFtdXHJcbiAgcHJvdGVjdGVkIG91dHB1dHM6IFRPW10gPSBbXVxyXG4gIHByb3RlY3RlZCBjaGFuZ2U6IFRPW10gPSBbXVxyXG5cclxuICAvLyBUT0RPOiBzaG91bGQgdGhpcyBmdW5jdGlvbiBhbGxvdyBmb3IgcmVwZWF0ZWQgY2FsbHMgd2l0aCB0aGUgc2FtZVxyXG4gIC8vICAgICAgIGFzc2V0SUQ/XHJcbiAgYWRkQXNzZXRBbW91bnQgPSAoYXNzZXRJRDogQnVmZmVyLCBhbW91bnQ6IEJOLCBidXJuOiBCTikgPT4ge1xyXG4gICAgbGV0IGFhOiBBc3NldEFtb3VudCA9IG5ldyBBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIGJ1cm4pXHJcbiAgICB0aGlzLmFtb3VudHMucHVzaChhYSlcclxuICAgIHRoaXMuYW1vdW50a2V5W2FhLmdldEFzc2V0SURTdHJpbmcoKV0gPSBhYVxyXG4gIH1cclxuXHJcbiAgYWRkSW5wdXQgPSAoaW5wdXQ6IFRJKSA9PiB7XHJcbiAgICB0aGlzLmlucHV0cy5wdXNoKGlucHV0KVxyXG4gIH1cclxuXHJcbiAgYWRkT3V0cHV0ID0gKG91dHB1dDogVE8pID0+IHtcclxuICAgIHRoaXMub3V0cHV0cy5wdXNoKG91dHB1dClcclxuICB9XHJcblxyXG4gIGFkZENoYW5nZSA9IChvdXRwdXQ6IFRPKSA9PiB7XHJcbiAgICB0aGlzLmNoYW5nZS5wdXNoKG91dHB1dClcclxuICB9XHJcblxyXG4gIGdldEFtb3VudHMgPSAoKTogQXNzZXRBbW91bnRbXSA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5hbW91bnRzXHJcbiAgfVxyXG5cclxuICBnZXREZXN0aW5hdGlvbnMgPSAoKTogQnVmZmVyW10gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuZGVzdGluYXRpb25zXHJcbiAgfVxyXG5cclxuICBnZXRTZW5kZXJzID0gKCk6IEJ1ZmZlcltdID0+IHtcclxuICAgIHJldHVybiB0aGlzLnNlbmRlcnNcclxuICB9XHJcblxyXG4gIGdldENoYW5nZUFkZHJlc3NlcyA9ICgpOiBCdWZmZXJbXSA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VBZGRyZXNzZXNcclxuICB9XHJcblxyXG4gIGdldEFzc2V0QW1vdW50ID0gKGFzc2V0SGV4U3RyOiBzdHJpbmcpOiBBc3NldEFtb3VudCA9PiB7XHJcbiAgICByZXR1cm4gdGhpcy5hbW91bnRrZXlbYCR7YXNzZXRIZXhTdHJ9YF1cclxuICB9XHJcblxyXG4gIGFzc2V0RXhpc3RzID0gKGFzc2V0SGV4U3RyOiBzdHJpbmcpOiBib29sZWFuID0+IHtcclxuICAgIHJldHVybiBhc3NldEhleFN0ciBpbiB0aGlzLmFtb3VudGtleVxyXG4gIH1cclxuXHJcbiAgZ2V0SW5wdXRzID0gKCk6IFRJW10gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuaW5wdXRzXHJcbiAgfVxyXG5cclxuICBnZXRPdXRwdXRzID0gKCk6IFRPW10gPT4ge1xyXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0c1xyXG4gIH1cclxuXHJcbiAgZ2V0Q2hhbmdlT3V0cHV0cyA9ICgpOiBUT1tdID0+IHtcclxuICAgIHJldHVybiB0aGlzLmNoYW5nZVxyXG4gIH1cclxuXHJcbiAgZ2V0QWxsT3V0cHV0cyA9ICgpOiBUT1tdID0+IHtcclxuICAgIHJldHVybiB0aGlzLm91dHB1dHMuY29uY2F0KHRoaXMuY2hhbmdlKVxyXG4gIH1cclxuXHJcbiAgY2FuQ29tcGxldGUgPSAoKTogYm9vbGVhbiA9PiB7XHJcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5hbW91bnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmICghdGhpcy5hbW91bnRzW2Ake2l9YF0uaXNGaW5pc2hlZCgpKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIGRlc3RpbmF0aW9uczogQnVmZmVyW10sXHJcbiAgICBzZW5kZXJzOiBCdWZmZXJbXSxcclxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW11cclxuICApIHtcclxuICAgIHRoaXMuZGVzdGluYXRpb25zID0gZGVzdGluYXRpb25zXHJcbiAgICB0aGlzLmNoYW5nZUFkZHJlc3NlcyA9IGNoYW5nZUFkZHJlc3Nlc1xyXG4gICAgdGhpcy5zZW5kZXJzID0gc2VuZGVyc1xyXG4gIH1cclxufVxyXG4iXX0=