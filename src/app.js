const express = require("express");
const cors = require("cors");

const { uuid, isUuid } = require('uuidv4');

const app = express();

app.use(express.json());
app.use(cors());

const repositories = [];

//Middlewares & helpers

function validateUuid(request, response, next) {
  const {id} = request.params;
  if(!isUuid(id)){
    response.status(400).json({
      status: 400, 
      message: "id inválido"
    });
  }

  return next();
}

function findRepo(response, id) {
  const requiredRepo = repositories.find(repo => {
    return repo.id == id
  });
  
  if(!requiredRepo){
    response.status(404).json({
      status: 404, 
      message: "Repositório não encontrado"
    });
  }

  return requiredRepo;
}

function queryRepo(repo, urlQuery, titleQuery, techQuery){
  const containsTech = techQuery.split(",").find(tech => repo.techs.includes(tech))

  return repo.url.includes(urlQuery || repo.url) &&
          repo.title.includes(titleQuery || repo.title) &&
          containsTech
}

//Routes

app.get("/repositories", (request, response) => {
  const urlQuery = request.query.url,
        titleQuery = request.query.title,
        techQuery = request.query.techs;

  var repoResponse = [];
  if(urlQuery || titleQuery || techQuery) {
    repoResponse = repositories.filter(repo => queryRepo(repo, urlQuery, titleQuery, techQuery));
  } else {
    repoResponse = repositories;
  }

  response.json(repoResponse);
});

app.post("/repositories", (request, response) => {
  const {title, url, techs} = request.body;

  if(!title || !url || !techs) {
    response.status(500).json({
      status: 500, 
      message: "Erro ao criar repositório, certifique-se de que passou todos os parâmetros corretamente (title, url e techs)"
    })
  }

  const newRepo = {
    id: uuid(), 
    title, 
    url, 
    techs,
    likes: 0
  };

  repositories.push(newRepo);
  response.json(newRepo);
});

app.get("/repositories/:id", validateUuid, (request, response) => {
  const {id} = request.params;

  const requiredRepo = findRepo(response, id);

  response.json(requiredRepo);
});

app.put("/repositories/:id", validateUuid, (request, response) => {
  const {id} = request.params;
  const {title, url, techs} = request.body;

  const requiredRepo = findRepo(response, id);

  if(requiredRepo){
    const requiredRepoIndex = repositories.indexOf(requiredRepo);

    const updatedRepo = {
      id: requiredRepo.id,
      title: title || requiredRepo.title,
      url: url || requiredRepo.url,
      techs: techs || requiredRepo.techs,
      likes: requiredRepo.likes
    };
    
    repositories[requiredRepoIndex] = updatedRepo;

    response.json(updatedRepo);
  }
});

app.delete("/repositories/:id", validateUuid, (request, response) => {
  const {id} = request.params;

  const requiredRepo = findRepo(response, id);

  if(requiredRepo){
    const requiredRepoIndex = repositories.indexOf(requiredRepo);

    repositories.splice(requiredRepoIndex, 1);

    response.status(204).json({
      status: 204,
      message: "Succes!"
    });
  }
});

app.post("/repositories/:id/like", validateUuid, (request, response) => {
  const {id} = request.params;

  const requiredRepo = findRepo(response, id);

  if(requiredRepo){
    const requiredRepoIndex = repositories.indexOf(requiredRepo);

    requiredRepo.likes = requiredRepo.likes+1;
    repositories[requiredRepoIndex] = requiredRepo;

    response.json(requiredRepo);
  }
});

module.exports = app;
