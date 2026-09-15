// ==========================================
// نظام إدارة الأصوات (bg-music.mp3)
// ==========================================

const bgMusic = document.getElementById('bg-music');
const ayanokojiVoice = document.getElementById('ayanokoji-voice');
const voiceIndicator = document.getElementById('voice-indicator');

// ✅ ضبط مستويات الصوت
if (bgMusic) bgMusic.volume = 0.05;           // 20% لموسيقى الخلفية (MP3)
if (ayanokojiVoice) ayanokojiVoice.volume = 0.35; // 35% لصوت أيانوكوجي

// ==========================================
// تشغيل موسيقى الخلفية (MP3)
// ==========================================
function startBgMusic() {
    if (!bgMusic) return;
    
    bgMusic.play().then(() => {
        console.log('🎵 تم تشغيل bg-music.mp3 (20%)');
    }).catch(err => {
        console.log('⏳ في انتظار النقر:', err);
    });
}

// ==========================================
// ♟️ صوت حركة القطعة (20%)
// ==========================================
let audioContext = null;

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {}
    }
}

function playMoveSound() {
    initAudioContext();
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.08);
}

// ==========================================
// ️ صوت أيانوكوجي مع المؤشر البصري
// ==========================================
function playAyanokojiVoice() {
    if (ayanokojiVoice) {
        ayanokojiVoice.currentTime = 0;
        
        if (voiceIndicator) voiceIndicator.classList.add('active');
        
        ayanokojiVoice.play().catch(err => {
            console.log('تعذر تشغيل صوت أيانوكوجي:', err);
            if (voiceIndicator) voiceIndicator.classList.remove('active');
        });
        
        ayanokojiVoice.onended = function() {
            if (voiceIndicator) voiceIndicator.classList.remove('active');
        };
    }
}

function resetAyanokojiVoice() {
    if (ayanokojiVoice) {
        ayanokojiVoice.pause();
        ayanokojiVoice.currentTime = 0;
    }
    if (voiceIndicator) voiceIndicator.classList.remove('active');
}

// تشغيل الموسيقى عند أول نقرة
document.addEventListener('click', function() {
    initAudioContext();
    startBgMusic();
}, { once: true });

document.addEventListener('touchstart', function() {
    initAudioContext();
    startBgMusic();
}, { once: true });

// تصدير الدوال
window.playMoveSound = playMoveSound;
window.playAyanokojiVoice = playAyanokojiVoice;
window.resetAyanokojiVoice = resetAyanokojiVoice;
