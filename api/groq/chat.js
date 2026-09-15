import { Groq } from "groq-sdk"

const POINT_SCHEMA = {
    type: "array",
    items: {type: "number"},
    minItems: 3,
    maxItems: 3,
};

const IMPORT_SCHEMA = {
    type: "object",
    properties: {
        imported_paths: {
            type: "array",
            items: {
                anyOf: [
                    {
                        type: "object",
                        properties: {
                            type: {type: "string", enum: ["path"]},
                            startPoint: POINT_SCHEMA,
                            endPoint: POINT_SCHEMA,
                            waypoints: {type: "array", items: POINT_SCHEMA},
                            headingInterpolation: {
                                type: "string",
                                enum: ["tangent", "constant", "linear"],
                            },
                            startHeading: {type: ["number", "null"]},
                            endHeading: {type: ["number", "null"]},
                        },
                        required: ["type", "startPoint", "endPoint", "waypoints",
                            "headingInterpolation", "startHeading", "endHeading"],
                        additionalProperties: false,
                    },
                    {
                        type: "object",
                        properties: {
                            type: {type: "string", enum: ["wait"]},
                            duration: {type: "number", minimum: 0},
                        },
                        required: ["type", "duration"],
                        additionalProperties: false,
                    },
                ],
            },
        },
    },
    required: ["imported_paths"],
    additionalProperties: false,
};

const SYSTEM_PROMPT = `You are an FTC RoadRunner API path extractor. Given Java OpMode code, extract the autonomous path as a JSON object with an "imported_paths" array.

Each element is either a path segment or a wait:
- Path: {"type":"path","startPoint":[x,y,tangentDeg],"endPoint":[x,y,tangentDeg],"waypoints":[],"headingInterpolation":"tangent"|"constant"|"linear","startHeading":null,"endHeading":null}
- Wait: {"type":"wait","duration":seconds}

Extraction rules:
- The initial robot pose comes from: new Pose2d(x, y, Math.toRadians(h)): this is the startPoint of the first path: [x, y, h]
- splineTo(new Vector2d(x,y), Math.toRadians(t)): headingInterpolation:"tangent", endPoint=[x,y,t]
- splineToConstantHeading(new Vector2d(x,y), Math.toRadians(t)): headingInterpolation:"constant", startHeading = heading carried from previous pose
- splineToLinearHeading(new Pose2d(x,y,Math.toRadians(h)), Math.toRadians(t)): headingInterpolation:"linear", endPoint=[x,y,t], endHeading=h
- waitSeconds(n): {"type":"wait","duration":n}
- Estimate the amount of time it takes to run custom Action objects located in the Actions.runBlocking() function and add corresponding wait blocks of the following format: {"type":"wait","duration":n}
- Each path's startPoint equals the previous path's endPoint (chain them in order)
- Math.toRadians(x): x is in degrees; use x directly as the degree value
- waypoints array is always [] unless the code uses intermediate points (rare)
- startHeading for constant: use the heading from the Pose2d that started this trajectory builder chain, or the last known heading
- endHeading for linear: the heading value h from Pose2d(x,y,Math.toRadians(h))

Return ONLY the raw JSON object: {"imported_paths":[...]}. No explanation, no markdown, no code fences.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed'});
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: {message: 'Missing GROQ_API_KEY in server environment'},
        })
    }

    try {
        const {prompt} = req.body || {};
        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({error: {message: 'A non-empty prompt is required'}});
        }
        const groq = new Groq({apiKey});

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "imported_code",
                    strict: true,
                    schema: IMPORT_SCHEMA,
                },
            }
        });
        const parsed = JSON.parse(chatCompletion.choices[0]?.message?.content);
        const paths = Array.isArray(parsed) ? parsed : parsed?.imported_paths;
        if (!Array.isArray(paths)) {
            return res.status(502).json({error: {message: 'Groq returned an invalid path response'}});
        }
        return res.status(200).json({chat_response: JSON.stringify(paths)});
    } catch (err) {
        return res.status(500).json({error: {message: err.message}});
    }
}
