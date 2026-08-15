'use strict';

/**
 * Smart Payment Plan Calculator
 * Rule: annual_fare <= 10000 → Single payment
 *       annual_fare >  10000 → 2 Installments
 */
function calcPaymentPlan(annualFare) {
  const fare = parseInt(annualFare) || 0;
  if (fare <= 0)     return { plan: 'single', installments: 1, inst1: 0,    inst2: 0    };
  if (fare <= 10000) return { plan: 'single', installments: 1, inst1: fare,  inst2: 0    };
  const inst1 = Math.ceil(fare / 2);
  const inst2 = fare - inst1;
  return { plan: 'two', installments: 2, inst1, inst2 };
}

/** Generate unique payment reference */
function genPaymentRef() {
  return 'TXN' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100).toString().padStart(2,'0');
}

/** Generate student code */
function genStudentCode(lastId) {
  return 'AITRC' + new Date().getFullYear() + String(lastId + 1).padStart(4, '0');
}

/** Format INR */
function formatINR(amount) {
  return '₹' + parseInt(amount || 0).toLocaleString('en-IN');
}

/** Validate mobile number */
function isValidMobile(phone) {
  return /^[6-9]\d{9}$/.test(String(phone || '').replace(/\s/g, ''));
}

/** Paginate helper */
function paginate(page, limit) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(500, Math.max(1, parseInt(limit) || 50));
  return { offset: (p - 1) * l, limit: l, page: p };
}

module.exports = { calcPaymentPlan, genPaymentRef, genStudentCode, formatINR, isValidMobile, paginate };
