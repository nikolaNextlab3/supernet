"use strict";
/**
 * @packageDocumentation
 * @module API-PlatformVM-Credentials
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
    if (credid === constants_1.PlatformVMConstants.SECPCREDENTIAL) {
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
        this._typeID = constants_1.PlatformVMConstants.SECPCREDENTIAL;
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
        let newbasetx = (0, exports.SelectCredentialClass)(id, ...args);
        return newbasetx;
    }
}
exports.SECPCredential = SECPCredential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUVILDJDQUFpRDtBQUNqRCwwREFBcUQ7QUFDckQsK0NBQWdEO0FBRWhEOzs7Ozs7R0FNRztBQUNJLE1BQU0scUJBQXFCLEdBQUcsQ0FDbkMsTUFBYyxFQUNkLEdBQUcsSUFBVyxFQUNGLEVBQUU7SUFDZCxJQUFJLE1BQU0sS0FBSywrQkFBbUIsQ0FBQyxjQUFjLEVBQUU7UUFDakQsT0FBTyxJQUFJLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ25DO0lBQ0QsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxvQkFBVyxDQUFDLCtDQUErQyxDQUFDLENBQUE7QUFDeEUsQ0FBQyxDQUFBO0FBVFksUUFBQSxxQkFBcUIseUJBU2pDO0FBRUQsTUFBYSxjQUFlLFNBQVEsd0JBQVU7SUFBOUM7O1FBQ1ksY0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQzVCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxjQUFjLENBQUE7SUFzQnhELENBQUM7SUFwQkMsOENBQThDO0lBRTlDLGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUE7SUFDckIsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBbUIsSUFBSSxjQUFjLEVBQUUsQ0FBQTtRQUNsRCxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLE9BQU8sT0FBZSxDQUFBO0lBQ3hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxjQUFjLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUM1QyxDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQVUsRUFBRSxHQUFHLElBQVc7UUFDL0IsSUFBSSxTQUFTLEdBQWUsSUFBQSw2QkFBcUIsRUFBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtRQUM5RCxPQUFPLFNBQVMsQ0FBQTtJQUNsQixDQUFDO0NBQ0Y7QUF4QkQsd0NBd0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLUNyZWRlbnRpYWxzXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbmltcG9ydCB7IENyZWRlbnRpYWwgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzXCJcclxuaW1wb3J0IHsgQ3JlZElkRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIGNyZWRlbnRpYWwgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0NyZWRlbnRpYWxdXSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIGNyZWRpZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGNyZWRlbnRpYWwgSUQgcGFyc2VkIHByaW9yIHRvIHRoZSBieXRlcyBwYXNzZWQgaW5cclxuICpcclxuICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgYW4gW1tDcmVkZW50aWFsXV0tZXh0ZW5kZWQgY2xhc3MuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgU2VsZWN0Q3JlZGVudGlhbENsYXNzID0gKFxyXG4gIGNyZWRpZDogbnVtYmVyLFxyXG4gIC4uLmFyZ3M6IGFueVtdXHJcbik6IENyZWRlbnRpYWwgPT4ge1xyXG4gIGlmIChjcmVkaWQgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUwpIHtcclxuICAgIHJldHVybiBuZXcgU0VDUENyZWRlbnRpYWwoLi4uYXJncylcclxuICB9XHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICB0aHJvdyBuZXcgQ3JlZElkRXJyb3IoXCJFcnJvciAtIFNlbGVjdENyZWRlbnRpYWxDbGFzczogdW5rbm93biBjcmVkaWRcIilcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNFQ1BDcmVkZW50aWFsIGV4dGVuZHMgQ3JlZGVudGlhbCB7XHJcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUENyZWRlbnRpYWxcIlxyXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5TRUNQQ1JFREVOVElBTFxyXG5cclxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXHJcblxyXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxyXG4gIH1cclxuXHJcbiAgY2xvbmUoKTogdGhpcyB7XHJcbiAgICBsZXQgbmV3YmFzZTogU0VDUENyZWRlbnRpYWwgPSBuZXcgU0VDUENyZWRlbnRpYWwoKVxyXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcclxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcclxuICB9XHJcblxyXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xyXG4gICAgcmV0dXJuIG5ldyBTRUNQQ3JlZGVudGlhbCguLi5hcmdzKSBhcyB0aGlzXHJcbiAgfVxyXG5cclxuICBzZWxlY3QoaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBDcmVkZW50aWFsIHtcclxuICAgIGxldCBuZXdiYXNldHg6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoaWQsIC4uLmFyZ3MpXHJcbiAgICByZXR1cm4gbmV3YmFzZXR4XHJcbiAgfVxyXG59XHJcbiJdfQ==