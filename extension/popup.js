document.addEventListener('DOMContentLoaded', () => {
  const endpointInput = document.getElementById('endpoint');
  const saveButton = document.getElementById('save');
  const status = document.getElementById('status');

  chrome.storage.sync.get(['feedbackEndpoint'], (result) => {
    endpointInput.value = result.feedbackEndpoint || 'https://localhost:3000/api/feedback';
  });

  saveButton.addEventListener('click', () => {
    const endpoint = endpointInput.value.trim();
    chrome.storage.sync.set({ feedbackEndpoint: endpoint }, () => {
      status.textContent = 'Guardado. Recargá la página para activar.';
    });
  });
});
