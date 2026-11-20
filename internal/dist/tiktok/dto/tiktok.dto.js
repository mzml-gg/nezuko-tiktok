"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawRequestDto = exports.SearchQueryDto = exports.UserPageQueryDto = exports.UserDetailQueryDto = exports.PageQueryDto = exports.CountQueryDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const toBool = ({ value }) => {
    if (typeof value === 'boolean')
        return value;
    const v = String(value).toLowerCase();
    return v === 'true' || v === '1' || v === 'yes';
};
const trim = ({ value }) => typeof value === 'string' ? value.trim() : value;
class CountQueryDto {
    count;
}
exports.CountQueryDto = CountQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Max)(50),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CountQueryDto.prototype, "count", void 0);
class PageQueryDto extends CountQueryDto {
    cursor;
}
exports.PageQueryDto = PageQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.Matches)(/^-?\d+$/, { message: 'cursor must be a numeric cursor from a previous response' }),
    __metadata("design:type", String)
], PageQueryDto.prototype, "cursor", void 0);
class UserDetailQueryDto {
    uniqueId;
    secUid;
}
exports.UserDetailQueryDto = UserDetailQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9._]{1,24}$/, {
        message: 'uniqueId must be a TikTok handle without the leading "@"',
    }),
    __metadata("design:type", String)
], UserDetailQueryDto.prototype, "uniqueId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserDetailQueryDto.prototype, "secUid", void 0);
class UserPageQueryDto extends PageQueryDto {
}
exports.UserPageQueryDto = UserPageQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserPageQueryDto.prototype, "secUid", void 0);
class SearchQueryDto extends CountQueryDto {
    offset;
    searchId;
}
exports.SearchQueryDto = SearchQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "keyword", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'offset must be the numeric cursor from a previous response' }),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9]{1,64}$/, { message: 'searchId must be log_pb.impr_id from the first page' }),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "searchId", void 0);
class RawRequestDto {
    query;
    referer;
    method;
    body;
    sign;
    bare;
    allowEmpty;
}
exports.RawRequestDto = RawRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.Matches)(/^\/[^/]/, {
        message: 'path must be an origin-relative path beginning with a single "/"',
    }),
    __metadata("design:type", String)
], RawRequestDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RawRequestDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RawRequestDto.prototype, "referer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['GET', 'POST']),
    __metadata("design:type", String)
], RawRequestDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RawRequestDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(toBool),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RawRequestDto.prototype, "sign", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(toBool),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RawRequestDto.prototype, "bare", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(toBool),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RawRequestDto.prototype, "allowEmpty", void 0);
//# sourceMappingURL=tiktok.dto.js.map