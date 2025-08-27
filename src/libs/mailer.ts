import nodemailer from "nodemailer";

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
  MAIL_FROM,
} = process.env;

export const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: Number(MAIL_PORT || 587),
  secure: false, // true nếu dùng 465
  auth: MAIL_USER && MAIL_PASS ? { user: MAIL_USER, pass: MAIL_PASS } : undefined,
});

export async function sendMail(opts: { to: string; subject: string; html: string; }) {
  await transporter.sendMail({
    from: MAIL_FROM || MAIL_USER,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
