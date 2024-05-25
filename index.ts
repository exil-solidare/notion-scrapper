import Notion, { NOTION_DB } from "./notion";
import { NotionToMarkdown } from "notion-to-md";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const n2m = new NotionToMarkdown({ notionClient: Notion });
const posts: { [key: string]: any; results: PageObjectResponse[] } = await Notion.databases.query({
    database_id: NOTION_DB as string,
    filter: {
        or: [
            {
                property: "Status",
                select: {
                    equals: "Published",
                },
            },
        ],
    },
});

await Promise.all(
    posts.results.map(async (post) => {
        const mdblocks = await n2m.pageToMarkdown(post.id);
        const mdString = n2m.toMarkdownString(mdblocks).parent;

        if (!("title" in post.properties.Title)) return;
        ["year", "month", "day"].forEach((prop: keyof PageObjectResponse["properties"]) => {
            if (!(prop in post.properties)) return;
            if (post.properties[prop].type != "formula") return;
            // @ts-ignore
            if (!("string" in post.properties[prop].formula)) return;
        });

        const fileDirectory = `${__dirname}/posts/${post.properties.year.formula.string}/${post.properties.month.formula.string}/${post.properties.day.formula.string}/`;
        const fileName = `${post.properties.Title.title[0].plain_text}.md`.replace(/[?\/\:]/g, "-");

        mkdirSync(fileDirectory, { recursive: true });
        writeFileSync(`${fileDirectory}/${fileName}`, mdString, { encoding: "utf-8" });
    })
);
