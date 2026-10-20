import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';
let pool;
export function database(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is missing');if(!pool){pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,idleTimeoutMillis:5000,connectionTimeoutMillis:10000});attachDatabasePool(pool);}return pool;}
