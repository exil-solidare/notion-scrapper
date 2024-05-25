import { Client } from "@notionhq/client";
import dotenv from "dotenv";

dotenv.config();

const NOTION_DB = process.env.NOTION_DB;
console.log(`Here we go: ${process.env.NOTION_TOKEN}`);

export default new Client({
    auth: process.env.NOTION_TOKEN,
});

export { NOTION_DB };
