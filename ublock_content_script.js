/*******************************************************************************
 * uBlock Content Script Integration
 * 
 * This file handles content script integration for uBlock Origin
 * functionality, including cosmetic filtering and element blocking.
 *******************************************************************************/

// Import the uBlock integration
importScripts('ublock_integration.js');

class UBlockContentScript {
    constructor() {
        this.integration = new UBlockIntegration();
        this.cosmeticFilters = [];
        this.blockedElements = new Set();
        this.observer = null;
        this.setupEventListeners();
        this.initializeCosmeticFiltering();
    }

    setupEventListeners() {
        // Listen for messages from service worker
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Listen for DOM changes to apply cosmetic filters
        this.setupDOMObserver();

        // Listen for page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.onPageLoad.bind(this));
        } else {
            this.onPageLoad();
        }
    }

    handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'ublock_applyCosmeticFilters':
                    this.applyCosmeticFilters();
                    sendResponse({ success: true });
                    break;

                case 'ublock_blockElement':
                    this.blockElement(message.selector);
                    sendResponse({ success: true });
                    break;

                case 'ublock_unblockElement':
                    this.unblockElement(message.selector);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('🔗 uBlock Content Script: Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    setupDOMObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.checkElementForBlocking(node);
                        }
                    });
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    onPageLoad() {
        console.log('🔗 uBlock Content Script: Page loaded, applying filters');
        this.applyCosmeticFilters();
        this.checkExistingElements();
    }

    checkExistingElements() {
        // Check all existing elements for blocking
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            this.checkElementForBlocking(element);
        });
    }

    checkElementForBlocking(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

        // Check against cosmetic filters
        for (const filter of this.cosmeticFilters) {
            if (this.matchesCosmeticFilter(element, filter)) {
                this.blockElementByFilter(element, filter);
                return;
            }
        }
    }

    matchesCosmeticFilter(element, filter) {
        if (filter.type !== 'cosmetic') return false;

        const pattern = filter.pattern;
        
        // Handle different cosmetic filter patterns
        if (pattern.startsWith('##')) {
            // Element hiding filter
            const selector = pattern.substring(2);
            return this.matchesSelector(element, selector);
        } else if (pattern.startsWith('#@#')) {
            // Exception filter
            const selector = pattern.substring(3);
            return this.matchesSelector(element, selector);
        }

        return false;
    }

    matchesSelector(element, selector) {
        try {
            // Simple selector matching
            if (selector.includes(',')) {
                const selectors = selector.split(',');
                return selectors.some(sel => this.matchesSingleSelector(element, sel.trim()));
            } else {
                return this.matchesSingleSelector(element, selector);
            }
        } catch (error) {
            return false;
        }
    }

    matchesSingleSelector(element, selector) {
        try {
            // Handle common Adblock selectors
            if (selector.includes('##')) {
                const [parent, child] = selector.split('##');
                if (parent && child) {
                    return this.matchesParentChild(element, parent, child);
                }
            } else if (selector.includes('[') && selector.includes(']')) {
                // Attribute selector
                return this.matchesAttributeSelector(element, selector);
            } else {
                // Simple CSS selector
                return element.matches(selector);
            }
        } catch (error) {
            return false;
        }
    }

    matchesParentChild(element, parentSelector, childSelector) {
        // Check if element matches child selector and has parent matching parent selector
        if (!element.matches(childSelector)) return false;
        
        let parent = element.parentElement;
        while (parent) {
            if (parent.matches(parentSelector)) return true;
            parent = parent.parentElement;
        }
        return false;
    }

    matchesAttributeSelector(element, selector) {
        // Simple attribute selector matching
        const match = selector.match(/\[([^=]+)(?:=([^\]]+))?\]/);
        if (!match) return false;

        const attrName = match[1];
        const attrValue = match[2];

        if (attrValue) {
            return element.getAttribute(attrName) === attrValue;
        } else {
            return element.hasAttribute(attrName);
        }
    }

    blockElementByFilter(element, filter) {
        if (filter.pattern.startsWith('#@#')) {
            // Exception filter - don't block
            return;
        }

        this.blockElement(element);
    }

    blockElement(elementOrSelector) {
        let element;
        
        if (typeof elementOrSelector === 'string') {
            element = document.querySelector(elementOrSelector);
        } else {
            element = elementOrSelector;
        }

        if (!element) return;

        // Hide the element
        element.style.display = 'none !important';
        element.style.visibility = 'hidden !important';
        element.style.opacity = '0 !important';
        element.style.height = '0 !important';
        element.style.width = '0 !important';
        element.style.overflow = 'hidden !important';

        // Mark as blocked
        element.setAttribute('data-ublock-blocked', 'true');
        this.blockedElements.add(element);

        console.log('🔗 uBlock Content Script: Blocked element:', element);
    }

    unblockElement(elementOrSelector) {
        let element;
        
        if (typeof elementOrSelector === 'string') {
            element = document.querySelector(elementOrSelector);
        } else {
            element = elementOrSelector;
        }

        if (!element) return;

        // Restore the element
        element.style.display = '';
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.height = '';
        element.style.width = '';
        element.style.overflow = '';

        // Remove blocked marker
        element.removeAttribute('data-ublock-blocked');
        this.blockedElements.delete(element);

        console.log('🔗 uBlock Content Script: Unblocked element:', element);
    }

    applyCosmeticFilters() {
        // Load cosmetic filters from the integration
        const allFilters = [];
        for (const [listUrl, filters] of this.integration.filterLists) {
            allFilters.push(...filters.filter(f => f.type === 'cosmetic'));
        }

        this.cosmeticFilters = allFilters;
        console.log(`🔗 uBlock Content Script: Loaded ${this.cosmeticFilters.length} cosmetic filters`);

        // Apply filters to existing elements
        this.checkExistingElements();
    }

    // Get statistics
    getStats() {
        return {
            cosmeticFilters: this.cosmeticFilters.length,
            blockedElements: this.blockedElements.size,
            integrationStats: this.integration.getStats()
        };
    }

    // Cleanup
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// Initialize the content script
const ublockContentScript = new UBlockContentScript();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    ublockContentScript.destroy();
});
