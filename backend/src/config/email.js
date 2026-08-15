'use strict';
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER) {
    console.warn('[Email] SMTP not configured — skipping send');
    return { messageId: 'skipped' };
  }
  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'AITRC Transport'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to, subject, html, text,
  });
  return info;
}

module.exports = { sendMail };
