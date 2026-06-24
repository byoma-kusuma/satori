export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export type SendEmailFunction = (options: EmailOptions) => Promise<void>;

export type EmailProvider = "azure" | "gmail";
export const EMAIL_SERVICE_PROVIDERS: Record<EmailProvider, string> = {
  azure: "azure",
  gmail: "gmail",
};
