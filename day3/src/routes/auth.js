import express from 'express';
import pick from "lodash/pick.js";
import omit from "lodash/omit.js"
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

const authRouter = express.Router();
const SALT_ROUNDS = 10;
/* 

GET /me
POST /sign-up
POST /sign-in
POST /sign-out
*/

// GET /me
authRouter.get("/me", async (request, response) => {

    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // check if user have jwt session
    if (!jwtSession) {
        response.status(401).json({
            data: null,
            message: "not authenticated"
        });

        return;
    }

    // verify jwt if valid
    try {
        const jwtSessionObject = await jwt.verify(
            jwtSession,
            process.env.JWT_SECRET
        );
        const userId = jwtSessionObject.uid;

        const user = await request.app.locals.prisma.user.findUnique({
            where: {
                id: userId,
            }
        });

        const filteredUser = omit(
            user,
            ["id", "password"]
        );

        response.send({
            user: filteredUser,
            message: filteredUser ? "ok" : "error"
        });
    }
    catch {
        response.status(401).json({
            data: null,
            message: "jwt is not valid"
        });
    }


    // console.log(jwtSession)
    // response.send({ data: jwtSession, message: "ok" });
})

// POST /sign-up
authRouter.post("/sign-up", async (request, response) => {
    const filteredBody = pick(request.body, [
        "firstName",
        "lastName",
        "email",
        "password"
    ]);

    //  bcrypt will encrypt and will add SALT_ROUNDS, SALT_ROUNDS => random characters(depends on the number you defined)
    const hashedPassword = await bcrypt.hash(filteredBody.password, SALT_ROUNDS);
    filteredBody.password = hashedPassword;

    const user = await request.app.locals.prisma.user.create({
        data: filteredBody,
    });

    // don't put unnecessary details in JWT Session, especially sensitive info
    const jwtSessionObject = {
        uid: user.id,
        email: user.email
    };

    const maxAge = 1 * 24 * 60 * 60;

    const jwtSession = await jwt.sign(
        jwtSessionObject,
        process.env.JWT_SECRET,
        {
            expiresIn: maxAge, // expiry of JWT session
        }
    );

    // console.log(jwtSession);

    response.cookie(
        "sessionId",
        jwtSession,
        {
            httpOnly: true,
            maxAge: maxAge * 1000,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production" ? true : false,
        }   
    );


    response.send({ data: user, message: user? "ok" : "error" });
})

// POST /sign-in
authRouter.post("/sign-in", 
    [
        body("password")
        .notEmpty()
        .isLength({ min: 5 })
        .withMessage("Sign In requires a valid `password`"),
        body("email")
        .notEmpty()
        .isEmail()
        .withMessage("Sign In requires a valid `email`"),
    ],
    async (request, response) => {

        const errors = validationResult(request);

        if (!errors.isEmpty()) {
            response.status(400).json({ errors: errors.array() });
            return;
        };

        const filteredBody = pick(request.body, [
            "email",
            "password"
        ]);

        const user = await request.app.locals.prisma.user.findUnique({
            where: {
                email: filteredBody.email
            },
        });

        // return error message + correct status
        if (!user) {
            response.status(404).json({
                data: null,
                message: "resource not found"
            });
            return;
        };
        // bcrypt will decrypt the password +_SALT_ROUNDS automatically
        const isCorrectPassword = await bcrypt.compare(
            filteredBody.password,
            user.password
        );
        
        // return error message + correct status
        if (!isCorrectPassword) {
            response.status(401).json({
                data: null,
                message: "incorrect credentials"
            });

            return;
        };
        // use omit to remove the following field(s) to return
        const filteredUser = omit(user, ["id", "password"]);

        // don't put unnecessary details in JWT Session, especially sensitive info
        const jwtSessionObject = {
            uid: user.id,
            email: user.email
        };

        const maxAge = 1 * 24 * 60 * 60;

        const jwtSession = await jwt.sign(
            jwtSessionObject,
            process.env.JWT_SECRET,
            {
                expiresIn: maxAge, // expiry of JWT session
            }
        );

        // console.log(jwtSession);

        response.cookie(
            "sessionId",
            jwtSession,
            {
                httpOnly: true,
                maxAge: maxAge * 1000,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production" ? true : false,
            }   
        );

        response.send({ data: filteredUser, message: "ok"});
    })

// POST /sign-out
authRouter.post("/sign-out", (request, response) => {

    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // expire cookies to log out 
    response.cookie(
        "sessionId",
        jwtSession,
        {
            maxAge: 1 // one millisecond
        }
    );

    response.send({ data: null, message: "ok" });
})



export default authRouter;
