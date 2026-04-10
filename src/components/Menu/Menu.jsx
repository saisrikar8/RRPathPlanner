import "./Menu.css";
import { useMemo, useState, useCallback } from "react";
import PathMenu from "./PathMenu.jsx";

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
    totalTime,
    motionConstraints,
}) {
    const [openSections, setOpenSections] = useState(() => ({
        telemetry: true,
        paths: true,
    }));

    const toggleSection = useCallback((id) => {
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

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
                <div className="sidebar__header-text">
                    <h2 className="sidebar__title">Telemetry</h2>
                    <p className="sidebar__subtitle">Current Pose & Stats</p>
                </div>
                <div className="sidebar__profile-chip">
                    <span className="sidebar__profile-label">Motion Profile</span>
                    <span className="sidebar__profile-value">{motionSummary}</span>
                </div>
            </div>

            <div className="sidebar__scroll">
                <AccordionSection
                    id="telemetry"
                    title="Live Pose"
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
                    title="Path Segments"
                    summary={`${displayedPaths.length} path(s)`}
                    open={openSections.paths}
                    onToggle={toggleSection}
                >
                    <PathMenu paths={displayedPaths} setPaths={setDisplayedPaths} />
                </AccordionSection>
            </div>
        </div>
    );
}

export default Menu;
