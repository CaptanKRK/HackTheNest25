// content.js for Article Fact Check and Popup Detection coordination

function getArticleData() {
  const title = document.title || "";
  let mainText = "";
  const h1 = document.querySelector("h1");
  if (h1) mainText = h1.innerText;
  const article = document.querySelector("article");
  if (article && article.innerText.length > mainText.length) mainText = article.innerText;
  // Fallback: meta description
  if (!mainText || mainText.trim().length < 20) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) mainText = metaDesc.getAttribute('content') || mainText;
  }
  // Fallback: body text
  if (!mainText || mainText.trim().length < 20) {
    mainText = document.body.innerText.slice(0, 1000);
  }
  return { title, mainText };
}

// eBay scraping function
async function handleEbayScraping() {
  console.log('🔗 Content Script: Starting eBay scraping');
  
  // Check if we're on an eBay page
  const hostname = window.location.hostname.toLowerCase();
  const isEbayPage = hostname.includes('ebay.com') || 
                    hostname.includes('ebay.co.uk') || 
                    hostname.includes('ebay.ca') || 
                    hostname.includes('ebay.com.au');

  if (!isEbayPage) {
    throw new Error('Not on an eBay page');
  }

  // Wait for page to load if needed
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  const productData = {
    url: window.location.href,
    timestamp: Date.now(),
    title: extractEbayTitle(),
    price: extractEbayPrice(),
    seller: extractEbaySeller(),
    condition: extractEbayCondition(),
    shipping: extractEbayShipping(),
    images: extractEbayImages(),
    description: extractEbayDescription(),
    specifications: extractEbaySpecifications(),
    reviews: extractEbayReviews(),
    availability: extractEbayAvailability(),
    category: extractEbayCategory(),
    itemId: extractEbayItemId(),
    sellerRating: extractEbaySellerRating(),
    returnPolicy: extractEbayReturnPolicy(),
    paymentMethods: extractEbayPaymentMethods()
  };

  console.log('🔗 Content Script: eBay data scraped:', productData);
  return productData;
}

// eBay data extraction functions
function extractEbayTitle() {
  const selectors = [
    'h1[data-testid="x-item-title-label"]',
    'h1#x-title-label',
    'h1[class*="title"]',
    'h1',
    '.x-title-label',
    '[data-testid="x-item-title-label"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return document.title || 'Unknown Product';
}

function extractEbayPrice() {
  const priceSelectors = [
    '.notranslate[data-testid="x-price-primary"]',
    '.notranslate[data-testid="x-price-current"]',
    '.notranslate[class*="price"]',
    '.u-flL.condText',
    '.notranslate'
  ];

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.includes('$')) {
      const priceText = element.textContent.trim();
      const priceMatch = priceText.match(/[\$£€¥]\s*[\d,]+\.?\d*/);
      if (priceMatch) {
        return {
          current: priceMatch[0],
          original: priceText,
          currency: extractCurrency(priceText)
        };
      }
    }
  }

  return { current: 'Price not found', original: '', currency: 'USD' };
}

function extractCurrency(priceText) {
  if (priceText.includes('£')) return 'GBP';
  if (priceText.includes('€')) return 'EUR';
  if (priceText.includes('¥')) return 'JPY';
  if (priceText.includes('$')) return 'USD';
  return 'USD';
}

function extractEbaySeller() {
  const sellerSelectors = [
    '[data-testid="x-sellercard-atf"] a',
    '.mbg-nw a',
    '.mbg a',
    '[data-testid="x-sellercard-atf"]',
    '.mbg-nw'
  ];

  for (const selector of sellerSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const sellerName = element.textContent.trim();
      const sellerUrl = element.href || '';
      return {
        name: sellerName,
        url: sellerUrl,
        id: extractSellerId(sellerUrl)
      };
    }
  }

  return { name: 'Unknown Seller', url: '', id: '' };
}

function extractSellerId(url) {
  if (!url) return '';
  const match = url.match(/\/usr\/([^\/\?]+)/);
  return match ? match[1] : '';
}

function extractEbayCondition() {
  const conditionSelectors = [
    '[data-testid="x-condition-label"]',
    '.u-flL.condText',
    '.u-flL',
    '[class*="condition"]'
  ];

  for (const selector of conditionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Condition not specified';
}

function extractEbayShipping() {
  const shippingSelectors = [
    '[data-testid="x-shipping-label"]',
    '.u-flL.condText',
    '[class*="shipping"]'
  ];

  for (const selector of shippingSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Shipping information not available';
}

function extractEbayImages() {
  const imageSelectors = [
    '[data-testid="x-image-carousel"] img',
    '.img img',
    '.img',
    '[class*="image"] img'
  ];

  const images = [];
  
  for (const selector of imageSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(img => {
      if (img.src && !images.includes(img.src)) {
        images.push(img.src);
      }
    });
  }

  return images.slice(0, 10); // Limit to 10 images
}

function extractEbayDescription() {
  const descSelectors = [
    '[data-testid="x-description"]',
    '.u-flL.condText',
    '.u-flL',
    '[class*="description"]'
  ];

  for (const selector of descSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim().substring(0, 1000); // Limit length
    }
  }

  return 'Description not available';
}

function extractEbaySpecifications() {
  const specSelectors = [
    '.u-flL.condText',
    '[class*="specification"]',
    '[class*="detail"]'
  ];

  const specs = {};
  
  for (const selector of specSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const text = element.textContent.trim();
      if (text.includes(':')) {
        const [key, value] = text.split(':', 2);
        if (key && value) {
          specs[key.trim()] = value.trim();
        }
      }
    });
  }

  return specs;
}

function extractEbayReviews() {
  const reviewSelectors = [
    '[data-testid="x-review-label"]',
    '[class*="review"]',
    '[class*="rating"]'
  ];

  for (const selector of reviewSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'No reviews available';
}

function extractEbayAvailability() {
  const availabilitySelectors = [
    '[data-testid="x-availability-label"]',
    '[class*="availability"]',
    '[class*="stock"]'
  ];

  for (const selector of availabilitySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Availability not specified';
}

function extractEbayCategory() {
  const categorySelectors = [
    '[data-testid="x-breadcrumb"]',
    '.breadcrumb',
    '[class*="breadcrumb"]',
    '[class*="category"]'
  ];

  for (const selector of categorySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Category not specified';
}

function extractEbayItemId() {
  const url = window.location.href;
  const match = url.match(/\/itm\/(\d+)/);
  return match ? match[1] : '';
}

function extractEbaySellerRating() {
  const ratingSelectors = [
    '[data-testid="x-sellercard-atf"] [class*="rating"]',
    '.mbg-nw [class*="rating"]',
    '[class*="seller-rating"]'
  ];

  for (const selector of ratingSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Rating not available';
}

function extractEbayReturnPolicy() {
  const returnSelectors = [
    '[data-testid="x-return-policy"]',
    '[class*="return"]',
    '[class*="policy"]'
  ];

  for (const selector of returnSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Return policy not specified';
}

function extractEbayPaymentMethods() {
  const paymentSelectors = [
    '[data-testid="x-payment-methods"]',
    '[class*="payment"]',
    '[class*="method"]'
  ];

  for (const selector of paymentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }

  return 'Payment methods not specified';
}

// Enhanced popup detection coordination
if (typeof window !== 'undefined') {
  console.log('🔗 Security Scanner: Content script coordinator loaded');
  
  let popupSettings = {};

  // Get popup settings from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['popupSettings'], (result) => {
      popupSettings = result.popupSettings || {};
      console.log('🔗 Security Scanner: Loaded popup settings:', popupSettings);
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.popupSettings) {
        popupSettings = changes.popupSettings.newValue || {};
        console.log('🔗 Security Scanner: Updated popup settings:', popupSettings);
      }
    });
  }

  // Listen for popup blocked events from the main world script
  document.addEventListener('securityScannerPopupBlocked', function(event) {
    const details = event.detail;
    console.log('🔗 Security Scanner: Received popup blocked event:', details);
    
    const currentDomain = details.domain;
    
    // Check saved preferences
    if (popupSettings[currentDomain] === 'allow') {
      console.log('🔗 Security Scanner: User preference is to allow popups for this domain');
      // Dispatch event to main world to execute popup
      const executeEvent = new CustomEvent('securityScannerExecutePopup', {
        detail: {
          url: details.url,
          name: details.name,
          features: details.features
        }
      });
      document.dispatchEvent(executeEvent);
      return;
    }
    
    if (popupSettings[currentDomain] === 'block') {
      console.log('🔗 Security Scanner: User preference is to block popups for this domain');
      return;
    }
    
    // No preference saved, show confirmation dialog
    const popupId = 'popup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Send to service worker to show confirmation dialog
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'popupAttempt',
        url: details.url,
        source: details.source,
        domain: details.domain,
        name: details.name,
        features: details.features,
        popupId: popupId,
        blockedCount: details.blockedCount
      }).catch(error => {
        console.error('🔗 Security Scanner: Error sending popup message:', error);
      });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeArticle") {
    sendResponse(getArticleData());
  } else if (request.type === "ebay_scrape") {
    console.log('🔗 Content Script: Received eBay scrape request');
    handleEbayScraping()
      .then(data => {
        console.log('🔗 Content Script: eBay scraping successful:', data);
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('🔗 Content Script: eBay scraping failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (request.action === "analyzeToS") {
    // Check if current page is a ToS page
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase();
    
    const tosIndicators = [
      'terms of service', 'terms and conditions', 'terms of use',
      'user agreement', 'service agreement', 'legal terms',
      'terms', 'conditions', 'agreement', 'policy'
    ];
    
    const tosUrlPatterns = [
      '/terms', '/tos', '/terms-of-service', '/terms-and-conditions',
      '/legal', '/agreement', '/user-agreement', '/service-agreement',
      '/terms-of-use', '/conditions', '/policy'
    ];
    
    const urlMatch = tosUrlPatterns.some(pattern => url.includes(pattern));
    const titleMatch = tosIndicators.some(indicator => title.includes(indicator));
    const contentMatch = tosIndicators.some(indicator => bodyText.includes(indicator));
    
    const isToSPage = urlMatch || titleMatch || contentMatch;
    
    sendResponse({ isToSPage });
  } else if (request.type === 'executePopup' && request.popupId) {
    console.log('🔗 Security Scanner: User chose to allow popup');
    
    // Create a notification that the popup was allowed
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 600;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>✅</span>
        <div>
          <div>Popup Allowed</div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
            Opening ${request.url ? new URL(request.url).hostname : 'popup'}...
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Dispatch event to main world to execute the popup
    setTimeout(() => {
      const executeEvent = new CustomEvent('securityScannerExecutePopup', {
        detail: {
          url: request.url,
          name: request.name,
          features: request.features,
          popupId: request.popupId
        }
      });
      document.dispatchEvent(executeEvent);
      
      sendResponse({ success: true });
    }, 500);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
    
    return true; // Will respond asynchronously
  } else if (request.type === 'blockPopup' && request.popupId) {
    console.log('🔗 Security Scanner: User chose to block popup');
    sendResponse({ success: true });
  }
});