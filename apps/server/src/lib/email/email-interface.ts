export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type SendEmailFunction = (options: EmailOptions) => Promise<any>;

export type EmailProvider = "azure" | "gmail";
export const EMAIL_SERVICE_PROVIDERS: Record<EmailProvider, string> = {
  azure: "azure",
  gmail: "gmail",
};