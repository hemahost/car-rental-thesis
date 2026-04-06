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

export async function sendBookingConfirmationEmail(
  to: string,
  userName: string,
  carName: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  totalPrice: number
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Booking Confirmed! - CarRental",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin: 0 0 8px;">🚗 CarRental</h2>
        <p style="color: #64748b; margin: 0 0 24px;">Booking Confirmation</p>
        <p style="color: #334155;">Hi <strong>${userName}</strong>, your booking has been confirmed!</p>
        <div style="background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Car</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${carName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Pick-up</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Return</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${endDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Duration</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${totalDays} day${totalDays > 1 ? "s" : ""}</td>
            </tr>
            <tr style="border-top: 2px solid #e2e8f0;">
              <td style="padding: 12px 0 0; font-weight: 700; color: #1a1a2e;">Total Price</td>
              <td style="padding: 12px 0 0; text-align: right; font-weight: 700; color: #2563eb; font-size: 1.2rem;">$${totalPrice}</td>
            </tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 0.9rem;">Thank you for choosing CarRental! 🎉</p>
      </div>
    `,
  });
}

export async function sendBookingStatusEmail(
  to: string,
  userName: string,
  carName: string,
  status: string,
  startDate: string,
  endDate: string,
  totalPrice: number
): Promise<void> {
  const isConfirmed = status === "CONFIRMED";
  const subject = isConfirmed
    ? "Your Booking Has Been Confirmed! - CarRental"
    : "Your Booking Has Been Cancelled - CarRental";
  const headerColor = isConfirmed ? "#16a34a" : "#dc2626";
  const statusLabel = isConfirmed ? "✅ Confirmed" : "❌ Cancelled";
  const bodyText = isConfirmed
    ? `Great news, <strong>${userName}</strong>! Your booking has been <strong>confirmed</strong> by our team.`
    : `Hi <strong>${userName}</strong>, unfortunately your booking has been <strong>cancelled</strong>.`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin: 0 0 8px;">🚗 CarRental</h2>
        <p style="color: #64748b; margin: 0 0 24px;">Booking Update</p>
        <p style="color: #334155;">${bodyText}</p>
        <div style="background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Status</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 700; color: ${headerColor};">${statusLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Car</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${carName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Pick-up</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 0.9rem;">Return</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1a1a2e;">${endDate}</td>
            </tr>
            <tr style="border-top: 2px solid #e2e8f0;">
              <td style="padding: 12px 0 0; font-weight: 700; color: #1a1a2e;">Total Price</td>
              <td style="padding: 12px 0 0; text-align: right; font-weight: 700; color: #2563eb; font-size: 1.2rem;">$${totalPrice}</td>
            </tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 0.9rem;">
          ${isConfirmed ? "We look forward to serving you! 🎉" : "We apologize for any inconvenience. Please contact us if you have questions."}
        </p>
      </div>
    `,
  });
}
