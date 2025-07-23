class VoicePageNavigator {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.history = [];
        this.currentIndex = -1;
        
        this.initElements();
        this.initSpeechRecognition();
        this.initEventListeners();
    }
    
    initElements() {
        this.voiceBtn = document.getElementById('voiceBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.transcript = document.getElementById('transcript');
        this.urlInput = document.getElementById('urlInput');
        this.goBtn = document.getElementById('goBtn');
        this.backBtn = document.getElementById('backBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.contentFrame = document.getElementById('contentFrame');
    }
    
    initSpeechRecognition() {
        // HTTPS環境チェック（より詳細な情報表示）
        console.log('Protocol:', location.protocol);
        console.log('Hostname:', location.hostname);
        console.log('Port:', location.port);
        
        // HTTPS環境チェック - HTTPでは音声認識のネットワーク通信が制限される
        if (location.protocol !== 'https:') {
            this.showError('音声認識にはHTTPS環境が必要です。以下の方法を試してください：\n1. ngrok http 5500\n2. GitHub Pages\n3. Netlify Deploy');
            return;
        }
        
        // ブラウザサポートチェック
        console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
        console.log('SpeechRecognition available:', 'SpeechRecognition' in window);
        
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            console.log('Using webkitSpeechRecognition');
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
            console.log('Using SpeechRecognition');
        } else {
            console.error('Speech recognition not supported');
            this.showError('音声認識がサポートされていません - Chrome/Edgeを使用してください');
            return;
        }
        
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceStatus('音声認識中...', true);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceStatus('音声認識OFF', false);
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                this.transcript.textContent = `認識結果: ${finalTranscript}`;
                this.processVoiceCommand(finalTranscript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            console.error('Error details:', event);
            
            let errorMsg = '';
            switch(event.error) {
                case 'network':
                    errorMsg = 'ネットワークエラー - インターネット接続を確認してください';
                    break;
                case 'not-allowed':
                    errorMsg = 'マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してください';
                    break;
                case 'audio-capture':
                    errorMsg = 'マイクが見つかりません。マイクが接続されているか確認してください';
                    break;
                case 'no-speech':
                    errorMsg = '音声が検出されませんでした';
                    break;
                default:
                    errorMsg = `音声認識エラー: ${event.error}`;
            }
            
            this.showError(errorMsg);
        };
    }
    
    initEventListeners() {
        this.voiceBtn.addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });
        
        this.goBtn.addEventListener('click', () => {
            this.loadUrl();
        });
        
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadUrl();
            }
        });
        
        this.backBtn.addEventListener('click', () => {
            this.goBack();
        });
        
        this.forwardBtn.addEventListener('click', () => {
            this.goForward();
        });
        
        this.contentFrame.addEventListener('load', () => {
            this.updateNavigationButtons();
        });
    }
    
    toggleVoiceRecognition() {
        console.log('toggleVoiceRecognition called');
        
        if (!this.recognition) {
            this.showError('音声認識が利用できません');
            return;
        }
        
        if (this.isListening) {
            console.log('Stopping recognition');
            this.recognition.stop();
        } else {
            console.log('Starting recognition');
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Recognition start error:', error);
                this.showError(`音声認識開始エラー: ${error.message}`);
            }
        }
    }
    
    updateVoiceStatus(text, listening) {
        this.voiceStatus.textContent = text;
        if (listening) {
            this.voiceBtn.classList.add('listening');
        } else {
            this.voiceBtn.classList.remove('listening');
        }
    }
    
    processVoiceCommand(command) {
        const cleanCommand = command.trim().toLowerCase();
        
        console.log('Voice command:', cleanCommand);
        
        if (cleanCommand.includes('次') || cleanCommand.includes('つぎ') || 
            cleanCommand.includes('下') || cleanCommand.includes('した') ||
            cleanCommand.includes('進む') || cleanCommand.includes('すすむ')) {
            this.scrollDown();
        } else if (cleanCommand.includes('前') || cleanCommand.includes('まえ') || 
                   cleanCommand.includes('上') || cleanCommand.includes('うえ') ||
                   cleanCommand.includes('戻る') || cleanCommand.includes('もどる')) {
            this.scrollUp();
        }
        
        setTimeout(() => {
            this.transcript.textContent = '認識結果: ';
        }, 3000);
    }
    
    loadUrl() {
        let url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('URLを入力してください');
            return;
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // CORS問題を回避するためのプロキシオプション
        const useProxy = document.getElementById('useProxy')?.checked || false;
        let finalUrl = url;
        
        if (useProxy) {
            // 無料のCORSプロキシサービスを使用（本番環境では独自プロキシ推奨）
            finalUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        }
        
        try {
            this.contentFrame.src = finalUrl;
            this.addToHistory(url); // 元のURLを履歴に保存
            this.urlInput.value = url;
            
            // iframe読み込み完了時にスクロール用スクリプトを注入
            this.contentFrame.onload = () => {
                this.injectScrollScript();
            };
            
            // iframe読み込みエラーをキャッチ
            this.contentFrame.onerror = () => {
                this.showError('このサイトはiframe表示を許可していません。プロキシモードを試してください。');
            };
            
        } catch (error) {
            this.showError('URLの読み込みに失敗しました');
        }
    }
    
    injectScrollScript() {
        try {
            const frameDoc = this.contentFrame.contentDocument;
            if (frameDoc) {
                // スクロール用のスクリプトを iframe 内に注入
                const script = frameDoc.createElement('script');
                script.id = 'voiceScrollHandler';
                script.textContent = `
                    // 音声ナビゲーター用のスクロール処理
                    window.voiceScrollDown = function() {
                        console.log('voiceScrollDown called');
                        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                        const scrollAmount = 500;
                        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                        const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
                        window.scrollTo({
                            top: newPosition,
                            behavior: 'smooth'
                        });
                        console.log('Scroll down executed:', currentScroll, '→', newPosition);
                        return true;
                    };
                    
                    window.voiceScrollUp = function() {
                        console.log('voiceScrollUp called');
                        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                        const scrollAmount = 500;
                        const newPosition = Math.max(0, currentScroll - scrollAmount);
                        window.scrollTo({
                            top: newPosition,
                            behavior: 'smooth'
                        });
                        console.log('Scroll up executed:', currentScroll, '→', newPosition);
                        return true;
                    };
                    
                    console.log('Voice scroll functions injected successfully');
                `;
                
                // 既存のスクリプトがあれば削除
                const existingScript = frameDoc.getElementById('voiceScrollHandler');
                if (existingScript) {
                    existingScript.remove();
                }
                
                frameDoc.head.appendChild(script);
                console.log('Scroll script injected into iframe');
            }
        } catch (error) {
            console.log('Script injection failed:', error.message);
        }
    }
    
    addToHistory(url) {
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        this.history.push(url);
        this.currentIndex = this.history.length - 1;
        this.updateNavigationButtons();
    }
    
    scrollUp() {
        console.log('scrollUp called');
        
        // iframe内のページをスクロールする方法を複数試行
        let scrolled = false;
        
        // 手動でiframe内のスクロール位置を変更
        try {
            console.log('Method 1 - Direct iframe manipulation');
            
            // iframe内のwindowオブジェクトに直接アクセス
            const frameWindow = this.contentFrame.contentWindow;
            if (frameWindow) {
                // 現在のスクロール位置を取得
                let currentScroll = 0;
                try {
                    currentScroll = frameWindow.pageYOffset || frameWindow.scrollY || 0;
                    console.log('Current scroll position:', currentScroll);
                } catch(e) {
                    console.log('Could not get scroll position:', e.message);
                }
                
                // スクロール量
                const scrollAmount = 500;
                const newPosition = Math.max(0, currentScroll - scrollAmount);
                
                // 複数の方法でスクロール実行
                try {
                    // 方法A: scrollTo
                    frameWindow.scrollTo(0, newPosition);
                    console.log('Method 1A - scrollTo executed:', newPosition);
                } catch(e) {
                    console.log('scrollTo failed:', e.message);
                }
                
                try {
                    // 方法B: scrollBy
                    frameWindow.scrollBy(0, -scrollAmount);
                    console.log('Method 1B - scrollBy executed:', -scrollAmount);
                } catch(e) {
                    console.log('scrollBy failed:', e.message);
                }
                
                try {
                    // 方法C: location hash manipulation
                    const hash = frameWindow.location.hash;
                    frameWindow.location.hash = hash + (hash.includes('scroll') ? '1' : '#scroll');
                    setTimeout(() => {
                        frameWindow.history.back();
                    }, 10);
                    console.log('Method 1C - hash manipulation executed');
                } catch(e) {
                    console.log('hash manipulation failed:', e.message);
                }
                
                scrolled = true;
                this.showMessage(`上スクロール実行 (${currentScroll} → ${newPosition})`);
            } else {
                console.log('frameWindow not accessible');
            }
            
        } catch (error) {
            console.log('Method 1 failed:', error.message);
        }
        
        if (!scrolled) {
            try {
                // 方法2: contentDocument経由
                const frameDoc = this.contentFrame.contentDocument;
                if (frameDoc) {
                    const currentScroll = frameDoc.documentElement.scrollTop || frameDoc.body.scrollTop;
                    const scrollAmount = 500; // 固定値でテスト
                    const newPosition = Math.max(0, currentScroll - scrollAmount);
                    
                    console.log('Method 2 - Current scroll:', currentScroll, 'New position:', newPosition);
                    
                    frameDoc.documentElement.scrollTop = newPosition;
                    frameDoc.body.scrollTop = newPosition; // 古いブラウザ対応
                    
                    scrolled = true;
                    this.showMessage(`上にスクロールしました (${currentScroll} → ${newPosition})`);
                }
            } catch (error) {
                console.log('Method 2 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            try {
                // 方法2: contentWindow経由
                const frameWindow = this.contentFrame.contentWindow;
                if (frameWindow) {
                    const currentScroll = frameWindow.pageYOffset || frameWindow.scrollY;
                    const scrollAmount = 500;
                    const newPosition = Math.max(0, currentScroll - scrollAmount);
                    
                    console.log('Method 2 - Current scroll:', currentScroll, 'New position:', newPosition);
                    
                    frameWindow.scrollTo({
                        top: newPosition,
                        behavior: 'smooth'
                    });
                    
                    scrolled = true;
                    this.showMessage(`上にスクロールしました (${currentScroll} → ${newPosition})`);
                }
            } catch (error) {
                console.log('Method 2 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            // 方法3: 注入済み関数を呼び出し
            try {
                const frameWindow = this.contentFrame.contentWindow;
                if (frameWindow && typeof frameWindow.voiceScrollUp === 'function') {
                    const result = frameWindow.voiceScrollUp();
                    if (result) {
                        console.log('Method 3 - Injected function call successful');
                        this.showMessage('注入関数でスクロールしました');
                        scrolled = true;
                    }
                }
            } catch (error) {
                console.log('Method 3 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            // 方法4: postMessage を使用してiframe内のページに指示
            try {
                this.contentFrame.contentWindow.postMessage({
                    action: 'scroll',
                    direction: 'up',
                    amount: 500
                }, '*');
                
                console.log('Method 4 - PostMessage sent');
                this.showMessage('上にスクロール指示を送信しました');
                scrolled = true;
            } catch (error) {
                console.log('Method 4 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            // 方法5: キーボードイベントシミュレーション
            try {
                const frameWindow = this.contentFrame.contentWindow;
                if (frameWindow) {
                    // PageUpキーをシミュレート
                    const event = new frameWindow.KeyboardEvent('keydown', {
                        key: 'PageUp',
                        code: 'PageUp',
                        keyCode: 33,
                        which: 33,
                        bubbles: true
                    });
                    frameWindow.document.dispatchEvent(event);
                    
                    console.log('Method 5 - PageUp key simulated');
                    this.showMessage('上キーをシミュレートしました');
                    scrolled = true;
                }
            } catch (error) {
                console.log('Method 5 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            console.log('All scroll methods failed - iframe access restricted');
            this.showMessage('スクロールできません。CORS制限またはiframeアクセス制限があります。');
        }
    }
    
    scrollDown() {
        console.log('scrollDown called');
        
        // iframe内のページをスクロールする方法を複数試行
        let scrolled = false;
        
        // 手動でiframe内のスクロール位置を変更
        try {
            console.log('Method 1 - Direct iframe manipulation');
            
            // iframe内のwindowオブジェクトに直接アクセス
            const frameWindow = this.contentFrame.contentWindow;
            if (frameWindow) {
                // 現在のスクロール位置を取得
                let currentScroll = 0;
                let maxScroll = 0;
                try {
                    currentScroll = frameWindow.pageYOffset || frameWindow.scrollY || 0;
                    maxScroll = frameWindow.document.documentElement.scrollHeight - frameWindow.innerHeight;
                    console.log('Current scroll position:', currentScroll, 'Max scroll:', maxScroll);
                } catch(e) {
                    console.log('Could not get scroll position:', e.message);
                }
                
                // スクロール量
                const scrollAmount = 500;
                const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
                
                // 複数の方法でスクロール実行
                try {
                    // 方法A: scrollTo
                    frameWindow.scrollTo(0, newPosition);
                    console.log('Method 1A - scrollTo executed:', newPosition);
                } catch(e) {
                    console.log('scrollTo failed:', e.message);
                }
                
                try {
                    // 方法B: scrollBy
                    frameWindow.scrollBy(0, scrollAmount);
                    console.log('Method 1B - scrollBy executed:', scrollAmount);
                } catch(e) {
                    console.log('scrollBy failed:', e.message);
                }
                
                try {
                    // 方法C: document.body.scrollTop直接操作
                    frameWindow.document.documentElement.scrollTop = newPosition;
                    frameWindow.document.body.scrollTop = newPosition;
                    console.log('Method 1C - direct scrollTop executed:', newPosition);
                } catch(e) {
                    console.log('direct scrollTop failed:', e.message);
                }
                
                scrolled = true;
                this.showMessage(`下スクロール実行 (${currentScroll} → ${newPosition})`);
            } else {
                console.log('frameWindow not accessible');
            }
            
        } catch (error) {
            console.log('Method 1 failed:', error.message);
        }
        
        if (!scrolled) {
            try {
                // 方法2: contentDocument経由
                const frameDoc = this.contentFrame.contentDocument;
                if (frameDoc) {
                    const currentScroll = frameDoc.documentElement.scrollTop || frameDoc.body.scrollTop;
                    const scrollAmount = 500; // 固定値でテスト
                    const maxScroll = frameDoc.documentElement.scrollHeight - frameDoc.documentElement.clientHeight;
                    const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
                    
                    console.log('Method 2 - Current scroll:', currentScroll, 'Max scroll:', maxScroll, 'New position:', newPosition);
                    
                    frameDoc.documentElement.scrollTop = newPosition;
                    frameDoc.body.scrollTop = newPosition; // 古いブラウザ対応
                    
                    scrolled = true;
                    this.showMessage(`下にスクロールしました (${currentScroll} → ${newPosition})`);
                }
            } catch (error) {
                console.log('Method 2 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            try {
                // 方法2: contentWindow経由
                const frameWindow = this.contentFrame.contentWindow;
                if (frameWindow) {
                    const currentScroll = frameWindow.pageYOffset || frameWindow.scrollY;
                    const scrollAmount = 500;
                    const maxScroll = frameWindow.document.documentElement.scrollHeight - frameWindow.innerHeight;
                    const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
                    
                    console.log('Method 2 - Current scroll:', currentScroll, 'Max scroll:', maxScroll, 'New position:', newPosition);
                    
                    frameWindow.scrollTo({
                        top: newPosition,
                        behavior: 'smooth'
                    });
                    
                    scrolled = true;
                    this.showMessage(`下にスクロールしました (${currentScroll} → ${newPosition})`);
                }
            } catch (error) {
                console.log('Method 2 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            // 方法3: 注入済み関数を呼び出し
            try {
                const frameWindow = this.contentFrame.contentWindow;
                if (frameWindow && typeof frameWindow.voiceScrollDown === 'function') {
                    const result = frameWindow.voiceScrollDown();
                    if (result) {
                        console.log('Method 3 - Injected function call successful');
                        this.showMessage('注入関数でスクロールしました');
                        scrolled = true;
                    }
                }
            } catch (error) {
                console.log('Method 3 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            // 方法4: postMessage を使用してiframe内のページに指示
            try {
                this.contentFrame.contentWindow.postMessage({
                    action: 'scroll',
                    direction: 'down',
                    amount: 500
                }, '*');
                
                console.log('Method 4 - PostMessage sent');
                this.showMessage('下にスクロール指示を送信しました');
                scrolled = true;
            } catch (error) {
                console.log('Method 4 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            // 方法5: キーボードイベントシミュレーション
            try {
                const frameWindow = this.contentFrame.contentWindow;
                if (frameWindow) {
                    // PageDownキーをシミュレート
                    const event = new frameWindow.KeyboardEvent('keydown', {
                        key: 'PageDown',
                        code: 'PageDown',
                        keyCode: 34,
                        which: 34,
                        bubbles: true
                    });
                    frameWindow.document.dispatchEvent(event);
                    
                    console.log('Method 5 - PageDown key simulated');
                    this.showMessage('下キーをシミュレートしました');
                    scrolled = true;
                }
            } catch (error) {
                console.log('Method 5 failed:', error.message);
            }
        }
        
        if (!scrolled) {
            console.log('All scroll methods failed - iframe access restricted');
            this.showMessage('スクロールできません。CORS制限またはiframeアクセス制限があります。');
        }
    }
    
    goBack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.contentFrame.src = this.history[this.currentIndex];
            this.urlInput.value = this.history[this.currentIndex];
            this.updateNavigationButtons();
            this.showMessage('前のページに移動しました');
        } else {
            this.showMessage('これ以上戻れません');
        }
    }
    
    goForward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.contentFrame.src = this.history[this.currentIndex];
            this.urlInput.value = this.history[this.currentIndex];
            this.updateNavigationButtons();
            this.showMessage('次のページに移動しました');
        } else {
            this.showMessage('これ以上進めません');
        }
    }
    
    updateNavigationButtons() {
        this.backBtn.disabled = this.currentIndex <= 0;
        this.forwardBtn.disabled = this.currentIndex >= this.history.length - 1;
    }
    
    showMessage(message) {
        this.transcript.textContent = `メッセージ: ${message}`;
        setTimeout(() => {
            this.transcript.textContent = '認識結果: ';
        }, 2000);
    }
    
    showError(error) {
        this.transcript.textContent = `エラー: ${error}`;
        setTimeout(() => {
            this.transcript.textContent = '認識結果: ';
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VoicePageNavigator();
});