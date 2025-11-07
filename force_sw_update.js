// Force Service Worker Update Script
// Run this in the browser console to force update the service worker

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
    console.log('Service workers unregistered');
    
    // Reload the page to re-register the service worker
    window.location.reload();
  });
} else {
  console.log('Service workers not supported');
}
