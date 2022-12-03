import express from 'express';
import pick from "lodash/pick.js";
import omit from "lodash/omit.js";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import requiresAuth from '../middleware/requiresAuth.js';

const userRouter = express.Router();

userRouter.get("/users/:userId", async (request, response) => {

    // get session token from cookies
    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // get user id from parameter
    const userId = request.params.userId;

    try {
        // verify session token
        const jwtSessionObject = await jwt.verify(
            jwtSession,
            process.env.JWT_SECRET
        );
        
        // get user details if token is verified
        const userDetails = await request.app.locals.prisma.user.findUnique({
            where: {
                id: Number.parseInt(userId)
            },
            include: {
                tweets: true,
                replies: true
            }
        });

        // remove unnecessary data
        const filteredDetails = omit(userDetails, [
            "createdAt",
            "updatedAt",
            "id",
            "password"
        ]);
        
        // send HTTP response
        response.send({
            data: filteredDetails,
            message: userDetails? "ok" : "Resource not found!"
        });
    }
    catch {
        // get username and bio only if not authenticated
        const userDetails = await request.app.locals.prisma.user.findUnique({
            where: {
                id: Number.parseInt(userId)
            },
            select: {
                userName: true,
                bio: true
            }
        });

        // send HTTP response
        response.send({
            data: userDetails,
            message: userDetails? "ok" : "Resource not found!"
        });
    }

});

export default userRouter;