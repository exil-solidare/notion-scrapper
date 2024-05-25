import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import NotionModule from "./notion";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { writeFile, mkdir } from "fs/promises";
import { transformMd } from "./transformMarkdown";
import { parallel, safeName } from "./utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const Notion = new NotionModule({
    secret: process.env.NOTION_SECRET,
    database: process.env.NOTION_DB,
});

console.log("Fetching pages...");
const pages = await Notion.fetchArticles();
console.log(`Found ${pages.length} pages`);

await parallel(
    pages,
    async (page: PageObjectResponse) => {
        const article = await Notion.getArticle(page);

        const articlePath = `${__dirname}/../src/content/posts/${page.properties.year.formula.string}/${page.properties.month.formula.string}/${page.properties.day.formula.string}/`;
        const assetsPath = articlePath;
        const fileName = `${safeName(page.properties.Title?.title[0]?.plain_text)}.md`;

        // transform markdown
        article.markdown = await transformMd({
            markdown: article.content.parent,
            article,
            articlePath: articlePath,
            assetsPath,
        });

        // save markdown to disk
        // TODO: check if content's not updated
        // and if not, don't save
        await mkdir(articlePath, { recursive: true });
        await writeFile(`${articlePath}/${fileName}`, article.markdown, "utf8");

        console.log(`Created '${articlePath}' from "${article.title}" (${article.id})`);
    },
    25
);
