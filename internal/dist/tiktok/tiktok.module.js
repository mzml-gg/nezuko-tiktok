"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiktokModule = void 0;
const common_1 = require("@nestjs/common");
const session_module_1 = require("../session/session.module");
const tiktok_client_1 = require("./tiktok.client");
const tiktok_service_1 = require("./tiktok.service");
const tiktok_controller_1 = require("./tiktok.controller");
let TiktokModule = class TiktokModule {
};
exports.TiktokModule = TiktokModule;
exports.TiktokModule = TiktokModule = __decorate([
    (0, common_1.Module)({
        imports: [session_module_1.SessionModule],
        controllers: [tiktok_controller_1.TiktokController, tiktok_controller_1.InternalController],
        providers: [tiktok_client_1.TiktokClient, tiktok_service_1.TiktokService],
        exports: [tiktok_service_1.TiktokService, tiktok_client_1.TiktokClient],
    })
], TiktokModule);
//# sourceMappingURL=tiktok.module.js.map