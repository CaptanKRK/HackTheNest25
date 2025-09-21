# Terms and Conditions Scanner Feature

## Overview

The Terms and Conditions Scanner is a new feature that automatically detects and analyzes Terms of Service (ToS) pages for potentially harmful, unfair, or suspicious clauses. It uses natural language processing and pattern recognition to identify red flags that could negatively impact users' privacy, security, or legal rights.

## Features

### 🔍 Automatic Detection
- **Smart Page Detection**: Automatically identifies ToS pages using URL patterns, page titles, and content analysis
- **Real-time Analysis**: Scans pages as users navigate to them
- **Visual Notifications**: Shows a notification banner when ToS pages are detected

### 🧠 Intelligent Analysis
The scanner analyzes ToS documents for four main categories of risks:

#### 1. Data Privacy Risks
- Excessive data collection mentions
- Data sharing with third parties
- Long-term data retention policies
- User tracking and analytics disclosures

#### 2. Unfair Obligations
- Binding arbitration clauses
- Hidden fees and automatic charges
- Waiver of user rights
- Unilateral terms modification rights

#### 3. Security Concerns
- Broad access to user accounts
- Information disclosure requirements
- Security breach acknowledgments

#### 4. Suspicious Language
- Vague discretionary language
- Unilateral change rights
- One-sided interpretation rights

### 📊 Risk Assessment
- **Risk Scoring**: Provides a percentage-based risk score (0-100%)
- **Categorized Issues**: Groups findings by risk category
- **Detailed Context**: Shows relevant text snippets for each issue found

### 🎨 User-Friendly Interface
- **Clean Summary**: Plain-language explanations of complex legal terms
- **Visual Indicators**: Color-coded risk levels and icons
- **Interactive Details**: Expandable sections for detailed analysis
- **Actionable Recommendations**: Clear guidance on what users should consider

## Technical Implementation

### Files Added/Modified

1. **`tos_scanner.js`** - Main content script for ToS detection and analysis
2. **`popup.html`** - Updated with ToS scanner interface
3. **`popup.js`** - Added ToS scanner functionality
4. **`content.js`** - Added ToS page detection logic
5. **`manifest.json`** - Updated with new content script
6. **`test_tos_scanner.html`** - Test page with various ToS red flags

### Architecture

```
Browser Extension
├── Content Scripts
│   ├── tos_scanner.js (ToS detection & analysis)
│   └── content.js (Message handling)
├── Popup Interface
│   ├── popup.html (UI elements)
│   └── popup.js (ToS scanner logic)
└── Background
    └── service_worker.js (Message routing)
```

### Pattern Recognition

The scanner uses regex patterns to identify potentially problematic language:

```javascript
// Example patterns for data privacy risks
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
  }
];
```

## Usage

### For Users

1. **Automatic Detection**: The scanner automatically detects ToS pages and shows a notification
2. **Manual Scanning**: Use the "Scan Current ToS Page" button in the extension popup
3. **Review Results**: Check the risk score and detailed analysis
4. **Make Informed Decisions**: Use the analysis to understand potential risks

### For Developers

1. **Testing**: Use `test_tos_scanner.html` to test the scanner with various red flags
2. **Customization**: Modify patterns in `tos_scanner.js` to add new detection rules
3. **Integration**: The scanner integrates seamlessly with existing popup blocker functionality

## Risk Categories and Scoring

### Risk Levels
- **Low Risk (0-39%)**: Minimal issues found
- **Medium Risk (40-69%)**: Some concerning clauses detected
- **High Risk (70-100%)**: Multiple significant red flags

### Scoring Algorithm
```javascript
riskScore = (totalRiskPoints / maxPossiblePoints) * 100
```

Each detected pattern contributes risk points based on severity:
- **High Severity (8-10 points)**: Binding arbitration, data selling
- **Medium Severity (5-7 points)**: Vague language, unilateral changes
- **Low Severity (1-4 points)**: Minor concerns, standard practices

## Examples of Detected Issues

### Data Privacy Risks
- "We may share your information with third-party partners"
- "Your data will be retained indefinitely"
- "We collect browsing history and location data"

### Unfair Obligations
- "Disputes will be resolved through binding arbitration"
- "Your subscription will automatically renew"
- "We may modify these terms at any time"

### Security Concerns
- "We may access your account for security purposes"
- "We will cooperate with law enforcement investigations"
- "We are not responsible for data breaches"

## Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Compatible with minor modifications
- **Safari**: Requires WebKit adaptations

## Privacy and Security

- **Local Processing**: All analysis happens in the browser
- **No Data Transmission**: No user data is sent to external servers
- **Transparent Analysis**: Users can see exactly what patterns are detected
- **Opt-in Only**: Scanner only activates on detected ToS pages

## Future Enhancements

### Planned Features
1. **Machine Learning Integration**: More sophisticated NLP analysis
2. **Legal Database**: Integration with known problematic clauses
3. **Comparative Analysis**: Compare ToS across different services
4. **Export Reports**: Generate PDF reports of analysis results
5. **Multi-language Support**: Analyze ToS in different languages

### Advanced Pattern Recognition
1. **Semantic Analysis**: Understanding context and meaning
2. **Legal Precedent**: Integration with case law database
3. **Regulatory Compliance**: Check against privacy regulations (GDPR, CCPA)
4. **Historical Analysis**: Track changes in ToS over time

## Testing

### Test Scenarios
1. **Clean ToS**: Pages with minimal issues (should score low)
2. **Problematic ToS**: Pages with multiple red flags (should score high)
3. **Mixed Content**: Pages with some issues but not severe
4. **Non-ToS Pages**: Regular web pages (should not trigger scanner)

### Test Data
The `test_tos_scanner.html` file contains various red flags for testing:
- Data sharing clauses
- Binding arbitration
- Automatic renewal terms
- Liability limitations
- Unilateral modification rights

## Contributing

### Adding New Patterns
To add new detection patterns, modify the pattern arrays in `tos_scanner.js`:

```javascript
const newPatterns = [
  {
    pattern: /your-regex-pattern/i,
    risk: 7, // Risk level 1-10
    category: 'dataPrivacy', // Category name
    description: 'Human-readable description'
  }
];
```

### Categories
- `dataPrivacy`: Data collection and sharing issues
- `unfairObligations`: Unfair user obligations
- `securityConcerns`: Security-related issues
- `suspiciousLanguage`: Vague or concerning language

## Support

For issues or questions about the ToS scanner:
1. Check the browser console for error messages
2. Verify the extension has proper permissions
3. Test with the provided test page
4. Review the pattern matching logic for false positives/negatives

## License

This feature is part of the Security Scanner browser extension and follows the same licensing terms.
