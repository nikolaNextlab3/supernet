"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PubSub {
    newSet() {
        return JSON.stringify({ newSet: {} });
    }
    newBloom(maxElements = 1000, collisionProb = 0.01) {
        return JSON.stringify({
            newBloom: {
                maxElements: maxElements,
                collisionProb: collisionProb
            }
        });
    }
    addAddresses(addresses) {
        return JSON.stringify({
            addAddresses: {
                addresses: addresses
            }
        });
    }
}
exports.default = PubSub;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVic3ViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL3B1YnN1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQXFCLE1BQU07SUFDekIsTUFBTTtRQUNKLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFDRCxRQUFRLENBQUMsY0FBc0IsSUFBSSxFQUFFLGdCQUF3QixJQUFJO1FBQy9ELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNwQixRQUFRLEVBQUU7Z0JBQ1IsV0FBVyxFQUFFLFdBQVc7Z0JBQ3hCLGFBQWEsRUFBRSxhQUFhO2FBQzdCO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUNELFlBQVksQ0FBQyxTQUFtQjtRQUM5QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDcEIsWUFBWSxFQUFFO2dCQUNaLFNBQVMsRUFBRSxTQUFTO2FBQ3JCO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQztDQUNGO0FBbkJELHlCQW1CQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGNsYXNzIFB1YlN1YiB7XHJcbiAgbmV3U2V0KCkge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHsgbmV3U2V0OiB7fSB9KVxyXG4gIH1cclxuICBuZXdCbG9vbShtYXhFbGVtZW50czogbnVtYmVyID0gMTAwMCwgY29sbGlzaW9uUHJvYjogbnVtYmVyID0gMC4wMSkge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgbmV3Qmxvb206IHtcclxuICAgICAgICBtYXhFbGVtZW50czogbWF4RWxlbWVudHMsXHJcbiAgICAgICAgY29sbGlzaW9uUHJvYjogY29sbGlzaW9uUHJvYlxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuICBhZGRBZGRyZXNzZXMoYWRkcmVzc2VzOiBzdHJpbmdbXSkge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgYWRkQWRkcmVzc2VzOiB7XHJcbiAgICAgICAgYWRkcmVzc2VzOiBhZGRyZXNzZXNcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbn1cclxuIl19