// Terms and Conditions Scanner
// Detects ToS pages and analyzes them for potentially harmful clauses

class ToSScanner {
  constructor() {
    this.isToSPage = false;
    this.scanResults = null;
    this.analysisInProgress = false;
    this.init();
  }

  init() {
    this.detectToSPage();
    if (this.isToSPage) {
      this.showToSNotification();
      this.analyzeContent();
    }
  }

  detectToSPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase();

    // Common ToS page indicators
    const tosIndicators = [
      'terms of service', 'terms and conditions', 'terms of use',
      'user agreement', 'service agreement', 'legal terms',
      'terms', 'conditions', 'agreement', 'policy'
    ];

    // URL patterns
    const tosUrlPatterns = [
      '/terms', '/tos', '/terms-of-service', '/terms-and-conditions',
      '/legal', '/agreement', '/user-agreement', '/service-agreement',
      '/terms-of-use', '/conditions', '/policy'
    ];

    // Check URL
    const urlMatch = tosUrlPatterns.some(pattern => url.includes(pattern));
    
    // Check title
    const titleMatch = tosIndicators.some(indicator => title.includes(indicator));
    
    // Check for common ToS keywords in content
    const contentMatch = tosIndicators.some(indicator => bodyText.includes(indicator));

    // Check for legal language patterns
    const legalPatterns = [
      'by using this service', 'you agree to', 'you consent to',
      'binding arbitration', 'governing law', 'jurisdiction',
      'limitation of liability', 'disclaimer', 'warranty'
    ];
    const legalMatch = legalPatterns.some(pattern => bodyText.includes(pattern));

    this.isToSPage = urlMatch || titleMatch || (contentMatch && legalMatch);

    console.log('🔍 ToS Scanner: Page analysis', {
      url: url,
      title: title,
      isToSPage: this.isToSPage,
      urlMatch,
      titleMatch,
      contentMatch,
      legalMatch
    });
  }

  showToSNotification() {
    // Create notification banner
    const notification = document.createElement('div');
    notification.id = 'tos-scanner-notification';
    notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          📋
        </div>
        <div>
          <div style="font-weight: 600;">Terms & Conditions Detected</div>
          <div style="font-size: 12px; opacity: 0.9;">Analyzing for potential risks...</div>
        </div>
      </div>
      <button id="tos-scanner-close" style="background: none; border: none; color: white; cursor: pointer; padding: 4px; border-radius: 4px; opacity: 0.8;">
        ✕
      </button>
    `;

    document.body.insertBefore(notification, document.body.firstChild);

    // Add close functionality
    document.getElementById('tos-scanner-close').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  async analyzeContent() {
    if (this.analysisInProgress) return;
    this.analysisInProgress = true;

    try {
      const content = this.extractToSContent();
      const analysis = await this.performAnalysis(content);
      this.scanResults = analysis;
      this.showAnalysisResults(analysis);
    } catch (error) {
      console.error('🔍 ToS Scanner: Analysis failed', error);
    } finally {
      this.analysisInProgress = false;
    }
  }

  extractToSContent() {
    // Extract main content, prioritizing likely ToS sections
    let content = '';
    
    // Try to find main content areas
    const contentSelectors = [
      'main', 'article', '.content', '.main-content', 
      '.terms-content', '.legal-content', '#content'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > content.length) {
        content = element.innerText;
      }
    }

    // Fallback to body content
    if (!content || content.length < 100) {
      content = document.body.innerText;
    }

    // Limit content size for processing
    return content.substring(0, 50000);
  }

  async performAnalysis(content) {
    const redFlags = [];
    const riskScore = { total: 0, max: 0 };
    const categories = {
      dataPrivacy: [],
      unfairObligations: [],
      securityConcerns: [],
      suspiciousLanguage: []
    };

    // Data Privacy Risk Patterns
    const dataPrivacyPatterns = [
      {
        pattern: /collect.*personal.*information|gather.*data|store.*information/i,
        risk: 8,
        category: 'dataPrivacy',
        description: 'Excessive data collection mentioned'
      },
      {
        pattern: /share.*third.*party|sell.*data|transfer.*information/i,
        risk: 9,
        category: 'dataPrivacy',
        description: 'Data sharing with third parties'
      },
      {
        pattern: /retain.*data|keep.*information|store.*permanently/i,
        risk: 6,
        category: 'dataPrivacy',
        description: 'Long-term data retention'
      },
      {
        pattern: /cookies.*tracking|analytics.*data|behavioral.*tracking/i,
        risk: 7,
        category: 'dataPrivacy',
        description: 'User tracking and analytics'
      }
    ];

    // Unfair Obligations Patterns
    const unfairObligationsPatterns = [
      {
        pattern: /binding.*arbitration|mandatory.*arbitration|waive.*jury.*trial/i,
        risk: 9,
        category: 'unfairObligations',
        description: 'Binding arbitration clause (limits legal rights)'
      },
      {
        pattern: /hidden.*fees|additional.*charges|automatic.*renewal/i,
        risk: 8,
        category: 'unfairObligations',
        description: 'Hidden fees or automatic charges'
      },
      {
        pattern: /waive.*rights|limit.*liability|disclaim.*warranty/i,
        risk: 7,
        category: 'unfairObligations',
        description: 'Waiver of user rights or liability limitations'
      },
      {
        pattern: /modify.*terms|change.*agreement|update.*policy/i,
        risk: 6,
        category: 'unfairObligations',
        description: 'Unilateral terms modification'
      }
    ];

    // Security Concerns Patterns
    const securityPatterns = [
      {
        pattern: /access.*account|monitor.*activity|review.*content/i,
        risk: 8,
        category: 'securityConcerns',
        description: 'Broad access to user accounts or content'
      },
      {
        pattern: /disclose.*information|report.*authorities|cooperate.*investigation/i,
        risk: 7,
        category: 'securityConcerns',
        description: 'Information disclosure requirements'
      },
      {
        pattern: /security.*breach|data.*breach|unauthorized.*access/i,
        risk: 5,
        category: 'securityConcerns',
        description: 'Security breach acknowledgment'
      }
    ];

    // Suspicious Language Patterns
    const suspiciousLanguagePatterns = [
      {
        pattern: /reasonable.*discretion|sole.*discretion|at.*our.*discretion/i,
        risk: 6,
        category: 'suspiciousLanguage',
        description: 'Vague discretionary language'
      },
      {
        pattern: /may.*change|reserve.*right|without.*notice/i,
        risk: 5,
        category: 'suspiciousLanguage',
        description: 'Unilateral change rights'
      },
      {
        pattern: /interpretation.*final|our.*decision.*final|binding.*interpretation/i,
        risk: 7,
        category: 'suspiciousLanguage',
        description: 'One-sided interpretation rights'
      }
    ];

    // Analyze content against all patterns
    const allPatterns = [
      ...dataPrivacyPatterns,
      ...unfairObligationsPatterns,
      ...securityPatterns,
      ...suspiciousLanguagePatterns
    ];

    for (const patternData of allPatterns) {
      const matches = content.match(patternData.pattern);
      if (matches) {
        riskScore.total += patternData.risk;
        riskScore.max += 10; // Max possible risk per pattern
        
        const flag = {
          pattern: patternData.pattern.source,
          risk: patternData.risk,
          category: patternData.category,
          description: patternData.description,
          matches: matches.length,
          context: this.getContext(content, matches[0], 100)
        };
        
        redFlags.push(flag);
        categories[patternData.category].push(flag);
      }
    }

    // Calculate overall risk score
    const riskPercentage = riskScore.max > 0 ? Math.round((riskScore.total / riskScore.max) * 100) : 0;
    
    return {
      riskScore: riskPercentage,
      redFlags,
      categories,
      totalFlags: redFlags.length,
      contentLength: content.length,
      analysisDate: new Date().toISOString()
    };
  }

  getContext(text, match, contextLength) {
    const index = text.indexOf(match);
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + match.length + contextLength);
    return text.substring(start, end).trim();
  }

  showAnalysisResults(analysis) {
    // Remove existing results if any
    const existingResults = document.getElementById('tos-scanner-results');
    if (existingResults) {
      existingResults.remove();
    }

    // Create results panel
    const resultsPanel = document.createElement('div');
    resultsPanel.id = 'tos-scanner-results';
    resultsPanel.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
    `;

    const riskColor = analysis.riskScore >= 70 ? '#e53e3e' : 
                     analysis.riskScore >= 40 ? '#d69e2e' : '#38a169';
    const riskIcon = analysis.riskScore >= 70 ? '⚠️' : 
                    analysis.riskScore >= 40 ? '⚠️' : '✅';

    resultsPanel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; background: ${riskColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${analysis.riskScore >= 70 ? '!' : analysis.riskScore >= 40 ? '?' : '✓'}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 16px;">ToS Risk Analysis</div>
            <div style="font-size: 12px; color: #666;">${analysis.totalFlags} potential issues found</div>
          </div>
        </div>
        
        <div style="background: #f7fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 500;">Risk Score</span>
            <span style="font-weight: 600; color: ${riskColor};">${analysis.riskScore}%</span>
          </div>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: ${riskColor}; height: 100%; width: ${analysis.riskScore}%; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="tos-scanner-details" style="flex: 1; padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
            View Details
          </button>
          <button id="tos-scanner-close-results" style="padding: 8px 12px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(resultsPanel);

    // Add event listeners
    document.getElementById('tos-scanner-close-results').addEventListener('click', () => {
      resultsPanel.remove();
    });

    document.getElementById('tos-scanner-details').addEventListener('click', () => {
      this.showDetailedResults(analysis);
    });

    // Auto-hide after 30 seconds if no interaction
    setTimeout(() => {
      if (resultsPanel.parentNode && !resultsPanel.matches(':hover')) {
        resultsPanel.remove();
      }
    }, 30000);
  }

  showDetailedResults(analysis) {
    // Create detailed modal
    const modal = document.createElement('div');
    modal.id = 'tos-scanner-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;

    const categoryIcons = {
      dataPrivacy: '',
      unfairObligations: '',
      securityConcerns: '',
      suspiciousLanguage: ''
    };

    const categoryNames = {
      dataPrivacy: 'Data Privacy Risks',
      unfairObligations: 'Unfair Obligations',
      securityConcerns: 'Security Concerns',
      suspiciousLanguage: 'Suspicious Language'
    };

    modalContent.innerHTML = `
      <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Detailed ToS Analysis</h2>
          <button id="tos-scanner-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
          ${Object.entries(analysis.categories).map(([key, flags]) => `
            <div style="background: #f7fafc; padding: 12px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 4px;">${categoryIcons[key]}</div>
              <div style="font-weight: 500; font-size: 12px;">${categoryNames[key]}</div>
              <div style="font-size: 18px; font-weight: 600; color: ${flags.length > 0 ? '#e53e3e' : '#38a169'};">${flags.length}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="padding: 24px;">
        ${Object.entries(analysis.categories).map(([key, flags]) => `
          ${flags.length > 0 ? `
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
                ${categoryNames[key]}
              </h3>
              ${flags.map(flag => `
                <div style="background: #fef5e7; border-left: 3px solid #d69e2e; padding: 12px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
                  <div style="font-weight: 500; margin-bottom: 4px;">${flag.description}</div>
                  <div style="font-size: 12px; color: #666; margin-bottom: 6px;">Risk Level: ${flag.risk}/10</div>
                  <div style="font-size: 12px; color: #4a5568; background: #f7fafc; padding: 8px; border-radius: 4px; font-family: monospace;">
                    "${flag.context}"
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `).join('')}

        ${analysis.totalFlags === 0 ? `
          <div style="text-align: center; padding: 40px 20px; color: #38a169;">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Major Issues Found</div>
            <div style="color: #666;">This ToS appears to be relatively standard with no significant red flags detected.</div>
          </div>
        ` : ''}
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close modal functionality
    document.getElementById('tos-scanner-close-modal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// Initialize ToS Scanner when page loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ToSScanner();
    });
  } else {
    new ToSScanner();
  }
}
