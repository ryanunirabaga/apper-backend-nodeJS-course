import express from "express";
import pick from "lodash/pick.js";
import { body, validationResult } from "express-validator";
import requiresAuth from "../middleware/requiresAuth.js";
import { Prisma } from '@prisma/client';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import omit from "lodash/omit.js";

const userRouter = express.Router();

const SALT_ROUNDS = 10;

/* CRUD operations here */

// GET me
userRouter.get("/me", requiresAuth, async (request, response) => {

    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // get user id from session token
    const jwtSessionObject = await jwt.verify(
        jwtSession,
        process.env.JWT_SECRET
    );
    const userId = jwtSessionObject.uid;
    
    // get user details
    const user = await request.app.locals.prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true
        }
    });

    response.send({
        data: user,
        message: "ok"
    });
});

// change username
userRouter.put(
    "/me/change/username",
    [
        body("userName").notEmpty().withMessage("new username is required.")
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
        const filteredBody = pick(request.body, ["userName"])

        const cookies = request.cookies;
        const jwtSession = cookies.sessionId;

        // get user id from session token
        const jwtSessionObject = await jwt.verify(
            jwtSession,
            process.env.JWT_SECRET
        );
        const userId = jwtSessionObject.uid;
        
        try {
            // update username in database
            const updatedUser = await request.app.locals.prisma.user.update({
                where: {
                    id: userId
                },
                data: filteredBody,
            });

            const filteredUser = omit(updatedUser, ["id","password"]);
            // send HTTP response
            response.send({
                data: filteredUser,
                message: "username was updated successfully."
            });
        }
        catch(error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                response.status(400).json({
                    error: `${error.meta.target[0].toLowerCase()} already exists!`
                });
            }
        }
    }
);

// change password
userRouter.put(
    "/me/change/password",
    [
        body("oldPassword").notEmpty().withMessage("old password is required."),
        body("newPassword").notEmpty().withMessage("new password is required.")
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
        const filteredBody = pick(request.body,
            [
                "oldPassword",
                "newPassword"
            ]
            );

        const cookies = request.cookies;
        const jwtSession = cookies.sessionId;

        // get user id from session token
        const jwtSessionObject = await jwt.verify(
            jwtSession,
            process.env.JWT_SECRET
        );
        const userId = jwtSessionObject.uid;

        // get user details using user id
        const user = await request.app.locals.prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        // decrypt and check password
        const isCorrectPassword = await bcrypt.compare(
            filteredBody.oldPassword,
            user.password
        );
        // return error if incorrect password
        if(!isCorrectPassword) {
            response.status(401).json(
                { error: "Incorrect old password." }
            );
            return;
        }

        // hash new password using bcrypt
        const hashedPassword = await bcrypt.hash(filteredBody.newPassword, SALT_ROUNDS);

        // update password in database
        const updatedUser = await request.app.locals.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                password: hashedPassword
            },
        });

        // 
        const filteredUser = omit(updatedUser,["id","password"]);

        // send HTTP response
        response.send({
            data: filteredUser,
            message: "password was updated successfully."
        });
    }
);




export default userRouter;