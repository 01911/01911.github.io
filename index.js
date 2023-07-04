const jsdom = require('jsdom');
const express = require('express');
const cors = require('cors');

const comando = require('./comando');
const lapumia = require('./lapumia');

const { JSDOM } = jsdom;
const BASE_URL = process.env.BASE_URL || 'https://3ae7066cd73c148e477bfbaea60b36be.github.io';
const sources = [comando, lapumia];

const app = express();
app.use(cors());

app.get('/', async (request, response) => {
  const search = BASE_URL + '/search?search_query=a';
  
  return response.json({ search });
});

app.get('/detail', async (request, response) => {
  const { url = '' } = request.query;
  const alias = url.split('/')[2].replace('www.', '');

  const [engine] = sources.filter((item) => item.getOriginUrl().includes(alias));

  if (!engine || !engine.detail) {
    const available = Object.values(sources).map((item) => item.getOriginUrl()).join(', ');
    throw new Error(`Engine not found: ${alias}. Available: ${available}`);
  }
  
  const infoWithMagnets = await engine.detail({ url });
  
  response.header("Content-Type",'application/json');
  return response.send(JSON.stringify(infoWithMagnets, null, 4));
})

app.get('/search', async (request, response) => {
  const { search_query = '' } = request.query;
  
  let results = [];

  for (i=0; i < sources.length; i++) {
    const engine = sources[i];
    
    try {
      const resultsOfCurrentEngine = await engine.search({ search_query });

      results = [...results, ...resultsOfCurrentEngine];
    } catch (error) {
      console.log('error on: ' + engine.getOriginUrl());
    }
  }
  

  const _results = results.map((item) => ({
    ...item,
    LINK_TO_GET_MAGNETS: BASE_URL + '/detail?url=' + item.desc_link
  }));
  
  response.header("Content-Type",'application/json');
  return response.send(JSON.stringify(_results, null, 4));
})

app.listen(process.env.PORT || 3333);
