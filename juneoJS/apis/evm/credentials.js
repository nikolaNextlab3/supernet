"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-Credentials
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECPCredential = exports.SelectCredentialClass = void 0;
const constants_1 = require("./constants");
const credentials_1 = require("../../common/credentials");
const errors_1 = require("../../utils/errors");
/**
 * Takes a buffer representing the credential and returns the proper [[Credential]] instance.
 *
 * @param credid A number representing the credential ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Credential]]-extended class.
 */
const SelectCredentialClass = (credid, ...args) => {
    if (credid === constants_1.EVMConstants.SECPCREDENTIAL) {
        return new SECPCredential(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.CredIdError("Error - SelectCredentialClass: unknown credid");
};
exports.SelectCredentialClass = SelectCredentialClass;
class SECPCredential extends credentials_1.Credential {
    constructor() {
        super(...arguments);
        this._typeName = "SECPCredential";
        this._typeID = constants_1.EVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    getCredentialID() {
        return this._typeID;
    }
    clone() {
        let newbase = new SECPCredential();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new SECPCredential(...args);
    }
    select(id, ...args) {
        let credential = (0, exports.SelectCredentialClass)(id, ...args);
        return credential;
    }
}
exports.SECPCredential = SECPCredential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vY3JlZGVudGlhbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsMkNBQTBDO0FBQzFDLDBEQUFxRDtBQUNyRCwrQ0FBZ0Q7QUFFaEQ7Ozs7OztHQU1HO0FBQ0ksTUFBTSxxQkFBcUIsR0FBRyxDQUNuQyxNQUFjLEVBQ2QsR0FBRyxJQUFXLEVBQ0YsRUFBRTtJQUNkLElBQUksTUFBTSxLQUFLLHdCQUFZLENBQUMsY0FBYyxFQUFFO1FBQzFDLE9BQU8sSUFBSSxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNuQztJQUNELDBCQUEwQjtJQUMxQixNQUFNLElBQUksb0JBQVcsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFBO0FBQ3hFLENBQUMsQ0FBQTtBQVRZLFFBQUEscUJBQXFCLHlCQVNqQztBQUVELE1BQWEsY0FBZSxTQUFRLHdCQUFVO0lBQTlDOztRQUNZLGNBQVMsR0FBVyxnQkFBZ0IsQ0FBQTtRQUNwQyxZQUFPLEdBQVcsd0JBQVksQ0FBQyxjQUFjLENBQUE7SUFzQnpELENBQUM7SUFwQkMsOENBQThDO0lBRTlDLGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUE7SUFDckIsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBbUIsSUFBSSxjQUFjLEVBQUUsQ0FBQTtRQUNsRCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLE9BQU8sT0FBZSxDQUFBO0lBQ3hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxjQUFjLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUM1QyxDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQVUsRUFBRSxHQUFHLElBQVc7UUFDL0IsSUFBSSxVQUFVLEdBQWUsSUFBQSw2QkFBcUIsRUFBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUMvRCxPQUFPLFVBQVUsQ0FBQTtJQUNuQixDQUFDO0NBQ0Y7QUF4QkQsd0NBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1FVk0tQ3JlZGVudGlhbHNcclxuICovXHJcblxyXG5pbXBvcnQgeyBFVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxyXG5pbXBvcnQgeyBDcmVkZW50aWFsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jcmVkZW50aWFsc1wiXHJcbmltcG9ydCB7IENyZWRJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXHJcblxyXG4vKipcclxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBjcmVkZW50aWFsIGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tDcmVkZW50aWFsXV0gaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSBjcmVkaWQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBjcmVkZW50aWFsIElEIHBhcnNlZCBwcmlvciB0byB0aGUgYnl0ZXMgcGFzc2VkIGluXHJcbiAqXHJcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbQ3JlZGVudGlhbF1dLWV4dGVuZGVkIGNsYXNzLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFNlbGVjdENyZWRlbnRpYWxDbGFzcyA9IChcclxuICBjcmVkaWQ6IG51bWJlcixcclxuICAuLi5hcmdzOiBhbnlbXVxyXG4pOiBDcmVkZW50aWFsID0+IHtcclxuICBpZiAoY3JlZGlkID09PSBFVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUwpIHtcclxuICAgIHJldHVybiBuZXcgU0VDUENyZWRlbnRpYWwoLi4uYXJncylcclxuICB9XHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICB0aHJvdyBuZXcgQ3JlZElkRXJyb3IoXCJFcnJvciAtIFNlbGVjdENyZWRlbnRpYWxDbGFzczogdW5rbm93biBjcmVkaWRcIilcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNFQ1BDcmVkZW50aWFsIGV4dGVuZHMgQ3JlZGVudGlhbCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZTogc3RyaW5nID0gXCJTRUNQQ3JlZGVudGlhbFwiXHJcbiAgcHJvdGVjdGVkIF90eXBlSUQ6IG51bWJlciA9IEVWTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBsZXQgbmV3YmFzZTogU0VDUENyZWRlbnRpYWwgPSBuZXcgU0VDUENyZWRlbnRpYWwoKVxyXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBTRUNQQ3JlZGVudGlhbCguLi5hcmdzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBDcmVkZW50aWFsIHtcclxuICAgIGxldCBjcmVkZW50aWFsOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKGlkLCAuLi5hcmdzKVxyXG4gICAgcmV0dXJuIGNyZWRlbnRpYWxcclxuICB9XHJcbn1cclxuIl19