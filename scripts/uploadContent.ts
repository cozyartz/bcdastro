import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { uploadToCloudflareVideo, uploadToCloudflareImage } from '../bcdastro/src/lib/cloudflare';
import { insertMediaToDB } from '../bcdastro/src/lib/db';
import { convertUsdToEth } from '../bcdastro/src/lib/pricing';

config();

const CONTENT_DIR = 'content/incoming';

async function main() {
  const metaPath = join(CONTENT_DIR, 'meta.json');
  const metadata = JSON.parse(await readFile(metaPath, 'utf-8'));

  const { title: projectTitle, default_price_usd, media } = metadata;

  for (const item of media) {
    const filePath = join(CONTENT_DIR, item.filename);
    const usdPrice = item.price_usd ?? default_price_usd;
    const ethPrice = await convertUsdToEth(usdPrice);

    let result;
    if (item.type === 'video') {
      result = await uploadToCloudflareVideo(filePath);
    } else {
      result = await uploadToCloudflareImage(filePath);
    }

    const { id: cloudflare_id, preview_url } = result;

    await insertMediaToDB({
      title: item.title,
      type: item.type,
      cloudflare_id,
      preview_url,
      fiat_price_cents: Math.round(usdPrice * 100),
      price_wei: ethPrice,
      accepts_stripe: true,
      accepts_crypto: true,
      description: `${projectTitle} - ${item.title}`,
    });
  }

  console.log('✅ Upload complete.');
}

main().catch(console.error);