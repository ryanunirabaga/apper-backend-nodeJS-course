import express from 'express';


const bookGenreRouter = express.Router();


bookGenreRouter.get("/bookgenres", async (request, response) => {
    const bookGenres = await request.app.locals.prisma.bookGenre.findMany(/* {
        where: {
            bookId_genreId: {
                bookId: 14,
                genreId: 1
            }
        }
    } */);

    response.send({ data: bookGenres, message: 'success' });
})


export default bookGenreRouter;