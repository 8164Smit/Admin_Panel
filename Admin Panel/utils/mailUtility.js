const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendOTPEmail = async (toEmail, otp, adminName) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Password Reset OTP - Admin Panel',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px 30px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
          .body { padding: 40px 30px; }
          .otp-box { background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
          .otp-code { font-size: 42px; font-weight: 900; color: #fff; letter-spacing: 8px; }
          .info { color: #64748b; font-size: 14px; line-height: 1.6; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="body">
            <p style="color:#1e293b;font-size:16px;">Hello <strong>${adminName}</strong>,</p>
            <p class="info">We received a request to reset your Admin Panel password. Use the OTP below to proceed:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p class="info">⏱ This OTP is valid for <strong>10 minutes</strong> only.</p>
            <p class="info">If you didn't request this, please ignore this email. Your account remains secure.</p>
          </div>
          <div class="footer">
            <p>Admin Panel &copy; ${new Date().getFullYear()} — Secure & Reliable</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
