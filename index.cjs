const jwt = require("jsonwebtoken");
const { jwtDecode } = require('jwt-decode');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require('cookie-parser');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());



app.listen(3001, () => console.log('API server running on :3001'));

app.post('/api/groq/chat', verifyCookie, handler);
const mongodbConnectionStr = `mongodb+srv://tummalasaisrikar2:${process.env.MONGODB_CONNECTION_STR}@yichangs-temu-storage.irg9scu.mongodb.net/`
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
    if (!req || !req.cookies || !req.cookies.token) {
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
    const {default: groqHandler} = await import('./api/groq/chat.js');
    return groqHandler(req, res);
}


module.exports = { createJwtToken, verifyCookie }