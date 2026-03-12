export interface IDigitalOceanConfig {
  spaces: {
    key: string;
    secret: string;
    endpoint: string;
    region: string;
    bucket: string;
  };
  sendgrid: {
    apiKey: string;
    senderEmail: string;
  };
}
