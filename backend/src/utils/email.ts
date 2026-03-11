import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetCodeEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Your Password Reset Code - CarRental",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin: 0 0 8px;">🚗 CarRental</h2>
        <p style="color: #64748b; margin: 0 0 24px;">Password Reset Request</p>
        <p style="color: #334155;">You requested a password reset. Use the code below to set a new password. This code expires in <strong>15 minutes</strong>.</p>
        <div style="background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 2rem; font-weight: 700; color: #2563eb; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 0.9rem;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
