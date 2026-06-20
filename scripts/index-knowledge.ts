import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting knowledge indexing...");

  const dataPath = path.join(__dirname, "../src/knowledge/data.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const knowledgeChunks = JSON.parse(rawData);

  // Clear existing chunks
  console.log("Clearing existing knowledge chunks...");
  await prisma.knowledgeChunk.deleteMany({});

  console.log(`Indexing ${knowledgeChunks.length} chunks...`);

  for (const chunk of knowledgeChunks) {
    await prisma.knowledgeChunk.create({
      data: {
        title: chunk.title,
        content: chunk.content,
        sourcePath: chunk.sourcePath,
        category: chunk.category,
        projectName: chunk.projectName,
        tags: chunk.tags || [],
        tools: chunk.tools || [],
        aliases: chunk.aliases || [],
        priority: chunk.priority || 0
      }
    });
  }

  console.log("Knowledge indexing complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
