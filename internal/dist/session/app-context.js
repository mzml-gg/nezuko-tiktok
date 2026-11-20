"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAppContext = parseAppContext;
const REHYDRATION_RE = /<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i;
function parseAppContext(html) {
    const match = REHYDRATION_RE.exec(html);
    if (!match)
        return undefined;
    let parsed;
    try {
        parsed = JSON.parse(match[1]);
    }
    catch {
        return undefined;
    }
    const scope = parsed.__DEFAULT_SCOPE__;
    const context = scope?.['webapp.app-context'];
    if (!context || typeof context !== 'object')
        return undefined;
    const num = (v) => typeof v === 'number' ? v : typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined;
    const str = (v) => typeof v === 'string' && v.trim() !== '' ? v : undefined;
    const aid = num(context['appId']) ?? num(context['aid']);
    return {
        aid,
        region: str(context['region']),
        wid: str(context['wid']),
        odinId: str(context['odinId']),
        nonce: str(context['nonce']),
        webIdCreatedTime: str(context['webIdCreatedTime']),
        csrfToken: str(context['csrfToken']),
        userAgent: str(context['userAgent']),
        botType: str(context['botType']),
        abTestVersions: str(context['abTestVersion']?.['versionName']) ?? undefined,
        raw: context,
    };
}
//# sourceMappingURL=app-context.js.map