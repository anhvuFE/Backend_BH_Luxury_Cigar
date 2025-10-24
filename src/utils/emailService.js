require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter;

const createTransporter = () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS
  } = process.env;

  const host = SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = SMTP_PORT || process.env.EMAIL_PORT;
  const secureFlag = (SMTP_SECURE || process.env.EMAIL_SECURE || '').toLowerCase();
  const user = SMTP_USER || process.env.EMAIL_USER;
  const pass = SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured');
  }

  transporter = nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 465,
    secure: secureFlag ? secureFlag === 'true' : true,
    auth: {
      user,
      pass
    }
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const mailTransporter = createTransporter();
  const { SMTP_USER, EMAIL_USER, SMTP_FROM, EMAIL_FROM } = process.env;

  const mailOptions = {
    from: SMTP_FROM || EMAIL_FROM || SMTP_USER || EMAIL_USER,
    to,
    subject,
    text,
    html
  };

  return mailTransporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail
};
