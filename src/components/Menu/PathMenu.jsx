import "./PathMenu.css";
import { Fragment } from "react";
function PathMenu({paths, setPaths}){
    const generateRandCoord = () =>{
        return Math.random()*145 - 72;
    }
    const setPathStartPoint = (pathId, startPoint) => {
        setPaths(prev => prev.map(p => p.id === pathId ? { ...p, startPoint } : p));
    }
    const setPathEndPoint = (pathId, endPoint) => {
        setPaths(prev => prev.map(p => p.id === pathId ? { ...p, endPoint } : p));
    }
    const setPathStartHeading = (pathId, heading) => {
        setPaths(prev => prev.map(p => p.id === pathId ? { ...p, startHeading: heading } : p));
    }
    const setPathEndHeading = (pathId, heading) => {
        setPaths(prev => prev.map(p => p.id === pathId ? { ...p, endHeading: heading } : p));
    }
    const setPathInterpolation = (pathId, pathInterpolation) => {
        setPaths(prev => prev.map(p => {
            if (p.id !== pathId) return p;
            let newP = { ...p, headingInterpolation: pathInterpolation };
            if (pathInterpolation === "tangent") {
                newP.startHeading = null;
                newP.endHeading = null;
            } else if (pathInterpolation === "constant") {
                newP.startHeading = 0;
                newP.endHeading = null;
            } else if (pathInterpolation === "linear") {
                newP.startHeading = 0;
                newP.endHeading = 0;
            }
            return newP;
        }));
    }
    const addWaypoint = (pathId) => {
        setPaths(prev => prev.map(p => {
            if (p.id !== pathId) return p;
            const lastPoint = p.waypoints.length > 0 ? p.waypoints[p.waypoints.length - 1] : p.startPoint;
            const newWaypoint = [
                (lastPoint[0] + p.endPoint[0]) / 2,
                (lastPoint[1] + p.endPoint[1]) / 2,
                0
            ];
            return { ...p, waypoints: [...p.waypoints, newWaypoint] };
        }));
    }
    const removeWaypoint = (pathId, waypointIdx) => {
        setPaths(prev => prev.map(p => {
            if (p.id !== pathId) return p;
            return {
                ...p,
                waypoints: p.waypoints.filter((_, idx) => idx !== waypointIdx)
            };
        }));
    }
    const updateWaypoint = (pathId, waypointIdx, waypoint) => {
        setPaths(prev => prev.map(p => p.id === pathId ? {
            ...p,
            waypoints: p.waypoints.map((w, idx) => idx === waypointIdx ? waypoint : w)
        } : p));
    }
    const removePath = (pathId) => {
        setPaths(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(path => path.id !== pathId);
        });
    }
    const addPath = () => {
        setPaths(prev => {
            const lastPath = prev.length !== 0 ? prev[prev.length - 1] : null;
            const startPoint = lastPath ? lastPath.endPoint : [0, 0, 0];
            const clamp = (v) => Math.max(-72, Math.min(72, v));
            const clampedEnd = [clamp(startPoint[0] + 20), clamp(startPoint[1] + 20), 0];
            return [...prev, {
                id: Date.now(),
                startPoint,
                endPoint: clampedEnd,
                headingInterpolation: "tangent",
                startHeading: null,
                endHeading: null,
                waypoints: []
            }];
        });
    }
    return (
        <div className="path-menu-root">
            {paths.map((path, idx) => {
                return (
                    <Fragment key={path.id}>
                        <div className="path-menu-path-header">
                            <h3 className="path-menu-path-title">Path {idx + 1}</h3>
                            <button 
                                type="button" 
                                className="path-menu-item-remove" 
                                onClick={() => removePath(path.id)}
                                title="Remove this path"
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <hr className="path-menu-divider" />
                        <div className = "start-point">
                            <h3 style = {{textAlign: "left"}}>Start Point</h3>
                            <span>X: </span><input type = "number" max = "72" min = "-72" step = "0.01" className = "textInput"
                                                   value={path["startPoint"][0].toFixed(2)} onChange={e => setPathStartPoint(path['id'], [parseFloat(e.target.value) || 0, path["startPoint"][1], path["startPoint"][2]])}/>
                            <span>Y: </span><input type = "number" max = "72" min = "-72" step = "0.01" className = "textInput"
                                                   value={path["startPoint"][1].toFixed(2)} onChange={e => setPathStartPoint(path['id'], [path["startPoint"][0], parseFloat(e.target.value) || 0, path["startPoint"][2]])}/>
                            <span>Tangent: </span><input type = "number" max = "360" min = "-360" step = "1" className = "textInput"
                                                         value={Math.round(path["startPoint"][2])} onChange={e => setPathStartPoint(path['id'], [path["startPoint"][0], path["startPoint"][1], parseFloat(e.target.value) || 0])}/>
                            {path.headingInterpolation !== "tangent" && (<><span>Heading: </span><input type = "number" max = "360" min = "-360" step = "1" className = "textInput"
                                                                                                        value={Math.round(path["startHeading"])} onChange={e => setPathStartHeading(path['id'], parseFloat(e.target.value) || 0)}/></>)}
                            <span>Interpolation: </span><select className = "textInput"
                                                                value={path["headingInterpolation"]} onChange={e => setPathInterpolation(path['id'], e.target.value)}>
                                <option value = "tangent">Tangent</option>
                                <option value = "constant">Constant</option>
                                <option value = "linear">Linear</option>
                            </select>
                        </div>
                        <WayPoints addWaypoint={addWaypoint} removeWaypoint={removeWaypoint} updateWaypoint={updateWaypoint} pathId={path['id']} waypoints={path.waypoints}></WayPoints>
                        <div className = "end-point">
                            <h3 style = {{textAlign: "left"}}>End Point</h3>
                            <span>X: </span><input type = "number" max = "72" min = "-72" step = "0.01" className = "textInput"
                                                   value={path["endPoint"][0].toFixed(2)} onChange={e => setPathEndPoint(path['id'], [parseFloat(e.target.value) || 0, path["endPoint"][1], path["endPoint"][2]])}/>
                            <span>Y: </span><input type = "number" max = "72" min = "-72" step = "0.01" className = "textInput"
                                                   value={path["endPoint"][1].toFixed(2)} onChange={e => setPathEndPoint(path['id'], [path["endPoint"][0], parseFloat(e.target.value) || 0, path["endPoint"][2]])}/>
                            <span>Tangent: </span><input type = "number" max = "360" min = "-360" step = "1" className = "textInput"
                                                         value={Math.round(path["endPoint"][2])} onChange={e => setPathEndPoint(path['id'], [path["endPoint"][0], path["endPoint"][1], parseFloat(e.target.value) || 0])}/>
                            {path.headingInterpolation === "linear" && (<><span>Heading: </span><input type = "number" max = "360" min = "-360" step = "1" className = "textInput"
                                                                                                        value={Math.round(path["endHeading"])} onChange={e => setPathEndHeading(path['id'], parseFloat(e.target.value) || 0)}/></>)}

                        </div>
                    </Fragment>
                );
            })}
            <div className="path-menu-btns">
                <button type="button" className="path-pill path-pill--add" onClick={addPath}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add path
                </button>
            </div>
        </div>
    )
}

function WayPoints({ waypoints, addWaypoint, removeWaypoint, updateWaypoint, pathId }) {
    return (
        <div className="path-waypoints">
            {
                waypoints.map((waypoint, index)=>{
                    return (
                        <div key={index} className="waypoint-item">
                            <div className="waypoint-header">
                                <h4>Waypoint {index + 1}</h4>
                                <button 
                                    type="button" 
                                    className="path-menu-item-remove" 
                                    onClick={() => removeWaypoint(pathId, index)}
                                    title="Remove this waypoint"
                                >
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <div className="waypoint-fields">
                                <span>X: </span><input onChange = {e => updateWaypoint(pathId, index, [parseFloat(e.target.value) || 0, waypoint[1], waypoint[2]])} type = "number" max = "72" min = "-72" step = "0.01" className = "textInput" value={waypoint[0].toFixed(2)}/>
                                <span>Y: </span><input onChange = {e => updateWaypoint(pathId, index, [waypoint[0], parseFloat(e.target.value) || 0, waypoint[2]])} type = "number" max = "72" min = "-72" step = "0.01" className = "textInput" value={waypoint[1].toFixed(2)}/>
                                <span>Tangent: </span><input onChange = {e => updateWaypoint(pathId, index, [waypoint[0], waypoint[1], parseFloat(e.target.value) || 0])} type = "number" max = "360" min = "-360" step = "1" className = "textInput" value={Math.round(waypoint[2])}/>
                            </div>
                        </div>
                    )
                })
            }
            <div className="path-menu-btns">
                <button type="button" className="path-pill path-pill--add" onClick={() => addWaypoint(pathId)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add waypoint
                </button>
            </div>
        </div>
    )
}

export default PathMenu;
