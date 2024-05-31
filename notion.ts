import dotenv from "dotenv";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

dotenv.config({ path: "./.env" });

export default class NotionModule {
    options: any;
    database_id: string;
    notion: Client;
    notion2md: NotionToMarkdown;

    constructor({ secret, database }) {
        this.database_id = database;
        this.notion = new Client({ auth: secret });
        this.notion2md = new NotionToMarkdown({ notionClient: this.notion });
    }

    async fetchEntries() {
        const pages = await this._fetchPagesFromDb(this.database_id);
        return pages;
    }

    async getEntry(page: PageObjectResponse) {
        const entry = {
            id: page.id,
            title: getTitle(page),
            ...toPlainPage(page),
            ...toPlainProperties(page.properties),
            content: await this._getPageMarkdown(page.id),
        };

        return entry;
    }

    async _fetchPagesFromDb(database_id) {
        const response = await this.notion.databases.query({
            database_id: database_id,
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
        // TODO: paginate more than 100 pages
        return response.results;
    }

    async _getPageMarkdown(page_id) {
        const mdBlocks = await this.notion2md.pageToMarkdown(page_id);
        return this.notion2md.toMarkdownString(mdBlocks);
    }

    async updateBlogStatus(page_id) {
        this.notion.pages.update({
            page_id: page_id,
            properties: {
                status: {
                    select: {
                        name: "Published",
                    },
                },
            },
        });
    }
}

function toPlainPage(page: PageObjectResponse) {
    return {
        created_time: new Date(page.created_time),
        last_edited_time: new Date(page.last_edited_time),

        cover_image: page.cover?.external?.url || page.cover?.file.url,

        icon_image: page.icon?.file?.url,
        icon_emoji: page.icon?.emoji,
    };
}

function getTitle(page: PageObjectResponse) {
    const titleProp = Object.values(page.properties).find((prop) => prop.id === "title");
    return titleProp.title[0]?.plain_text;
}

function toPlainProperties(properties: PageObjectResponse["properties"]) {
    const types = {
        title(prop: keyof PageObjectResponse["properties"]) {
            return prop.title[0]?.plain_text;
        },
        rich_text(prop: keyof PageObjectResponse["properties"]) {
            return prop.rich_text[0]?.plain_text;
        },
        number(prop: PageObjectResponse["properties"]) {
            return prop.number;
        },
        select(prop: PageObjectResponse["properties"]) {
            return prop.select?.name;
        },
        multi_select(prop: PageObjectResponse["properties"]) {
            return prop.multi_select.map((s) => s.name);
        },
        date(prop: PageObjectResponse["properties"]) {
            return prop.date?.start ? new Date(prop.date?.start) : null;
        },
        files(prop: PageObjectResponse["properties"]) {
            const urls = prop.files?.map((file) => file.file?.url || file.external?.url);
            return urls.length <= 1 ? urls[0] : urls;
        },
        checkbox(prop: PageObjectResponse["properties"]) {
            return prop.checkbox;
        },
        url(prop: PageObjectResponse["properties"]) {
            return prop.url;
        },
        email(prop: PageObjectResponse["properties"]) {
            return prop.email;
        },
        phone_number(prop: PageObjectResponse["properties"]) {
            return prop.phone_number;
        },
        formula(prop: PageObjectResponse["properties"]) {
            return prop.formula.boolean || prop.formula.date || prop.formula.number || prop.formula.string;
        },
        unique_id(prop: PageObjectResponse["properties"]) {
            return prop.unique_id.prefix + "-" + prop.unique_id.number;
        },
        created_time(prop: PageObjectResponse) {
            return new Date(prop.created_time);
        },
        last_edited_time(prop: PageObjectResponse) {
            return new Date(prop.last_edited_time);
        },
    };
    const obj = {};
    for (const [key, value] of Object.entries(properties)) {
        if (types[value.type]) {
            obj[key] = types[value.type](value);
        } else {
            console.warn(`Unknown block type: ${value.type}`);
            obj[key] = value[value.type];
        }
    }
    return obj;
}
