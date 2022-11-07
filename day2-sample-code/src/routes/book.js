import express from "express";
import pick from "lodash/pick.js";
import { body, validationResult } from "express-validator";

const booksRouter = express.Router();

booksRouter.get("/books/test", (request, response) => {
  response.send({ message: "hello, world" });
});

// GET     /books
// GET     /books/:bookId
// POST    /books
// PUT     /books/:bookId
// DELETE  /books/:bookId

booksRouter.get("/books", async (request, response) => {
    const books = await request.app.locals.prisma.book.findMany();
    response.send({ data: books, message: 'ok'});
})

booksRouter.get("/books/:bookId", async (request, response) => {
    const bookId = request.params.bookId;
    const book = await request.app.locals.prisma.book.findUnique({
        where: {
            id: Number.parseInt(bookId),
        },
    })
    response.send({ data: book, message: book ? 'ok': 'not found'});

})

booksRouter.get("/books/:bookId/author", async (request, response) => {
    const bookId = request.params.bookId;
    const book = await request.app.locals.prisma.book.findUnique({
        where: {
            id: Number.parseInt(bookId),
        },
        include: {
            author: true,
        },
    })
    if(!book) {
        response.send({ data: book, message:'not found'});
        return;
    }
    response.send({ 
        data: book.author,
        message: book ? 'ok': 'not found'
    });
})

booksRouter.post(
    "/books",
    [
        body('title')
        .notEmpty()
        .isLength({min: 5})
        .withMessage(
            "Book requires 'title' and should be minimum of 5 characters!"
        )
    ],
    async (request, response) => {
    const error = validationResult(request);

    if(!error.isEmpty()) {
        response.status(400).json({ errors: error.array() });
        return;
    }

    const filteredBody = pick(request.body, [
        "title",
        "subtitle",
        "published",
        "publisher",
        "pages",
        "description",
        "website",
        "authorId"
    ])

    const book = await request.app.locals.prisma.book.create({
        data: filteredBody,
    })
    response.send({data: book, message: 'create success!'})
})

booksRouter.put("/books/:bookId", async (request, response) => {
    const bookId = request.params.bookId;

    const filteredBody = pick(request.body, [
        "title",
        "subtitle",
        "published",
        "publisher",
        "pages",
        "description",
        "website",
        "authorId"
    ]);

    const updatedBook = await request.app.locals.prisma.book.update({
        where: {
            id: Number.parseInt(bookId),
        },
        data: filteredBody,
    });

    response.send({data: updatedBook, message: 'update success!'});

});

booksRouter.delete("/books/:bookId", async (request, response) => {
    const bookId = request.params.bookId;

    try {
        const deleteBook = await request.app.locals.prisma.book.delete({
            where: {
                id: Number.parseInt(bookId),
            },
        });
    
        response.send({data: deleteBook, message: 'deletion success!'});
    }
    catch {
        response.send({data: null, message: 'resource not found!'});
    }

})

export default booksRouter;