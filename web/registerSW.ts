// Service Worker Registration
// Handles PWA installation and updates

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('[PWA] New version available! Refresh to update.');
                
                // Optionally show update notification to user
                showUpdateNotification(newWorker);
              }
            });
          }
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });
  }
}

function showUpdateNotification(worker: ServiceWorker) {
  // Create a simple notification banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #f0e6d2;
    color: #000;
    padding: 16px 24px;
    border: 2px solid #d4c5b0;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 10000;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    display: flex;
    gap: 16px;
    align-items: center;
  `;
  
  banner.innerHTML = `
    <span>New version available!</span>
    <button id="update-btn" style="
      background: #000;
      color: #f0e6d2;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
    ">UPDATE NOW</button>
    <button id="dismiss-btn" style="
      background: transparent;
      color: #000;
      border: 1px solid #000;
      padding: 8px 16px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
    ">LATER</button>
  `;
  
  document.body.appendChild(banner);
  
  // Update button handler
  document.getElementById('update-btn')?.addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
  
  // Dismiss button handler
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
  });
}

// Install prompt handling
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  console.log('[PWA] Install prompt available');
  
  // Show custom install button/banner
  showInstallPromotion();
});

function showInstallPromotion() {
  // Create install promotion banner
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #0a0a0a;
    color: #f0e6d2;
    padding: 16px 24px;
    border: 2px solid #f0e6d2;
    box-shadow: 0 4px 12px rgba(0,0,0,0.8);
    z-index: 10000;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    display: flex;
    gap: 16px;
    align-items: center;
    max-width: 90%;
  `;
  
  banner.innerHTML = `
    <span>📱 Install Patch Pay as an app</span>
    <button id="install-btn" style="
      background: #f0e6d2;
      color: #000;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
      font-weight: bold;
    ">INSTALL</button>
    <button id="install-dismiss-btn" style="
      background: transparent;
      color: #f0e6d2;
      border: 1px solid #f0e6d2;
      padding: 8px 16px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 0.1em;
    ">NOT NOW</button>
  `;
  
  document.body.appendChild(banner);
  
  // Install button handler
  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User response: ${outcome}`);
      
      // Clear the deferred prompt
      deferredPrompt = null;
      
      // Remove the banner
      banner.remove();
    }
  });
  
  // Dismiss button handler
  document.getElementById('install-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
    
    // Don't show again for this session
    sessionStorage.setItem('install-prompt-dismissed', 'true');
  });
  
  // Don't show if already dismissed this session
  if (sessionStorage.getItem('install-prompt-dismissed')) {
    banner.remove();
  }
}

// Track installation
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully!');
  deferredPrompt = null;
  
  // Remove install banner if present
  document.getElementById('install-banner')?.remove();
});

// Detect if running as installed PWA
export function isRunningAsPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Log PWA status
if (isRunningAsPWA()) {
  console.log('[PWA] Running as installed app');
} else {
  console.log('[PWA] Running in browser');
}
