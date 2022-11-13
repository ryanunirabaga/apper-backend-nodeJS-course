import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const PATH_TO_FILE = path.resolve("./prisma/seed.json");
const loadData = () => {
  const dbData = fs.readFileSync(PATH_TO_FILE);
  const data = JSON.parse(dbData);
  return data;
};

async function main() {
  const data = loadData();
  const books = data.books;

  for (const book of books) {
    const {
      author,
      title,
      subtitle,
      description,
      pages,
      published,
      publisher,
      website,
    } = book;

    const [firstName, lastName] = author.split(" ");

    const authorRecord = await prisma.author.create({
      data: {
        firstName,
        lastName,
      },
    });

    const authorId = authorRecord.id;
    await prisma.book.create({
      data: {
        title,
        subtitle,
        description,
        pages,
        published,
        publisher,
        website,
        authorId,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });