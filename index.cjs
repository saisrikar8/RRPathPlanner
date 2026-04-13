const jwt = require("jsonwebtoken");
const { jwtDecode } = require('jwt-decode');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require('cookie-parser');
const express = require('express');
const Groq = require('groq-sdk')
require('dotenv').config();

const SYSTEM_PROMPT = `You are an FTC RoadRunner API path extractor. Given Java OpMode code, extract the autonomous path as a JSON array.

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

Return ONLY the raw JSON array. No explanation, no markdown, no code fences.`;

const apiKey = process.env.VITE_GROQ_API_KEY;
const groq = new Groq({apiKey: apiKey})

const app = express();
app.use(express.json());
app.use(cookieParser());



app.listen(3001, () => console.log('API server running on :3001'));

app.post('/api/groq/chat', verifyCookie, handler);
const mongodbConnectionStr = `mongodb+srv://tummalasaisrikar:${process.env.MONGODB_CONNECTION_STR}@yichangs-temu-storage.irg9scu.mongodb.net/`
const dbclient = new MongoClient(mongodbConnectionStr);
const usageCollection = dbclient.db('rr-pathplanner').collection('usage');
function createJwtToken(json) {
    const token = jwt.sign(json, process.env.JWT_SIGN_KEY, {
        expiresIn: '30000',
    });
    return token;
}

async function verifyCookie(req, res, next) {
    let token;
    if (!req || !req.cookies) {
        token = createJwtToken({ip: req.ip});
    } else {
        try {
            token = req.cookies.token;
            let exp = token.exp;
        } catch (err) {
            await usageCollection.deleteOne({token: req.cookies.token});
            console.log(err);
            token = createJwtToken({ip: req.ip})
        }
    }
    try {
        const usage = await usageCollection.findOne({token: token});
        if (usage && usage.count > 3){
            return res.status(429).json({status: "error", message: 'You have reached the maximum number of requests. Please wait and try again.'});
        }
        await usageCollection.findOneAndUpdate({token: token}, {
            $inc: {
                count: 1
            }
        },
        {
            upsert: true,
        })
        res.cookie('token', token);
        next();
    } catch (err) {
        console.log(err)
        return res.status(401).json({status: "error", message: 'Your token is invalid.'});
    }
}



async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed'});
    }

    if (!apiKey) {
        return res.status(500).json({
            error: {message: 'Missing GROQ_API_KEY in Vercel env'},
        })
    }

    try {
        const {prompt} = req.body;

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
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            response_format: {
                type: "json_object",
                json_object: {
                    name: "imported_code",
                    schema: {
                        properties: {
                            imported_paths: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        pathType: {
                                            type: "string",
                                            enum: ["wait", "path"]
                                        },
                                        startPoint: {
                                            type: "array",
                                            items: {
                                                type: "number",
                                            },
                                            minItems: 3,
                                            maxItems: 3
                                        },
                                        endPoint: {
                                            type: "array",
                                            items: {
                                                type: "number",
                                            },
                                            minItems: 3,
                                            maxItems: 3
                                        },
                                        waypoints: {
                                            type: "array",
                                            items: {
                                                type: "number"
                                            }
                                        },
                                        headingInterpolation: {
                                            type: "string",
                                            enum: ["tangent", "constant", "linear"]
                                        },
                                        startHeading: {
                                            type: ["number", "null"]
                                        },
                                        endHeading: {
                                            type: ["number", "null"]
                                        },
                                        duration: {
                                            type: "number",
                                        }
                                    },
                                    required: ["pathType"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["imported_paths"],
                        additionalProperties: false
                    }
                },
                required: ["imported_code"]
            }
        });
        return res.status(200).json({chat_response: chatCompletion.choices[0]?.message?.content});
    } catch (err) {
        return res.status(500).json({error: {message: err.message}});
    }
}


module.exports = { createJwtToken, verifyCookie }