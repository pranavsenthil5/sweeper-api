const express = require('express');
const { Pool } = require('pg');

class DatabaseManager {
  constructor() {
    this.pool = new Pool({
      user: 'node',
      host: 'localhost',
      database: 'postgres',
      password: 'node',
      port: 5432,
    });

    this.app = express();
    this.app.use(express.json());
    this.port = 8080;
  }

  async createProjectsTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          organization VARCHAR(255) NOT NULL,
          visibility VARCHAR(255) NOT NULL,
          github VARCHAR(255) NOT NULL
        );
      `;
      await this.pool.query(query);
      console.log('Projects table created');
    } catch (err) {
      console.error(err);
      console.error('Projects table creation failed');
    }
  }

  async createChoicesTable() {
    // id, project_key, metric_keys (array of strings) 
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS choices (
          id SERIAL PRIMARY KEY,
          project_key VARCHAR(255) NOT NULL,
          metric_keys VARCHAR(255) NOT NULL
        );
      `;
      await this.pool.query(query);
      console.log('Choices table created');
    } catch (err) {
      console.error(err);
      console.error('Choices table creation failed');
    }
  }

  startServer() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }

  setupTables() {
    this.createProjectsTable();
    this.createChoicesTable();
  }
  async addProject(key, name, organization, visibility, github) {
    try {
      const query = `
        INSERT INTO projects (key, name, organization, visibility, github)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [key, name, organization, visibility];
      const res = await this.pool.query(query, values);
      console.log('Project added to table');
      return res.rows[0];
    } catch (err) {
      console.error(err);
      console.error('Project addition failed');
    }
  }

  async addChoice(project_key, metric_keys) {
    try {
      const query = `
        INSERT INTO choices (project_key, metric_keys)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const values = [project_key, metric_keys];
      const res = await this.pool.query(query, values);
      console.log('Choice added to table');
      return res.rows[0];
    } catch (err) {
      console.error(err);
      console.error('Choice addition failed');
    }
  }

  async getLastChoiceByProjectKey(project_key) {
    try {
      const query = `
        SELECT * FROM choices
        WHERE project_key = $1
        ORDER BY id DESC
        LIMIT 1;
      `;
      const values = [project_key];
      const res = await this.pool.query(query, values);
      console.log('Choice retrieved from table');
      return res.rows[0];
    } catch (err) {
      console.error(err);
      console.error('Choice retrieval failed');
    }
  }

  async getProjectByName(name) {
    try {
      const query = `
        SELECT * FROM projects
        WHERE name = $1;
      `;
      const values = [name];
      const res = await this.pool.query(query, values);
      console.log('Project retrieved from table');
      return res.rows;
    } catch (err) {
      console.error(err);
      console.error('Project retrieval failed');
    }
  }

  async closePool() {
    await this.pool.end();
    console.log('Pool has been closed');
  }
}

module.exports = DatabaseManager;