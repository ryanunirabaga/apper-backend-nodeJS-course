/* old import way */
// const express = require('express') // commonjs
// new way
import express from 'express' // module
import dbData from './db/data.js'
import fs from "fs"
import path from "path"

const app = express()
app.use(express.json) // allows to parse JSON from network request

const port = 3000;

const getBooks = () => {
    const pathToFile = path.resolve('./src/db/data.json');
    const dbData = fs.readFileSync(pathToFile);
    const data = JSON.parse(dbData);
    return data;
};

function createBook(newBook) {
    const pathToFile = path.resolve("./src/db/data.json");
    const dbData = fs.readFileSync(pathToFile);
    const data = JSON.parse(dbData);
    const books = data.books;
    books.push(newBook);
    const dbDataStringified = JSON.stringify(data);
    fs.writeFileSync(pathToFile, dbDataStringified);
};
  
function updateTitle(bookId, newTitle) {
    const pathToFile = path.resolve("./src/db/data.json");
    const dbData = fs.readFileSync(pathToFile);
    const data = JSON.parse(dbData);
    for (let idx = 0; idx < data.books.length; idx++) {
    const id = data.books[idx].id;
    if (id !== bookId) continue;

    data.books[idx].title = newTitle;
    }

    const dbDataStringified = JSON.stringify(data);
    fs.writeFileSync(pathToFile, dbDataStringified);
};

function deleteBook(bookId) {
    const pathToFile = path.resolve("./src/db/data.json");
    const dbData = fs.readFileSync(pathToFile);
    const data = JSON.parse(dbData);
    const books = data.books;
    const filteredBooks = books.filter((book) => book.id !== bookId);
    data.books = filteredBooks;
    const dbDataStringified = JSON.stringify(data);
    fs.writeFileSync(pathToFile, dbDataStringified);
};
  

app.get("/", (request, response) => {
    const greeting = (request.query.greeting) ? request.query.greeting: 'hi';
    const name = (request.query.name) ? request.query.name: 'bob';
    response.send({message: `${greeting}, ${name}`})
    // const bruh = request.query.bruh
    // response.send({message: 'Hello, World!', ...request.query})
    // response.send({message: 'Hello, World!', bruh: bruh})
})
// app.get("/test", (request, response) => {
//     response.send({message: 'test lodi'})
// })

// // get all books
// app.get("/books", (request, response) => {
//     response.send({books: dbData.books})
// })

// // get all books
// app.post("/books", (request, response) => {
//     response.send({books: dbData.books})
// })

// get specific books
// app.get("/books/:bookId", (request, response) => {
//     const bookId = request.params.bookId;
//     response.send({bookId})
// })


// app.get("/books/:bookId/anime/:animeId", (request, response) => {
//     const bookId = request.params.bookId;
//     const animeId = request.params.animeId;
//     response.send({bookId, animeId})
// })


// GET A BOOK EXERCISE
app.get("/books/:bookId", (request, response) => {
    const bookId = request.params.bookId;
    const allBooks = getBooks();
    const book = allBooks.books.find((bookItem) => bookItem.id == bookId) || null;
    
    response.send({book: book})
})

// FILTER BOOKS EXERCISE
app.get("/books", (request, response) => {

    const filter = request.query.filter

    if (!filter)
        response.send({books: dbData.books})
    else {
        const filterAuthor = filter['author']
        const filterTitle = filter['title']

        //console.log(request.query.filter)
        
        let filteredBooks = []

        if (filterAuthor)
            filteredBooks = dbData.books.filter((book) => book.author === filterAuthor);

        if (filterTitle)
            filteredBooks = dbData.books.filter((book) => book.title.includes(filterTitle));
        
        response.send({books: filteredBooks})
    }
})


// middleware
function cleanRequestParams(request, response, next ) {
    const newQuesryParams = {
        name: request.query.name || ""
    };
    // with this, only name query will be passed
    
    request.query = newQuesryParams;
    next();
}

// sample how to pass middleware
app.get("/anime", cleanRequestParams, (request, response) => {
    response.send({...request.query})
})

app.listen(port, () => {
    console.log(`Example app listening on ${port}`)
})