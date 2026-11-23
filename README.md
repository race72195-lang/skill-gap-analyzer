# Skill Gap Analyzer

**Live demo: https://race72195-lang.github.io/skill-gap-analyzer/**

A small web app for job seekers in data. Paste a job posting (English or Russian) and it shows:

- which data skills the vacancy asks for (SQL, Python, Power BI, A/B testing and 80+ others);
- how well your skills match, as a percentage;
- which skills are missing;
- which of your portfolio projects to mention in the application.

A second mode takes **several vacancies at once** and ranks skills by how often they are requested, marking the ones you do not have. This turns a pile of postings into a learning priority list.

Everything runs in the browser. No server, no accounts, no data leaves the page.

## How it works

1. **Skill dictionary:** 83 skills in 8 categories, each with regular expressions that cover English and Russian word forms (for example `статистик[а-я]*` catches "статистика", "статистики", "статистику").
2. **Whole-word matching with Unicode:** a skill matches only as a separate word, so "NoSQL" is not SQL, "excellent" is not Excel, "GitHub" is not Git, "JSON" is not JS, and "R&D" or "R-squared" is not the language R.
3. **Match score:** the share of the vacancy's skills that are in your profile. Your profile is a set of switches that you edit and that is saved in your browser.
4. **Project suggestions:** every portfolio project lists the skills it gives evidence for (edit `PROJECTS` in `docs/engine.js`); the app proposes the projects that cover the most skills from the vacancy.
5. **Several vacancies:** postings are separated by a line with `---`; the app counts in how many postings each skill appears.

## By profession mode

Type a profession and level (for example `стажировка data analyst`, `ML инженер junior`, `product analyst intern`) or click the buttons. The app shows how many required skills of that role you cover, what is missing (with a short learning order), nice-to-have skills, projects to mention, and your fit across all 7 professions at that level. Levels: internship, junior, middle (middle includes the requirements of the lower levels).

The role requirements are my own estimates of what typical postings ask for, not market data. Use the vacancy tabs with real postings for exact numbers.

## Results

On six sample vacancies (three English, three Russian, written for this demo) with the sample profile, the match ranged from 27% (a BI-heavy posting with ClickHouse, ETL and DataLens) to 78%, and the average match was **68%**. Python appeared in all six postings, English and SQL in four of six.

**Tests:** 20 hand-labelled text snippets, including tricky cases for false matches (NoSQL, R&D, R-squared, GitHub, JSON, excellent). All 20 pass (precision and recall 100%). Because the author wrote both the snippets and the dictionary, this shows the logic is correct on the known traps, not how it performs on every real posting.

```bash
node tests/run_tests.js
```

## Limitations

- The dictionary is hand-made, so unusual wording or skills outside the dictionary are missed. It is not an AI model and does not understand context.
- "Required" and "nice to have" are not distinguished: a skill after "will be a plus" counts like a must-have.
- Skills are on or off; levels (beginner, expert) are not modelled.
- The match percentage is a simple ratio, a conversation starter and not a prediction of being hired.
- The sample vacancies are demo texts, not real postings, so the market ranking on them is illustrative.

## Run it

Open `docs/index.html` in any browser. No installation needed.

## Publish it as a link (GitHub Pages)

Repository **Settings -> Pages -> Source: Deploy from a branch -> Branch: main, folder: /docs -> Save**. After a minute the page is available at `https://<username>.github.io/skill-gap-analyzer/`.

## Project structure

```
docs/index.html       the web app (interface)
docs/engine.js        skill dictionary, extraction, matching and ranking (works in browser and Node)
tests/cases.json      hand-labelled test snippets
tests/run_tests.js    test runner (Node)
```

---
Alizhan Islam | https://www.linkedin.com/in/alizhan-islam-960790362 | alizhan1809@gmail.com
