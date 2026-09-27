(function () {
  function sendPageView() {
    if (!window.dynatrace || typeof window.dynatrace.sendBizEvent !== 'function') return;

    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);
    var section = parts.length > 0 ? parts[0] : '';
    var page = parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
    var title = document.title.replace(/\s*[-|]\s*[^-|]+$/, '').trim();

    window.dynatrace.sendBizEvent('docs.page.viewed', {
      'page_name': page,
      'page_title': title,
      'section': section,
      'page_path': path,
      'url': window.location.href
    });
  }

  document.addEventListener('DOMContentLoaded', sendPageView);
})();
