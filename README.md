# سامانه هوشمند سفارش غذای کارکنان

Staff food-ordering system for a ~50-person company (demo version). Persian / RTL, React + Vite + Tailwind.
Data is stored in the browser (localStorage), so the demo needs no server or database.

## Modules

| بخش | امکانات |
|---|---|
| داشبورد | KPIهای امروز و ماه، روند ۱۴ روزه، محبوب‌ترین غذاها، هزینه به تفکیک واحد |
| سفارش کارکنان | انتخاب روز (۶ روز آینده)، منوی روز، سهم کارمند پس از یارانه، مهلت سفارش، سقف روزانه، لغو |
| سفارش‌ها و کیف پول من | دید کارمند: تاریخچه سفارش، کسر حقوق ماه، گردش کیف پول |
| سفارش ویژه / مهمان | تعداد دلخواه، عنوان جلسه، مرکز هزینه |
| برنامه غذایی | برنامه هفتگی، کپی از هفته قبل |
| مدیریت غذاها | کد/نام/قیمت/دسته، دستور پخت از اقلام انبار، بهای تمام‌شده و حاشیه سود |
| آشپزخانه | جمع سفارش هر غذا، مواد لازم در برابر موجودی، لیست تحویل، تحویل و کسر خودکار از انبار، چاپ |
| انبار | موجودی، نقطه سفارش و هشدار، ورود/خروج، گردش کالا، ارزش انبار، خروجی اکسل |
| کارکنان | ۵۰ نفر نمونه، واحد، روش پرداخت، کیف پول |
| حسابداری | خلاصه مالی ماه (شمسی)، لیست کسر از حقوق با خروجی، شارژ تکی/گروهی کیف پول، مراکز هزینه، دفتر تراکنش |
| گزارش‌ها | به تفکیک غذا / کارمند / واحد / روز هفته، ریز «چه کسی چه خرید»، فیلتر بازه، خروجی CSV |
| تنظیمات | یارانه٪، مهلت، سقف روزانه، روش پرداخت (کسر از حقوق / کیف پول / انتخابی برای هر نفر)، بازنشانی دمو |

Role switcher in the header (مدیر، حسابدار، انباردار، کارمند) shows each role's view.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as **Vite** (build `npm run build`, output `dist`).
3. `vercel.json` already rewrites all routes to `index.html`.

## Next step for production

Replace the localStorage store (`src/store.ts`) with a real backend (e.g. Next.js API + Postgres) and add login by personnel code.
