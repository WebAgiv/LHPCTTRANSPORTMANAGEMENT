# 🚌 AITRC VITA SMART TRANSPORT ERP v4.0

**Adarsh Institute of Technology & Research Centre, Vita**  
*Developed by SORA IT TECH Solutions | AY 2025–26*  
*Loknete Ma. Hanmantrao Patil Charitable Trust*

---

## ⚡ QUICKSTART

```bash
# 1. Import database (23 routes, 340 real stops, ACOP fares)
mysql -u root -p < database/schema.sql

# 2. Configure
cd backend
cp .env.example .env   # Edit: add MySQL password + 2 JWT secrets

# 3. Run
npm install && node src/utils/setup.js && npm start

# 4. Open http://localhost:5000
# Login: superadmin / admin@1234
```

---

## 📁 PROJECT STRUCTURE

```
AITRC-TRANSPORT-ERP/
├── backend/
│   └── src/
│       ├── controllers/       ← Business logic (11 controllers)
│       ├── middleware/        ← JWT auth, error handler, validator
│       ├── models/            ← User, Student, Payment models
│       ├── routes/            ← 13 Express route files
│       ├── config/            ← DB pool, email transporter
│       ├── utils/             ← Logger, helpers, setup script
│       └── server.js          ← Express entry point
├── android-app/               ← Mobile app (Phase 2)
├── database/
│   └── schema.sql             ← 14 tables + 23 routes + 340 stops
├── docker/
│   ├── docker-compose.yml     ← MySQL + Backend containers
│   └── Dockerfile
├── docs/
│   └── INSTALL.md             ← Full installation guide
├── frontend/
│   └── index.html             ← Complete ERP (1.2 MB, self-contained)
├── logs/                      ← Winston log files (auto-created)
└── uploads/
    └── bills/                 ← Expense document uploads
```

---

## 💡 SMART PAYMENT RULE

| Annual ACOP Fare | Plan | Details |
|-----------------|------|---------|
| ≤ ₹10,000 | 💎 Single Payment | Full amount due now |
| > ₹10,000 | 📅 2 Installments | ⌈fare÷2⌉ now + remainder by Dec 31 |

Auto-applied everywhere — Registration, Fare Matrix, Payments, Student Portal.

---

## 🔑 DEFAULT LOGINS

| Username | Password | Role |
|----------|----------|------|
| superadmin | admin@1234 | Super Admin |
| transport | admin@1234 | Transport Manager |
| finance | admin@1234 | Finance Officer |
| security1 | admin@1234 | Security Gate |
| principal | admin@1234 | Principal |

---

## 📊 REAL DATA

- **23 Routes** | **340 Stops** | Source: Official ACOP PDF
- **25 Buses** — MH10 series (real registrations)
- **23 Drivers** — Real AITRC transport staff
- **Fare Range** — ₹3,908 (Gandhinagar) to ₹47,388 (Atpadi)

---

*© 2025 SORA IT TECH Solutions | CONFIDENTIAL | transport@aitrcvita.edu.in*
