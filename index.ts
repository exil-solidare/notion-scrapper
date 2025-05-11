import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import NotionModule from './notion'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { transformMd } from './transformMarkdown'
import { parallel, safeName } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getPath = (type: 'posts' | 'pages', entry: PageObjectResponse) => {
  const base = `${__dirname}/../src/content`
  if (type === 'posts')
    return `${base}/posts/${entry.properties.year.formula.string}/${entry.properties.month.formula.string}/${entry.properties.day.formula.string}/`
  if (type === 'pages') return `${base}/pages/`
  else return
}

const getContent = async (
  content = [
    { type: 'posts', db: process.env.NOTION_DB_POSTS },
    { type: 'pages', db: process.env.NOTION_DB_PAGES },
  ]
) => {
  for await (const contentType of content) {
    const type = contentType.type
    const Notion = new NotionModule({
      secret: process.env.NOTION_SECRET,
      database: contentType.db,
    })

    console.log(`Fetching ${type}...`)
    const entries = await Notion.fetchEntries()
    console.log(`Found ${entries.length} ${type}`)

    await parallel(
      entries,
      async (entry: PageObjectResponse) => {
        const post = await Notion.getEntry(entry)

        const articlePath = getPath(type, entry)
        const assetsPath = articlePath
        const fileName = `${safeName(entry.properties.Title?.title[0]?.plain_text)}.md`

        // transform markdown
        post.markdown = await transformMd({
          markdown: post.content.parent,
          article: post,
          articlePath: articlePath,
          assetsPath,
        })

        // save markdown to disk
        // TODO: check if content's not updated
        // and if not, don't save
        await mkdir(articlePath, { recursive: true })
        await writeFile(`${articlePath}/${fileName}`, post.markdown, 'utf8')

        console.log(`Created '${articlePath}' from "${post.title}" (${post.id})`)
      },
      25
    )
  }
}

await getContent()
