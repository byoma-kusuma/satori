import { sendEmailGmail } from "./email/gmail.email-provider";
import { sendEmailAzure } from "./email/azure.email-provider";
import { EmailOptions } from "./email/email-interface";


export async function sendEmail(options: EmailOptions): Promise<any> {
  const provider = process.env.EMAIL_SERVICE_PROVIDER;

  switch (provider) {
    case "azure":
    case "azure-communication-services":
      return await sendEmailAzure(options);
    case "gmail":
      return await sendEmailGmail(options);
    default:
      throw new Error(`Unsupported email service provider: ${provider}. Supported providers: azure, azure-communication-services, gmail`);
  }
}