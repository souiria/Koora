# Kora AI 🇲🇦 — منصة التحليل الذكي وتوقعات كرة القدم

منصة متكاملة لتحليل مباريات كرة القدم وتقديم توقعات إحصائية حقيقية بالدارجة المغربية (RTL)، مبنية باستعمال:
- **Frontend**: React + Vite + Tailwind CSS + PWA (واجهة عربية مغربية RTL).
- **Backend**: Python + FastAPI + NumPy / SciPy.
- **AI Engine**: محاكاة Monte Carlo (10,000 محاكاة للماتش) + توزيع Poisson + تصنيف Elo.
- **API**: معطيات حية ومباشرة من ESPN Public Soccer API (بدون الحاجة لمفتاح API أو قاعدة بيانات).

## طريقة التشغيل (Quick Start)

### 1. تشغيل السيرفر (Backend)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # على Windows: venv\Scripts\activate
pip install -r requirements.txt
pytest test_engine.py
uvicorn main:app --reload --port 8000
```

### 2. تشغيل الواجهة (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 3. رفع المشروع لـ GitHub (`souiria/Koora`)
```bash
git init
git remote add origin https://github.com/souiria/Koora.git
git add .
git commit -m "feat: Kora AI Moroccan Darija Football Prediction Platform"
git branch -M main
git push -u origin main
```
