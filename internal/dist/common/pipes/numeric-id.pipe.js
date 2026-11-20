"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumericIdPipe = void 0;
const common_1 = require("@nestjs/common");
const tiktok_errors_1 = require("../errors/tiktok-errors");
const NUMERIC_ID = /^\d{5,25}$/;
let NumericIdPipe = class NumericIdPipe {
    transform(value, { data }) {
        const id = value?.trim() ?? '';
        if (!NUMERIC_ID.test(id)) {
            throw new tiktok_errors_1.BadRequestError(`${data ?? 'id'} must be a numeric TikTok id`, { value });
        }
        return id;
    }
};
exports.NumericIdPipe = NumericIdPipe;
exports.NumericIdPipe = NumericIdPipe = __decorate([
    (0, common_1.Injectable)()
], NumericIdPipe);
//# sourceMappingURL=numeric-id.pipe.js.map