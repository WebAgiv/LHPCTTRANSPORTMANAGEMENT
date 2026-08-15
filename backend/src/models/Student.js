'use strict';
const { query }          = require('../config/db');
const { calcPaymentPlan, genStudentCode } = require('../utils/helpers');

class Student {
  static async findAll({ status, route_id, search, offset, limit }) {
    let w = ['1=1'], p = [];
    if (status)   { w.push('s.pass_status = ?'); p.push(status); }
    if (route_id) { w.push('s.route_id = ?');    p.push(route_id); }
    if (search) {
      w.push('(s.full_name LIKE ? OR s.student_code LIKE ? OR s.phone LIKE ?)');
      const q = `%${search}%`; p.push(q, q, q);
    }
    const [rows] = await query(
      `SELECT s.*, r.route_name, r.annual_fare_typical, st.stop_name, st.acop_fare,
              b.bus_number, d.full_name AS driver_name
       FROM students s
       LEFT JOIN routes  r ON s.route_id  = r.id
       LEFT JOIN stops   st ON s.stop_id  = st.id
       LEFT JOIN buses   b  ON r.bus_id   = b.id
       LEFT JOIN drivers d  ON r.driver_id = d.id
       WHERE ${w.join(' AND ')}
       ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [...p, limit, offset]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await query(
      `SELECT s.*, r.route_name, r.annual_fare_typical, b.bus_number,
              d.full_name AS driver_name, d.phone AS driver_phone,
              st.stop_name, st.acop_fare, st.monthly_fare
       FROM students s
       LEFT JOIN routes  r  ON s.route_id  = r.id
       LEFT JOIN stops   st ON s.stop_id   = st.id
       LEFT JOIN buses   b  ON r.bus_id    = b.id
       LEFT JOIN drivers d  ON r.driver_id = d.id
       WHERE s.id = ? OR s.student_code = ? LIMIT 1`,
      [id, id]
    );
    if (!rows.length) return null;
    const student = rows[0];
    // Attach payment plan info
    const pp = calcPaymentPlan(student.acop_fare || student.annual_fare_typical);
    student.payment_plan = pp;
    // Attach payments
    const [pays] = await query(
      'SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC LIMIT 20',
      [student.id]
    );
    student.payments = pays;
    return student;
  }

  static async create(data) {
    const [[{ maxId }]] = await query('SELECT COALESCE(MAX(id),0) AS maxId FROM students');
    const code = data.student_code || genStudentCode(maxId);
    const [result] = await query(
      `INSERT INTO students
        (student_code,full_name,email,phone,parent_phone,gender,dob,branch,
         year,division,roll_no,admission_type,route_id,stop_id,
         pass_status,pass_valid_from,pass_valid_to)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','2025-07-01','2026-06-30')`,
      [code, data.full_name, data.email, data.phone, data.parent_phone,
       data.gender, data.dob, data.branch, data.year, data.division,
       data.roll_no, data.admission_type || 'Regular', data.route_id, data.stop_id || null]
    );
    return { id: result.insertId, student_code: code };
  }

  static async update(id, data) {
    await query(
      `UPDATE students SET full_name=?,email=?,phone=?,parent_phone=?,
        branch=?,year=?,division=?,route_id=?,stop_id=?,pass_status=?
       WHERE id=? OR student_code=?`,
      [data.full_name, data.email, data.phone, data.parent_phone,
       data.branch, data.year, data.division, data.route_id, data.stop_id,
       data.pass_status, id, id]
    );
  }

  static async suspend(id) {
    await query("UPDATE students SET pass_status='suspended' WHERE id=? OR student_code=?", [id, id]);
  }

  static async activate(id) {
    await query("UPDATE students SET pass_status='active' WHERE id=?", [id]);
  }

  static async bulkInsert(students) {
    let ok = 0, skip = 0, errors = [];
    for (const s of students) {
      try {
        await query(
          `INSERT IGNORE INTO students
            (student_code,full_name,email,phone,branch,year,division,route_id,pass_status)
           VALUES (?,?,?,?,?,?,?,?,'pending')`,
          [s.student_code, s.full_name, s.email, s.phone, s.branch, s.year, s.division, s.route_id]
        );
        ok++;
      } catch (e) { skip++; errors.push({ code: s.student_code, error: e.message }); }
    }
    return { ok, skip, errors };
  }
}

module.exports = Student;
