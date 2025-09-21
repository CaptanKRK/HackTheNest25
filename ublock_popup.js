// uBlock Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        totalFilters: document.getElementById('totalFilters'),
        blockedRequests: document.getElementById('blockedRequests'),
        customFilters: document.getElementById('customFilters'),
        whitelistDomains: document.getElementById('whitelistDomains'),
        customFilter: document.getElementById('customFilter'),
        addFilterBtn: document.getElementById('addFilterBtn'),
        refreshStatsBtn: document.getElementById('refreshStatsBtn'),
        whitelistDomain: document.getElementById('whitelistDomain'),
        addWhitelistBtn: document.getElementById('addWhitelistBtn'),
        whitelistItems: document.getElementById('whitelistItems'),
        testUrl: document.getElementById('testUrl'),
        testUrlBtn: document.getElementById('testUrlBtn'),
        testResult: document.getElementById('testResult'),
        statusMessage: document.getElementById('statusMessage')
    };

    // Load initial stats
    loadStats();

    // Event listeners
    elements.addFilterBtn.addEventListener('click', addCustomFilter);
    elements.refreshStatsBtn.addEventListener('click', loadStats);
    elements.addWhitelistBtn.addEventListener('click', addToWhitelist);
    elements.testUrlBtn.addEventListener('click', testUrl);

    // Enter key handlers
    elements.customFilter.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCustomFilter();
    });

    elements.whitelistDomain.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addToWhitelist();
    });

    elements.testUrl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') testUrl();
    });

    // Load statistics
    async function loadStats() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ublock_getStats'
            });

            if (response.success) {
                const stats = response.stats;
                elements.totalFilters.textContent = stats.totalFilters || 0;
                elements.blockedRequests.textContent = stats.blockedRequests || 0;
                elements.customFilters.textContent = stats.customFilters || 0;
                elements.whitelistDomains.textContent = stats.whitelistDomains || 0;
                
                showStatus('Stats updated successfully', 'success');
            } else {
                showStatus('Failed to load stats: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showStatus('Error loading stats: ' + error.message, 'error');
        }
    }

    // Add custom filter
    async function addCustomFilter() {
        const filter = elements.customFilter.value.trim();
        if (!filter) {
            showStatus('Please enter a filter', 'error');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ublock_addFilter',
                filter: filter
            });

            if (response.success) {
                elements.customFilter.value = '';
                showStatus('Filter added successfully', 'success');
                loadStats();
            } else {
                showStatus('Failed to add filter: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showStatus('Error adding filter: ' + error.message, 'error');
        }
    }

    // Add to whitelist
    async function addToWhitelist() {
        const domain = elements.whitelistDomain.value.trim();
        if (!domain) {
            showStatus('Please enter a domain', 'error');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ublock_whitelist',
                domain: domain
            });

            if (response.success) {
                elements.whitelistDomain.value = '';
                showStatus('Domain added to whitelist', 'success');
                loadStats();
                loadWhitelist();
            } else {
                showStatus('Failed to add domain: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showStatus('Error adding domain: ' + error.message, 'error');
        }
    }

    // Remove from whitelist
    async function removeFromWhitelist(domain) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ublock_unwhitelist',
                domain: domain
            });

            if (response.success) {
                showStatus('Domain removed from whitelist', 'success');
                loadStats();
                loadWhitelist();
            } else {
                showStatus('Failed to remove domain: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showStatus('Error removing domain: ' + error.message, 'error');
        }
    }

    // Load whitelist items
    async function loadWhitelist() {
        // This would need to be implemented to get the current whitelist
        // For now, we'll show a placeholder
        elements.whitelistItems.innerHTML = '<div style="text-align: center; color: #6c757d; font-size: 12px; padding: 10px;">Whitelist items will be loaded here</div>';
    }

    // Test URL
    async function testUrl() {
        const url = elements.testUrl.value.trim();
        if (!url) {
            showStatus('Please enter a URL to test', 'error');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'ublock_shouldBlock',
                url: url
            });

            if (response.success) {
                const result = response.shouldBlock ? 'BLOCKED' : 'ALLOWED';
                const color = response.shouldBlock ? '#dc3545' : '#28a745';
                elements.testResult.innerHTML = `
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; text-align: center;">
                        <strong style="color: ${color};">${result}</strong>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">${url}</div>
                    </div>
                `;
            } else {
                showStatus('Failed to test URL: ' + (response.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showStatus('Error testing URL: ' + error.message, 'error');
        }
    }

    // Show status message
    function showStatus(message, type) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status ${type}`;
        elements.statusMessage.classList.remove('hidden');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            elements.statusMessage.classList.add('hidden');
        }, 3000);
    }

    // Load whitelist on startup
    loadWhitelist();
});
