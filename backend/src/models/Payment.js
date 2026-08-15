'use strict';
const { query }         = require('../config/db');
const { calcPaymentPlan, genPaymentRef } = require('../utils/helpers');

class Payment {
  static calcPlan(annualFare) {
    return calcPaymentPlan(annualFare);
  }

  static async findAll({ student_id, status, plan, offset, limit }) {
    let w = ['1=1'], p = [];
    if (student_id) { w.push('p.student_id = ?');    p.push(student_id); }
    if (status)     { w.push('p.status = ?');        p.push(status); }
    if (plan)       { w.push('p.payment_plan = ?');  p.push(plan); }
    const [rows] = await query(
      `SELECT p.*, s.student_code, s.full_name, r.route_name
       FROM payments p
       LEFT JOIN students s ON p.student_id = s.id
       LEFT JOIN routes   r ON p.route_id   = r.id
       WHERE ${w.join(' AND ')}
       ORDER BY p.payment_date DESC LIMIT ? OFFSET ?`,
      [...p, limit, offset]
    );
    return rows;
  }

  static async create({ student_id, route_id, annual_fare, amount, payment_plan,
                         installment_no = 1, for_period_from, for_period_to,
                         method = 'cash', gateway_txn_id, notes,
                         academic_year = '2025-26', collected_by }) {
    // Auto-calculate plan from annual_fare
    const pp = calcPaymentPlan(parseInt(annual_fare) || 0);
    const finalPlan   = payment_plan || pp.plan;
    const finalInstOf = pp.installments;
    const finalAmount = parseInt(amount) || (installment_no === 1 ? pp.inst1 : pp.inst2);

    // Prevent duplicate installment
    if (finalPlan === 'two') {
      const [ex] = await query(
        `SELECT id FROM payments WHERE student_id=? AND installment_no=? AND academic_year=? AND status='success'`,
        [student_id, installment_no, academic_year]
      );
      if (ex.length) throw Object.assign(new Error(`Installment ${installment_no} already paid for AY ${academic_year}`), { status: 409 });
    }

    const ref = genPaymentRef();
    const [result] = await query(
      `INSERT INTO payments
        (payment_ref,student_id,route_id,amount,annual_fare,payment_plan,
         installment_no,installment_of,for_period_from,for_period_to,
         academic_year,method,gateway_txn_id,status,collected_by,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'success',?,?)`,
      [ref, student_id, route_id, finalAmount, annual_fare || 0, finalPlan,
       installment_no, finalInstOf, for_period_from, for_period_to,
       academic_year, method, gateway_txn_id || null, collected_by || null, notes || null]
    );

    // Activate student pass
    await query("UPDATE students SET pass_status='active' WHERE id=?", [student_id]);

    return { id: result.insertId, payment_ref: ref, plan: finalPlan, amount: finalAmount, installment_no, installment_of: finalInstOf };
  }

  static async summary() {
    const [[data]] = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN status='success' THEN amount END), 0) AS total_collected,
         COUNT(CASE WHEN status='success' THEN 1 END)                  AS success_count,
         COUNT(CASE WHEN status='failed'  THEN 1 END)                  AS failed_count,
         COUNT(DISTINCT CASE WHEN payment_plan='single' AND status='success' THEN student_id END) AS single_paid,
         COUNT(DISTINCT CASE WHEN installment_no=1 AND status='success' THEN student_id END)      AS inst1_paid,
         COUNT(DISTINCT CASE WHEN installment_no=2 AND status='success' THEN student_id END)      AS inst2_paid
       FROM payments WHERE academic_year='2025-26'`
    );
    return data;
  }

  static async overdue() {
    const [rows] = await query(
      `SELECT s.student_code, s.full_name, s.phone, r.route_name,
              p.amount AS inst1_amount, p.payment_date AS inst1_date,
              r.annual_fare_typical, (r.annual_fare_typical - p.amount) AS inst2_due
       FROM students s
       JOIN payments p ON p.student_id = s.id AND p.installment_no = 1 AND p.status = 'success'
       JOIN routes   r ON s.route_id = r.id
       WHERE r.annual_fare_typical > 10000
         AND s.pass_status != 'suspended'
         AND s.id NOT IN (
           SELECT student_id FROM payments
           WHERE (installment_no=2 OR payment_plan='single') AND status='success'
         )
       ORDER BY inst2_due DESC`
    );
    return rows;
  }

  static async forStudent(studentId) {
    const [rows] = await query(
      `SELECT p.*, r.route_name FROM payments p
       LEFT JOIN routes r ON p.route_id = r.id
       WHERE p.student_id = ? OR p.student_id = (SELECT id FROM students WHERE student_code=? LIMIT 1)
       ORDER BY p.payment_date DESC`,
      [studentId, studentId]
    );
    const inst1  = rows.find(p => p.installment_no === 1 && p.status === 'success');
    const inst2  = rows.find(p => p.installment_no === 2 && p.status === 'success');
    const single = rows.find(p => p.payment_plan   === 'single' && p.status === 'success');
    const total  = rows.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0);
    return {
      payments: rows,
      summary:  { inst1_paid: !!(inst1 || single), inst2_paid: !!(inst2 || single), single_paid: !!single, total_paid: total },
    };
  }
}

module.exports = Payment;
