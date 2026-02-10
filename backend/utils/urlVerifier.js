const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Verify if a URL is accessible and returns a valid HTTP status
 * @param {string} urlString - The URL to verify
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<{isValid: boolean, statusCode?: number, error?: string}>}
 */
async function verifyUrl(urlString, timeout = 10000) {
  return new Promise((resolve) => {
    if (!urlString || typeof urlString !== 'string') {
      return resolve({ isValid: false, error: 'Invalid URL string' });
    }

    // Ensure URL has protocol
    let urlToCheck = urlString.trim();
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = 'https://' + urlToCheck;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(urlToCheck);
    } catch (error) {
      return resolve({ isValid: false, error: 'Invalid URL format' });
    }

    // Determine which module to use
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD', // Use HEAD to avoid downloading full content
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SkillEnhancementBot/1.0; +https://skill-enhancement-platform.com)',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      // Reject unauthorized SSL certificates in production, but allow in development
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    };

    const req = client.request(options, (res) => {
      // Consider 2xx and 3xx status codes as valid
      const isValid = res.statusCode >= 200 && res.statusCode < 400;
      res.destroy(); // Close the response
      resolve({
        isValid,
        statusCode: res.statusCode,
        error: isValid ? undefined : `HTTP ${res.statusCode}`
      });
    });

    req.on('error', (error) => {
      // Handle specific error types
      let errorMessage = 'Connection failed';
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Domain not found';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        errorMessage = 'Request timeout';
      } else if (error.code === 'CERT_HAS_EXPIRED') {
        errorMessage = 'SSL certificate expired';
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        errorMessage = 'SSL certificate verification failed';
      } else {
        errorMessage = error.message || 'Unknown error';
      }
      resolve({ isValid: false, error: errorMessage });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ isValid: false, error: 'Request timeout' });
    });

    req.setTimeout(timeout);
    req.end();
  });
}

/**
 * Verify multiple URLs in parallel (with rate limiting)
 * @param {string[]} urls - Array of URLs to verify
 * @param {number} concurrency - Maximum concurrent requests (default: 5)
 * @returns {Promise<Array<{url: string, result: Object}>>}
 */
async function verifyUrls(urls, concurrency = 5) {
  const results = [];
  const queue = [...urls];
  
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    workers.push(processQueue());
  }

  async function processQueue() {
    while (queue.length > 0) {
      const url = queue.shift();
      const result = await verifyUrl(url);
      results.push({ url, result });
      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  await Promise.all(workers);
  return results;
}

/**
 * Check if URL belongs to known authentic platforms
 * @param {string} urlString - The URL to check
 * @returns {boolean}
 */
function isKnownAuthenticPlatform(urlString) {
  if (!urlString) return false;
  
  const authenticDomains = [
    'youtube.com',
    'youtu.be',
    'udemy.com',
    'coursera.org',
    'edx.org',
    'linkedin.com',
    'pluralsight.com',
    'skillshare.com',
    'khanacademy.org',
    'freecodecamp.org',
    'codecademy.com',
    'udacity.com',
    'medium.com',
    'github.com',
    'stackoverflow.com',
    'w3schools.com',
    'mdn.io',
    'developer.mozilla.org',
    'docs.python.org',
    'nodejs.org',
    'react.dev',
    'vuejs.org',
    'angular.io',
    'typescriptlang.org'
  ];

  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return authenticDomains.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

module.exports = {
  verifyUrl,
  verifyUrls,
  isKnownAuthenticPlatform
};
