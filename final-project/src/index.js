import express from 'express'
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import meRouter from './routes/me.js';
import tweetRouter from './routes/tweet.js';
// import bookGenreRouter from './routes/bookgenre.js';

// dotenv.config();

const app = express();
const prisma = new PrismaClient();
app.use(express.json());
app.use(cookieParser()); // allows express to read/write cookies
app.use(cors()); // allows express to reed/write cors   
app.locals.prisma = prisma;

const PORT = 3000;
app.use(authRouter);
app.use(meRouter);
app.use(tweetRouter);

app.get("/",(request, response) => {
    response.send({message: 'hello, world'});
});


app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));