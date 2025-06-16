const whatsappConfig = {
    appId: process.env.WHATSAPP_APP_ID || "1153538919291940",
    appSecret: process.env.WHATSAPP_APP_SECRET || "0982719782da8a00ddde42febabbd060",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "EAAQZAIzWE3CQBO0EbYKHunc3GIs3NeM2JZCTmSzZBGTKY1ASEGX3YTdQZBnZBxjNGX9oJjaweTIIp0rMvGTBerzfjTNdh30pQY3PZAD5qPiStA1VWc4QlxPh8EUPaG5GZBojIuh2SxOXEWKQKhOSONZAB79HHMmKZCNZArdB6LRVi2aZB6xAaiKwLRifCy7XicZCxvOESAZDZD",
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "3469681606499078",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "589370880934492",
    apiVersion: 'v22.0',
    baseUrl: 'https://graph.facebook.com'
};

module.exports = whatsappConfig; 