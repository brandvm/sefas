
// Initialize Wistia's command queue (required for Wistia API)
window._wq = window._wq || [];

// Main function: Check consent status and configure Wistia privacy settings accordingly
function applyWistiaPrivacySettings() {
  _wq.push(function(W) {

    // Check if user has given marketing consent via Iubenda
    // Purpose '4' is typically the marketing/advertising category in Iubenda
    var hasMarketingConsent = typeof _iub !== 'undefined' &&
                              _iub.cs &&
                              _iub.cs.consent &&
                              _iub.cs.consent.purposes &&
                              _iub.cs.consent.purposes['4'];

    // Apply privacy settings to every Wistia video on the page
    W.api.all().forEach(function(video) {

      if (hasMarketingConsent) {
        // User HAS given consent: Enable all analytics features
        video.setOption('doNotTrack', false);     // Enable engagement tracking (heatmaps, graphs)
        video.setOption('seo', true);             // Enable SEO tracking
        video.setOption('trackEmail', true);      // Enable email tracking
        video.setOption('googleAnalytics', true); // Enable Google Analytics integration

      } else {
        // User has NOT given consent: Disable all analytics (video still plays)
        video.setOption('doNotTrack', true);      // Disable engagement tracking
        video.setOption('seo', false);            // Disable SEO tracking
        video.setOption('trackEmail', false);     // Disable email tracking
        video.setOption('googleAnalytics', false); // Disable Google Analytics integration
      }
    });
  });
}

// Apply privacy settings when page loads
applyWistiaPrivacySettings();

// Listen for consent changes and update settings in real-time
if (typeof _iub !== 'undefined') {
  _iub.cons_instructions = _iub.cons_instructions || [];

  // When user GIVES consent, re-apply settings (enables analytics)
  _iub.cons_instructions.push(["onConsentGiven", applyWistiaPrivacySettings]);

  // When user REJECTS consent, re-apply settings (disables analytics)
  _iub.cons_instructions.push(["onConsentRejected", applyWistiaPrivacySettings]);
}
