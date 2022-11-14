import express from 'express'
import { PrismaClient } from '@prisma/client';
import booksRouter from './routes/book.js';
import authorRouter from './routes/author.js';
import genreRouter from './routes/genre.js';
import authRouter from './routes/auth.js';

const app = express();
const prisma = new PrismaClient();
app.use(express.json())

app.locals.prisma = prisma;

const PORT = 3000;
app.use(authRouter);
app.use(booksRouter);
app.use(authorRouter);
app.use(genreRouter);

app.get("/",(request, response) => {
    response.send({message: 'hello, world'});
});


app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));