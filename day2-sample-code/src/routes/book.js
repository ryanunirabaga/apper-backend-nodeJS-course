import express from "express";

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

booksRouter.post("/books", async (request, response) => {
    const body = request.body;

    const book = await request.app.locals.prisma.book.create({
        data: {
            title: body.title,
            subtitle: body.subtitle,
            published: body.published,
            publisher: body.publisher,
            pages: body.pages,
            description: body.description,
            website: body.website,
            authorId: body.authorId,
          },
    })
    response.send({data: book, message: 'ok'})
})

export default booksRouter;