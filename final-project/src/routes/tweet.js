import express from 'express';
import pick from "lodash/pick.js";
import omit from "lodash/omit.js";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { Prisma } from '@prisma/client';
import jwt from "jsonwebtoken";
import requiresAuth from '../middleware/requiresAuth.js';

const tweetRouter = express.Router();


// GET all tweets
tweetRouter.get("/tweets", requiresAuth, async (request, response) => {
    
    const allTweets = await request.app.locals.prisma.tweet.findMany({
        select: {
            user: {
                select:{
                    userName: true
                }
            },
            content: true,
            replies: {
                select: {
                    user: {
                        select: {
                            userName: true
                        }
                    },
                    content: true
                }
            }
        }
    });
    allTweets.user.userName = allTweets.user;

    response.send({
        data: allTweets,
        message: "ok"
    });
});

// POST a tweet
tweetRouter.post(
    "/tweets",
    [
        body("content")
        .notEmpty()
        .isLength({ max: 280 })
        .withMessage("content is required.")

    ],
    requiresAuth,
    async (request, response) => {

        // validate request body
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            response.status(400).json(
                { errors: errors.array() }
            );
            return;
        };

        // filter request body
        const filteredBody = pick(request.body, ["content"])

        // get session token from cookies
        const cookies = request.cookies;
        const jwtSession = cookies.sessionId;
    
        // get user id from session token
        const jwtSessionObject = await jwt.verify(
            jwtSession,
            process.env.JWT_SECRET
        );
        const userId = jwtSessionObject.uid;
        
        // add userId to filtered request body
        filteredBody.userId = userId;
        
        // add tweet to database
        const tweet = await request.app.locals.prisma.tweet.create({
            data: filteredBody
        });

        // send HTTP response
        response.send({
            data: tweet,
            message: "ok"
        });
});

export default tweetRouter;