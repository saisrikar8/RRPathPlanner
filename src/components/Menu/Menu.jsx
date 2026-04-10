import "./Menu.css";
import { useMemo, useState, useCallback } from "react";
import PathMenu from "./PathMenu.jsx";
import MotionParamsModal from "../MotionParamsModal/MotionParamsModal.jsx";

function AccordionSection({ id, title, summary, open, onToggle, children }) {
    return (
        <section className={`accordion ${open ? "accordion--open" : ""}`}>
            <button
                type="button"
                className="accordion__head"
                onClick={() => onToggle(id)}
                aria-expanded={open}
            >
                <span className="accordion__chevron" aria-hidden />
                <span className="accordion__title">{title}</span>
                {summary ? <span className="accordion__summary">{summary}</span> : null}
            </button>
            {open ? <div className="accordion__body">{children}</div> : null}
        </section>
    );
}

function Menu({
    displayedPaths,
    setDisplayedPaths,
    currentPosition,
    engine,
    totalTime,
    motionConstraints,
    setMotionConstraints,
}) {
    const [showCode, setShowCode] = useState(false);
    const [motionModalOpen, setMotionModalOpen] = useState(false);
    const [className, setClassName] = useState("AutonomousOpMode");
    const [openSections, setOpenSections] = useState(() => ({
        telemetry: true,
        paths: true,
        export: false,
    }));

    const toggleSection = useCallback((id) => {
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const generatedCode = useMemo(() => {
        if (!engine) return "// Define some paths to see code";
        return engine.generateRoadrunnerCode(className);
    }, [engine, className]);

    const telemetrySummary = useMemo(() => {
        if (!currentPosition) return "";
        return `(${Number(currentPosition[0]).toFixed(1)}, ${Number(currentPosition[1]).toFixed(1)})`;
    }, [currentPosition]);

    const durationLabel = useMemo(() => {
        if (!totalTime || totalTime <= 0) return "—";
        if (totalTime < 60) return `${totalTime.toFixed(2)}s`;
        const m = Math.floor(totalTime / 60);
        const s = (totalTime % 60).toFixed(1);
        return `${m}m ${s}s`;
    }, [totalTime]);

    const motionSummary = useMemo(
        () =>
            `${motionConstraints.maxVel} in/s · μ${motionConstraints.frictionCoefficient}`,
        [motionConstraints.maxVel, motionConstraints.frictionCoefficient]
    );

    return (
        <div className="sidebar">
            <div className="sidebar__header">
                <div className="sidebar__header-top">
                    <div className="sidebar__header-text">
                        <h2 className="sidebar__title">Planner</h2>
                        <p className="sidebar__subtitle">Paths, telemetry, and export</p>
                    </div>
                    <button
                        type="button"
                        className="sidebar__motion-btn"
                        onClick={() => setMotionModalOpen(true)}
                        title="Open motion parameters"
                    >
                        Motion
                    </button>
                </div>
                <button
                    type="button"
                    className="sidebar__motion-chip"
                    onClick={() => setMotionModalOpen(true)}
                >
                    <span className="sidebar__motion-chip-label">Profile</span>
                    <span className="sidebar__motion-chip-value">{motionSummary}</span>
                </button>
            </div>

            <MotionParamsModal
                open={motionModalOpen}
                onClose={() => setMotionModalOpen(false)}
                motionConstraints={motionConstraints}
                setMotionConstraints={setMotionConstraints}
            />

            <div className="sidebar__scroll">
                <AccordionSection
                    id="telemetry"
                    title="Telemetry"
                    summary={telemetrySummary}
                    open={openSections.telemetry}
                    onToggle={toggleSection}
                >
                    <div className="pose-grid">
                        <span className="pose-label">X</span>
                        <span className="pose-value">{currentPosition && currentPosition[0]?.toFixed(2)} in</span>
                        <span className="pose-label">Y</span>
                        <span className="pose-value">{currentPosition && currentPosition[1]?.toFixed(2)} in</span>
                        <span className="pose-label">Heading</span>
                        <span className="pose-value">{currentPosition && currentPosition[2]?.toFixed(2)}°</span>
                        <span className="pose-label">Est. duration</span>
                        <span className="pose-value">{durationLabel}</span>
                    </div>
                </AccordionSection>

                <AccordionSection
                    id="paths"
                    title="Paths"
                    summary={`${displayedPaths.length} segment(s)`}
                    open={openSections.paths}
                    onToggle={toggleSection}
                >
                    <PathMenu paths={displayedPaths} setPaths={setDisplayedPaths} />
                </AccordionSection>

                <AccordionSection
                    id="export"
                    title="Export"
                    summary="Road Runner"
                    open={openSections.export}
                    onToggle={toggleSection}
                >
                    <div className="code-class-row">
                        <label className="code-class-label" htmlFor="rr-class-name">
                            Class name
                        </label>
                        <input
                            id="rr-class-name"
                            type="text"
                            value={className}
                            onChange={(e) =>
                                setClassName(e.target.value.replace(/\s/g, "") || "AutonomousOpMode")
                            }
                            className="code-class-input"
                        />
                    </div>
                    <button
                        type="button"
                        className="path-menu-btn menu-btn-full"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? "Hide Java" : "Show generated Java"}
                    </button>
                    {showCode ? (
                        <>
                            <button
                                type="button"
                                className="path-menu-btn menu-btn-full menu-btn-secondary"
                                onClick={() => navigator.clipboard.writeText(generatedCode)}
                            >
                                Copy to clipboard
                            </button>
                            <pre className="generated-code-block">{generatedCode}</pre>
                        </>
                    ) : null}
                </AccordionSection>
            </div>
        </div>
    );
}

export default Menu;
