export const envConfig = () => ({
    port: parseInt(process.env.PORT || '3000', 10), jwt: {
        secret: process.env.JWT_SECRET || 'fallbackSuperSecretKeyChangeThisInProd',
        expiresIn: '1d',
    },
    paystack: {
        secretKey: process.env.PAYSTACK_SECRET_KEY,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    },
});