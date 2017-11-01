# Waka

[![Maintainability](https://api.codeclimate.com/v1/badges/bf59f49c861eee7e624e/maintainability)](https://codeclimate.com/github/consindo/waka/maintainability)
[![Dependency Status](https://david-dm.org/consindo/waka.svg?theme=shields.io)](https://david-dm.org/consindo/waka)
[![devDependency Status](https://david-dm.org/consindo/waka/dev-status.svg?theme=shields.io)](https://david-dm.org/consindo/waka#info=devDependencies)

![Waka Icon](https://raw.githubusercontent.com/consindo/waka/master/dist/branding/launcher-icon-3x.png)

Your guide around public transport in Auckland & Wellington. Help us add more cities!

<https://getwaka.com>

## Client Development
- You'll need node.js & npm installed. (at least v8)
- `npm install` to install deps.
- `npm run watch:live` to watch and recompile js & css
- Go to `http://localhost:8009`

### Code Style
- Run it through Prettier <https://github.com/prettier/prettier>


### Start (after config has been set)
- `node index` to run server on :8000.
- Private API will be running on :8001
- `npm run build` to production build js & css. Service Worker is enabled.
- Use `npm run watch` to dev client and server at the same time. Automatically proxies :8009/a to :8000/a. Service Worker is disabled.