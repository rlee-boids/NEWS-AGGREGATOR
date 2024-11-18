import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const getDbConnection = async () => {
  return open({
    filename: './news.db',
    driver: sqlite3.Database,
  });
};
