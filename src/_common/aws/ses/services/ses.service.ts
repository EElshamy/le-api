import {
  GetSendQuotaCommand,
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailCommandOutput,
  SESClient
} from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeHttpHandler } from "@smithy/node-http-handler";
import * as https from 'https';



@Injectable()
export class SesService {
  private readonly sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get('AWS_SES_REGION');
    const accessKeyId = this.configService.get('AWS_SES_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SES_SECRET_ACCESS_KEY');

    // console.log('🚀 Initializing SESClient with config:');
    // console.log('   Region:', region);
    // console.log(
    //   '   AccessKeyId:',
    //   accessKeyId ? accessKeyId.slice(0, 4) + '****' : 'NOT SET'
    // );
    // console.log(
    //   '   SecretAccessKey:',
    //   secretAccessKey ? '****SET****' : 'NOT SET'
    // );

    this.sesClient = new SESClient({
      region: region || 'eu-north-1',
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      },
      maxAttempts: 3,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 10000, // 10 seconds connection timeout
        socketTimeout: 120000, // 2 minutes socket timeout
        httpsAgent: new https.Agent({
          maxSockets: 100 // Set the maximum number of simultaneous connections
        })
      })
    });
  }

  async sendSimpleEmail(
    client: SESClient,
    from: string,
    to: string | string[],
    subject: string,
    body: { htmlBody?: string; textBody?: string }
  ): Promise<SendEmailCommandOutput> {
    if (body.htmlBody && body.textBody) {
      throw new Error('Only one of htmlBody or textBody can be provided');
    }

    const emailParams: SendEmailCommandInput = {
      Source: from,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          ...(body.htmlBody && {
            Html: {
              Data: body.htmlBody,
              Charset: 'UTF-8'
            }
          }),
          ...(body.textBody && {
            Text: {
              Data: body.textBody,
              Charset: 'UTF-8'
            }
          })
        }
      }
    };

    // console.log('📧 Sending email with params:', {
    //   Source: emailParams.Source,
    //   ToAddresses: emailParams.Destination?.ToAddresses,
    //   Subject: emailParams.Message?.Subject?.Data,
    //   BodyType: body.htmlBody ? 'HTML' : 'TEXT'
    // });

    const maxRetries = 7;
    let attempt = 0;
    let lastError: any;
    while (attempt <= maxRetries) {
      try {
        const response = await client.send(new SendEmailCommand(emailParams));
        return response;
      } catch (error: any) {
        const code = error?.Code || error?.code;
        const isThrottling = code === 'Throttling' || code === 'ThrottlingException';
        lastError = error;
        console.error('❌ Error sending email to', to, 'Attempt:', attempt + 1, 'Code:', code);
        if (!isThrottling || attempt === maxRetries) {
          // Non-throttling or exhausted retries: rethrow
          throw error;
        }
        // Exponential backoff with jitter (base 200ms, cap ~8s)
        const base = 200;
        const delay = Math.min(8000, Math.pow(2, attempt) * base);
        const jitter = Math.floor(Math.random() * Math.floor(base));
        const sleep = delay + jitter;
        await new Promise(res => setTimeout(res, sleep));
        attempt++;
      }
    }
    throw lastError;
  }

  async getSESLimits(): Promise<any> {
    console.log('ℹ️ Fetching SES sending quota...');
    const result = await this.sesClient.send(new GetSendQuotaCommand({}));
    console.log('📊 SES Limits:', result);
    return result;
  }
}
