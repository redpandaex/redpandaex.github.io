/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://redpandaex.github.io',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  outDir: 'out', // 因为您使用的是output: "export"，所以输出目录是 "out"
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/404',
    '/500'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://redpandaex.github.io/server-sitemap.xml', // 如果您有动态生成的页面
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/'
      }
    ]
  }
}