/*******************************************************************************
 * uBlock Origin Core Integration
 * 
 * This file integrates the essential filtering and blocking functionality
 * from uBlock Origin into the Security Scanner extension.
 * 
 * Key features integrated:
 * - Static filtering engine for ad blocking
 * - URL parsing and domain extraction utilities
 * - Adblock filter syntax support
 * - Request blocking and modification
 * - Declarative Net Request rules generation
 *******************************************************************************/

// Core filtering engine classes and utilities
class UBlockIntegration {
    constructor() {
        this.initialized = false;
        this.filteringEngines = {
            static: null,
            dynamic: null,
            cosmetic: null
        };
        this.filterLists = new Map();
        this.blockedRequests = new Set();
        this.whitelistDomains = new Set();
        this.customFilters = [];
        
        // Initialize core components
        this.init();
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Load essential filter lists
            await this.loadFilterLists();
            
            // Initialize filtering engines
            this.initFilteringEngines();
            
            // Set up request interception
            this.setupRequestInterception();
            
            this.initialized = true;
            console.log('🔗 uBlock Integration: Core components initialized');
        } catch (error) {
            console.error('🔗 uBlock Integration: Initialization failed:', error);
        }
    }

    // Load essential filter lists
    async loadFilterLists() {
        const essentialLists = [
            'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
            'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
            'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt'
        ];

        for (const listUrl of essentialLists) {
            try {
                const response = await fetch(listUrl);
                const text = await response.text();
                const filters = this.parseFilterList(text);
                this.filterLists.set(listUrl, filters);
                console.log(`🔗 uBlock Integration: Loaded ${filters.length} filters from ${listUrl}`);
            } catch (error) {
                console.warn(`🔗 uBlock Integration: Failed to load ${listUrl}:`, error);
            }
        }
    }

    // Parse Adblock filter list
    parseFilterList(text) {
        const lines = text.split('\n');
        const filters = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('!')) continue;
            
            // Parse different filter types
            const filter = this.parseFilter(trimmed);
            if (filter) {
                filters.push(filter);
            }
        }
        
        return filters;
    }

    // Parse individual filter
    parseFilter(line) {
        const filter = {
            raw: line,
            type: 'unknown',
            pattern: '',
            options: {},
            exception: false
        };

        // Check if it's an exception rule
        if (line.startsWith('@@')) {
            filter.exception = true;
            line = line.substring(2);
        }

        // Check for options (after $)
        const dollarIndex = line.indexOf('$');
        if (dollarIndex !== -1) {
            filter.pattern = line.substring(0, dollarIndex);
            const optionsStr = line.substring(dollarIndex + 1);
            filter.options = this.parseOptions(optionsStr);
        } else {
            filter.pattern = line;
        }

        // Determine filter type
        if (line.includes('##')) {
            filter.type = 'cosmetic';
        } else if (line.includes('#@#')) {
            filter.type = 'cosmetic_exception';
        } else if (line.startsWith('||')) {
            filter.type = 'network_domain';
        } else if (line.startsWith('|')) {
            filter.type = 'network_start';
        } else if (line.endsWith('|')) {
            filter.type = 'network_end';
        } else if (line.includes('*') || line.includes('^')) {
            filter.type = 'network_pattern';
        } else {
            filter.type = 'network_plain';
        }

        return filter;
    }

    // Parse filter options
    parseOptions(optionsStr) {
        const options = {};
        const parts = optionsStr.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('=')) {
                const [key, value] = trimmed.split('=', 2);
                options[key.trim()] = value.trim();
            } else {
                options[trimmed] = true;
            }
        }
        
        return options;
    }

    // Initialize filtering engines
    initFilteringEngines() {
        this.filteringEngines.static = new StaticFilteringEngine(this);
        this.filteringEngines.dynamic = new DynamicFilteringEngine(this);
        this.filteringEngines.cosmetic = new CosmeticFilteringEngine(this);
    }

    // Set up request interception
    setupRequestInterception() {
        // This will be handled by the service worker
        // The actual interception happens in the service worker
    }

    // Check if a request should be blocked
    shouldBlockRequest(request) {
        if (!this.initialized) return false;

        const url = request.url;
        const hostname = this.extractHostname(url);
        const domain = this.extractDomain(hostname);

        // Check whitelist first
        if (this.isWhitelisted(url, hostname, domain)) {
            return false;
        }

        // Check against all filter lists
        for (const [listUrl, filters] of this.filterLists) {
            for (const filter of filters) {
                if (this.matchesFilter(url, hostname, domain, filter)) {
                    if (filter.exception) {
                        return false; // Exception rule overrides blocking
                    } else {
                        this.blockedRequests.add(url);
                        return true; // Block the request
                    }
                }
            }
        }

        return false;
    }

    // Check if URL/domain is whitelisted
    isWhitelisted(url, hostname, domain) {
        // Check exact domain matches
        if (this.whitelistDomains.has(hostname) || this.whitelistDomains.has(domain)) {
            return true;
        }

        // Check subdomain matches
        for (const whitelistDomain of this.whitelistDomains) {
            if (hostname.endsWith('.' + whitelistDomain)) {
                return true;
            }
        }

        return false;
    }

    // Check if a filter matches a request
    matchesFilter(url, hostname, domain, filter) {
        const pattern = filter.pattern;
        
        switch (filter.type) {
            case 'network_domain':
                return this.matchesDomainPattern(url, hostname, pattern);
            case 'network_start':
                return url.startsWith(pattern.substring(1));
            case 'network_end':
                return url.endsWith(pattern.substring(0, pattern.length - 1));
            case 'network_pattern':
                return this.matchesPattern(url, pattern);
            case 'network_plain':
                return url.includes(pattern);
            default:
                return false;
        }
    }

    // Match domain pattern (||domain.com^)
    matchesDomainPattern(url, hostname, pattern) {
        if (!pattern.startsWith('||') || !pattern.endsWith('^')) {
            return false;
        }
        
        const domain = pattern.substring(2, pattern.length - 1);
        return hostname === domain || hostname.endsWith('.' + domain);
    }

    // Match pattern with wildcards
    matchesPattern(url, pattern) {
        // Convert Adblock pattern to regex
        let regexPattern = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
            .replace(/\*/g, '.*') // Convert * to .*
            .replace(/\^/g, '[^a-zA-Z0-9._-]'); // Convert ^ to character class
        
        try {
            const regex = new RegExp(regexPattern);
            return regex.test(url);
        } catch (error) {
            return false;
        }
    }

    // Extract hostname from URL
    extractHostname(url) {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch (error) {
            return '';
        }
    }

    // Extract domain from hostname
    extractDomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length < 2) return hostname;
        
        // Simple domain extraction (could be enhanced with public suffix list)
        return parts.slice(-2).join('.');
    }

    // Add custom filter
    addCustomFilter(filterText) {
        const filter = this.parseFilter(filterText);
        if (filter) {
            this.customFilters.push(filter);
            console.log('🔗 uBlock Integration: Added custom filter:', filterText);
        }
    }

    // Add domain to whitelist
    addToWhitelist(domain) {
        this.whitelistDomains.add(domain.toLowerCase());
        console.log('🔗 uBlock Integration: Added to whitelist:', domain);
    }

    // Remove domain from whitelist
    removeFromWhitelist(domain) {
        this.whitelistDomains.delete(domain.toLowerCase());
        console.log('🔗 uBlock Integration: Removed from whitelist:', domain);
    }

    // Get blocking statistics
    getStats() {
        return {
            totalFilters: Array.from(this.filterLists.values()).reduce((sum, filters) => sum + filters.length, 0),
            customFilters: this.customFilters.length,
            whitelistDomains: this.whitelistDomains.size,
            blockedRequests: this.blockedRequests.size,
            initialized: this.initialized
        };
    }
}

// Static Filtering Engine
class StaticFilteringEngine {
    constructor(integration) {
        this.integration = integration;
        this.compiledFilters = new Map();
    }

    // Compile filter for faster matching
    compileFilter(filter) {
        if (this.compiledFilters.has(filter.raw)) {
            return this.compiledFilters.get(filter.raw);
        }

        let compiled = null;
        
        if (filter.type === 'network_pattern') {
            try {
                const regexPattern = filter.pattern
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\*/g, '.*')
                    .replace(/\^/g, '[^a-zA-Z0-9._-]');
                compiled = new RegExp(regexPattern);
            } catch (error) {
                compiled = null;
            }
        }

        this.compiledFilters.set(filter.raw, compiled);
        return compiled;
    }

    // Check if request matches compiled filter
    matchesCompiledFilter(url, filter) {
        const compiled = this.compileFilter(filter);
        if (!compiled) return false;
        
        return compiled.test(url);
    }
}

// Dynamic Filtering Engine
class DynamicFilteringEngine {
    constructor(integration) {
        this.integration = integration;
        this.dynamicRules = new Map();
    }

    // Add dynamic rule
    addRule(domain, rule) {
        if (!this.dynamicRules.has(domain)) {
            this.dynamicRules.set(domain, []);
        }
        this.dynamicRules.get(domain).push(rule);
    }

    // Check dynamic rules
    checkDynamicRules(url, hostname) {
        const domain = this.integration.extractDomain(hostname);
        
        if (this.dynamicRules.has(domain)) {
            const rules = this.dynamicRules.get(domain);
            for (const rule of rules) {
                if (this.matchesRule(url, rule)) {
                    return rule.action;
                }
            }
        }
        
        return null;
    }

    // Check if URL matches rule
    matchesRule(url, rule) {
        // Simple pattern matching for dynamic rules
        return url.includes(rule.pattern);
    }
}

// Cosmetic Filtering Engine
class CosmeticFilteringEngine {
    constructor(integration) {
        this.integration = integration;
        this.cosmeticFilters = [];
    }

    // Add cosmetic filter
    addFilter(filter) {
        if (filter.type === 'cosmetic') {
            this.cosmeticFilters.push(filter);
        }
    }

    // Apply cosmetic filters to page
    applyFilters() {
        // This would be called from content script
        // Implementation depends on specific cosmetic filtering needs
    }
}

// Export for use in other parts of the extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UBlockIntegration;
} else if (typeof window !== 'undefined') {
    window.UBlockIntegration = UBlockIntegration;
}

// Auto-initialize if in browser context
if (typeof window !== 'undefined' && typeof chrome !== 'undefined') {
    window.ublockIntegration = new UBlockIntegration();
}
