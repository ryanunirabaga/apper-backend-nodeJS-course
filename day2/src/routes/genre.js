import express from "express";
import pick from "lodash/pick.js";
import { body, validationResult } from "express-validator";

const genreRouter = express.Router();

/*
HW:
GET     /genres
GET     /genres/:genreId
GET     /genres/:genreId/books
POST    /genres
PUT     /genres/:genreId
DELETE  /genres/:genreId
*/

genreRouter.get("/genres", async (request, response) => {
    const genres = await request.app.locals.prisma.genre.findMany();
    response.send({ data: genres, message: 'success!' });
})

genreRouter.get("/genres/:genreId", async (request, response) => {
    const genreId = request.params.genreId;
    const genre = await request.app.locals.prisma.genre.findUnique({
        where: {
            id: Number.parseInt(genreId)
        }
    });
    response.send({ data: genre, message: genre? 'ok' : "genre not found" });
})

genreRouter.get("/genres/:genreId/books", async (request, response) => {
    const genreId = request.params.genreId;
    const genre = await request.app.locals.prisma.genre.findUnique({
        where: {
            id: Number.parseInt(genreId)
        },
        include: {
            books: {
                include: { 
                    book: true 
                }
            }
        }
    });
    if(!genre) {
        response.send({ data: null, message:'resource not found'});
        return;
    }
    const books = genre.books.map(({ book }) => book);
    response.send({ data: books, message: genre ? 'ok' : "genre not found" });
})

genreRouter.post("/genres", async (request, response) => {
    const filteredBody = pick(request.body, [
        "title"
    ]);
    const genre = await request.app.locals.prisma.genre.create({
        data: filteredBody,
    });
    response.send({ data: genre, message: 'create success!'})
})

genreRouter.put("/genres/:genreId", async (request, response) => {
    const genreId = request.params.genreId;
    const filteredBody = pick(request.body, [
        "title"
    ]);
    try {
        const updateGenre = await request.app.locals.prisma.genre.update({
            where: {
                id: Number.parseInt(genreId)
            },
            data: filteredBody,
        });
        response.send({ data: updateGenre, message: "update success!" });
    }
    catch {
        response.send({ data: null, message: "genre not found" });
    }
})

genreRouter.delete("/genres/:genreId", async (request, response) => {
    const genreId = request.params.genreId;

    try {
        const deleteGenre = await request.app.locals.prisma.genre.delete({
            where: {
                id: Number.parseInt(genreId)
            }
        });
        response.send({ data: deleteGenre, message: "delete success!" });
    }
    catch {
        response.send({ data: null, message: "genre not found" });
    }
})
export default genreRouter;