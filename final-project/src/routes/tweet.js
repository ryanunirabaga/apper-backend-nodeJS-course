import express from 'express';
import pick from "lodash/pick.js";
import omit from "lodash/omit.js";
import { body, validationResult } from "express-validator";
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
        .withMessage("content is required(max 280 characters).")

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

// DELETE a tweet
tweetRouter.delete("/tweets/:tweetId", requiresAuth, async (request, response) => {

    // get tweetId from parameter
    const tweetId = Number.parseInt(request.params.tweetId);

    // get session token from cookies
    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // get user id from session token
    const jwtSessionObject = await jwt.verify(
        jwtSession,
        process.env.JWT_SECRET
    );
    const userId = jwtSessionObject.uid;
    
    // get tweet
    const tweet = await request.app.locals.prisma.tweet.findUnique({
        where: {
            id: tweetId
        }
    });

    // check if tweet is existing
    if (!tweet) {
        response.status(404).json({
            data: null,
            message: "Resource not found!"
        });
        return;
    }

    // check if user owned the tweet
    if (userId !== tweet.userId) {
        response.status(401).json({
            error: "You don't own this tweet."
        });
        return;
    };

    // delete user tweet from database
    const deleteTweet = await request.app.locals.prisma.tweet.delete({
        where: {
            id: tweetId
        }
    });

    // send HTTP response
    response.send({
        data: deleteTweet,
        message: "tweet was deleted successfully!"
    });
});

export default tweetRouter;