import nodemailer from "nodemailer";
import { env } from "../config/env";
import logger from "../config/logger";

export async function sendEmail(options: { to: string; subject: string; html: string; text?: string }) {
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"PalikaOS" <${env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Message sent: ${info.messageId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error sending email: ${error.message}`);
    // We don't throw here to prevent the API from crashing if email fails, 
    // but in a production environment you might want to handle it differently.
    return false;
  }
}
