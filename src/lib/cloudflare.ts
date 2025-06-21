export async function getSignedImageUrl(imageId: string, env: any) {
     return `https://imagedelivery.net/<your-account-hash>/${imageId}/public?signed=true&expires=86400`;
   }

   export async function getSignedStreamUrl(streamId: string, env: any) {
     return `https://customer-f73n9hage318w7.cloudflarest.com/${streamId}/downloads/default.mp4?signed=true&expires=86400`;
   }