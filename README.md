# nezuko-tiktok-search

مكتبة **Node.js** للبحث عن فيديوهات TikTok العامة وإرجاع روابط صفحات المشاهدة والبيانات الوصفية الأساسية. تعمل مباشرة داخل عملية Node.js ولا تتطلب تشغيل خادم REST أو فتح منفذ.

> **تنبيه:** هذه مكتبة غير رسمية، وليست تابعة إلى TikTok أو ByteDance أو معتمدة منهما. قد تتغير واجهات TikTok أو سياساته، لذلك لا يمكن ضمان استمرار البحث أو توفر كل الحقول.

## المتطلبات

- Node.js 22 أو أحدث.
- اتصال بالإنترنت.
- في معظم البيئات تستخدم المكتبة ناقل TLS المضمّن. إذا لم يعمل هذا الناقل على نظامك، يتوفر جسر احتياطي يحتاج إلى Python 3 وحزمة `curl_cffi`:

```bash
python3 -m pip install --user curl_cffi
```

يُشغّل الجسر تلقائياً عند الحاجة ثم يُغلق؛ لا تشغّل خادماً منفصلاً.

## التثبيت

بعد اعتماد هذا التحديث، يمكن تثبيت نسخة المستودع مباشرة: 

```bash
npm install github:mzml-gg/nezuko-tiktok
```

بعد توفر الإصدار المنشور على npm، استخدم:

```bash
npm install nezuko-tiktok-search
```

## بحث سريع

```js
const { searchVideos } = require('nezuko-tiktok-search');

async function main() {
  const result = await searchVideos('cats', { count: 5 });

  console.log(result.videos.map((video) => ({
    title: video.title,
    url: video.url,
    username: video.author.username,
    views: video.views,
    likes: video.likes
  })));
}

main().catch(console.error);
```

`searchVideos(keyword, options)` يقبل كلمة بحث غير فارغة. قيمة `count` اختيارية، وتكون بين 1 و50، والافتراضي 20. تُغلق المكتبة سياقها الداخلي بعد انتهاء الاستدعاء.

## إعادة استخدام الجلسة والتنقل بين الصفحات

لإجراء عدة طلبات متتابعة، أنشئ عميلاً واحداً وأغلقه في كتلة `finally`:

```js
const { createClient } = require('nezuko-tiktok-search');

async function main() {
  const client = createClient();

  try {
    const firstPage = await client.searchVideos('football', { count: 10 });
    console.log(firstPage.videos[0]?.url);

    if (firstPage.hasMore) {
      const nextPage = await client.searchVideos('football', {
        count: 10,
        offset: firstPage.cursor,
        searchId: firstPage.searchId
      });
      console.log(nextPage.videos.length);
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
```

## جلب فيديو بمعرّفه

```js
const { getVideo } = require('nezuko-tiktok-search');

async function main() {
  const video = await getVideo('7698296086431059207');
  console.log(video.url, video.description);
}

main().catch(console.error);
```

## شكل النتيجة

`searchVideos()` يعيد كائناً يحتوي على `query` و`videos` و`cursor` و`hasMore` و`searchId`. كل عنصر فيديو يتضمن، عند إتاحتها من TikTok:

- `id` و`title` و`description` و`url`.
- `author` مع `username` و`name` و`verified` و`url` و`avatarUrl`.
- `views` و`likes` و`comments` و`shares` و`durationSeconds`.
- `thumbnail` و`playUrl` و`downloadUrl` و`createdAt` و`music`.

قد تكون بعض القيم `null` أو غير متاحة بحسب استجابة TikTok. يمكن طلب كائن المصدر الخام عبر `{ includeRaw: true }`، مثلاً `searchVideos('cats', { includeRaw: true })`.

## الإعدادات

تُقرأ إعدادات الخدمة من متغيرات البيئة. مثال:

```bash
TIKTOK_REGION=US TIKTOK_MIN_REQUEST_INTERVAL_MS=1000 node app.js
```

المتغيرات المدعومة من الخدمة المضمّنة تشمل `TIKTOK_REGION` و`TIKTOK_PROXY_URL` و`TIKTOK_TIMEOUT_MS` و`TIKTOK_MIN_REQUEST_INTERVAL_MS`. استخدم معدل طلبات معتدلاً، والتزم بشروط TikTok والقوانين المعمول بها.

## الروابط والاعتمادية

`url` هو رابط صفحة الفيديو في TikTok، وهو الخيار الأنسب للمشاركة. أما `playUrl` و`downloadUrl` فهما روابط CDN مباشرة قد تكون مؤقتة أو تُرفض، ولا تضمن المكتبة صلاحيتها للتنزيل أو التشغيل لاحقاً. نتائج البحث تعتمد على ما تسمح به TikTok في وقت الطلب، وقد تتأثر بتغييرات الموقع أو القيود الجغرافية أو الشبكة.

لا تتضمن المكتبة حساب TikTok أو كلمة مرور أو ملفات cookies، ولا ينبغي استخدامها لتجاوز ضوابط الوصول أو حقوق أصحاب المحتوى.

## الاختبارات

```bash
npm test
```

## حقوق النشر والتراخيص

حقوق أجزاء الربط والتغليف والتوثيق الأصلية في هذا المشروع: **© 2026 Monte وBMG Inc.** يوضح ملف [`COPYRIGHT.md`](./COPYRIGHT.md) نطاق هذا الإسناد. تبقى أجزاء المصدر المضمّنة من مشروع [`sangzun-han/Tiktok-Api`](https://github.com/sangzun-han/Tiktok-Api) منسوبة إلى أصحابها وخاضعة لإشعار MIT المحفوظ في `LICENSE` و`internal/LICENSE.upstream` و`THIRD-PARTY-NOTICES.md`. لا يمنح هذا الإسناد أي حقوق في TikTok أو ByteDance أو المحتوى الذي ينشئه المستخدمون.
