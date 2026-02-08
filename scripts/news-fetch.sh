#!/usr/bin/env sh
set -eu

node scripts/news_pipeline.mjs fetch "$@"
