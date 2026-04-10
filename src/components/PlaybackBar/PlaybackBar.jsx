import { motion } from "framer-motion";
import "./PlaybackBar.css";

const pausePath = `M35 20 L35 20 L35 80 L35 80 M65 20 L65 20 L65 80 L65 80`;
const playPath = `M28 15 L82 50 L28 85 L28 15 M28 15 L82 50 L28 85 L28 15`;

function PlaybackBar({ isPlaying, setIsPlaying, progress, setProgress, currentTimeSec, totalDurationSec }) {
    const formatTime = (s) => {
        if (!Number.isFinite(s) || s < 0) s = 0;
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        const millis = Math.floor((s % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, "0")}.${millis}`;
    };

    return (
        <div className="playback-bar" role="toolbar" aria-label="Playback">
            <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="playback-bar__play"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                <svg className="playback-bar__play-icon" viewBox="0 0 100 100" width="22" height="22" aria-hidden>
                    <motion.path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ d: isPlaying ? pausePath : playPath }}
                        transition={{ duration: 0.42, ease: [0.37, 0, 0.63, 1] }}
                    />
                </svg>
            </button>
            <button
                type="button"
                className="playback-bar__restart"
                onClick={() => {
                    setProgress(0);
                    setIsPlaying(false);
                }}
                aria-label="Restart playback"
            >
                <img src="restart.png" className="playback-bar__restart-img" alt="" width={22} height={22} />
            </button>
            <input
                type="range"
                min={0}
                max={1000}
                value={progress}
                onChange={(e) => setProgress(parseFloat(e.target.value))}
                className="playback-bar__scrubber"
                aria-label="Playback position"
            />
            <div className="playback-bar__time">
                {formatTime(currentTimeSec)} / {formatTime(totalDurationSec)}
            </div>
        </div>
    );
}

export default PlaybackBar;
