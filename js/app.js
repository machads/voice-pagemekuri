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
        
        if (cleanCommand.includes('次') || cleanCommand.includes('つぎ') || cleanCommand.includes('進む')) {
            this.goForward();
        } else if (cleanCommand.includes('前') || cleanCommand.includes('まえ') || 
                   cleanCommand.includes('戻る') || cleanCommand.includes('もどる') ||
                   cleanCommand.includes('後ろ') || cleanCommand.includes('うしろ')) {
            this.goBack();
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
            
            // iframe読み込みエラーをキャッチ
            this.contentFrame.onerror = () => {
                this.showError('このサイトはiframe表示を許可していません。プロキシモードを試してください。');
            };
            
        } catch (error) {
            this.showError('URLの読み込みに失敗しました');
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