import express from 'express';
import pick from "lodash/pick.js";
import omit from "lodash/omit.js"
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { Prisma } from '@prisma/client'
import jwt from "jsonwebtoken";

const authRouter = express.Router();

const SALT_ROUNDS = 10;


/* CRUD operations here */

// Sign-up

authRouter.post(
    "/sign-up",
    [   
        body("firstName").notEmpty().withMessage("first name is required."),
        body("lastName").notEmpty().withMessage("last name is required."),
        body("userName").notEmpty().withMessage("username is required."),
        body("email").notEmpty().isEmail().normalizeEmail().withMessage("email is required."),
        body("password").notEmpty().withMessage("password is required."),
        body("birthday").notEmpty().toDate().withMessage("birthday is required."),
        body("bio").notEmpty()/* .optional({checkFalsy: true}) */
    ],
    async (request, response) => {

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            response.status(400).json(
                { errors: errors.array() }
            );
            return;
        };
        
        const filteredBody = pick(request.body, [
            "firstName",
            "lastName",
            "userName",
            "email",
            "password",
            "birthday",
            "bio"
        ]);

        // hash password using bcrypt
        const hashedPassword = await bcrypt.hash(filteredBody.password, SALT_ROUNDS);
        filteredBody.password = hashedPassword;

        try {
            // create user
            const user = await request.app.locals.prisma.user.create({
                data: filteredBody
            });

            // create session token
            const jwtSessionToken = {
                uid: user.id,
                email: user.email,
                username: user.userName
            };

            // set session token max age
            const maxAge = 1 * 24 * 60 * 60;

            // sign session token
            const jwtSession = await jwt.sign(
                jwtSessionToken,
                process.env.JWT_SECRET,
                {
                    expiresIn: maxAge
                }
            );

            // output session token as cookie
            response.cookie(
                "sessionId",
                jwtSession,
                {
                    httpOnly: true,
                    maxAge: maxAge * 1000,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production" ? true : false
                }
            );
            
            const filtereduser = omit(user, ["id","password"]);
            // Send HTTP Response
            response.send({
                data: filtereduser,
                message: filtereduser? "ok" : "error"
            });
        }
        catch(error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                response.status(400).json({
                    data: null,
                    message: `${error.meta.target[0].toLowerCase()} already exists!`
                });
            }
        }
    }
);

// Sign-in

export default authRouter;