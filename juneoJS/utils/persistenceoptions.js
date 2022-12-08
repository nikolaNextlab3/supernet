"use strict";
/**
 * @packageDocumentation
 * @module Utils-PersistanceOptions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistanceOptions = void 0;
/**
 * A class for defining the persistance behavior of this an API call.
 *
 */
class PersistanceOptions {
    /**
     *
     * @param name The namespace of the database the data
     * @param overwrite True if the data should be completey overwritten
     * @param MergeRule The type of process used to merge with existing data: "intersection", "differenceSelf", "differenceNew", "symDifference", "union", "unionMinusNew", "unionMinusSelf"
     *
     * @remarks
     * The merge rules are as follows:
     *   * "intersection" - the intersection of the set
     *   * "differenceSelf" - the difference between the existing data and new set
     *   * "differenceNew" - the difference between the new data and the existing set
     *   * "symDifference" - the union of the differences between both sets of data
     *   * "union" - the unique set of all elements contained in both sets
     *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
     *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
     */
    constructor(name, overwrite = false, mergeRule) {
        this.name = undefined;
        this.overwrite = false;
        this.mergeRule = "union";
        /**
         * Returns the namespace of the instance
         */
        this.getName = () => this.name;
        /**
         * Returns the overwrite rule of the instance
         */
        this.getOverwrite = () => this.overwrite;
        /**
         * Returns the [[MergeRule]] of the instance
         */
        this.getMergeRule = () => this.mergeRule;
        this.name = name;
        this.overwrite = overwrite;
        this.mergeRule = mergeRule;
    }
}
exports.PersistanceOptions = PersistanceOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyc2lzdGVuY2VvcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL3BlcnNpc3RlbmNlb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFHSDs7O0dBR0c7QUFDSCxNQUFhLGtCQUFrQjtJQXNCN0I7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsWUFBcUIsS0FBSyxFQUFFLFNBQW9CO1FBckNoRSxTQUFJLEdBQVcsU0FBUyxDQUFBO1FBRXhCLGNBQVMsR0FBWSxLQUFLLENBQUE7UUFFMUIsY0FBUyxHQUFjLE9BQU8sQ0FBQTtRQUV4Qzs7V0FFRztRQUNILFlBQU8sR0FBRyxHQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFBO1FBRWpDOztXQUVHO1FBQ0gsaUJBQVksR0FBRyxHQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFBO1FBRTVDOztXQUVHO1FBQ0gsaUJBQVksR0FBRyxHQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFBO1FBbUI1QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUMxQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtJQUM1QixDQUFDO0NBQ0Y7QUEzQ0QsZ0RBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIFV0aWxzLVBlcnNpc3RhbmNlT3B0aW9uc1xyXG4gKi9cclxuXHJcbmltcG9ydCB7IE1lcmdlUnVsZSB9IGZyb20gXCIuL2NvbnN0YW50c1wiXHJcbi8qKlxyXG4gKiBBIGNsYXNzIGZvciBkZWZpbmluZyB0aGUgcGVyc2lzdGFuY2UgYmVoYXZpb3Igb2YgdGhpcyBhbiBBUEkgY2FsbC5cclxuICpcclxuICovXHJcbmV4cG9ydCBjbGFzcyBQZXJzaXN0YW5jZU9wdGlvbnMge1xyXG4gIHByb3RlY3RlZCBuYW1lOiBzdHJpbmcgPSB1bmRlZmluZWRcclxuXHJcbiAgcHJvdGVjdGVkIG92ZXJ3cml0ZTogYm9vbGVhbiA9IGZhbHNlXHJcblxyXG4gIHByb3RlY3RlZCBtZXJnZVJ1bGU6IE1lcmdlUnVsZSA9IFwidW5pb25cIlxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm5zIHRoZSBuYW1lc3BhY2Ugb2YgdGhlIGluc3RhbmNlXHJcbiAgICovXHJcbiAgZ2V0TmFtZSA9ICgpOiBzdHJpbmcgPT4gdGhpcy5uYW1lXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIG92ZXJ3cml0ZSBydWxlIG9mIHRoZSBpbnN0YW5jZVxyXG4gICAqL1xyXG4gIGdldE92ZXJ3cml0ZSA9ICgpOiBib29sZWFuID0+IHRoaXMub3ZlcndyaXRlXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIFtbTWVyZ2VSdWxlXV0gb2YgdGhlIGluc3RhbmNlXHJcbiAgICovXHJcbiAgZ2V0TWVyZ2VSdWxlID0gKCk6IE1lcmdlUnVsZSA9PiB0aGlzLm1lcmdlUnVsZVxyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lc3BhY2Ugb2YgdGhlIGRhdGFiYXNlIHRoZSBkYXRhXHJcbiAgICogQHBhcmFtIG92ZXJ3cml0ZSBUcnVlIGlmIHRoZSBkYXRhIHNob3VsZCBiZSBjb21wbGV0ZXkgb3ZlcndyaXR0ZW5cclxuICAgKiBAcGFyYW0gTWVyZ2VSdWxlIFRoZSB0eXBlIG9mIHByb2Nlc3MgdXNlZCB0byBtZXJnZSB3aXRoIGV4aXN0aW5nIGRhdGE6IFwiaW50ZXJzZWN0aW9uXCIsIFwiZGlmZmVyZW5jZVNlbGZcIiwgXCJkaWZmZXJlbmNlTmV3XCIsIFwic3ltRGlmZmVyZW5jZVwiLCBcInVuaW9uXCIsIFwidW5pb25NaW51c05ld1wiLCBcInVuaW9uTWludXNTZWxmXCJcclxuICAgKlxyXG4gICAqIEByZW1hcmtzXHJcbiAgICogVGhlIG1lcmdlIHJ1bGVzIGFyZSBhcyBmb2xsb3dzOlxyXG4gICAqICAgKiBcImludGVyc2VjdGlvblwiIC0gdGhlIGludGVyc2VjdGlvbiBvZiB0aGUgc2V0XHJcbiAgICogICAqIFwiZGlmZmVyZW5jZVNlbGZcIiAtIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGV4aXN0aW5nIGRhdGEgYW5kIG5ldyBzZXRcclxuICAgKiAgICogXCJkaWZmZXJlbmNlTmV3XCIgLSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBuZXcgZGF0YSBhbmQgdGhlIGV4aXN0aW5nIHNldFxyXG4gICAqICAgKiBcInN5bURpZmZlcmVuY2VcIiAtIHRoZSB1bmlvbiBvZiB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBib3RoIHNldHMgb2YgZGF0YVxyXG4gICAqICAgKiBcInVuaW9uXCIgLSB0aGUgdW5pcXVlIHNldCBvZiBhbGwgZWxlbWVudHMgY29udGFpbmVkIGluIGJvdGggc2V0c1xyXG4gICAqICAgKiBcInVuaW9uTWludXNOZXdcIiAtIHRoZSB1bmlxdWUgc2V0IG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gYm90aCBzZXRzLCBleGNsdWRpbmcgdmFsdWVzIG9ubHkgZm91bmQgaW4gdGhlIG5ldyBzZXRcclxuICAgKiAgICogXCJ1bmlvbk1pbnVzU2VsZlwiIC0gdGhlIHVuaXF1ZSBzZXQgb2YgYWxsIGVsZW1lbnRzIGNvbnRhaW5lZCBpbiBib3RoIHNldHMsIGV4Y2x1ZGluZyB2YWx1ZXMgb25seSBmb3VuZCBpbiB0aGUgZXhpc3Rpbmcgc2V0XHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSwgbWVyZ2VSdWxlOiBNZXJnZVJ1bGUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWVcclxuICAgIHRoaXMub3ZlcndyaXRlID0gb3ZlcndyaXRlXHJcbiAgICB0aGlzLm1lcmdlUnVsZSA9IG1lcmdlUnVsZVxyXG4gIH1cclxufVxyXG4iXX0=