// ==========================================
// ملف إدارة شاشات البداية والنهاية
// ==========================================

let playerColor = 'w';
let gameStarted = false;

const pawnColors = [
    'rgba(200, 200, 200, 0.6)',
    'rgba(255, 255, 255, 0.4)',
    'rgba(0, 0, 0, 0.6)',
    'rgba(255, 255, 255, 0.8)'
];

const pawnSVG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="COLOR" stroke="STROKE" stroke-width="1.5"/></svg>';

function changePawnColor() {
    const randomColor = pawnColors[Math.floor(Math.random() * pawnColors.length)];
    const strokeColor = randomColor.includes('0, 0, 0') ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
    const svg = pawnSVG.replace(/COLOR/g, randomColor).replace(/STROKE/g, strokeColor);
    $('#start-pawn').css('background-image', `url('${svg}')`);
}

setInterval(changePawnColor, 3000);
changePawnColor();

$('#start-screen').on('click', function() {
    if (!gameStarted) {
        $(this).fadeOut(300, function() {
            $('#color-selection').fadeIn(300);
        });
    }
});

$('#white-option').on('click', function() { startGame('w'); });
$('#black-option').on('click', function() { startGame('b'); });

function startGame(color) {
    playerColor = color;
    gameStarted = true;
    
    if (typeof resetAyanokojiFirstMove === 'function') resetAyanokojiFirstMove();
    if (typeof resetAyanokojiVoice === 'function') resetAyanokojiVoice();
    
    $('#color-selection').fadeOut(300, function() {
        $('#board-container').css('display', 'block').hide().fadeIn(300);
        $('#ayanokoji-profile').css('display', 'flex').hide().fadeIn(300);
        
        setTimeout(function() {
            if (typeof board !== 'undefined') board.resize();
        }, 350);

        if (typeof game !== 'undefined' && typeof board !== 'undefined') {
            game.reset();
            board.orientation(color === 'w' ? 'white' : 'black');
            board.start();
            if (typeof removeMoveIndicators === 'function') removeMoveIndicators();
        }
        
        if (playerColor === 'b') {
            setTimeout(function() {
                if (typeof game !== 'undefined' && !game.game_over()) {
                    makeAyanokojiMove();
                }
            }, 1500);
        }
    });
}

function showEndScreen(result) {
    const $endScreen = $('#end-screen');
    const $endTitle = $('#end-title');
    const $endQuote = $('#end-quote');
    
    $endScreen.removeClass('win draw loss');
    
    const quotes = {
        win: {
            title: 'لقد تركك أيانوكوجي تفوز هذه المرة',
            quote: 'كل الناس محض أدوات، لا تهم الطريقة، لا يهم من يجب التضحية به، في هذا العالم الفوز هو كل شيء، طالما أفوز في النهاية'
        },
        draw: {
            title: 'لقد تعادلت مع أيانوكوجي في هذا الدور',
            quote: 'هل البشر متساوون؟ قال رجل عظيم ذات مرة: "السماء لا تضع شخصاً فوق آخر أو أسفل الآخر"'
        },
        loss: {
            title: 'لقد خسرت',
            quote: 'لا تيأس إذا رجعت خطوة للوراء، فلا تنس أن السهم يحتاج أن ترجعه للوراء لينطلق بقوة إلى الأمام'
        }
    };
    
    const data = quotes[result];
    $endTitle.text(data.title);
    $endQuote.text(data.quote);
    $endScreen.addClass(result);
    $endScreen.fadeIn(400);
}

$('#end-screen').on('click', function() {
    $(this).fadeOut(300, function() {
        $('#start-screen').fadeIn(300);
        $('#board-container').hide();
        $('#ayanokoji-profile').hide();
        gameStarted = false;
        
        if (typeof game !== 'undefined' && typeof board !== 'undefined') {
            game.reset();
            board.start();
            if (typeof removeMoveIndicators === 'function') removeMoveIndicators();
        }
    });
});
