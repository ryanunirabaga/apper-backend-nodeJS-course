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

    // get session token from cookies
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

// GET all user's own tweets (default sorted by newest)
userRouter.get("/me/tweets", requiresAuth, async (request, response) => {

    // get session token from cookies
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
            tweets: {
                orderBy: {
                    createdAt: "desc"
                },
            }
        },
    });

    // send HTTP response
    response.send({
        data: user.tweets,
        message: "ok"
    });

});

// GET all user's own replies (default sorted by newest)
userRouter.get("/me/replies", requiresAuth, async (request, response) => {

    // get session token from cookies
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
            replies: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        },
    });

    // send HTTP response
    response.send({
        data: user.replies,
        message: "ok"
    });

});

// GET all user's own tweets and replies to those tweets (default sorted by newest)
userRouter.get("/me/tweets-and-replies", requiresAuth, async (request, response) => {

    // get session token from cookies
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
            tweets: {
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    replies: {
                        orderBy: {
                            createdAt: "desc"
                        }
                    }
                }
            },
        },
    });

    // send HTTP response
    response.send({
        data: user.tweets,
        message: "ok"
    });

});

// GEt all user favorite tweets
userRouter.get("/me/favorites", requiresAuth, async (request, response) => {

    // get session token from cookies
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
            favorites: {
                include: {
                    tweet: {
                        select: {
                            content: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                },
            },
        },
    });

    // send HTTP response
    response.send({
        data: user.favorites,
        message: "ok"
    });

});

// change username
userRouter.put(
    "/me/change-username",
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

            // remove id and password in response data
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
    "/me/change-password",
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

        // remove id and password in response data
        const filteredUser = omit(updatedUser,["id","password"]);

        // send HTTP response
        response.send({
            data: filteredUser,
            message: "password was updated successfully."
        });
    }
);

// change bio
userRouter.put(
    "/me/change-bio",
    [
        body("bio").notEmpty().withMessage("bio is required.")
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
        const filteredBody = pick(request.body, ["bio"])

        const cookies = request.cookies;
        const jwtSession = cookies.sessionId;

        // get user id from session token
        const jwtSessionObject = await jwt.verify(
            jwtSession,
            process.env.JWT_SECRET
        );
        const userId = jwtSessionObject.uid;
        
        // update user's bio in database
        const updatedUser = await request.app.locals.prisma.user.update({
            where: {
                id: userId
            },
            data: filteredBody,
        });

        // remove id and password in response data
        const filteredUser = omit(updatedUser, ["id","password"]);

        // send HTTP response
        response.send({
            data: filteredUser,
            message: "bio was updated successfully."
        });

    }
);

// GET user by id
userRouter.get("/users/:userId", async (request, response) => {

    // get session token from cookies
    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // get user id from parameter
    const userId = request.params.userId;

    // check param if a number
    if (isNaN(userId)) {
        response.status(400).json({
            error: "Invalid parameter!"
        });
        return;
    }

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
            message: userDetails ? "ok" : "Resource not found!"
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

// GET user's tweets
userRouter.get("/users/:userId/tweets", requiresAuth, async (request, response) => {

    // get user id from parameter
    const userId = request.params.userId;

    // check param if a number
    if (isNaN(userId)) {
        response.status(400).json({
            error: "Invalid parameter!"
        });
        return;
    }

    // get user details
    const user = await request.app.locals.prisma.user.findUnique({
        where: {
            id: Number.parseInt(userId)
        },
        select: {
            tweets: {
                orderBy: {
                    createdAt: "desc"
                },
            }
        },
    });

    // send HTTP response
    response.send({
        data: user.tweets,
        message: "ok"
    });

});

// GET user's replies
userRouter.get("/users/:userId/replies", requiresAuth, async (request, response) => {

    // get user id from parameter
    const userId = request.params.userId;

    // check param if a number
    if (isNaN(userId)) {
        response.status(400).json({
            error: "Invalid parameter!"
        });
        return;
    }

    // get user details
    const user = await request.app.locals.prisma.user.findUnique({
        where: {
            id: Number.parseInt(userId)
        },
        select: {
            replies: {
                orderBy: {
                    createdAt: "desc"
                },
            }
        },
    });

    // send HTTP response
    response.send({
        data: user.replies,
        message: "ok"
    });

});

// GET user's favorites
userRouter.get("/users/:userId/favorites", requiresAuth, async (request, response) => {

    // get user id from parameter
    const userId = request.params.userId;

    // check param if a number
    if (isNaN(userId)) {
        response.status(400).json({
            error: "Invalid parameter!"
        });
        return;
    }

    // get user details
    const user = await request.app.locals.prisma.user.findUnique({
        where: {
            id: Number.parseInt(userId)
        },
        select: {
            favorites: {
                orderBy: {
                    createdAt: "desc"
                },
            }
        },
    });

    // send HTTP response
    response.send({
        data: user.favorites,
        message: "ok"
    });

});

// follow a user
userRouter.post("/users/:userId/follow", requiresAuth, async (request, response) => {

    // get user id from parameter
    const followingUserId = request.params.userId;

    // check param if a number
    if (isNaN(followingUserId)) {
        response.status(400).json({
            error: "Invalid parameter!"
        });
        return;
    }

    // get session token from cookies
    const cookies = request.cookies;
    const jwtSession = cookies.sessionId;

    // get user id from session token
    const jwtSessionObject = await jwt.verify(
        jwtSession,
        process.env.JWT_SECRET
    );
    const followeUserId = jwtSessionObject.uid;
    
    // check following id and follower id if the same
    if (followeUserId == followingUserId) {
        response.status(400).json({
            error: "You cannot follow yourself!"
        });
        return;
    }

    // get following user
    const followingUser = await request.app.locals.prisma.user.findUnique({
        where: {
            id: Number.parseInt(followingUserId)
        }
    });

    // check user if existing
    if (!followingUser) {
        response.status(404).json({
            data: null,
            message: "Resource not found!"
        });
        return;
    }

    try {
        // add following user to database
        const followeduser = await request.app.locals.prisma.follow.create({
            data: {
                followerId: followeUserId,
                followingId: Number.parseInt(followingUserId)
            }
        });

        // send HTTP response
        response.send({
            data: followeduser,
            message: "User was followed successfully!"
        });  
    }
    catch {
        // send HTTP error response
        response.status(400).json({
            error: "You're already following this user!"
        }); 
    }
});



export default userRouter;