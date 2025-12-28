import { EmailClient } from "@azure/communication-email";
import { EmailOptions } from "./email-interface";

export async function sendEmailAzure(options: EmailOptions): Promise<void> {
  const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
  const fromEmail = process.env.AZURE_COMMUNICATION_FROM_EMAIL;

  if (!connectionString) {
    throw new Error("AZURE_COMMUNICATION_CONNECTION_STRING environment variable is not set");
  }

  if (!fromEmail) {
    throw new Error("AZURE_COMMUNICATION_FROM_EMAIL environment variable is not set");
  }

  const client = new EmailClient(connectionString);

  const message = {
    senderAddress: fromEmail,
    content: {
      subject: options.subject,
      plainText: options.text,
      html: options.html || options.text,
    },
    recipients: {
      to: [
        {
          address: options.to,
        },
      ],
    },
  };

  const poller = await client.beginSend(message);
  await poller.pollUntilDone();
} 
