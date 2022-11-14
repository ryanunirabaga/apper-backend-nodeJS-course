import express from 'express';
import pick from "lodash/pick.js";
import omit from "lodash/omit.js"
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

const authRouter = express.Router();
const SALT_ROUNDS = 10;
/* 

GET /me
POST /sign-up
POST /sign-in
POST /sign-out
*/

// GET /me
authRouter.get("/me", (request, response) => {
    response.send({ data: null, message: "ok" });
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
        const filtereduser = omit(user, ["id", "password"]);

        response.send({ data: filtereduser, message: "ok"})
    })

// POST /sign-out
authRouter.get("/me", (request, response) => {
    response.send({ data: null, message: "ok" });
})



export default authRouter;
