const jsdom = require('jsdom');
//import fs from 'fs';

const { JSDOM } = jsdom;

class Lapumia {
  getOriginUrl() {
    return 'https://lapumia.org';
    //return 'https://www.comandotorrent.tv';
  }

  async detail({ url }) {
    const response = await JSDOM.fromURL(url);
    //const response = await JSDOM.fromFile('./src/assets/fakes/html/magnet-source/detail/ct-detail.html');

    const { document } = response.window;

    const name = document.querySelector('h1')?.textContent
    const desc_link = document.querySelector('h1 a')?.getAttribute('href')
    const thumb = document.querySelector('.content img')?.getAttribute('src');

    const getLinks = (link) => {
      let text = link.closest('p')?.innerText || ''
      //text = text.replace(String(link.textContent), "")

      text = !text
        ? String(new URLSearchParams(String(link.getAttribute('href'))).get('dn'))
        : text;

      return { url: String(link.getAttribute('href')), text, type: 'magnet' }
    }

    const links = [...document.querySelectorAll('a[href^="magnet"]')]
      .map(el => getLinks(el))
      .filter(item => item.url.includes('magnet'))

    return { name: String(name), thumb: String(thumb), links, engine_url: this.getOriginUrl(), desc_link: String(desc_link) };
  }

  async parseResults(document, selector) {

    const getContent = async (art) => {
      //const { links } = await this.detail(String(art.querySelector('h2 a')?.getAttribute('href')));

      return {
        name: String(art.querySelector('.title a')
          ?.textContent
          ?.replace(/\n|\r|\t/g, '')
          ?.replace(/\\n|\\r|\\t/g, '')
          ?.replace(/\s{2,}/g, '')),
        thumb: String(art.querySelector('img')?.getAttribute('src')),
        links: [],
        engine_url: this.getOriginUrl(),
        desc_link: String(art.querySelector('.title a')?.getAttribute('href')),
      }
    };

    const elements = [...document.querySelectorAll(selector)];
    let contents = [];

    for (let i = 0; i < elements.length; i++) {
      contents.push(await getContent(elements[i]));
    }

    return contents;
  }

  async parseResultsAside(document, selector) {

    const getContent = async (art, thumb) => {

      return {
        name: String(art.querySelector('a')
          ?.getAttribute('title')
          ?.replace(/\n|\r|\t/g, '')
          ?.replace(/\\n|\\r|\\t/g, '')
          ?.replace(/\s{2,}/g, '')),
        thumb: String(thumb.querySelector(`img`)?.getAttribute('src')),
        links: [],
        engine_url: this.getOriginUrl(),
        desc_link: String(art.querySelector('a')?.getAttribute('href')),
      }
    };

    const elements = [...document.querySelectorAll(selector)];
    let contents = [];

    for (let i = 0; i < elements.length; i++) {
      if (i % 2 === 0) {
        continue;
      }
      contents.push(await getContent(elements[i], elements[i - 1]));
    }

    return contents;
  }

  async search({ search_query }) {
    const url = `${this.getOriginUrl()}/?s=${search_query}`
    const response = await JSDOM.fromURL(url);
    //const response = await JSDOM.fromFile('./src/modules/magnetSource/infra/crosscutting/repositories/ct.html');

    const { document } = response.window;

    const results = await this.parseResults(document, '.posts .post');

    return results;
  }

  async top() {
    const url = this.getOriginUrl();
    const response = await JSDOM.fromURL(url);

    const { document } = response.window;
    const recents = await this.parseResults(document, '.posts .post');
    const top = await this.parseResultsAside(document, 'ul.wpp-list:nth-of-type(1) li');

    return { top, recents };
  }
}

const lapumia = new Lapumia();
module.exports = lapumia;
