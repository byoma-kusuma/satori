import { createTransport, SentMessageInfo } from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const EMAIL_USER: string = process.env.EMAIL_USER!;
const EMAIL_PASS: string = process.env.EMAIL_PASS!;

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<SentMessageInfo> {
  return transporter.sendMail({
    from: EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}