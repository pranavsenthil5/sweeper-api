const express = require("express");
const dotenv = require("dotenv");
const request = require("request");
const cors = require("cors");

const databaseManager = require("./dbmanager");

db = new databaseManager();

db.startServer();
db.setupTables();

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/metrics", (req, res) => {
  console.log("Calling metrics API");
  var options = {
    url: "https://sonarcloud.io/api/metrics/search",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    qs: {
      ps: 500,
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send("Internal Server Error");
    }
    res.send(body);
  });
});

app.get("/api/projects", (req, res) => {
  console.log("Calling projects API");
  var options = {
    url: "https://sonarcloud.io/api/projects/search",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    qs: {
      organization: "pranavsenthil5",
      ps: 500,
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send("Internal Server Error");
    }
    res.send(body);
  });
});

app.get("/api/project/:repo_name", async (req, res) => {
  project = await db.getProjectByName(req.params.repo_name);
  if (project) {
    console.log(project);
    if (project.length > 0) {
      res.send(project[0]);
    }
  }
  var repo_name = req.params.repo_name;
  var github_url = req.body.github_url;

  API_URL = "https://sonarcloud.io/api/projects/create";

  var options = {
    url: API_URL,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    form: {
      organization: "pranavsenthil5",
      project: repo_name,
      name: repo_name,
    },
  };

  request.post(options, (error, response, body) => {
    if (error) {
      res.status(500).send("Internal Server Error");
    }

    if (body?.errors) {
      console.log("Project already exists");
    } else {
      db.addProject(
        repo_name,
        repo_name,
        "pranavsenthil5",
        "public",
         github_url
      );
    }
    res.send(body);
  });
});

app.get("/api/measures/:key", async (req, res) => {
  console.log("Calling measures API, key: ", req.params.key, "Metrics: ", req.query);

  key = req.params.key;
  var options = {
    url: `https://sonarcloud.io/api/measures/search_history`,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
    qs: {
      component: key,
      metrics: req.query.metric_keys,
    },
  };
  request(options, (error, response, body) => {
    if (error) {
      res.status(500).send("Internal Server Error");
    }
    res.send(body);
  });
});

app.post("/api/choose/:key", (req, res) => {
  key = req.params.key;
  chosen_metrics = req.body.chosen_metrics;
  
  db.addChoice(key, chosen_metrics); 
  res.send("Metrics chosen");
});

app.get("/api/chosen/:key", async (req, res) => {
  console.log("Getting chosen metrics, key: ", req.params.key); 
  key = req.params.key;
  choice = await db.getLastChoiceByProjectKey(key);
  console.log("Choice: ", choice);
  metrics = choice.metric_keys;
//looks like string  Metrics:  '{"428","350","351","423","319","352","317","318","354","308","309","315","421","313","306","289","163","422","78","79","277"}'
  
  // split the string into an array of strings
  metrics = metrics.split(",");
  // remove the quotes from each string
  metrics = metrics.map((metric) => metric.replace(/"/g, ""));
  // remove the curly braces from the first and last elements
  metrics[0] = metrics[0].replace("{", "");
  metrics[metrics.length - 1] = metrics[metrics.length - 1].replace("}", "");

  
  

  console.log("Metrics: ", metrics);
  
  var output = "";
  for (var i = 0; i < metrics.length; i++) {
    output += metrics[i];
    if (i < metrics.length - 1) {
      output += ",";
    }
  }

  output_json = {
    metrics: metrics,
  };

  // return the metrics as a comma separated string
  res.send(output_json);
});