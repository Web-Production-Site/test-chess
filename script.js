document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('bg-video');
    const source = document.getElementById('video-source');
    
    if (!video || !source) return;
    
    const videos = ['1.mp4', '2.mp4'];
    source.src = videos[Math.floor(Math.random() * videos.length)];
    video.load();
    
    const tryPlay = () => {
        video.play().catch(() => {
            const unlock = () => {
                video.play();
                document.removeEventListener('click', unlock);
                document.removeEventListener('touchstart', unlock);
            };
            document.addEventListener('click', unlock);
            document.addEventListener('touchstart', unlock);
        });
    };
    
    tryPlay();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            video.pause();
        } else {
            video.play().catch(() => {});
        }
    });
});
