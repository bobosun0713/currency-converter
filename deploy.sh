#!/usr/bin/env sh
set -e

pnpm vite build --base=/currency-converter/

cd dist

if [ ! -d ".git" ]; then
  git init
fi

git add -A
git commit -m 'deploy to github pages'

git push -f https://github.com/bobosun0713/currency-converter.git master:gh-pages

cd -
