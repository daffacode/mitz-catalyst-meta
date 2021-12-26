"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileFields = void 0;
class ProfileFields {
    constructor(fields) {
        this.fields = fields;
    }
    getFields() {
        return this.fields.join(',');
    }
}
exports.ProfileFields = ProfileFields;
ProfileFields.ONLY_SNAPSHOTS = new ProfileFields(['snapshots']);
//# sourceMappingURL=LambdasAPI.js.map