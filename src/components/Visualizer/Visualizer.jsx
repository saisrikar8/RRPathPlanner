import "./Visualizer.css";
import { Layer, Stage, Line, Rect, Group, Circle, Arrow } from "react-konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { MotionEngine } from "../MotionEngine.js";
import fieldImg from '../../assets/field-2025-juice-dark.png';

function Visualizer({ displayedPaths, setDisplayedPaths, isPlaying, currentPosition }) {
    const measureRef = useRef(null);
    const [stageSize, setStageSize] = useState(400);


    useEffect(() => {
        const el = measureRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;

        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect;
            const s = Math.floor(Math.min(cr.width, cr.height));
            setStageSize(Math.max(160, s));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const engine = useMemo(() => {
        if (!displayedPaths || displayedPaths.length === 0) return null;
        return new MotionEngine(displayedPaths);
    }, [displayedPaths]);

    const sampledPaths = useMemo(() => {
        if (!engine) return [];
        return displayedPaths.map((_, i) => engine.samplePath(i, 200));
    }, [engine, displayedPaths]);

    const scale = stageSize / 144;
    const center = stageSize / 2;

    const toKonva = (x, y) => {
        return {
            x: center + x * scale,
            y: center - y * scale
        };
    };

    const toRoadRunner = (kx, ky) => {
        return {
            x: (kx - center) / scale,
            y: (center - ky) / scale
        };
    };

    const handlePointDrag = (pathIdx, type, pointIdx, e) => {
        const { x, y } = toRoadRunner(e.target.x(), e.target.y());
        setDisplayedPaths(prev => {
            const newPaths = [...prev];
            const path = { ...newPaths[pathIdx] };

            if (type === "start") {
                path.startPoint = [x, y, path.startPoint[2]];
                if (pathIdx > 0) {
                    newPaths[pathIdx - 1] = { ...newPaths[pathIdx - 1], endPoint: [x, y, newPaths[pathIdx - 1].endPoint[2]] };
                }
            } else if (type === "end") {
                path.endPoint = [x, y, path.endPoint[2]];
                if (pathIdx < newPaths.length - 1) {
                    newPaths[pathIdx + 1] = { ...newPaths[pathIdx + 1], startPoint: [x, y, newPaths[pathIdx + 1].startPoint[2]] };
                }
            } else if (type === "waypoint") {
                const newWaypoints = [...path.waypoints];
                newWaypoints[pointIdx] = [x, y, newWaypoints[pointIdx][2]];
                path.waypoints = newWaypoints;
            }

            newPaths[pathIdx] = path;
            return newPaths;
        });
    };

    const handleTangentDrag = (pathIdx, type, pointIdx, e) => {
        const { x, y } = toRoadRunner(e.target.x(), e.target.y());
        e.target.x(0);
        e.target.y(0);

        setDisplayedPaths(prev => {
            const newPaths = [...prev];
            const path = { ...newPaths[pathIdx] };

            let origin;
            if (type === "start") {
                origin = { x: path.startPoint[0], y: path.startPoint[1] };
            } else if (type === "end") {
                origin = { x: path.endPoint[0], y: path.endPoint[1] };
            } else {
                origin = { x: path.waypoints[pointIdx][0], y: path.waypoints[pointIdx][1] };
            }

            const angleDeg = Math.atan2(y - origin.y, x - origin.x) * 180 / Math.PI;

            if (type === "start") {
                path.startPoint = [path.startPoint[0], path.startPoint[1], angleDeg];
            } else if (type === "end") {
                path.endPoint = [path.endPoint[0], path.endPoint[1], angleDeg];
            } else {
                const newWaypoints = [...path.waypoints];
                newWaypoints[pointIdx] = [newWaypoints[pointIdx][0], newWaypoints[pointIdx][1], angleDeg];
                path.waypoints = newWaypoints;
            }

            newPaths[pathIdx] = path;
            return newPaths;
        });
    };
    const renderTangentHandle = (pathIdx, type, pointIdx, point, angleDeg) => {
        const pt = toKonva(point[0], point[1]);
        const angleRad = (angleDeg || 0) * Math.PI / 180;
        const handleLen = 50; // increased for better control
        const handlePt = {
            x: pt.x + Math.cos(angleRad) * handleLen,
            y: pt.y - Math.sin(angleRad) * handleLen
        };

        return (
            <Group key={`tangent-${type}-${pathIdx}-${pointIdx}`}>
                <Line
                    points={[pt.x, pt.y, handlePt.x, handlePt.y]}
                    stroke="rgba(53, 212, 190, 0.45)"
                    strokeWidth={1.5}
                />
                <Circle
                    x={handlePt.x}
                    y={handlePt.y}
                    radius={5}
                    fill="#35d4be"
                    opacity={0.95}
                    draggable
                    onDragMove={(e) => {
                        handleTangentDrag(pathIdx, type, pointIdx, e);
                    }}
                    onMouseEnter={e => {
                        const stage = e.target.getStage();
                        stage.container().style.cursor = 'crosshair';
                    }}
                    onMouseLeave={e => {
                        const stage = e.target.getStage();
                        stage.container().style.cursor = 'default';
                    }}
                />
                {/* Visual indicator for angle while dragging could be added here if needed */}
            </Group>
        );
    };

    return (
        <div className="Visualizer">
            <div className="Visualizer__measure" ref={measureRef}>
                <div
                    className="Visualizer__field-square"
                    style={{ width: stageSize, height: stageSize, backgroundImage: `url(${fieldImg})` }}
                >
                    <Stage width={stageSize} height={stageSize}>
                        <Layer>
                            {/* Draw Paths */}
                            {sampledPaths.map((path, i) => {
                        const points = path.flatMap(p => {
                            const {x, y} = toKonva(p.x, p.y);
                            return [x, y];
                        });
                                return (
                                    <Line
                                        key={i}
                                        points={points}
                                        stroke="rgba(233, 237, 244, 0.55)"
                                        strokeWidth={2.5}
                                        lineJoin="round"
                                        lineCap="round"
                                        shadowColor="rgba(0,0,0,0.35)"
                                        shadowBlur={6}
                                        shadowOffset={{ x: 0, y: 1 }}
                                    />
                                );
                            })}

                            {/* Draw Waypoints, Start and End points */}
                            {displayedPaths.map((path, i) => {
                        const start = toKonva(path.startPoint[0], path.startPoint[1]);
                        const end = toKonva(path.endPoint[0], path.endPoint[1]);
                                return (
                                    <Group key={i}>
                                        {/* Tangent Handles */}
                                        {renderTangentHandle(i, "start", 0, path.startPoint, path.startPoint[2])}
                                        {renderTangentHandle(i, "end", 0, path.endPoint, path.endPoint[2])}
                                        {path.waypoints.map((w, j) => renderTangentHandle(i, "waypoint", j, w, w[2]))}

                                        {/* Points */}
                                        <Circle
                                            x={start.x}
                                            y={start.y}
                                            radius={6}
                                    fill="#35d4be"
                                    stroke="#0a0c10"
                                            strokeWidth={1.5}
                                            draggable
                                            onDragMove={(e) => handlePointDrag(i, "start", 0, e)}
                                            onMouseEnter={e => e.target.getStage().container().style.cursor = 'move'}
                                            onMouseLeave={e => e.target.getStage().container().style.cursor = 'default'}
                                        />
                                        <Circle
                                            x={end.x}
                                            y={end.y}
                                            radius={6}
                                    fill="#ffb020"
                                    stroke="#0a0c10"
                                            strokeWidth={1.5}
                                            draggable
                                            onDragMove={(e) => handlePointDrag(i, "end", 0, e)}
                                            onMouseEnter={e => e.target.getStage().container().style.cursor = 'move'}
                                            onMouseLeave={e => e.target.getStage().container().style.cursor = 'default'}
                                        />
                                        {path.waypoints.map((w, j) => {
                                            const pt = toKonva(w[0], w[1]);
                                            return (
                                                <Circle
                                                    key={`waypoint-${i}-${j}`}
                                                    x={pt.x}
                                                    y={pt.y}
                                                    radius={5}
                                            fill="#e9edf4"
                                            stroke="#242b38"
                                                    strokeWidth={1}
                                                    opacity={0.95}
                                                    draggable
                                                    onDragMove={(e) => handlePointDrag(i, "waypoint", j, e)}
                                                    onMouseEnter={e => e.target.getStage().container().style.cursor = 'move'}
                                                    onMouseLeave={e => e.target.getStage().container().style.cursor = 'default'}
                                                />
                                            );
                                        })}
                                    </Group>
                                );
                            })}

                            {/* Draw Robot */}
                            {currentPosition && (
                                <Group
                                    x={center + currentPosition[0] * scale}
                                    y={center - currentPosition[1] * scale}
                                    rotation={-currentPosition[2]}
                                    listening={false}
                                >
                                    <Rect
                                        x={-9 * scale}
                                        y={-9 * scale}
                                        width={18 * scale}
                                        height={18 * scale}
                                        fillLinearGradientStartPoint={{ x: -9 * scale, y: -9 * scale }}
                                        fillLinearGradientEndPoint={{ x: 9 * scale, y: 9 * scale }}
                                fillLinearGradientColorStops={[
                                    0,
                                    "rgba(255, 176, 32, 0.92)",
                                    1,
                                    "rgba(53, 212, 190, 0.5)",
                                ]}
                                stroke="#e9edf4"
                                        strokeWidth={2}
                                        cornerRadius={4}
                                        shadowColor="rgba(0,0,0,0.45)"
                                        shadowBlur={12}
                                        shadowOffset={{ x: 0, y: 4 }}
                                        opacity={0.98}
                                    />
                                    <Arrow
                                        points={[0, 0, 10 * scale, 0]}
                                        pointerLength={6}
                                        pointerWidth={6}
                                fill="#0a0c10"
                                stroke="#0a0c10"
                                        strokeWidth={2}
                                    />
                                </Group>
                            )}
                        </Layer>
                    </Stage>
                </div>
            </div>
        </div>
    );
}

export default Visualizer