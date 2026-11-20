# nezuko-tiktok

مكتبة Node.js بصيغة ESM للاتصال بـ [omkarcloud/tiktok-scraper](https://github.com/omkarcloud/tiktok-scraper)، مع واجهة سهلة للبحث عن فيديوهات TikTok، pagination، تفاصيل الفيديو، الاقتراحات، والبحث في المستخدمين والبثوث.

> **مهم:** المشروع الأصلي خادم Python. هذه الحزمة عميل Node.js له وليست نسخة من كود الـ scraper داخله. شغّل خادم Python محلياً أو استخدم خادماً متوافقاً، ثم مرّر عنوانه في `baseUrl`.

## التثبيت

```bash
npm install nezuko-tiktok
```

## تشغيل خادم المصدر

```bash
git clone https://github.com/omkarcloud/tiktok-scraper
cd tiktok-scraper
python -m pip install -r requirements.txt
python run.py
```

سيعمل افتراضياً على `http://127.0.0.1:8000`. إذا كان TikTok محجوباً من بيئتك، اضبط `TIKTOK_PROXY` حسب توثيق المشروع الأصلي.

## البحث عن فيديوهات

```js
import { createClient } from 'nezuko-tiktok';

const tiktok = createClient({ baseUrl: 'http://127.0.0.1:8000' });
const page = await tiktok.searchVideos('dance', {
  country: 'us',
  sort: 'relevance',
  published: 'month'
});

console.log(page.video_count);
for (const video of page.videos) {
  console.log(video.id, video.link, video.description);
}
```

## الصفحات التالية

```js
const nextPage = await tiktok.searchVideos('dance', {
  country: 'us',
  cursor: page.next_cursor
});
```

أو استخدم async iterator:

```js
for await (const video of tiktok.iterateVideos('dance', { country: 'us', maxPages: 3 })) {
  console.log(video.link);
}
```

## الدوال المتاحة

- `health()`
- `searchVideos(query, options)` — `sort`: `relevance` أو `likes`، و`published`: `day`, `week`, `month`, `3months`, `6months`
- `searchUsers(query, options)`
- `searchTop(query, options)`
- `searchLive(query, options)`
- `suggestions(query, options)`
- `videoDetails(video, options)`
- `videoMedia(video, options)`
- `iterateVideos(query, options)`

كل الطلبات ترجع JSON كما يرجعه خادم المصدر. أخطاء HTTP ترمي `TikTokHttpError`، وأخطاء المدخلات ترمي `TikTokValidationError`.

## إعدادات البيئة

يمكنك تمرير `TIKTOK_API_URL` بدلاً من `baseUrl`:

```bash
TIKTOK_API_URL=http://127.0.0.1:8000 node app.js
```

## الاختبارات

```bash
npm test                 # اختبارات محلية لا تحتاج TikTok
npm run test:live        # اختبار اتصال حي؛ يحتاج خادم المصدر على 8000
```

## English summary

`nezuko-tiktok` is an ESM Node.js client for the HTTP API exposed by the upstream Python scraper. It does not bypass TikTok protections or provide authentication; availability depends on TikTok and the server's network egress. The default API URL is `http://127.0.0.1:8000`.

## الإسناد والترخيص

هذه الحزمة MIT. خادم المصدر [omkarcloud/tiktok-scraper](https://github.com/omkarcloud/tiktok-scraper) مرخّص أيضاً MIT؛ راجع ملف `NOTICE` لمعلومات الإسناد. استخدم الخدمة بما يتوافق مع شروط TikTok والقوانين المحلية.
