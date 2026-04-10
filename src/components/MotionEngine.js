
const ARC_SAMPLES = 200;

function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }
function fmt(n)     { return parseFloat(n.toFixed(4)); }

function wrapAngle(angle) {
    let a = angle % (2 * Math.PI);
    if (a > Math.PI)   a -= 2 * Math.PI;
    if (a <= -Math.PI) a += 2 * Math.PI;
    return a;
}

function lerpAngle(a, b, t) {
    const delta = wrapAngle(b - a);
    return a + delta * t;
}

function dist2D(A, B) {
    const dx = B[0] - A[0], dy = B[1] - A[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function evalCubic(P0, P1, P2, P3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt, t2 = t * t;
    return [
        mt2 * mt * P0[0] + 3 * mt2 * t * P1[0] + 3 * mt * t2 * P2[0] + t2 * t * P3[0],
        mt2 * mt * P0[1] + 3 * mt2 * t * P1[1] + 3 * mt * t2 * P2[1] + t2 * t * P3[1],
    ];
}

function evalCubicDerivative(P0, P1, P2, P3, t) {
    const mt = 1 - t;
    return [
        3 * mt * mt * (P1[0] - P0[0]) + 6 * mt * t * (P2[0] - P1[0]) + 3 * t * t * (P3[0] - P2[0]),
        3 * mt * mt * (P1[1] - P0[1]) + 6 * mt * t * (P2[1] - P1[1]) + 3 * t * t * (P3[1] - P2[1]),
    ];
}

function thomasSolve(lower, main, upper, rhs) {
    const n = main.length;
    const b = [...main];
    const d = [...rhs];

    // Forward sweep — zero out lower diagonal
    for (let i = 1; i < n; i++) {
        if (Math.abs(b[i - 1]) < 1e-12) continue;
        const m = lower[i] / b[i - 1];
        b[i] -= m * upper[i - 1];
        d[i] -= m * d[i - 1];
    }

    const x = new Array(n).fill(0);
    x[n - 1] = d[n - 1] / b[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        x[i] = (d[i] - upper[i] * x[i + 1]) / b[i];
    }

    return x;
}

function _solveSimpleSpline(knots, startTangent = null, endTangent = null) {
    const n = knots.length - 1; // number of segments

    if (n === 0) return { P: [], Q: [] };

    // --- Single segment: closed-form ---
    if (n === 1) {
        const K0 = knots[0], K1 = knots[1];
        const scale = dist2D(K0, K1) / 3;

        const P = startTangent
            ? [K0[0] + startTangent[0] * scale, K0[1] + startTangent[1] * scale]
            : [(2 * K0[0] + K1[0]) / 3,         (2 * K0[1] + K1[1]) / 3];

        const Q = endTangent
            ? [K1[0] - endTangent[0] * scale, K1[1] - endTangent[1] * scale]
            : [(K0[0] + 2 * K1[0]) / 3,       (K0[1] + 2 * K1[1]) / 3];

        return { P: [P], Q: [Q] };
    }


    const lower  = new Array(n).fill(1);
    const mainD  = new Array(n).fill(4);
    const upperD = new Array(n).fill(1);
    const rhsX   = new Array(n).fill(0);
    const rhsY   = new Array(n).fill(0);

    for (let i = 1; i <= n - 2; i++) {
        rhsX[i] = 4 * knots[i][0] + 2 * knots[i + 1][0];
        rhsY[i] = 4 * knots[i][1] + 2 * knots[i + 1][1];
    }

    if (startTangent) {
        const scale = dist2D(knots[0], knots[1]) / 3;
        const P0x = knots[0][0] + startTangent[0] * scale;
        const P0y = knots[0][1] + startTangent[1] * scale;

        mainD[0]  = 1;
        upperD[0] = 0;
        rhsX[0]   = P0x;
        rhsY[0]   = P0y;

        lower[1]  = 0;
        const k2x = n >= 2 ? knots[2][0] : knots[1][0];
        const k2y = n >= 2 ? knots[2][1] : knots[1][1];
        rhsX[1] = 4 * knots[1][0] + 2 * k2x - P0x;
        rhsY[1] = 4 * knots[1][1] + 2 * k2y - P0y;
    } else {
        mainD[0]  = 2;
        upperD[0] = 1;
        lower[0]  = 0;
        rhsX[0]   = knots[0][0] + 2 * knots[1][0];
        rhsY[0]   = knots[0][1] + 2 * knots[1][1];
    }

    if (endTangent) {
        const scale = dist2D(knots[n - 1], knots[n]) / 3;
        const Qnx = knots[n][0] - endTangent[0] * scale;
        const Qny = knots[n][1] - endTangent[1] * scale;
        const Pnx = 2 * knots[n][0] - Qnx;
        const Pny = 2 * knots[n][1] - Qny;

        mainD[n - 1]  = 1;
        lower[n - 1]  = 0;
        upperD[n - 1] = 0;
        rhsX[n - 1]   = Pnx;
        rhsY[n - 1]   = Pny;

        if (n >= 2) {
            upperD[n - 2] = 0;
            rhsX[n - 2] = 4 * knots[n - 2][0] + 2 * knots[n - 1][0] - Pnx;
            rhsY[n - 2] = 4 * knots[n - 2][1] + 2 * knots[n - 1][1] - Pny;
        }
    } else {
        mainD[n - 1]  = 2;
        lower[n - 1]  = 1;
        upperD[n - 1] = 0;
        rhsX[n - 1]   = 3 * knots[n][0];
        rhsY[n - 1]   = 3 * knots[n][1];
    }

    const Px = thomasSolve(lower, mainD, upperD, rhsX);
    const Py = thomasSolve(lower, mainD, upperD, rhsY);
    const P  = Px.map((x, i) => [x, Py[i]]);

    const Q = [];
    for (let i = 0; i < n - 1; i++) {
        Q.push([
            2 * knots[i + 1][0] - P[i + 1][0],
            2 * knots[i + 1][1] - P[i + 1][1],
        ]);
    }
    if (endTangent) {
        const scale = dist2D(knots[n - 1], knots[n]) / 3;
        Q.push([
            knots[n][0] - endTangent[0] * scale,
            knots[n][1] - endTangent[1] * scale,
        ]);
    } else {
        Q.push([
            (knots[n][0] + P[n - 1][0]) / 2,
            (knots[n][1] + P[n - 1][1]) / 2,
        ]);
    }

    return { P, Q };
}

function solveSplineHandles(knots, tangents) {
    const nTotal = knots.length - 1;
    if (nTotal === 0) return { P: [], Q: [] };

    const tangentIndices = [0];
    for (let i = 1; i < knots.length - 1; i++) {
        if (tangents[i] !== null) tangentIndices.push(i);
    }
    if (!tangentIndices.includes(nTotal)) {
        tangentIndices.push(nTotal);
    }

    const P = [];
    const Q = [];

    for (let j = 0; j < tangentIndices.length - 1; j++) {
        const startIdx = tangentIndices[j];
        const endIdx = tangentIndices[j + 1];

        const subKnots = knots.slice(startIdx, endIdx + 1);
        const startT = tangents[startIdx];
        const endT = tangents[endIdx];

        const { P: subP, Q: subQ } = _solveSimpleSpline(subKnots, startT, endT);
        P.push(...subP);
        Q.push(...subQ);
    }

    return { P, Q };
}


function buildArcLengthTable(P0, P1, P2, P3) {
    const N = ARC_SAMPLES % 2 === 0 ? ARC_SAMPLES : ARC_SAMPLES + 1;
    const h = 1 / N;

    const speeds = new Array(N + 1);
    for (let i = 0; i <= N; i++) {
        const d = evalCubicDerivative(P0, P1, P2, P3, i / N);
        speeds[i] = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
    }

    const table = [{ t: 0, s: 0 }];
    let cumulative = 0;

    for (let i = 0; i < N; i++) {
        const t_mid = (i + 0.5) / N;
        const d_mid = evalCubicDerivative(P0, P1, P2, P3, t_mid);
        const s_mid = Math.sqrt(d_mid[0] * d_mid[0] + d_mid[1] * d_mid[1]);

        cumulative += (h / 6) * (speeds[i] + 4 * s_mid + speeds[i + 1]);
        table.push({ t: (i + 1) / N, s: cumulative });
    }

    return { table, totalLength: cumulative };
}

function tToArcLength(table, t) {
    if (t <= 0) return 0;
    if (t >= 1) return table[table.length - 1].s;

    let lo = 0, hi = table.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (table[mid].t < t) lo = mid;
        else hi = mid;
    }

    const e0 = table[lo], e1 = table[hi];
    const frac = (t - e0.t) / (e1.t - e0.t);
    return e0.s + frac * (e1.s - e0.s);
}

function arcLengthToT(table, s) {
    const maxS = table[table.length - 1].s;
    if (s <= 0)    return 0;
    if (s >= maxS) return 1;

    let lo = 0, hi = table.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (table[mid].s < s) lo = mid;
        else hi = mid;
    }

    const e0 = table[lo], e1 = table[hi];
    const frac = (s - e0.s) / (e1.s - e0.s);
    return e0.t + frac * (e1.t - e0.t);
}

export class MotionEngine {
    constructor(paths) {
        this.paths = paths;
        this._compiled = [];
        this._compile();
    }

    _compile() {
        this._compiled = this.paths.map(path => this._compilePath(path));
    }

    _compilePath(path) {
        const {
            startPoint, endPoint, waypoints,
            headingInterpolation, startHeading, endHeading,
        } = path;

        // Build ordered knot list
        const knots = [
            [startPoint[0], startPoint[1]],
            ...waypoints.map(w => [w[0], w[1]]),
            [endPoint[0], endPoint[1]],
        ];

        const tangents = [
            startPoint[2] != null ? [Math.cos(toRad(startPoint[2])), Math.sin(toRad(startPoint[2]))] : null,
            ...waypoints.map(w => w[2] != null ? [Math.cos(toRad(w[2])), Math.sin(toRad(w[2]))] : null),
            endPoint[2] != null ? [Math.cos(toRad(endPoint[2])), Math.sin(toRad(endPoint[2]))] : null,
        ];

        const { P, Q } = solveSplineHandles(knots, tangents);
        const numSegments = knots.length - 1;
        const rawSegments = [];

        for (let i = 0; i < numSegments; i++) {
            const { table, totalLength } = buildArcLengthTable(
                knots[i], P[i], Q[i], knots[i + 1]
            );
            rawSegments.push({
                P0: knots[i], P1: P[i], P2: Q[i], P3: knots[i + 1],
                arcTable: table,
                totalLength,
            });
        }

        const pathLength = rawSegments.reduce((s, seg) => s + seg.totalLength, 0);

        const startHeadingRad = startHeading != null ? toRad(startHeading) : null;
        const endHeadingRad   = endHeading   != null ? toRad(endHeading)   : null;

        let cumulative = 0;
        const segments = rawSegments.map((seg) => {
            const segStartS = cumulative;
            cumulative += seg.totalLength;

            const headingFn = this._makeHeadingFn(
                seg, headingInterpolation,
                startHeadingRad, endHeadingRad,
                segStartS, pathLength
            );

            return { ...seg, headingFn, segStartS };
        });

        return { segments, pathLength };
    }

    _makeHeadingFn(seg, mode, startHeadingRad, endHeadingRad, segStartS, pathLength) {
        switch (mode) {

            case "tangent":
                return (t) => {
                    const d = evalCubicDerivative(seg.P0, seg.P1, seg.P2, seg.P3, t);
                    return Math.atan2(d[1], d[0]);
                };

            case "constant":
                return (_t) => startHeadingRad ?? 0;

            case "linear": {
                const hStart = startHeadingRad ?? 0;
                const hEnd   = endHeadingRad   ?? 0;
                return (t) => {
                    // Convert t → local arc length, then to global fraction
                    const localS = tToArcLength(seg.arcTable, t);
                    const globalFrac = pathLength > 0 ? (segStartS + localS) / pathLength : 0;
                    return lerpAngle(hStart, hEnd, globalFrac);
                };
            }

            default:
                return (t) => {
                    const d = evalCubicDerivative(seg.P0, seg.P1, seg.P2, seg.P3, t);
                    return Math.atan2(d[1], d[0]);
                };
        }
    }

    samplePath(pathIndex, numSamples = 200) {
        const { segments, pathLength } = this._compiled[pathIndex];
        if (!segments.length || pathLength === 0) return [];

        const count = Math.max(numSamples, 2);
        const points = [];

        for (let i = 0; i < count; i++) {
            const s = (i / (count - 1)) * pathLength;
            const [x, y] = this._evalAtArcLength(segments, s);
            points.push({ x, y });
        }

        return points;
    }

    sampleAllPaths(numSamplesPerPath = 200) {
        return this._compiled.flatMap((_, i) => this.samplePath(i, numSamplesPerPath));
    }

    getPoseAtArcLength(pathIndex, s) {
        return this._evalAtArcLength(this._compiled[pathIndex].segments, s);
    }

    getPathLength(pathIndex) {
        return this._compiled[pathIndex].pathLength;
    }

    getSegments(pathIndex) {
        return this._compiled[pathIndex].segments;
    }

    getAllSegments() {
        return this._compiled.flatMap((c, i) =>
            c.segments.map(seg => ({ ...seg, pathIndex: i }))
        );
    }

    generateRoadrunnerCode(className = "AutonomousOpMode", startPoseVar = "startPose", trajName = "traj") {
        if (!this.paths.length) return "// No paths defined";

        const first = this.paths[0];
        const [sx, sy] = first.startPoint;
        const startFacingDeg = first.startHeading ?? first.startPoint[2] ?? 0;

        // Build the trajectory segment lines
        const segmentLines = [];
        for (let i = 0; i < this.paths.length; i++) {
            segmentLines.push(this._generateSegmentCode(this.paths[i], this._compiled[i]));
        }

        return [
            `package org.firstinspires.ftc.teamcode;`,
            ``,
            `import com.acmerobotics.dashboard.config.Config;`,
            `import com.acmerobotics.roadrunner.Action;`,
            `import com.acmerobotics.roadrunner.Pose2d;`,
            `import com.acmerobotics.roadrunner.Vector2d;`,
            `import com.acmerobotics.roadrunner.ftc.Actions;`,
            `import com.qualcomm.robotcore.eventloop.opmode.Autonomous;`,
            `import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;`,
            ``,
            `// NOTE: Replace MecanumDrive with your drive class from the RR v1 quickstart`,
            `import org.firstinspires.ftc.teamcode.MecanumDrive;`,
            ``,
            `@Autonomous(name = "${className}", group = "Autonomous")`,
            `@Config`,
            `public class ${className} extends LinearOpMode {`,
            ``,
            `    @Override`,
            `    public void runOpMode() {`,
            `        // Define start pose`,
            `        Pose2d ${startPoseVar} = new Pose2d(${fmt(sx)}, ${fmt(sy)}, Math.toRadians(${fmt(startFacingDeg)}));`,
            ``,
            `        // Initialize drive with start pose`,
            `        MecanumDrive drive = new MecanumDrive(hardwareMap, ${startPoseVar});`,
            ``,
            `        // Build trajectory using TrajectoryActionBuilder (replaces TrajectorySequenceBuilder)`,
            `        Action ${trajName} = drive.actionBuilder(${startPoseVar})`,
            ...segmentLines,
            `                .build();`,
            ``,
            `        // Wait for start signal`,
            `        waitForStart();`,
            ``,
            `        if (opModeIsActive()) {`,
            `            // runBlocking executes the action synchronously (replaces followTrajectorySequence)`,
            `            Actions.runBlocking(${trajName});`,
            `        }`,
            `    }`,
            `}`,
        ].join("\n");
    }

    _generateSegmentCode(path, compiled) {
        const { headingInterpolation, waypoints } = path;
        const { segments } = compiled;

        const isLine = waypoints.length === 0;

        if (isLine) {
            const [ex, ey] = path.endPoint;
            const endFacingDeg = path.endHeading ?? path.endPoint[2] ?? 0;
            let line = "";
            switch (headingInterpolation) {
                case "tangent":
                    line = `.strafeTo(new Vector2d(${fmt(ex)}, ${fmt(ey)}))`;
                    break;
                case "constant":
                    line = `.strafeToConstantHeading(new Vector2d(${fmt(ex)}, ${fmt(ey)}))`;
                    break;
                case "linear":
                    line = `.strafeToLinearHeading(new Vector2d(${fmt(ex)}, ${fmt(ey)}), Math.toRadians(${fmt(endFacingDeg)}))`;
                    break;
                default:
                    line = `.strafeTo(new Vector2d(${fmt(ex)}, ${fmt(ey)}))`;
            }
            return `                ${line}`;
        }

        // Multi-segment spline (one for each waypoint + one for the end)
        return segments.map(seg => {
            const [ex, ey] = seg.P3;
            // Exit tangent at segment end
            const d = evalCubicDerivative(seg.P0, seg.P1, seg.P2, seg.P3, 1);
            const exitTangentRad = Math.atan2(d[1], d[0]);
            const exitTangentStr = `Math.toRadians(${fmt(toDeg(exitTangentRad))})`;

            // Robot facing at segment end
            const endFacingRad = seg.headingFn(1);
            const endFacingDeg = toDeg(endFacingRad);

            let method = "";
            switch (headingInterpolation) {
                case "tangent":
                    method = `.splineTo(new Vector2d(${fmt(ex)}, ${fmt(ey)}), ${exitTangentStr})`;
                    break;
                case "constant":
                    method = `.splineToConstantHeading(new Vector2d(${fmt(ex)}, ${fmt(ey)}), ${exitTangentStr})`;
                    break;
                case "linear":
                    method = `.splineToLinearHeading(new Pose2d(${fmt(ex)}, ${fmt(ey)}, Math.toRadians(${fmt(endFacingDeg)})), ${exitTangentStr})`;
                    break;
                default:
                    method = `.splineTo(new Vector2d(${fmt(ex)}, ${fmt(ey)}), ${exitTangentStr})`;
            }
            return `                ${method}`;
        }).join("\n");
    }

    _evalAtArcLength(segments, s) {
        const { seg, t } = this._findSegmentAtArcLength(segments, s);
        const [x, y] = evalCubic(seg.P0, seg.P1, seg.P2, seg.P3, t);
        const headingDeg = toDeg(seg.headingFn(t));
        return [x, y, headingDeg];
    }

    _findSegmentAtArcLength(segments, s) {
        let remaining = s;

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const isLast = i === segments.length - 1;

            if (remaining <= seg.totalLength || isLast) {
                const maxS = seg.arcTable[seg.arcTable.length - 1].s;
                const localS = Math.min(Math.max(remaining, 0), maxS);
                const t = arcLengthToT(seg.arcTable, localS);
                return { seg, t };
            }

            remaining -= seg.totalLength;
        }

        const seg = segments[segments.length - 1];
        return { seg, t: 1 };
    }

    getPoseAtGlobalArcLength(sGlobal) {
        let remaining = sGlobal;
        const n = this.paths.length;
        if (n === 0) return [0, 0, 0];

        for (let i = 0; i < n; i++) {
            const len = this.getPathLength(i);
            const isLast = i === n - 1;
            if (remaining <= len + 1e-9 || isLast) {
                const local = Math.max(0, Math.min(remaining, len));
                return this.getPoseAtArcLength(i, local);
            }
            remaining -= len;
        }
        return this.getPoseAtArcLength(n - 1, this.getPathLength(n - 1));
    }

}

const G_IN_PER_S2 = 386.088;
export function buildDriveTimeProfile(engine, constraints) {
    const {
        maxVel = 50,
        maxAccel = 40,
        maxDecel = 40,
        maxAngVel = 180,
        maxAngAccel = 360,
        frictionCoefficient = 0.9,
        rollingResistance = 0,
    } = constraints;

    const maxAngVelRad = toRad(maxAngVel);
    const maxAngAccelRad = toRad(maxAngAccel);
    const mu = Math.max(0, frictionCoefficient);
    const aTraction = mu * G_IN_PER_S2;
    const aAccLim = Math.min(Math.max(maxAccel, 0), aTraction);
    const aDecLim = Math.min(Math.max(maxDecel, 0), aTraction);
    const roll = Math.max(0, rollingResistance);
    const aAccFwd = Math.max(1e-4, aAccLim - roll);
    const aDecBrk = Math.max(1e-4, aDecLim + roll);

    let totalLen = 0;
    for (let p = 0; p < engine.paths.length; p++) {
        totalLen += engine.getPathLength(p);
    }

    if (totalLen < 1e-6 || !Number.isFinite(totalLen)) {
        return {
            totalTime: 0,
            getPoseAtTime: (_t) => {
                if (engine.paths.length && engine.paths[0].startPoint) {
                    const sp = engine.paths[0].startPoint;
                    return [sp[0], sp[1], sp[2] ?? 0];
                }
                return [0, 0, 0];
            },
            getArcLengthAtTime: () => 0,
        };
    }

    const N = Math.min(900, Math.max(120, Math.ceil(totalLen * 5)));
    const ds = totalLen / N;

    const theta = new Float64Array(N + 1);
    const poses = new Array(N + 1);

    for (let i = 0; i <= N; i++) {
        const s = (i / N) * totalLen;
        const pose = engine.getPoseAtGlobalArcLength(s);
        poses[i] = pose;
        theta[i] = toRad(pose[2]);
    }

    for (let i = 1; i <= N; i++) {
        let d = theta[i] - theta[i - 1];
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        theta[i] = theta[i - 1] + d;
    }

    const kappa = new Float64Array(N + 1);
    for (let i = 1; i < N; i++) {
        kappa[i] = (theta[i + 1] - theta[i - 1]) / (2 * ds);
    }
    kappa[0] = (theta[1] - theta[0]) / ds;
    kappa[N] = (theta[N] - theta[N - 1]) / ds;

    const dkappaDs = new Float64Array(N + 1);
    for (let i = 1; i < N; i++) {
        dkappaDs[i] = (kappa[i + 1] - kappa[i - 1]) / (2 * ds);
    }
    dkappaDs[0] = (kappa[1] - kappa[0]) / ds;
    dkappaDs[N] = (kappa[N] - kappa[N - 1]) / ds;

    const vmax = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) {
        let cap = maxVel;
        const absK = Math.abs(kappa[i]);
        if (absK > 1e-10) {
            cap = Math.min(cap, maxAngVelRad / absK);
            cap = Math.min(cap, Math.sqrt(aAccLim / absK));
        }
        const absDk = Math.abs(dkappaDs[i]);
        if (absDk > 1e-10) {
            cap = Math.min(cap, Math.sqrt(maxAngAccelRad / absDk));
        }
        vmax[i] = Math.max(cap, 0);
    }
    vmax[0] = 0;
    vmax[N] = 0;

    const vf = new Float64Array(N + 1);
    vf[0] = 0;
    for (let i = 1; i <= N; i++) {
        vf[i] = Math.min(vmax[i], Math.sqrt(vf[i - 1] * vf[i - 1] + 2 * aAccFwd * ds));
    }

    const vb = new Float64Array(N + 1);
    vb[N] = 0;
    for (let i = N - 1; i >= 0; i--) {
        vb[i] = Math.min(vmax[i], Math.sqrt(vb[i + 1] * vb[i + 1] + 2 * aDecBrk * ds));
    }

    const v = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) {
        v[i] = Math.min(vf[i], vb[i]);
    }

    const sTab = new Float64Array(N + 1);
    const tTab = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) {
        sTab[i] = (i / N) * totalLen;
    }
    for (let i = 0; i < N; i++) {
        const vAvg = 0.5 * (v[i] + v[i + 1]);
        const dtSeg = vAvg > 1e-8 ? ds / vAvg : 0;
        tTab[i + 1] = tTab[i] + dtSeg;
    }

    const totalTime = tTab[N] > 0 ? tTab[N] : 0;

    function interpolatePose(i0, i1, u) {
        const p0 = poses[i0];
        const p1 = poses[i1];
        const x = p0[0] + (p1[0] - p0[0]) * u;
        const y = p0[1] + (p1[1] - p0[1]) * u;
        const h0 = toRad(p0[2]);
        let h1 = toRad(p1[2]);
        let delta = h1 - h0;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        const h = h0 + delta * u;
        return [x, y, toDeg(h)];
    }

    function getPoseAtTime(t) {
        if (totalTime <= 0 || N === 0) return [...poses[0]];
        const tt = Math.min(Math.max(t, 0), totalTime);
        if (tt <= 0) return [...poses[0]];
        if (tt >= totalTime) return [...poses[N]];

        let lo = 0;
        let hi = N;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (tTab[mid] < tt) lo = mid;
            else hi = mid;
        }
        const i = lo;
        const t0 = tTab[i];
        const t1 = tTab[i + 1];
        const u = t1 - t0 > 1e-12 ? (tt - t0) / (t1 - t0) : 0;
        return interpolatePose(i, i + 1, u);
    }

    function getArcLengthAtTime(t) {
        if (totalTime <= 0) return 0;
        const tt = Math.min(Math.max(t, 0), totalTime);
        if (tt <= 0) return 0;
        if (tt >= totalTime) return totalLen;

        let lo = 0;
        let hi = N;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (tTab[mid] < tt) lo = mid;
            else hi = mid;
        }
        const i = lo;
        const t0 = tTab[i];
        const t1 = tTab[i + 1];
        const u = t1 - t0 > 1e-12 ? (tt - t0) / (t1 - t0) : 0;
        return sTab[i] + u * ds;
    }

    return { totalTime, getPoseAtTime, getArcLengthAtTime };
}