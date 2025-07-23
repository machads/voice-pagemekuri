// iframe内のページでスクロール指示を受け取るためのスクリプト
(function() {
    'use strict';
    
    // postMessage でスクロール指示を受け取る
    window.addEventListener('message', function(event) {
        // セキュリティ: 特定のオリジンからのメッセージのみ受け取る
        // 本番環境では適切なオリジンチェックを行う
        
        if (event.data && event.data.action === 'scroll') {
            console.log('Scroll message received:', event.data);
            
            const scrollAmount = event.data.amount || 500;
            const direction = event.data.direction;
            
            if (direction === 'down') {
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
                
                window.scrollTo({
                    top: newPosition,
                    behavior: 'smooth'
                });
                
                console.log('Scrolled down:', currentScroll, '→', newPosition);
                
            } else if (direction === 'up') {
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                const newPosition = Math.max(0, currentScroll - scrollAmount);
                
                window.scrollTo({
                    top: newPosition,
                    behavior: 'smooth'
                });
                
                console.log('Scrolled up:', currentScroll, '→', newPosition);
            }
        }
    });
    
    console.log('iframe-scroll.js loaded - ready to receive scroll messages');
})();