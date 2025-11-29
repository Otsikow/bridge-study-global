const fs = require("fs");
const path = require("path");

const pages = [
  "",
  "contact",
  "faq",
  "blog",
  "legal/privacy",
  "legal/terms",
  "auth/login",
  "auth/signup",
  "search",
  "courses",
  "universities",
  "partnership",
  "visa-calculator",
  "feedback",
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
    <url>
      <loc>https://www.unidoxia.com/${page}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${page === "" ? "1.0" : "0.8"}</priority>
    </url>
  `
    )
    .join("")}
</urlset>`;

fs.writeFileSync(path.resolve(__dirname, "../public/sitemap.xml"), sitemap);

console.log("Sitemap generated successfully!");
