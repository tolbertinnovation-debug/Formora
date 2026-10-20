import { readFile } from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('Set a direct DATABASE_URL before running migrations.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{await client.query(await readFile(new URL('../migrations/001_cloud_workspace.sql',import.meta.url),'utf8'));console.log('Formora schema is ready.');}finally{await client.end();}
