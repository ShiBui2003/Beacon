// Simple toast notification utility
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.custom-toast');
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `custom-toast fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300 transform translate-x-0`;
  
  // Set colors based on type
  switch (type) {
    case 'success':
      toast.className += ' bg-green-500 text-white';
      break;
    case 'error':
      toast.className += ' bg-red-500 text-white';
      break;
    default:
      toast.className += ' bg-blue-500 text-white';
  }

  // Add icon based on type
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span>${icon}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 4000);
};

export const showSuccessToast = (message: string) => showToast(message, 'success');
export const showErrorToast = (message: string) => showToast(message, 'error');
export const showInfoToast = (message: string) => showToast(message, 'info');