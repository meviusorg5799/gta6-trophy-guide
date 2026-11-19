[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/meviusorg5799/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/meviusorg5799/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI

Entry for the [make.fun bounty gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01): build the best GTA 6 trophy guide.

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden until earned). Every trophy is shown with its official name, description and grade, a guide written in our own words with its source named, a checklist that saves progress in the browser, filters by grade and kind, a spoiler shield that hides story and secret trophies until earned, export and import of progress, a five-phase roadmap to the platinum, and a missables list built from the official descriptions.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` — no build step, no network requests at run time. It works with the network off.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library in `vendor/makefun-frontend.ts`.

## Sources

Trophy names, descriptions, grades, points and hidden flags come from the official PlayStation 5 list, as listed by Exophase and PSNProfiles. Counts and facts drawn from other guides are named beside the trophy they belong to (see the Sources tab in the app). Guides are written in our own words; nothing is copied from another guide. No Rockstar logo or official artwork is used.

## License

MIT — see [LICENSE](LICENSE).
