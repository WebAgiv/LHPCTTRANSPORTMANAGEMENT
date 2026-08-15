# AITRC VITA TRANSPORT ERP v4.0 — INSTALLATION GUIDE
**SORA IT TECH Solutions | AY 2025–26**

---

## METHOD 1 — STANDALONE (Open & Use Instantly)
```
1. Open  frontend/index.html  in Chrome or Firefox
2. Select Department from dropdown → credentials auto-fill
3. Click LOGIN → full ERP loads
```
No server, no database, no installation needed.

--- 

## METHOD 2 — FULL PRODUCTION (With Database)

### Prerequisites
- Node.js 18+ → https://nodejs.org
- MySQL 8.0+ → https://dev.mysql.com/downloads/mysql/

### Step 1 — Database  
```sql
-- In MySQL: 
CREATE DATABASE aitrc_transport_erp CHARACTER SET utf8mb4;
CREATE USER 'aitrc_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL ON aitrc_transport_erp.* TO 'aitrc_user'@'localhost';
FLUSH PRIVILEGES;
```
```bash
mysql -u aitrc_user -p aitrc_transport_erp < database/schema.sql
# Expected: "Schema ready: 340 stops loaded"
```

### Step 2 — Backend
```bash
cd backend
cp .env.example .env

# Generate JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env → add DB password and the 2 JWT secrets
nano .env

npm install
node src/utils/setup.js   # Seeds users
npm start
```

### Step 3 — Open
Visit **http://localhost:5000**

---

## METHOD 3 — DOCKER (Easiest Production)
```bash
cd docker
docker-compose up -d
# Wait ~30 seconds for MySQL to initialize

# Seed users:
docker exec aitrc_backend node src/utils/setup.js

# Open: http://localhost:5000
```

---

## LOGIN CREDENTIALS

| Department | Username | Password | Access |
|-----------|---------|----------|--------|
| 🛡️ Super Admin | superadmin | admin@1234 | Everything |
| 🏛️ Principal | principal | admin@1234 | Reports, Students, Fare Matrix |
| 🚌 Transport Manager | transport | admin@1234 | Students, Routes, Drivers |
| 💰 Finance Officer | finance | admin@1234 | Payments, Finance, Reports |
| 📊 Accountant | accountant | admin@1234 | Payments, Reports |
| 🔍 Security Staff | security1 | admin@1234 | Security Gate only |
| 🚗 Bus Driver | driver01 | admin@1234 | Driver Portal only |
| 🎓 Student | student01 | admin@1234 | My Pass, My Payments |

**⚠️ Change all passwords after first login!**

---        

## PAYMENT RULE (AUTOMATIC)
```
Annual ACOP Fare ≤ ₹10,000  →  💎 Single Payment
Annual ACOP Fare >  ₹10,000  →  📅 2 Installments
  Inst 1 = ⌈fare ÷ 2⌉  (Jul–Dec 2025)
  Inst 2 = fare − inst1 (Jan–Jun 2026)
```

---

## API REFERENCE

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/login | Login |
| GET | /api/dashboard/stats | Live KPIs |
| GET | /api/students | All students |
| POST | /api/students | Register student |
| GET | /api/students/:id/qr-pass | Generate QR |
| POST | /api/payments | Record payment |
| GET | /api/payments/overdue | Overdue inst 2 |
| GET | /api/payments/plan-check/:fare | Check plan |
| GET | /api/fare-matrix | All stop fares |
| POST | /api/security/scan | QR gate scan |
| GET | /api/reports/route-wise | Route collection |

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| DB connection failed | Check MySQL running + .env credentials |
| Module not found | Run `npm install` in backend/ |
| Port 5000 in use | Change `PORT=5001` in .env |
| Token expired | Logout and login again |
| 403 Access denied | Check role has permission for that page |

---

*© 2025 SORA IT TECH Solutions — CONFIDENTIAL*



