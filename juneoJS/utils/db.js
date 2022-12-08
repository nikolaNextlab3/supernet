"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @packageDocumentation
 * @module Utils-DB
 */
const store2_1 = __importDefault(require("store2"));
/**
 * A class for interacting with the {@link https://github.com/nbubna/store| store2 module}
 *
 * This class should never be instantiated directly. Instead, invoke the "DB.getInstance()" static
 * function to grab the singleton instance of the database.
 *
 * ```js
 * const db = DB.getInstance();
 * const blockchaindb = db.getNamespace("mychain");
 * ```
 */
class DB {
    constructor() { }
    /**
     * Retrieves the database singleton.
     */
    static getInstance() {
        if (!DB.instance) {
            DB.instance = new DB();
        }
        return DB.instance;
    }
    /**
     * Gets a namespace from the database singleton.
     *
     * @param ns Namespace to retrieve.
     */
    static getNamespace(ns) {
        return this.store.namespace(ns);
    }
}
exports.default = DB;
DB.store = store2_1.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvREFBd0M7QUFFeEM7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQXFCLEVBQUU7SUFLckIsZ0JBQXVCLENBQUM7SUFFeEI7O09BRUc7SUFDSCxNQUFNLENBQUMsV0FBVztRQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtZQUNoQixFQUFFLENBQUMsUUFBUSxHQUFHLElBQUksRUFBRSxFQUFFLENBQUE7U0FDdkI7UUFDRCxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUE7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQVU7UUFDNUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUNqQyxDQUFDOztBQXhCSCxxQkF5QkM7QUF0QmdCLFFBQUssR0FBRyxnQkFBSyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxyXG4gKiBAbW9kdWxlIFV0aWxzLURCXHJcbiAqL1xyXG5pbXBvcnQgc3RvcmUsIHsgU3RvcmVBUEkgfSBmcm9tIFwic3RvcmUyXCJcclxuXHJcbi8qKlxyXG4gKiBBIGNsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL25idWJuYS9zdG9yZXwgc3RvcmUyIG1vZHVsZX1cclxuICpcclxuICogVGhpcyBjbGFzcyBzaG91bGQgbmV2ZXIgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkLCBpbnZva2UgdGhlIFwiREIuZ2V0SW5zdGFuY2UoKVwiIHN0YXRpY1xyXG4gKiBmdW5jdGlvbiB0byBncmFiIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgdGhlIGRhdGFiYXNlLlxyXG4gKlxyXG4gKiBgYGBqc1xyXG4gKiBjb25zdCBkYiA9IERCLmdldEluc3RhbmNlKCk7XHJcbiAqIGNvbnN0IGJsb2NrY2hhaW5kYiA9IGRiLmdldE5hbWVzcGFjZShcIm15Y2hhaW5cIik7XHJcbiAqIGBgYFxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgREIge1xyXG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBEQlxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBzdG9yZSA9IHN0b3JlXHJcblxyXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICAvKipcclxuICAgKiBSZXRyaWV2ZXMgdGhlIGRhdGFiYXNlIHNpbmdsZXRvbi5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogREIge1xyXG4gICAgaWYgKCFEQi5pbnN0YW5jZSkge1xyXG4gICAgICBEQi5pbnN0YW5jZSA9IG5ldyBEQigpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gREIuaW5zdGFuY2VcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgYSBuYW1lc3BhY2UgZnJvbSB0aGUgZGF0YWJhc2Ugc2luZ2xldG9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIG5zIE5hbWVzcGFjZSB0byByZXRyaWV2ZS5cclxuICAgKi9cclxuICBzdGF0aWMgZ2V0TmFtZXNwYWNlKG5zOiBzdHJpbmcpOiBTdG9yZUFQSSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdG9yZS5uYW1lc3BhY2UobnMpXHJcbiAgfVxyXG59XHJcbiJdfQ==