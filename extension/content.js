/* FeedbackLoop Chrome Extension - content script */
(function () {
  'use strict';

  function inject(endpoint) {
    if (document.getElementById('feedbackloop-sdk')) return;
    const script = document.createElement('script');
    script.id = 'feedbackloop-sdk';
    script.src = chrome.runtime.getURL('feedback.js');
    script.async = true;
    script.dataset.endpoint = endpoint;
    script.dataset.survey = 'true';
    (document.head || document.documentElement).appendChild(script);
  }

  chrome.storage.sync.get(['feedbackEndpoint'], (result) => {
    const endpoint = result.feedbackEndpoint || 'http://localhost:3000/api/feedback';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => inject(endpoint));
    } else {
      inject(endpoint);
    }
  });
})();
