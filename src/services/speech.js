/**
 * 语音识别服务 — 基于 Web Speech API
 * 实时将语音转为文字，生成带时间戳的笔记
 */

const SpeechRecognition =
    typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

/**
 * 检查浏览器是否支持语音识别
 */
export function isSpeechSupported() {
    return !!SpeechRecognition;
}

/**
 * 创建语音识别实例
 * @param {Object} options
 * @param {Function} options.onResult - 收到转录结果时的回调 (text, isFinal)
 * @param {Function} options.onError - 出错时的回调 (error)
 * @param {Function} options.onStatusChange - 状态变化回调 ('listening' | 'stopped' | 'error')
 * @param {string} options.lang - 识别语言，默认 'zh-CN'
 */
export function createSpeechRecognizer(options = {}) {
    if (!SpeechRecognition) {
        return null;
    }

    const {
        onResult = () => { },
        onError = () => { },
        onStatusChange = () => { },
        lang = 'zh-CN',
    } = options;

    const recognition = new SpeechRecognition();

    // 配置
    recognition.continuous = true; // 持续识别
    recognition.interimResults = true; // 返回中间结果
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    let isListening = false;
    let shouldRestart = false;

    recognition.onstart = () => {
        isListening = true;
        onStatusChange('listening');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            onResult(finalTranscript.trim(), true);
        } else if (interimTranscript) {
            onResult(interimTranscript.trim(), false);
        }
    };

    recognition.onerror = (event) => {
        // 'no-speech' 不算真正的错误,只是没检测到语音
        if (event.error === 'no-speech') {
            return;
        }
        // 'aborted' 是主动停止
        if (event.error === 'aborted') {
            return;
        }
        console.error('Speech recognition error:', event.error);
        onError(event.error);
        onStatusChange('error');
    };

    recognition.onend = () => {
        isListening = false;
        // 如果应该持续识别，自动重启
        if (shouldRestart) {
            try {
                recognition.start();
            } catch (e) {
                // 忽略重复启动错误
            }
        } else {
            onStatusChange('stopped');
        }
    };

    return {
        start() {
            if (isListening) return;
            shouldRestart = true;
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        },

        stop() {
            shouldRestart = false;
            if (isListening) {
                recognition.stop();
            }
            onStatusChange('stopped');
        },

        isActive() {
            return isListening;
        },

        setLang(newLang) {
            recognition.lang = newLang;
        },
    };
}
