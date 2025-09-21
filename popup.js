// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing popup...');
  
  // Initialize blockchain storage
  if (typeof blockchainStorage === 'undefined') {
    // Load blockchain storage script if not already loaded
    const script = document.createElement('script');
    script.src = 'blockchain_storage.js';
    script.onload = () => {
      initializeBlockchainUI();
    };
    document.head.appendChild(script);
  } else {
    initializeBlockchainUI();
  }

  // Dark mode toggle functionality
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  
  // Load saved theme preference or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', savedTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = body.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Broadcast theme change to other UIs
      chrome.runtime.sendMessage({
        type: 'themeChanged',
        theme: newTheme
      }).catch(() => {
        // Ignore errors if no listeners
      });
      
      // Add a nice transition effect
      themeToggle.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        themeToggle.style.transform = '';
      }, 300);
    });
  }

const urlInput = document.getElementById('urlInput');
const scanBtn = document.getElementById('scanBtn');
const status = document.getElementById('status');
const resultDiv = document.getElementById('result');

// Email breach checker elements
const emailInput = document.getElementById('emailInput');
const emailScanBtn = document.getElementById('emailScanBtn');
const emailStatus = document.getElementById('emailStatus');
const emailResultDiv = document.getElementById('emailResult');

// ToS scanner elements
const tosScanBtn = document.getElementById('tosScanBtn');
const tosStatus = document.getElementById('tosStatus');
const tosResultDiv = document.getElementById('tosResult');

// Check if all elements exist before adding event listeners
if (!emailInput || !emailScanBtn || !emailStatus || !emailResultDiv) {
  console.error('Email elements not found in DOM');
}

if (!tosScanBtn || !tosStatus || !tosResultDiv) {
  console.error('ToS scanner elements not found in DOM');
}

scanBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Please enter a URL to scan', 'error');
    urlInput.focus();
    return;
  }
  
  showStatus('Analyzing URL...', 'loading');
  resultDiv.textContent = '';
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';

  try {
    // send a scan request to service worker
    const response = await chrome.runtime.sendMessage({ type: 'startScan', url });
    if (response && response.status === 'ok') {
      showStatus('Scan complete', 'success');
      showResult(response.result);
    } else {
      showStatus('Scan failed', 'error');
      resultDiv.innerHTML = `<div style="color: #e53e3e;">❌ Unable to scan this URL. Please try again.</div>`;
    }
  } catch (err) {
    showStatus('Connection error', 'error');
    resultDiv.innerHTML = `<div style="color: #e53e3e;">❌ ${err.message || 'Unable to connect to scanner service'}</div>`;
  } finally {
    scanBtn.disabled = false;
    scanBtn.innerHTML = `
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" stroke="currentColor" stroke-width="2" fill="currentColor"/>
      </svg>
      Scan
    `;
  }
});

function showStatus(message, type = 'info') {
  status.textContent = message;
  status.className = `status ${type}`;
}

function showResult(res) {
  const { score, verdict, reasons } = res;
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  const statusIcon = score >= 70 ? '⚠️' : score >= 40 ? '⚠️' : '✅';
  const statusColor = score >= 70 ? '#e53e3e' : score >= 40 ? '#d69e2e' : '#38a169';
  
  resultDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <div style="width: 24px; height: 24px; border-radius: 50%; background: ${statusColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
        ${score >= 70 ? '!' : score >= 40 ? '?' : '✓'}
      </div>
      <div>
        <strong>Security Assessment:</strong> <span class="${scoreClass}">${verdict}</span>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Risk Score: ${score}/100</div>
      </div>
    </div>
    <div style="margin-bottom: 8px;"><strong>Detection Details:</strong></div>
    <ul style="margin: 0; padding-left: 20px;">
      ${reasons.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
    </ul>
  `;
  
  // Blockchain storage is now handled automatically by the service worker
  // No need to manually store here since automatic detection handles it
}

// Handle "Scan Current Page" button
document.getElementById('gotoScan').addEventListener('click', async () => {
  const gotoBtn = document.getElementById('gotoScan');
  const originalText = gotoBtn.innerHTML;
  
  try {
    gotoBtn.disabled = true;
    gotoBtn.innerHTML = `
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Scanning...
    `;
    showStatus('Getting current page URL...', 'loading');
    resultDiv.textContent = '';
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot scan browser internal pages');
    }
    
    // Set the URL in the input field
    urlInput.value = tab.url;
    
    // Show scanning status
    showStatus('Analyzing current page...', 'loading');
    
    // Automatically perform the scan
    const response = await chrome.runtime.sendMessage({ type: 'startScan', url: tab.url });
    if (response && response.status === 'ok') {
      showStatus('Scan complete', 'success');
      showResult(response.result);
    } else {
      showStatus('Scan failed', 'error');
      resultDiv.innerHTML = `<div style="color: #e53e3e;">❌ Unable to scan this URL. Please try again.</div>`;
    }
    
  } catch (err) {
    console.error('Error scanning current page:', err);
    showStatus(`Cannot scan current page: ${err.message}`, 'error');
    if (err.message.includes('Unable to connect')) {
      resultDiv.innerHTML = `<div style="color: #e53e3e;">❌ ${err.message || 'Unable to connect to scanner service'}</div>`;
    }
  } finally {
    gotoBtn.disabled = false;
    gotoBtn.innerHTML = originalText;
  }
});

// uBlock Settings button
document.getElementById('openUBlock').addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('ublock_popup.html')
  });
});

// eBay Scraper button
document.getElementById('ebayScrapeBtn').addEventListener('click', async () => {
  const ebayBtn = document.getElementById('ebayScrapeBtn');
  const originalText = ebayBtn.innerHTML;
  
  try {
    ebayBtn.disabled = true;
    ebayBtn.innerHTML = `
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Analyzing...
    `;
    
    showStatus('Scraping eBay product data...', 'loading');
    resultDiv.textContent = '';
    
    // First scrape the eBay data
    const scrapeResponse = await chrome.runtime.sendMessage({
      type: 'ebay_scrape'
    });
    
    if (!scrapeResponse || !scrapeResponse.success) {
      throw new Error(scrapeResponse?.error || 'Failed to scrape eBay data - no response from service worker');
    }
    
    showStatus('Analyzing with AI...', 'loading');
    
    // Then analyze with AI
    const analysisResponse = await chrome.runtime.sendMessage({
      type: 'ebay_analyze',
      data: scrapeResponse.result
    });
    
    if (!analysisResponse || !analysisResponse.success) {
      throw new Error(analysisResponse?.error || 'Failed to analyze eBay data - no response from service worker');
    }
    
    // Display the analysis results
    displayEbayAnalysis(analysisResponse.result);
    showStatus('eBay analysis completed!', 'success');
    
  } catch (error) {
    console.error('eBay scraping error:', error);
    showStatus('Error: ' + error.message, 'error');
    resultDiv.innerHTML = `<div style="color: #e53e3e;">❌ ${error.message}</div>`;
  } finally {
    ebayBtn.disabled = false;
    ebayBtn.innerHTML = originalText;
  }
});

// Email breach checking functionality
console.log('Setting up email breach checker...');
console.log('Elements found:', {
  emailScanBtn: !!emailScanBtn,
  emailInput: !!emailInput, 
  emailStatus: !!emailStatus,
  emailResultDiv: !!emailResultDiv
});

if (emailScanBtn && emailInput && emailStatus && emailResultDiv) {
  console.log('All email elements found, setting up event listener');
  emailScanBtn.addEventListener('click', async () => {
    console.log('Email check button clicked');
    const email = emailInput.value.trim();
    if (!email) {
      showEmailStatus('Please enter an email address to check', 'error');
      emailInput.focus();
      return;
    }
    
    if (!isValidEmail(email)) {
      showEmailStatus('Please enter a valid email address', 'error');
      emailInput.focus();
      return;
    }
    
    showEmailStatus('Checking email breaches...', 'loading');
    emailResultDiv.textContent = '';
    emailScanBtn.disabled = true;
    emailScanBtn.innerHTML = `
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Checking...
    `;

    try {
      console.log('Sending message to service worker for email:', email);
      const response = await chrome.runtime.sendMessage({ type: 'checkEmailBreaches', email });
      console.log('Service worker response:', response);
      
      if (response && response.status === 'ok') {
        showEmailStatus('Check complete', 'success');
        showEmailResult(response.result);
      } else {
        showEmailStatus('Check failed', 'error');
        emailResultDiv.innerHTML = `<div style="color: #e53e3e;">❌ Unable to check this email. Please try again.</div>`;
      }
    } catch (err) {
      console.error('Email check error:', err);
      showEmailStatus('Connection error', 'error');
      emailResultDiv.innerHTML = `<div style="color: #e53e3e;">❌ ${err.message || 'Unable to connect to breach checking service'}</div>`;
  } finally {
    emailScanBtn.disabled = false;
    emailScanBtn.innerHTML = `
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
        <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" stroke-width="2"/>
      </svg>
      Check
    `;
  }
  });
} else {
  console.error('Email breach checker elements not found, skipping event listener setup');
  console.error('Missing elements:', {
    emailScanBtn: !emailScanBtn ? 'missing' : 'found',
    emailInput: !emailInput ? 'missing' : 'found',
    emailStatus: !emailStatus ? 'missing' : 'found',
    emailResultDiv: !emailResultDiv ? 'missing' : 'found'
  });
}

function showEmailStatus(message, type = 'info') {
  if (emailStatus) {
    emailStatus.textContent = message;
    emailStatus.className = `status ${type}`;
  }
}

function showEmailResult(result) {
  if (!emailResultDiv) return;
  
  const { breachCount, breaches, message, suggestion, source } = result;
  
  if (breachCount === 0) {
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #38a169; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ✓
        </div>
        <div>
          <strong style="color: #38a169;">Good news!</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">No breaches found</div>
        </div>
      </div>
      <div>${message}</div>
      ${suggestion ? `<div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">${suggestion}</div>` : ''}
      ${source ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Source: ${source}</div>` : ''}
    `;
  } else if (breachCount === -1) {
    // Special case for manual check required
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #d69e2e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ?
        </div>
        <div>
          <strong style="color: #d69e2e;">Manual Check Required</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">API limitations</div>
        </div>
      </div>
      <div style="margin-bottom: 12px;">${message}</div>
      <div style="margin-top: 12px; padding: 12px; background: #fef5e7; border-radius: 8px; border-left: 3px solid #d69e2e;">
        <div style="font-weight: 500; margin-bottom: 4px;">Manual Check Instructions:</div>
        <div style="font-size: 13px; line-height: 1.4;">
          1. Visit <a href="https://haveibeenpwned.com/" target="_blank" style="color: #d69e2e; text-decoration: underline;">haveibeenpwned.com</a><br>
          2. Enter your email address<br>
          3. Review any breaches found<br>
          4. Take appropriate security measures if needed
        </div>
      </div>
    `;
  } else if (breachCount === -2) {
    // Special case for likely breached service
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #d69e2e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          !
        </div>
        <div>
          <strong style="color: #d69e2e;">Service Has Known Breaches</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Historical security incidents</div>
        </div>
      </div>
      <div style="margin-bottom: 12px;">${message}</div>
      ${suggestion ? `<div style="margin-top: 8px; padding: 8px; background: #fef5e7; border-radius: 6px; font-size: 13px;">${suggestion}</div>` : ''}
      ${source ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Source: ${source}</div>` : ''}
    `;
  } else {
    const breachText = breachCount === 1 ? 'breach' : 'breaches';
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #e53e3e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          !
        </div>
        <div>
          <strong style="color: #e53e3e;">Security Alert!</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${breachCount} ${breachText} found</div>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <strong>This email was found in ${breachCount} data ${breachText}:</strong>
      </div>
      <ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
        ${breaches.map(breach => `
          <li style="margin-bottom: 8px;">
            <strong>${breach.Name}</strong> (${new Date(breach.BreachDate).getFullYear()})
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${breach.Description || 'Data breach occurred at this service.'}
            </div>
          </li>
        `).join('')}
      </ul>
      <div style="margin-top: 12px; padding: 8px; background: #fed7d7; border-radius: 6px; font-size: 12px;">
        <strong>Recommended actions:</strong> Change your password if you haven't already, enable 2FA, and monitor your accounts.
      </div>
      ${source ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Source: ${source}</div>` : ''}
    `;
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Allow Enter key to trigger email scan
if (emailInput && emailScanBtn) {
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !emailScanBtn.disabled) {
      emailScanBtn.click();
    }
  });
}

// YouTube Fact-Checker functionality
const youtubeFactCheckBtn = document.getElementById('youtubeFactCheckBtn');
const youtubeClearBtn = document.getElementById('youtubeClearBtn');
const youtubeStatus = document.getElementById('youtubeStatus');
const youtubeResult = document.getElementById('youtubeResult');

console.log('YouTube elements found:', {
  youtubeFactCheckBtn: !!youtubeFactCheckBtn,
  youtubeClearBtn: !!youtubeClearBtn,
  youtubeStatus: !!youtubeStatus,
  youtubeResult: !!youtubeResult
});

if (youtubeFactCheckBtn && youtubeStatus && youtubeResult) {
  console.log('Setting up YouTube fact-check button event listener');
  youtubeFactCheckBtn.addEventListener('click', async () => {
    console.log('YouTube fact-check button clicked');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab URL:', tab?.url);
      
      if (!tab || !tab.url || !tab.url.includes('youtube.com/watch')) {
        throw new Error('Please open a YouTube video first');
      }

      youtubeFactCheckBtn.disabled = true;
      youtubeStatus.textContent = 'Analyzing video...';
      youtubeStatus.className = 'status loading';
      youtubeResult.textContent = '';

      // Perform YouTube fact-check directly
      console.log('Starting YouTube fact-check...');
      
      // Fetch video metadata and send to Gemini
      const response = await chrome.runtime.sendMessage({
        action: 'fetchYouTubeMeta',
        url: tab.url
      });

      if (response && response.ok) {
        // Build the fact-check prompt
        const factCheckInstruction = `You are a concise AI fact-checker. Based only on the provided YouTube metadata and video URL, perform the following:
1) Provide a numbered list (max 5 items) of factual errors or corrections found in the video content (one sentence each).
2) One-line "Summary" with the corrected core claim.
3) "Sources" with up to 3 concise URLs or citations (one per line).
Keep the entire response under ~10 lines and do not add extra commentary.`;

        const pieces = [];
        if (response.oembed) pieces.push("oEmbed: " + JSON.stringify(response.oembed));
        if (response.pageMeta) pieces.push("Page meta: " + JSON.stringify(response.pageMeta));
        pieces.push("Video URL: " + tab.url);

        const finalPrompt = factCheckInstruction + "\n\n" + pieces.join("\n");

        // Send to Gemini for analysis
        youtubeStatus.textContent = 'AI is analyzing the video...';
        const aiResponse = await chrome.runtime.sendMessage({
          action: 'callGemini',
          prompt: finalPrompt
        });

        // Display the results
        youtubeStatus.textContent = 'Analysis complete';
        youtubeStatus.className = 'status success';
        youtubeResult.innerHTML = `
          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 8px; border-left: 4px solid #007bff;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #007bff;">🎥 YouTube Fact-Check Results</div>
            <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.4;">${aiResponse}</div>
          </div>
        `;
        
        // Show the clear button
        if (youtubeClearBtn) {
          youtubeClearBtn.style.display = 'inline-flex';
        }
      } else {
        throw new Error('Failed to fetch video metadata');
      }

    } catch (err) {
      console.error('YouTube fact-check error:', err);
      youtubeStatus.textContent = err.message;
      youtubeStatus.className = 'status error';
      youtubeResult.innerHTML = `
        <div style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-top: 8px; border-left: 4px solid #ef4444;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #ef4444;">&#10060; Error</div>
          <div style="font-size: 13px; color: #dc2626;">${err.message}</div>
        </div>
      `;
    } finally {
      youtubeFactCheckBtn.disabled = false;
    }
  });
  
  // Clear button functionality
  if (youtubeClearBtn) {
    youtubeClearBtn.addEventListener('click', () => {
      youtubeStatus.textContent = '';
      youtubeStatus.className = 'status';
      youtubeResult.innerHTML = '';
      youtubeClearBtn.style.display = 'none';
    });
  }
} else {
  console.error('YouTube fact-check elements not found:', {
    youtubeFactCheckBtn: !youtubeFactCheckBtn ? 'missing' : 'found',
    youtubeClearBtn: !youtubeClearBtn ? 'missing' : 'found',
    youtubeStatus: !youtubeStatus ? 'missing' : 'found',
    youtubeResult: !youtubeResult ? 'missing' : 'found'
  });
}

// ToS Scanner functionality
if (tosScanBtn && tosStatus && tosResultDiv) {
  console.log('Setting up ToS scanner...');
  
  tosScanBtn.addEventListener('click', async () => {
    console.log('ToS scan button clicked');
    
    try {
      tosScanBtn.disabled = true;
      tosScanBtn.innerHTML = `
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Scanning...
      `;
      showToSStatus('Analyzing current page for ToS content...', 'loading');
      tosResultDiv.textContent = '';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
        throw new Error('Cannot scan browser internal pages. Please navigate to a regular website.');
      }

      // Send message to content script to analyze ToS
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'analyzeToS' });
      } catch (err) {
        if (err.message.includes('Receiving end does not exist')) {
          throw new Error('Content script not available. Please refresh the page and try again.');
        }
        throw err;
      }
      
      if (response && response.isToSPage) {
        showToSStatus('ToS page detected - analyzing content...', 'loading');
        
        // Simulate analysis (in a real implementation, this would be done by the content script)
        setTimeout(() => {
          const mockAnalysis = generateMockToSAnalysis();
          showToSStatus('Analysis complete', 'success');
          showToSResult(mockAnalysis);
        }, 2000);
      } else {
        showToSStatus('No ToS page detected on current page', 'info');
        tosResultDiv.innerHTML = `
          <div style="color: #666; text-align: center; padding: 20px;">
            <div>This page doesn't appear to be a Terms & Conditions page.</div>
            <div style="font-size: 12px; margin-top: 8px; color: #999;">
              Navigate to a ToS page to use the scanner.
            </div>
          </div>
        `;
      }
      
    } catch (err) {
      console.error('ToS scan error:', err);
      showToSStatus(`Scan failed: ${err.message}`, 'error');
      tosResultDiv.innerHTML = '';
    } finally {
      tosScanBtn.disabled = false;
      tosScanBtn.innerHTML = `
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/>
          <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"/>
        </svg>
        Scan Current ToS Page
      `;
    }
  });
} else {
  console.error('ToS scanner elements not found, skipping event listener setup');
}

function showToSStatus(message, type = 'info') {
  if (tosStatus) {
    tosStatus.textContent = message;
    tosStatus.className = `status ${type}`;
  }
}

function showToSResult(analysis) {
  if (!tosResultDiv) return;
  
  const { riskScore, redFlags, categories, totalFlags } = analysis;
  
  const riskColor = riskScore >= 70 ? '#e53e3e' : 
                   riskScore >= 40 ? '#d69e2e' : '#38a169';
  const riskIcon = riskScore >= 70 ? '⚠️' : 
                  riskScore >= 40 ? '⚠️' : '✅';

  if (totalFlags === 0) {
    tosResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #38a169; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ✓
        </div>
        <div>
          <strong style="color: #38a169;">Good news!</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">No major red flags found</div>
        </div>
      </div>
      <div style="color: #38a169; font-size: 14px;">This ToS appears to be relatively standard with no significant issues detected.</div>
    `;
  } else {
    tosResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${riskColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ${riskScore >= 70 ? '!' : riskScore >= 40 ? '?' : '✓'}
        </div>
        <div>
          <strong style="color: ${riskColor};">ToS Risk Analysis</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${totalFlags} potential issues found</div>
        </div>
      </div>
      
      <div style="background: #f7fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 500;">Risk Score</span>
          <span style="font-weight: 600; color: ${riskColor};">${riskScore}%</span>
        </div>
        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="background: ${riskColor}; height: 100%; width: ${riskScore}%; transition: width 0.3s ease;"></div>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <strong>Key Issues Found:</strong>
      </div>
      <ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
        ${redFlags.slice(0, 5).map(flag => `
          <li style="margin-bottom: 6px; font-size: 13px;">
            <strong>${flag.description}</strong>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">
              Risk Level: ${flag.risk}/10
            </div>
          </li>
        `).join('')}
        ${redFlags.length > 5 ? `<li style="font-size: 12px; color: #666; font-style: italic;">... and ${redFlags.length - 5} more issues</li>` : ''}
      </ul>
      
      <div style="margin-top: 12px; padding: 8px; background: #fef5e7; border-radius: 6px; font-size: 12px;">
        <strong>Recommendation:</strong> Review the full analysis and consider the implications before agreeing to these terms.
      </div>
    `;
  }
}

function generateMockToSAnalysis() {
  // This would normally come from the actual ToS scanner
  const mockRedFlags = [
    {
      description: 'Data sharing with third parties',
      risk: 8,
      category: 'dataPrivacy'
    },
    {
      description: 'Binding arbitration clause',
      risk: 9,
      category: 'unfairObligations'
    },
    {
      description: 'Unilateral terms modification',
      risk: 6,
      category: 'unfairObligations'
    }
  ];

  return {
    riskScore: 65,
    redFlags: mockRedFlags,
    categories: {
      dataPrivacy: [mockRedFlags[0]],
      unfairObligations: [mockRedFlags[1], mockRedFlags[2]],
      securityConcerns: [],
      suspiciousLanguage: []
    },
    totalFlags: mockRedFlags.length,
    contentLength: 15000,
    analysisDate: new Date().toISOString()
  };
}

// Popup blocker settings
const popupBlockerToggle = document.getElementById('popupBlockerToggle');
const popupSettingsBtn = document.getElementById('popupSettingsBtn');

// Load popup blocker settings
chrome.storage.local.get(['popupBlockerSettings'], (result) => {
  if (result.popupBlockerSettings && popupBlockerToggle) {
    popupBlockerToggle.checked = result.popupBlockerSettings.enabled !== false;
  }
});

// Handle popup blocker toggle
if (popupBlockerToggle) {
  popupBlockerToggle.addEventListener('change', () => {
    chrome.storage.local.get(['popupBlockerSettings'], (result) => {
      const settings = result.popupBlockerSettings || { enabled: true, allowedDomains: [], blockedDomains: [] };
      settings.enabled = popupBlockerToggle.checked;
      chrome.storage.local.set({ popupBlockerSettings: settings });
    });
  });
}

// Handle popup settings button
if (popupSettingsBtn) {
  popupSettingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup_blocker.html?settings=true') });
  });
}

// Blockchain UI Functions
function initializeBlockchainUI() {
  console.log('Initializing blockchain UI...');
  
  // Ensure blockchain storage is available
  if (typeof blockchainStorage === 'undefined') {
    console.error('Blockchain storage not available during initialization');
    return;
  }
  
  // Wait for blockchain to be initialized
  const waitForInitialization = () => {
    if (blockchainStorage.isInitialized) {
      console.log('Blockchain is initialized, updating UI...');
      updateBlockchainUI();
    } else {
      console.log('Waiting for blockchain initialization...');
      setTimeout(waitForInitialization, 100);
    }
  };
  
  waitForInitialization();
  
  // Dashboard removed - blockchain data is now shown directly in popup
  
  // Set up refresh button
  const refreshBlockchainData = document.getElementById('refreshBlockchainData');
  if (refreshBlockchainData) {
    refreshBlockchainData.addEventListener('click', () => {
      console.log('Refreshing blockchain data...');
      updateBlockchainUI();
      
      // Add visual feedback
      refreshBlockchainData.innerHTML = `
        <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Refreshing...
      `;
      
      setTimeout(() => {
        refreshBlockchainData.innerHTML = `
          <svg class="btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Refresh
        `;
      }, 1000);
    });
  }
  
  console.log('Blockchain UI initialized successfully');
  
  // Add debug function to global scope for testing
  window.debugBlockchain = () => {
    console.log('=== BLOCKCHAIN DEBUG INFO ===');
    console.log('Blockchain storage available:', typeof blockchainStorage !== 'undefined');
    console.log('Blockchain initialized:', blockchainStorage ? blockchainStorage.isInitialized : 'N/A');
    if (typeof blockchainStorage !== 'undefined') {
      console.log('Total flagged websites:', blockchainStorage.getTotalFlaggedWebsites());
      console.log('Total flagged emails:', blockchainStorage.getTotalFlaggedEmails());
      console.log('Recent websites:', blockchainStorage.getRecentFlaggedWebsites());
      console.log('Recent emails:', blockchainStorage.getRecentFlaggedEmails());
      console.log('All blockchain data:', blockchainStorage.getAllBlockchainData());
    }
    console.log('=============================');
  };

  // Add testing functions to global scope
  window.testBlockchainPersistence = () => {
    if (typeof blockchainStorage !== 'undefined') {
      blockchainStorage.testPersistence();
    } else {
      console.error('Blockchain storage not available');
    }
  };

  window.clearBlockchainData = () => {
    if (typeof blockchainStorage !== 'undefined') {
      blockchainStorage.clearAllData();
      updateBlockchainUI();
    } else {
      console.error('Blockchain storage not available');
    }
  };
}

function updateBlockchainUI() {
  if (typeof blockchainStorage === 'undefined') {
    console.log('Blockchain storage not available');
    return;
  }

  try {
    // Force reload data from storage (async)
    blockchainStorage.forceRefreshAsync((refreshedData) => {
      console.log('Refreshed blockchain data:', refreshedData);
      
      // Update statistics
      const totalWebsites = blockchainStorage.getTotalFlaggedWebsites();
      const totalEmails = blockchainStorage.getTotalFlaggedEmails();
      
      console.log('Blockchain stats:', { totalWebsites, totalEmails });
      
      const totalFlaggedSitesEl = document.getElementById('totalFlaggedSites');
      const totalFlaggedEmailsEl = document.getElementById('totalFlaggedEmails');
      
      if (totalFlaggedSitesEl) totalFlaggedSitesEl.textContent = totalWebsites;
      if (totalFlaggedEmailsEl) totalFlaggedEmailsEl.textContent = totalEmails;
      
      // Update recent websites list
      updateRecentWebsitesList();
    });
    
  } catch (error) {
    console.error('Error updating blockchain UI:', error);
  }
}

function updateRecentWebsitesList() {
  const recentWebsitesEl = document.getElementById('recentWebsites');
  if (!recentWebsitesEl) return;
  
  try {
    const recentWebsites = blockchainStorage.getRecentFlaggedWebsites();
    
    if (recentWebsites.length === 0) {
      recentWebsitesEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔒</div>
          <div class="empty-state-text">No flagged websites yet.<br>Websites with 70+ risk score will appear here.</div>
        </div>
      `;
      return;
    }
    
    recentWebsitesEl.innerHTML = recentWebsites.map(website => {
      const riskClass = website.score >= 80 ? 'high-risk' : 'medium-risk';
      const timeAgo = getTimeAgo(website.timestamp);
      
      return `
        <div class="flagged-item" onclick="openWebsite('${website.url}')">
          <div class="flagged-icon ${riskClass}">
            ${website.score >= 80 ? '!' : '⚠'}
          </div>
          <div class="flagged-details">
            <div class="flagged-url">${truncateUrl(website.url, 40)}</div>
            <div class="flagged-meta">
              <span class="flagged-score">${website.score}/100</span>
              <span class="flagged-time">${timeAgo}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error updating recent websites list:', error);
    recentWebsitesEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">Error loading blockchain data</div>
      </div>
    `;
  }
}

function openWebsite(url) {
  chrome.tabs.create({ url: url });
}

function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + '...';
}

function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Update email result (blockchain storage is now handled automatically by service worker)
function showEmailResult(result) {
  if (!emailResultDiv) return;
  
  const { breachCount, breaches, message, suggestion, source } = result;
  
  if (breachCount === 0) {
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #38a169; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ✓
        </div>
        <div>
          <strong style="color: #38a169;">Good news!</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">No breaches found</div>
        </div>
      </div>
      <div>${message}</div>
      ${suggestion ? `<div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">${suggestion}</div>` : ''}
      ${source ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Source: ${source}</div>` : ''}
    `;
  } else if (breachCount === -1) {
    // Special case for manual check required
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #d69e2e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ?
        </div>
        <div>
          <strong style="color: #d69e2e;">Manual Check Required</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">API limitations</div>
        </div>
      </div>
      <div style="margin-bottom: 12px;">${message}</div>
      <div style="margin-top: 12px; padding: 12px; background: #fef5e7; border-radius: 8px; border-left: 3px solid #d69e2e;">
        <div style="font-weight: 500; margin-bottom: 4px;">Manual Check Instructions:</div>
        <div style="font-size: 13px; line-height: 1.4;">
          1. Visit <a href="https://haveibeenpwned.com/" target="_blank" style="color: #d69e2e; text-decoration: underline;">haveibeenpwned.com</a><br>
          2. Enter your email address<br>
          3. Review any breaches found<br>
          4. Take appropriate security measures if needed
        </div>
      </div>
    `;
  } else if (breachCount === -2) {
    // Special case for likely breached service
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #d69e2e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          !
        </div>
        <div>
          <strong style="color: #d69e2e;">Service Has Known Breaches</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Historical security incidents</div>
        </div>
      </div>
      <div style="margin-bottom: 12px;">${message}</div>
      ${suggestion ? `<div style="margin-top: 8px; padding: 8px; background: #fef5e7; border-radius: 6px; font-size: 13px;">${suggestion}</div>` : ''}
      ${source ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Source: ${source}</div>` : ''}
    `;
  } else {
    const breachText = breachCount === 1 ? 'breach' : 'breaches';
    emailResultDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #e53e3e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          !
        </div>
        <div>
          <strong style="color: #e53e3e;">Security Alert!</strong>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${breachCount} ${breachText} found</div>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <strong>This email was found in ${breachCount} data ${breachText}:</strong>
      </div>
      <ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">
        ${breaches.map(breach => `
          <li style="margin-bottom: 8px;">
            <strong>${breach.Name}</strong> (${new Date(breach.BreachDate).getFullYear()})
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${breach.Description || 'Data breach occurred at this service.'}
            </div>
          </li>
        `).join('')}
      </ul>
      <div style="margin-top: 12px; padding: 8px; background: #fed7d7; border-radius: 6px; font-size: 12px;">
        <strong>Recommended actions:</strong> Change your password if you haven't already, enable 2FA, and monitor your accounts.
      </div>
      ${source ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Source: ${source}</div>` : ''}
    `;
  }
}


}); // Close DOMContentLoaded event listener

// Display eBay analysis results
function displayEbayAnalysis(analysis) {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) return;

  const { productData, analysis: analysisData, summary } = analysis;
  
  let resultHTML = '';
  
  // Product header
  resultHTML += `
    <div class="ebay-product-header">
      <div class="product-title">${productData.title}</div>
      <div class="product-price">${productData.price?.current || 'Price N/A'}</div>
      <div class="product-seller">Seller: ${productData.seller?.name || 'Unknown'}</div>
    </div>
  `;
  
  // Overall Score (prominent display)
  const overallScore = analysisData.overallScore || 0;
  const scoreColor = overallScore >= 80 ? '#28a745' : overallScore >= 60 ? '#ffc107' : '#dc3545';
  const scoreLabel = overallScore >= 80 ? 'EXCELLENT' : overallScore >= 60 ? 'GOOD' : overallScore >= 40 ? 'FAIR' : 'POOR';
  
  resultHTML += `
    <div class="ebay-score-display" style="text-align: center; margin: 15px 0; padding: 20px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; border: 2px solid ${scoreColor};">
      <div style="font-size: 48px; font-weight: bold; color: ${scoreColor}; margin-bottom: 10px;">${overallScore}%</div>
      <div style="font-size: 18px; font-weight: 600; color: ${scoreColor}; text-transform: uppercase; letter-spacing: 1px;">${scoreLabel}</div>
      <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">Overall Safety & Value Score</div>
    </div>
  `;

  // Analysis summary
  resultHTML += `
    <div class="ebay-analysis-summary">
      <div class="summary-text">${summary}</div>
    </div>
  `;
  
  // Scores
  resultHTML += `
    <div class="ebay-scores">
      <div class="score-item">
        <span class="score-label">Legitimacy:</span>
        <span class="score-value legitimacy-${analysisData.legitimacyScore >= 7 ? 'high' : analysisData.legitimacyScore >= 4 ? 'medium' : 'low'}">${analysisData.legitimacyScore}/10 (${analysisData.legitimacyScore * 10}%)</span>
      </div>
      <div class="score-item">
        <span class="score-label">Value:</span>
        <span class="score-value value-${analysisData.valueScore >= 7 ? 'high' : analysisData.valueScore >= 4 ? 'medium' : 'low'}">${analysisData.valueScore}/10 (${analysisData.valueScore * 10}%)</span>
      </div>
      <div class="score-item">
        <span class="score-label">Risk:</span>
        <span class="score-value risk-${analysisData.riskLevel.toLowerCase()}">${analysisData.riskLevel}</span>
      </div>
    </div>
  `;
  
  // Recommendation
  const recommendationClass = analysisData.shouldBuy.toLowerCase().includes('yes') ? 'recommended' :
                             analysisData.shouldBuy.toLowerCase().includes('no') ? 'not-recommended' : 'caution';
  
  resultHTML += `
    <div class="ebay-recommendation ${recommendationClass}">
      <div class="recommendation-title">Recommendation: ${analysisData.shouldBuy}</div>
    </div>
  `;
  
  // Red flags
  if (analysisData.redFlags && analysisData.redFlags !== 'None identified') {
    resultHTML += `
      <div class="ebay-section red-flags">
        <div class="section-title">⚠️ Red Flags</div>
        <div class="section-content">${analysisData.redFlags}</div>
      </div>
    `;
  }
  
  // Green flags
  if (analysisData.greenFlags && analysisData.greenFlags !== 'None identified') {
    resultHTML += `
      <div class="ebay-section green-flags">
        <div class="section-title">✅ Green Flags</div>
        <div class="section-content">${analysisData.greenFlags}</div>
      </div>
    `;
  }
  
  // Key concerns
  if (analysisData.keyConcerns && analysisData.keyConcerns !== 'None identified') {
    resultHTML += `
      <div class="ebay-section key-concerns">
        <div class="section-title">🔍 Key Concerns</div>
        <div class="section-content">${analysisData.keyConcerns}</div>
      </div>
    `;
  }
  
  // Full analysis (collapsible)
  resultHTML += `
    <div class="ebay-section full-analysis">
      <div class="section-title collapsible" onclick="toggleCollapsible(this)">
        📊 Full AI Analysis
        <span class="collapse-icon">▼</span>
      </div>
      <div class="section-content collapsible-content" style="display: none;">
        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 12px; line-height: 1.4;">${analysisData.fullAnalysis}</pre>
      </div>
    </div>
  `;
  
  resultDiv.innerHTML = resultHTML;
}

// Toggle collapsible sections
function toggleCollapsible(element) {
  const content = element.nextElementSibling;
  const icon = element.querySelector('.collapse-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▲';
  } else {
    content.style.display = 'none';
    icon.textContent = '▼';
  }
}
