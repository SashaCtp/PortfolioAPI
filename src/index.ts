import fastify from 'fastify';
import { exit } from 'process';
import { config } from 'dotenv';
import TimelineYear from './types/TimelineYear';

// Read .env file
config();

const PORT = parseInt(process.env.PORT || '8000');
const server = fastify();

server.addHook('preHandler', (req, res, done) => {
    res.header('Access-Control-Allow-Origin', '*');
    done();
});
  
// Notion
const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_API_VERSION = '2022-06-28';

server.get('/', async (req, res) => {
    
    return '{ "status": "success" }'

});


server.get('/v1/projects/timeline', async (req, res) => {

    let headers = new Headers();
    headers.set('Authorization', NOTION_API_KEY);
    headers.set('Notion-Version', NOTION_API_VERSION);

    try{
        let data = await fetch('https://api.notion.com/v1/databases/b4443e7a399445f5b3b4939d08545079/query', {
            headers: headers,
            method: 'POST'
        }).then(data => data.json());

        let projects = data.results.map((el: any) => { return {
            "name": el.properties.Name.title[0].text.content,
            "description": el.properties.Description.rich_text[0].text.content,
            "tools": el.properties.Tools.multi_select.map((tool: any) => {return tool.name}),
            "year": el.properties.Year.number,
            "logo": (el.properties.Logo.files.length > 0 ? el.properties.Logo.files[0].file.url : '')
        }}).sort((a: any,b: any) => { return b.year - a.year});
    
        type Timeline = {
            [key: string]: TimelineYear
        }

        let timeline: Timeline = {};
        
        projects.forEach((project: any) => {
            let index = project.year.toString() as string;
            
            if(!Object.keys(timeline).includes(index)){
    
                timeline[index] = {
                    'year': project.year,
                    'projects': [ project ]
                };
    
            }else{
                timeline[index].projects.push(project);
            }
    
        });
        
        res.send(timeline);    
    }catch(err){
        console.error(err);
        res.send([]);
    }
});

// Launch server
server.listen({ port: PORT }, (err, addr) => {

    if(err){
        console.error(err);
        exit(1);
    }

    console.log('Server is listening on ' + addr);

});