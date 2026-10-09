// Generates the logo, favicons, app icons and social images from SVG sources.
// Usage (from packages/nextjs): node scripts/make-assets.mjs
import { mkdirSync, writeFileSync } from "fs";
import sharp from "sharp";

const BRAND = "#0f9d6e";
const DARK = "#0a7a54";
const COIN = "#fbbf24";
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

// A house whose body is a "U" (urunan, your asset) with a coin: pooled money held together.
const mark = (size = 512, bg = true) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND}"/><stop offset="1" stop-color="${DARK}"/></linearGradient></defs>
  ${bg ? `<rect width="512" height="512" rx="112" fill="url(#g)"/>` : ""}
  <polyline points="88,252 256,112 424,252" fill="none" stroke="${bg ? "#fff" : BRAND}" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M164 262 V330 a92 92 0 0 0 184 0 V262" fill="none" stroke="${bg ? "#fff" : BRAND}" stroke-width="42" stroke-linecap="round"/>
  <circle cx="256" cy="318" r="28" fill="${COIN}"/>
</svg>`;

const wordmark = (color = BRAND) => `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="200" viewBox="0 0 720 200">
  <g transform="translate(0,20) scale(0.3125)">${mark(512, true).replace(/<\/?svg[^>]*>/g, "")}</g>
  <text x="200" y="128" font-family="${FONT}" font-size="104" font-weight="900" letter-spacing="-2" fill="${color}">URSSET</text>
</svg>`;

const social = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f9d6e"/><stop offset="1" stop-color="#075e43"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="110" r="220" fill="#ffffff" opacity="0.07"/>
  <circle cx="1120" cy="560" r="160" fill="#ffffff" opacity="0.06"/>
  <g transform="translate(80,80) scale(0.34)">${mark(512, true).replace(/<\/?svg[^>]*>/g, "").replace(/url\(#g\)/, "#ffffff22")}</g>
  <text x="270" y="170" font-family="${FONT}" font-size="64" font-weight="900" letter-spacing="-1" fill="#fff">URSSET</text>
  <text x="80" y="330" font-family="${FONT}" font-size="92" font-weight="900" letter-spacing="-2" fill="#fff">3 langkah,</text>
  <text x="80" y="430" font-family="${FONT}" font-size="92" font-weight="900" letter-spacing="-2" fill="#fff">kamu punya aset.</text>
  <text x="80" y="510" font-family="${FONT}" font-size="34" fill="#d5f3e6">Urunan bareng teman beli rumah kos, terima sewa, jual kapan saja.</text>
  <text x="80" y="575" font-family="${FONT}" font-size="28" font-weight="700" fill="${COIN}">RWA di Robinhood Chain · Ethereum Jakarta Hackathon 2026</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });
mkdirSync("app", { recursive: true });

writeFileSync("public/logo-mark.svg", mark(512, true).trim());
writeFileSync("public/logo.svg", wordmark().trim());
writeFileSync("public/logo-white.svg", wordmark("#ffffff").trim());
writeFileSync("app/icon.svg", mark(512, true).trim());

const png = (svg, w, h, file) => sharp(Buffer.from(svg), { density: 192 }).resize(w, h).png().toFile(file);
await Promise.all([
  png(mark(512), 512, 512, "public/icons/icon-512.png"),
  png(mark(512), 192, 192, "public/icons/icon-192.png"),
  png(mark(512), 180, 180, "app/apple-icon.png"),
  png(mark(512), 64, 64, "public/favicon.png"),
  png(social, 1200, 630, "app/opengraph-image.png"),
  png(social, 1200, 630, "public/thumbnail.png"),
  png(wordmark(), 1440, 400, "public/logo.png"),
]);

writeFileSync(
  "public/manifest.webmanifest",
  JSON.stringify(
    {
      name: "URSSET: urunan asset",
      short_name: "URSSET",
      description: "3 langkah, kamu punya aset.",
      start_url: "/",
      display: "standalone",
      background_color: "#f6f8f7",
      theme_color: BRAND,
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    null,
    2,
  ),
);
console.log("assets written");
