/*******************************************************************************
 * uBlock Service Worker Integration
 * 
 * This file handles the service worker integration for uBlock Origin
 * functionality, including request blocking and declarative net request rules.
 *******************************************************************************/

// Import the uBlock integration
importScripts('ublock_integration.js');

class UBlockServiceWorker {
    constructor() {
        this.integration = new UBlockIntegration();
        this.declarativeRules = [];
        this.ruleIdCounter = 1;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for web requests
        chrome.webRequest.onBeforeRequest.addListener(
            this.handleRequest.bind(this),
            { urls: ["<all_urls>"] },
            ["requestBody"]
        );

        // Listen for headers
        chrome.webRequest.onBeforeSendHeaders.addListener(
            this.handleHeaders.bind(this),
            { urls: ["<all_urls>"] },
            ["requestHeaders", "blocking"]
        );

        // Listen for messages from content scripts
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Initialize declarative net request rules
        this.initializeDeclarativeRules();
    }

    async handleRequest(details) {
        try {
            const shouldBlock = this.integration.shouldBlockRequest(details);
            
            if (shouldBlock) {
                console.log('🔗 uBlock Service Worker: Blocking request:', details.url);
                return { cancel: true };
            }
        } catch (error) {
            console.error('🔗 uBlock Service Worker: Error handling request:', error);
        }
    }

    async handleHeaders(details) {
        try {
            // Check for header-based blocking
            const shouldBlock = this.integration.shouldBlockRequest(details);
            
            if (shouldBlock) {
                console.log('🔗 uBlock Service Worker: Blocking headers for:', details.url);
                return { cancel: true };
            }
        } catch (error) {
            console.error('🔗 uBlock Service Worker: Error handling headers:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'ublock_addFilter':
                    this.integration.addCustomFilter(message.filter);
                    sendResponse({ success: true });
                    break;

                case 'ublock_whitelist':
                    this.integration.addToWhitelist(message.domain);
                    sendResponse({ success: true });
                    break;

                case 'ublock_unwhitelist':
                    this.integration.removeFromWhitelist(message.domain);
                    sendResponse({ success: true });
                    break;

                case 'ublock_getStats':
                    const stats = this.integration.getStats();
                    sendResponse({ success: true, stats });
                    break;

                case 'ublock_shouldBlock':
                    const shouldBlock = this.integration.shouldBlockRequest({ url: message.url });
                    sendResponse({ success: true, shouldBlock });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('🔗 uBlock Service Worker: Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async initializeDeclarativeRules() {
        try {
            // Clear existing rules
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: this.declarativeRules.map(rule => rule.id)
            });

            this.declarativeRules = [];

            // Generate rules from filter lists
            await this.generateDeclarativeRules();

            // Apply the rules
            if (this.declarativeRules.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: this.declarativeRules
                });
                console.log(`🔗 uBlock Service Worker: Applied ${this.declarativeRules.length} declarative rules`);
            }
        } catch (error) {
            console.error('🔗 uBlock Service Worker: Error initializing declarative rules:', error);
        }
    }

    async generateDeclarativeRules() {
        // Convert uBlock filters to declarative net request rules
        for (const [listUrl, filters] of this.integration.filterLists) {
            for (const filter of filters) {
                if (filter.type.startsWith('network') && !filter.exception) {
                    const rule = this.convertFilterToRule(filter);
                    if (rule) {
                        this.declarativeRules.push(rule);
                        
                        // Chrome has a limit on the number of rules
                        if (this.declarativeRules.length >= 5000) {
                            console.warn('🔗 uBlock Service Worker: Reached rule limit, stopping');
                            break;
                        }
                    }
                }
            }
        }
    }

    convertFilterToRule(filter) {
        try {
            const rule = {
                id: this.ruleIdCounter++,
                priority: 1,
                action: { type: 'block' },
                condition: {
                    urlFilter: this.convertPatternToUrlFilter(filter.pattern),
                    resourceTypes: this.getResourceTypes(filter.options)
                }
            };

            // Add domain restrictions if present
            if (filter.options.domain) {
                rule.condition.initiatorDomains = this.parseDomains(filter.options.domain);
            }

            return rule;
        } catch (error) {
            console.warn('🔗 uBlock Service Worker: Failed to convert filter:', filter.raw, error);
            return null;
        }
    }

    convertPatternToUrlFilter(pattern) {
        // Convert Adblock pattern to URL filter
        if (pattern.startsWith('||')) {
            return pattern.substring(2).replace(/\^$/, '');
        } else if (pattern.startsWith('|')) {
            return pattern.substring(1);
        } else if (pattern.endsWith('|')) {
            return pattern.substring(0, pattern.length - 1);
        } else {
            return pattern;
        }
    }

    getResourceTypes(options) {
        const resourceTypes = ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other'];

        if (options.script) return ['script'];
        if (options.image) return ['image'];
        if (options.stylesheet) return ['stylesheet'];
        if (options.font) return ['font'];
        if (options.media) return ['media'];
        if (options.object) return ['object'];
        if (options.xmlhttprequest) return ['xmlhttprequest'];

        return resourceTypes;
    }

    parseDomains(domainStr) {
        return domainStr.split(',').map(d => d.trim()).filter(d => d);
    }

    // Update rules when filters change
    async updateRules() {
        await this.initializeDeclarativeRules();
    }
}

// Initialize the service worker
const ublockServiceWorker = new UBlockServiceWorker();
