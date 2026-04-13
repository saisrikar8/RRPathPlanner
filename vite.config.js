import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {Groq} from "groq-sdk";

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

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = new Groq({apiKey: apiKey})

function groqProxyPlugin() {
  return {
    name: 'groq-proxy',
    configureServer(server) {
      server.middlewares.use('/api/groq/chat', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          next();
          return;
        }

        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: { message: 'Missing GROQ_API_KEY in Vercel env' },
          }))
          next();
          return;
        }

        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }
          let parsed = JSON.parse(body);
          const { prompt } = parsed;
          console.log(prompt);

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
                            minItems:3,
                            maxItems:3
                          },
                          endPoint: {
                            type: "array",
                            items:{
                              type: "number",
                            },
                            minItems:3,
                            maxItems:3
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
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({chat_response: chatCompletion.choices[0]?.message?.content}));
          next();
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { message: err.message } }))
        }
      })
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), groqProxyPlugin()],
})
