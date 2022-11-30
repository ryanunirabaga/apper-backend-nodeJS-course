import express from "express";
import pick from "lodash/pick.js";
import { body, validationResult } from "express-validator";
import requiresAuth from "../middleware/requiresAuth.js";

const userRouter = express.Router();

/* CRUD operations here */

// GET me

userRouter.get("/me", requiresAuth, async (request, response) => {

    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // gwt user id from session token
    

    response.send({
        data: null,
        message: "ok"
    });
})





export default userRouter;