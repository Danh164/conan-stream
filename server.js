const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/proxy/:targetDomain', createProxyMiddleware({
  target: 'https://placeholder.com', // overridden by router
  router: function(req) {
    return 'https://' + req.params.targetDomain;
  },
  pathRewrite: function(path, req) {
    return path.replace('/proxy/' + req.params.targetDomain, '');
  },
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Referer', 'https://audioxin.com/');
      proxyReq.setHeader('Origin', 'https://audioxin.com/');
      proxyReq.setHeader('Host', req.params.targetDomain);
      proxyReq.setHeader('User-Agent', 'curl/8.7.1'); // Fake curl to avoid TLS fingerprint mismatch for browsers
      
      // Remove browser-specific headers that trigger Cloudflare TLS fingerprint checks
      const headersToRemove = [
        'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
        'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-user', 'accept-language', 'accept-encoding', 'accept'
      ];
      headersToRemove.forEach(h => proxyReq.removeHeader(h));
      
      console.log(`[Proxy] -> ${req.params.targetDomain}${req.url} - Headers:`, proxyReq.getHeaders());
    }
  }
}));

app.get('/api/video', async (req, res) => {
  try {
    const ep = req.query.ep;
    const url = `https://audioxin.com/conan-long-tieng-moi-nhat/tap-${ep}`;

    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const $ = cheerio.load(data);

    const videoSrc = $('#myVideo').attr('src') || $('video source').attr('src') || $('source').attr('src');

    if (videoSrc) {
      try {
        const parsedUrl = new URL(videoSrc);
        const proxiedUrl = `/proxy/${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;
        res.json({ success: true, video: proxiedUrl });
      } catch (e) {
        res.json({ success: false, error: 'Invalid video URL: ' + videoSrc });
      }
    } else {
      res.json({ success: false, error: 'No video source found' });
    }
  } catch (e) {
    console.error(`Error loading episode ${req.query.ep}:`, e.message);
    res.json({ success: false, error: e.message });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
