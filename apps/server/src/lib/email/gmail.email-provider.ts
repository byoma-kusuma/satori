import * as nodemailer from "nodemailer";
import { EmailOptions } from "./email-interface";

export async function sendEmailGmail(options: EmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS 
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || ""
  };

  await transporter.sendMail(mailOptions);
}
