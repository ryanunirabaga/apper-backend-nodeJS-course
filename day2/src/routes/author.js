import express from "express";
import pick from "lodash/pick.js";
import { body, validationResult } from "express-validator";

const authorRouter = express.Router();
/*
HW:
GET     /authors
GET     /authors/:authorId
GET     /authors/:authorId/books
POST    /authors
PUT     /authors/:authorId
DELETE  /authors/:authorId
*/

authorRouter.get("/authors", async (request, response) => {
    const authors = await request.app.locals.prisma.author.findMany();
    response.send({ data: authors, message: 'success!' });
})

authorRouter.get("/authors/:authorId", async (request, response) => {
    const authorId = request.params.authorId;
    const author = await request.app.locals.prisma.author.findUnique({
        where: {
            id: Number.parseInt(authorId),
        },
    });
    response.send({ 
        data: author,
        message: author ? 'success!' : 'author not found!' 
    });
})

authorRouter.get("/authors/:authorId/books", async (request, response) => {
    const authorId = request.params.authorId;
    const author = await request.app.locals.prisma.author.findUnique({
        where: {
            id: Number.parseInt(authorId),
        },
        include: {
            books: true,
        }
    });
    if(!author) {
        response.send({ data: null, message:'resource not found'});
        return;
    }
    const books = author.books;
    response.send({
        data: books,
        message: author ? 'success!' : 'author not found!'
    });
})

authorRouter.post("/authors", async (request, response) => {
    const filteredBody = pick(request.body, [
        "firstName",
        "lastName"
    ]);

    const author = await request.app.locals.prisma.author.create({
        data: filteredBody,
    });
    response.send({ data: author, message: 'success!' });
})

authorRouter.put("/authors/:authorId", async (request, response) => {
    const authorId = request.params.authorId;
    const filteredBody = pick(request.body, [
        "firstName",
        "lastName"
    ])
    try {
        const updateAuthor = await request.app.locals.prisma.author.update({
            where: {
                id: Number.parseInt(authorId),
            },
            data: filteredBody,
        });
        response.send({ data: updateAuthor, message: 'update success!' });
    }
    catch {
        response.send({data: null, message: 'resource not found!' });
    }

    
})

authorRouter.delete("/authors/:authorId", async (request, response) => {
    const authorId = request.params.authorId;

    try{
        const deleteAuthor = await request.app.locals.prisma.author.delete({
            where: {
                id: Number.parseInt(authorId),
            }
        });
        response.send({ data: deleteAuthor, message: 'delete success!' });
    }
    catch {
        response.send({ data: null, message: 'resource not found!' });
    }
})

export default authorRouter;