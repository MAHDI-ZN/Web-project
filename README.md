# Melody

سرویس استریم موسیقی شبیه اسپاتیفای برای درس برنامه‌سازی وب (دانشگاه صنعتی شریف).

فاز ۱: فرانت‌اند Next.js — فاز ۲: بک‌اند Django REST و ادغام.

## اجرا محلی

### بک‌اند

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver 8000
```

API: [http://localhost:8000/api/](http://localhost:8000/api/)

### فرانت‌اند

```bash
# از ریشه پروژه
copy .env.example .env.local
npm install
npm run dev
```

مرورگر: [http://localhost:3000](http://localhost:3000)

## Docker

```bash
docker compose up --build
```

فرانت روی پورت ۳۰۰۰ و بک‌اند روی ۸۰۰۰ بالا می‌آید.

## حساب‌های دمو

رمز همه: `demo1234`

| ایمیل | نقش |
|--------|------|
| sara@demo.com | شنونده پایه |
| ali@demo.com | شنونده نقره‌ای |
| nima@demo.com | شنونده طلایی |
| ava@demo.com | هنرمند تأییدشده |
| kaveh@demo.com | هنرمند در انتظار تأیید |
| support@demo.com | پشتیبان |
| admin@demo.com | مدیر سامانه |

## پرداخت

به صورت پیش‌فرض درگاه `mock` فعال است (بدون نیاز به اینترنت). برای زرین‌پال سندباکس:

```
PAYMENT_GATEWAY=zarinpal
ZARINPAL_SANDBOX=1
ZARINPAL_MERCHANT_ID=...
```

## تست‌ها

```bash
# فرانت
npm test

# بک‌اند
cd backend
python -m pytest
```

## ساختار

- `src/` — Next.js (App Router)
- `backend/` — Django + DRF
- `docker-compose.yml` — اجرای هر دو سرویس
- `REPORT.md` — گزارش نهایی فاز ۲

قیمت اشتراک نقره‌ای/طلایی از پنل مدیر بدون تغییر کد عوض می‌شود.
