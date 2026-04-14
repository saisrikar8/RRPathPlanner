import './App.css'
import Header from "./components/Header/Header.jsx"
import Visualizer from "./components/Visualizer/Visualizer.jsx";
import Menu from "./components/Menu/Menu.jsx";
import PlaybackBar from "./components/PlaybackBar/PlaybackBar.jsx";
import {useState, useMemo, useEffect, useRef} from "react";
import {MotionEngine, buildDriveTimeProfile} from "./components/MotionEngine.js";
import MotionParamsModal from "./components/MotionParamsModal/MotionParamsModal.jsx";
import ExportModal from "./components/ExportModal/ExportModal.jsx";
import ImportModal from "./components/ImportModal/ImportModal.jsx";
import { Analytics } from "@vercel/analytics/next"

const DEFAULT_MOTION = {
    maxVel: 50,
    maxAccel: 40,
    maxDecel: 40,
    maxAngVel: 180,
    maxAngAccel: 360,
    frictionCoefficient: 0.9,
    rollingResistance: 0,
};

function App() {
    const [displayedPaths, setDisplayedPaths] = useState([]);
    const [currentPosition, setCurrentPosition] = useState([0,0,0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0–1000 → normalized time along profile
    const [motionConstraints, setMotionConstraints] = useState(DEFAULT_MOTION);
    const [motionModalOpen, setMotionModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    const engine = useMemo(() => {
        if (!displayedPaths || displayedPaths.length === 0) return null;
        try {
            return new MotionEngine(displayedPaths);
        } catch (e) {
            console.error("Failed to compile paths", e);
            return null;
        }
    }, [displayedPaths]);

    const driveProfile = useMemo(() => {
        if (!engine) return null;
        return buildDriveTimeProfile(engine, motionConstraints);
    }, [engine, motionConstraints]);

    const totalTime = driveProfile?.totalTime ?? 0;

    const requestRef = useRef();
    const lastTimeRef = useRef();

    useEffect(() => {
        const animate = (time) => {
            if (lastTimeRef.current !== undefined) {
                const dt = (time - lastTimeRef.current) / 1000;
                if (totalTime > 1e-6) {
                    setProgress(prev => {
                        const prevT = (prev / 1000) * totalTime;
                        let nextT = prevT + dt;
                        if (nextT > totalTime) nextT = 0;
                        return (nextT / totalTime) * 1000;
                    });
                }
            }
            lastTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(requestRef.current);
            lastTimeRef.current = undefined;
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, totalTime]);

    useEffect(() => {
        if (driveProfile && totalTime > 1e-6) {
            const t = (progress / 1000) * totalTime;
            setCurrentPosition(driveProfile.getPoseAtTime(t));
            return;
        }

        if (displayedPaths.length > 0 && displayedPaths[0].startPoint) {
            const sp = displayedPaths[0].startPoint;
            setCurrentPosition([sp[0], sp[1], sp[2] || 0]);
        }
    }, [progress, driveProfile, totalTime, displayedPaths]);

    const currentTimeSec =
        driveProfile && totalTime > 0 ? (progress / 1000) * totalTime : 0;

    return (
        <div className="app-root">
            <Analytics></Analytics>
            <Header 
                onOpenMotion={() => setMotionModalOpen(true)}
                onOpenExport={() => setExportModalOpen(true)}
                onOpenImport={() => setImportModalOpen(true)}
            />
            <div className="app-body">
                <aside className="sidebar-column">
                    <Menu
                        displayedPaths={displayedPaths}
                        setDisplayedPaths={setDisplayedPaths}
                        currentPosition={currentPosition}
                        totalTime={totalTime}
                        motionConstraints={motionConstraints}
                    />
                </aside>
                <main className="field-column">
                    <div className="field-panel">
                        <Visualizer
                            isPlaying={isPlaying}
                            displayedPaths={displayedPaths}
                            setDisplayedPaths={setDisplayedPaths}
                            currentPosition={currentPosition}
                        />
                        <PlaybackBar
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            progress={progress}
                            setProgress={setProgress}
                            currentTimeSec={currentTimeSec}
                            totalDurationSec={totalTime}
                        />
                    </div>
                </main>
            </div>

            <MotionParamsModal
                open={motionModalOpen}
                onClose={() => setMotionModalOpen(false)}
                motionConstraints={motionConstraints}
                setMotionConstraints={setMotionConstraints}
            />

            <ExportModal
                open={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                engine={engine}
            />

            <ImportModal
                open={importModalOpen}
                onClose={()=>setImportModalOpen(false)}
                setDisplayedPaths={setDisplayedPaths}
            />
        </div>
    )
}

export default App
