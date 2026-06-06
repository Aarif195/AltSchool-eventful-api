export const envConfig = () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    jwt: {
        secret: process.env.JWT_SECRET || 'fallbackSuperSecretKeyChangeThisInProd',
        expiresIn: '1d',
    },
    paystack: {
        secretKey: process.env.PAYSTACK_SECRET_KEY,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    },
    mail: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.MAIL_SENDER_EMAIL,
    senderName: process.env.MAIL_SENDER_NAME || 'Eventful Platform',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});
