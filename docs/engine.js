/* Skill Gap Analyzer: engine.
 * Works in the browser (window.SkillEngine) and in Node (require). No dependencies.
 * Finds data-related skills in vacancy text (English and Russian) with a hand-made dictionary,
 * compares them with your skills and ranks skills across many vacancies. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SkillEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const L = "\\p{L}\\p{N}_";

  // n = canonical name, c = category, p = regex fragments (case-insensitive, matched as whole words;
  // Russian word endings are covered with [а-яё]*), cs = case-sensitive (used for the letter R)
  const SKILLS = [
    // Programming
    { n: "Python", c: "Programming", p: ["python", "питон[а-яё]*"] },
    { n: "SQL", c: "Programming", p: ["sql"] },
    { n: "R", c: "Programming", p: ["R"], cs: true },
    { n: "Java", c: "Programming", p: ["java"] },
    { n: "JavaScript", c: "Programming", p: ["javascript", "js"] },
    { n: "Scala", c: "Programming", p: ["scala"] },
    { n: "C++", c: "Programming", p: ["c\\+\\+"] },
    { n: "VBA", c: "Programming", p: ["vba"] },
    { n: "Bash", c: "Programming", p: ["bash", "shell"] },
    { n: "Git", c: "Programming", p: ["git", "гит[а-яё]*"] },
    // Python libraries
    { n: "pandas", c: "Python libraries", p: ["pandas"] },
    { n: "NumPy", c: "Python libraries", p: ["numpy"] },
    { n: "SciPy", c: "Python libraries", p: ["scipy"] },
    { n: "scikit-learn", c: "Python libraries", p: ["scikit[- ]?learn", "sklearn"] },
    { n: "TensorFlow", c: "Python libraries", p: ["tensorflow"] },
    { n: "PyTorch", c: "Python libraries", p: ["pytorch"] },
    { n: "Keras", c: "Python libraries", p: ["keras"] },
    { n: "XGBoost", c: "Python libraries", p: ["xgboost", "lightgbm", "catboost"] },
    { n: "matplotlib", c: "Python libraries", p: ["matplotlib"] },
    { n: "seaborn", c: "Python libraries", p: ["seaborn"] },
    { n: "Plotly", c: "Python libraries", p: ["plotly"] },
    { n: "Streamlit", c: "Python libraries", p: ["streamlit"] },
    { n: "Jupyter", c: "Python libraries", p: ["jupyter"] },
    { n: "statsmodels", c: "Python libraries", p: ["statsmodels"] },
    // BI and spreadsheets
    { n: "Excel", c: "BI and spreadsheets", p: ["excel", "эксел[а-яё]*", "ексел[а-яё]*"] },
    { n: "Google Sheets", c: "BI and spreadsheets", p: ["google sheets", "google таблиц[а-яё]*", "гугл[- ]таблиц[а-яё]*"] },
    { n: "Power BI", c: "BI and spreadsheets", p: ["power[ -]?bi", "пауэр[ -]?би", "повер[ -]?би"] },
    { n: "Tableau", c: "BI and spreadsheets", p: ["tableau", "табло"] },
    { n: "Looker", c: "BI and spreadsheets", p: ["looker"] },
    { n: "Qlik", c: "BI and spreadsheets", p: ["qlik(?:view|sense)?"] },
    { n: "Superset", c: "BI and spreadsheets", p: ["superset", "metabase"] },
    { n: "DataLens", c: "BI and spreadsheets", p: ["datalens", "даталенс"] },
    { n: "Grafana", c: "BI and spreadsheets", p: ["grafana"] },
    { n: "DAX", c: "BI and spreadsheets", p: ["dax", "power query"] },
    { n: "Pivot tables / VLOOKUP", c: "BI and spreadsheets", p: ["pivot[a-z ]*", "vlookup", "xlookup", "сводн[а-яё]+ таблиц[а-яё]*", "впр"] },
    // Databases
    { n: "PostgreSQL", c: "Databases", p: ["postgres(?:ql)?", "постгрес[а-яё]*"] },
    { n: "MySQL", c: "Databases", p: ["mysql"] },
    { n: "SQLite", c: "Databases", p: ["sqlite"] },
    { n: "MS SQL Server", c: "Databases", p: ["ms[ -]?sql", "sql server", "mssql", "t-sql"] },
    { n: "Oracle", c: "Databases", p: ["oracle"] },
    { n: "ClickHouse", c: "Databases", p: ["clickhouse", "кликхаус[а-яё]*"] },
    { n: "BigQuery", c: "Databases", p: ["bigquery"] },
    { n: "Snowflake", c: "Databases", p: ["snowflake"] },
    { n: "MongoDB", c: "Databases", p: ["mongodb", "mongo"] },
    { n: "Redis", c: "Databases", p: ["redis"] },
    { n: "Hive", c: "Databases", p: ["hive", "vertica"] },
    // Data engineering and tools
    { n: "Spark", c: "Data engineering", p: ["spark", "pyspark"] },
    { n: "Hadoop", c: "Data engineering", p: ["hadoop"] },
    { n: "Airflow", c: "Data engineering", p: ["airflow"] },
    { n: "Kafka", c: "Data engineering", p: ["kafka"] },
    { n: "dbt", c: "Data engineering", p: ["dbt"] },
    { n: "ETL", c: "Data engineering", p: ["etl", "elt"] },
    { n: "Data warehouse", c: "Data engineering", p: ["dwh", "data warehouse[a-z]*", "хранилищ[а-яё]+ данных"] },
    { n: "Docker", c: "Data engineering", p: ["docker"] },
    { n: "Linux", c: "Data engineering", p: ["linux"] },
    { n: "AWS", c: "Data engineering", p: ["aws", "amazon web services"] },
    { n: "Azure", c: "Data engineering", p: ["azure"] },
    { n: "Google Cloud", c: "Data engineering", p: ["gcp", "google cloud"] },
    { n: "GitHub", c: "Data engineering", p: ["github", "gitlab"] },
    // Analytics methods
    { n: "A/B testing", c: "Analytics methods", p: ["a/b", "а/б", "ab[- ]?test[a-z]*", "аб[- ]?тест[а-яё]*", "а/б[- ]?тест[а-яё]*", "split[- ]?test[a-z]*", "сплит[- ]?тест[а-яё]*", "experiment[s]?", "эксперимент[а-яё]*"] },
    { n: "Statistics", c: "Analytics methods", p: ["statistic[a-z]*", "статистик[а-яё]*", "статистическ[а-яё]+"] },
    { n: "Hypothesis testing", c: "Analytics methods", p: ["hypothes[ie]s", "гипотез[а-яё]*", "p-value"] },
    { n: "Regression", c: "Analytics methods", p: ["regression[s]?", "регресси[а-яё]*"] },
    { n: "Classification", c: "Analytics methods", p: ["classification", "классификаци[а-яё]*"] },
    { n: "Clustering", c: "Analytics methods", p: ["cluster[a-z]*", "кластер[а-яё]*", "segmentation", "сегментаци[а-яё]*"] },
    { n: "Time series", c: "Analytics methods", p: ["time[- ]series", "временн[а-яё]+ ряд[а-яё]*"] },
    { n: "Forecasting", c: "Analytics methods", p: ["forecast[a-z]*", "прогноз[а-яё]*"] },
    { n: "Machine learning", c: "Analytics methods", p: ["machine learning", "ml", "машинн[а-яё]+ обучени[а-яё]*"] },
    { n: "Deep learning", c: "Analytics methods", p: ["deep learning", "neural networks?", "нейронн[а-яё]+ сет[а-яё]*", "нейросет[а-яё]*"] },
    { n: "NLP", c: "Analytics methods", p: ["nlp", "natural language processing"] },
    { n: "Cohort analysis", c: "Analytics methods", p: ["cohort[a-z]*", "когортн[а-яё]+"] },
    { n: "Product analytics", c: "Analytics methods", p: ["product analytics", "продуктов[а-яё]+ аналитик[а-яё]*"] },
    { n: "Web analytics", c: "Analytics methods", p: ["google analytics", "яндекс[. ]?метрик[а-яё]*", "yandex metrica", "amplitude", "mixpanel", "appmetrica"] },
    { n: "Data visualization", c: "Analytics methods", p: ["data visuali[sz]ation", "visuali[sz]ation[s]?", "визуализаци[а-яё]*"] },
    { n: "Dashboards", c: "Analytics methods", p: ["dashboards?", "дашборд[а-яё]*"] },
    { n: "Data cleaning", c: "Analytics methods", p: ["data cleaning", "data cleansing", "data preparation", "data wrangling", "очистк[а-яё]+ данных", "подготовк[а-яё]+ данных"] },
    { n: "EDA", c: "Analytics methods", p: ["eda", "exploratory[a-z ]*", "разведочн[а-яё]+ анализ[а-яё]*"] },
    { n: "KPI / metrics", c: "Analytics methods", p: ["kpi[s]?", "metrics", "метрик[а-яё]*"] },
    { n: "Reporting", c: "Analytics methods", p: ["reporting", "reports?", "отч[её]тност[а-яё]*", "отч[её]т[а-яё]*"] },
    // Languages and soft skills
    { n: "English", c: "Languages and soft skills", p: ["english", "английск[а-яё]*"] },
    { n: "Chinese", c: "Languages and soft skills", p: ["chinese", "mandarin", "китайск[а-яё]*"] },
    { n: "Communication", c: "Languages and soft skills", p: ["communication", "коммуникативн[а-яё]+", "коммуникаци[а-яё]*"] },
    { n: "Presentation", c: "Languages and soft skills", p: ["presentations?", "презентаци[а-яё]*", "storytelling"] },
  ];

  // Projects that give evidence for skills (edit this list for your own portfolio)
  const PROJECTS = [
    { name: "Telco customer churn prediction", skills: ["Python", "pandas", "scikit-learn", "Machine learning", "Classification", "matplotlib", "seaborn", "Data visualization", "Data cleaning", "EDA"] },
    { name: "Olist e-commerce SQL analysis", skills: ["SQL", "SQLite", "Python", "pandas", "matplotlib", "KPI / metrics", "Reporting", "Data visualization"] },
    { name: "Cookie Cats A/B test", skills: ["A/B testing", "Statistics", "Hypothesis testing", "Python", "SciPy", "pandas", "matplotlib", "Data visualization"] },
    { name: "Superstore Excel dashboard", skills: ["Excel", "Dashboards", "KPI / metrics", "Reporting", "Data visualization"] },
    { name: "RFM customer segmentation", skills: ["Clustering", "Python", "pandas", "scikit-learn", "Machine learning", "Data cleaning", "Data visualization"] },
    { name: "Diabetes progression regression", skills: ["Regression", "Statistics", "Python", "scikit-learn", "pandas", "Machine learning"] },
    { name: "Breast tumour classification", skills: ["Classification", "Machine learning", "scikit-learn", "Python", "Statistics"] },
    { name: "Sales forecasting", skills: ["Time series", "Forecasting", "Python", "pandas", "matplotlib"] },
    { name: "Handwritten digit recognizer", skills: ["Machine learning", "Deep learning", "Python", "scikit-learn", "JavaScript"] },
  ];

  const DEFAULT_PROFILE = ["Python", "pandas", "NumPy", "SciPy", "scikit-learn", "matplotlib", "seaborn", "SQL", "SQLite",
    "Excel", "A/B testing", "Statistics", "Hypothesis testing", "Regression", "Classification", "Clustering", "Machine learning",
    "Time series", "Forecasting", "Data visualization", "Dashboards", "Data cleaning", "EDA", "KPI / metrics", "Reporting", "English", "Chinese"];

  const compiled = SKILLS.map(s => {
    const body = s.p.join("|");
    let src;
    if (s.cs) src = "(?<![" + L + "&/.+#'\\-])(?:" + body + ")(?![" + L + "&.+#'\\-])";
    else src = "(?<![" + L + "])(?:" + body + ")(?![" + L + "])";
    return { skill: s, re: new RegExp(src, s.cs ? "u" : "iu") };
  });

  function normalize(t) { return String(t || "").replace(/[ ‐-―]/g, " ").replace(/ё/g, "е").replace(/Ё/g, "Е"); }
  function norm(t) { return String(t || "").replace(/[ ‐-―]/g, " "); }

  function extractSkills(text) {
    const t = norm(text), found = [];
    for (const { skill, re } of compiled) if (re.test(t)) found.push(skill.n);
    return found;
  }

  function categoryOf(name) { const s = SKILLS.find(x => x.n === name); return s ? s.c : ""; }

  function analyseVacancy(text, mySkills) {
    const have = new Set(mySkills), required = extractSkills(text);
    const matched = required.filter(s => have.has(s)), missing = required.filter(s => !have.has(s));
    const matchPct = required.length ? Math.round(100 * matched.length / required.length) : null;
    // projects that cover the most matched skills
    const ranked = PROJECTS.map(p => ({ name: p.name, covers: p.skills.filter(s => matched.includes(s) || (required.includes(s))) }))
      .filter(p => p.covers.length).sort((a, b) => b.covers.length - a.covers.length).slice(0, 3);
    return { required, matched, missing, matchPct, projects: ranked };
  }

  function splitVacancies(text) {
    return String(text || "").split(/^\s*-{3,}\s*$/m).map(s => s.trim()).filter(s => s.length > 0);
  }

  function analyseMarket(vacancies, mySkills) {
    const have = new Set(mySkills), counts = new Map();
    const per = vacancies.map(v => extractSkills(v));
    per.forEach(list => list.forEach(s => counts.set(s, (counts.get(s) || 0) + 1)));
    const n = vacancies.length;
    const rows = [...counts.entries()].map(([skill, count]) => ({ skill, category: categoryOf(skill), count, share: count / n, have: have.has(skill) }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
    const avgMatch = per.length ? Math.round(100 * per.reduce((a, l) => a + (l.length ? l.filter(s => have.has(s)).length / l.length : 0), 0) / per.length) : null;
    return { n, rows, avgMatch, gaps: rows.filter(r => !r.have).slice(0, 8) };
  }

  // ---- Role profiles: hand-made estimates of what each role typically asks for (not market data) ----
  // core = needed even for an internship; junior = added at junior level; middle = added at middle level; nice = bonus
  const ROLES = [
    { id: "data-analyst", name: "Data Analyst", names: ["data analyst", "аналитик данных", "дата аналитик", "дата-аналитик", "аналитик", "analyst"],
      core: ["SQL", "Excel", "Python", "Statistics", "Data cleaning", "Data visualization", "Reporting"],
      junior: ["pandas", "EDA", "KPI / metrics", "Dashboards", "A/B testing", "Communication"],
      middle: ["Hypothesis testing", "Power BI", "Tableau", "Git", "Presentation", "Regression"],
      nice: ["matplotlib", "seaborn", "PostgreSQL", "Google Sheets", "English"] },
    { id: "bi-analyst", name: "BI Analyst", names: ["bi analyst", "bi аналитик", "аналитик bi", "bi-аналитик", "business intelligence", "bi developer", "bi разработчик"],
      core: ["SQL", "Excel", "Dashboards", "Data visualization", "Reporting"],
      junior: ["Power BI", "Tableau", "KPI / metrics", "Data cleaning", "ETL", "Communication"],
      middle: ["DAX", "Data warehouse", "PostgreSQL", "Python", "Presentation", "Git"],
      nice: ["Looker", "DataLens", "Qlik", "ClickHouse", "English"] },
    { id: "product-analyst", name: "Product Analyst", names: ["product analyst", "продуктовый аналитик", "аналитик продукта", "продуктовая аналитика", "product analytics"],
      core: ["SQL", "Excel", "KPI / metrics", "Statistics", "Product analytics"],
      junior: ["A/B testing", "Hypothesis testing", "Python", "pandas", "Cohort analysis", "Data visualization", "Communication"],
      middle: ["Dashboards", "Regression", "Presentation", "Git", "Tableau", "Power BI"],
      nice: ["Web analytics", "ClickHouse", "Looker", "English"] },
    { id: "marketing-analyst", name: "Marketing / Web Analyst", names: ["marketing analyst", "маркетинговый аналитик", "аналитик маркетинга", "web analyst", "веб аналитик", "веб-аналитик", "digital analyst"],
      core: ["Excel", "Web analytics", "KPI / metrics", "Reporting", "Data visualization"],
      junior: ["SQL", "A/B testing", "Dashboards", "Google Sheets", "Statistics", "Communication"],
      middle: ["Python", "Cohort analysis", "Power BI", "Tableau", "Presentation", "BigQuery"],
      nice: ["Looker", "Product analytics", "English"] },
    { id: "data-scientist", name: "Data Scientist", names: ["data scientist", "дата сайентист", "дата-сайентист", "специалист по данным", "data science"],
      core: ["Python", "Statistics", "Machine learning", "pandas", "SQL"],
      junior: ["scikit-learn", "NumPy", "Classification", "Regression", "EDA", "Git", "Jupyter", "Data visualization"],
      middle: ["Hypothesis testing", "A/B testing", "Clustering", "Time series", "XGBoost", "Docker", "Deep learning"],
      nice: ["PyTorch", "TensorFlow", "NLP", "Spark", "English", "Linux"] },
    { id: "ml-engineer", name: "ML Engineer", names: ["ml engineer", "machine learning engineer", "ml инженер", "ml-инженер", "инженер машинного обучения", "инженер ml", "ml разработчик"],
      core: ["Python", "Machine learning", "scikit-learn", "Git", "SQL"],
      junior: ["pandas", "NumPy", "Deep learning", "PyTorch", "Docker", "Linux", "Classification"],
      middle: ["TensorFlow", "Airflow", "AWS", "Spark", "Statistics", "Regression", "Bash"],
      nice: ["Kafka", "NLP", "Google Cloud", "Azure", "English"] },
    { id: "data-engineer", name: "Data Engineer", names: ["data engineer", "дата инженер", "дата-инженер", "инженер данных", "etl developer", "etl разработчик"],
      core: ["SQL", "Python", "ETL", "Git", "Linux"],
      junior: ["PostgreSQL", "Data warehouse", "Docker", "Bash", "pandas", "Airflow"],
      middle: ["Spark", "Kafka", "ClickHouse", "dbt", "AWS", "Hadoop"],
      nice: ["Snowflake", "BigQuery", "MongoDB", "Redis", "Scala", "English"] },
  ];
  const LEVELS = [
    { id: "intern", name: "Internship", words: ["internship", "intern", "стажировка", "стажировку", "стажировки", "стажёр", "стажер", "практика", "практикант", "trainee", "стаж"] },
    { id: "junior", name: "Junior", words: ["junior", "jun", "джуниор", "джун", "младший", "начинающий", "entry level", "entry-level"] },
    { id: "middle", name: "Middle", words: ["middle", "mid", "мидл", "миддл", "senior", "сеньор", "синьор", "старший", "lead"] },
  ];

  function roleSkills(role, level) {
    const j = role.junior, m = role.middle, n = role.nice;
    if (level === "intern") return { must: role.core.slice(), nice: j.concat(n) };
    if (level === "junior") return { must: role.core.concat(j), nice: m.concat(n) };
    return { must: role.core.concat(j, m), nice: n.slice() };
  }

  // Free text -> { role, level }. Either part may be null.
  function resolveRole(query) {
    let q = norm(query).toLowerCase().replace(/ё/g, "е").replace(/[()\[\],.;:!?]/g, " ").replace(/\s+/g, " ").trim();
    if (!q) return { role: null, level: null };
    let level = null;
    for (const lv of LEVELS) {
      for (const w of lv.words) {
        const re = new RegExp("(?<![" + L + "])" + w.replace(/ё/g, "е").replace(/[-\s]/g, "[-\\s]") + "(?![" + L + "])", "iu");
        if (re.test(q)) { level = lv.id; q = q.replace(re, " "); break; }
      }
      if (level) break;
    }
    q = q.replace(/\s+/g, " ").trim();
    let best = null, bestLen = 0;
    for (const r of ROLES) for (const nm of r.names) {
      const n2 = nm.toLowerCase().replace(/ё/g, "е");
      if (q.indexOf(n2) !== -1 && n2.length > bestLen) { best = r; bestLen = n2.length; }
    }
    return { role: best ? best.id : null, level };
  }

  function analyseRole(roleId, level, mySkills) {
    const role = ROLES.find(r => r.id === roleId); if (!role) return null;
    const have = new Set(mySkills), sk = roleSkills(role, level);
    const uniq = l => l.filter((x, i) => l.indexOf(x) === i);
    const must = uniq(sk.must), niceU = uniq(sk.nice).filter(x => !must.includes(x));
    const mHave = must.filter(s => have.has(s)), mMiss = must.filter(s => !have.has(s));
    const nHave = niceU.filter(s => have.has(s)), nMiss = niceU.filter(s => !have.has(s));
    const pct = must.length ? Math.round(100 * mHave.length / must.length) : 0;
    const nicePct = niceU.length ? Math.round(100 * nHave.length / niceU.length) : 0;
    // learning order: skills earlier in the list matter more (core first)
    const plan = mMiss.slice(0, 6);
    const need = new Set(must.concat(niceU));
    const projects = PROJECTS.map(p => ({ name: p.name, covers: p.skills.filter(s => need.has(s)) }))
      .filter(p => p.covers.length).sort((a, b) => b.covers.length - a.covers.length).slice(0, 3);
    const verdict = pct >= 80 ? "ready" : pct >= 50 ? "close" : "far";
    return { role: role.id, roleName: role.name, level, must, nice: niceU, mustHave: mHave, mustMissing: mMiss, niceHave: nHave, niceMissing: nMiss, pct, nicePct, plan, projects, verdict };
  }

  function compareRoles(level, mySkills) {
    return ROLES.map(r => { const a = analyseRole(r.id, level, mySkills); return { id: r.id, name: r.name, pct: a.pct, missing: a.mustMissing.length }; })
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
  }

  const EXAMPLES = [
    "Junior Data Analyst. We are looking for a data analyst intern to join our product team. Requirements: SQL (joins, window functions), Python (pandas, matplotlib), Excel, basic statistics and A/B testing. Experience with Tableau or Power BI is a plus. You will build dashboards and weekly reports for the product managers. Good English and communication skills.",
    "Стажёр-аналитик данных. Обязанности: сбор и очистка данных, подготовка отчётов и дашбордов в Power BI, анализ метрик продукта. Требования: уверенный SQL, Python (pandas, numpy), знание статистики и проверки гипотез, Excel (сводные таблицы, ВПР). Будет плюсом опыт с ClickHouse и Airflow, английский язык.",
    "Data Analyst (e-commerce). You will analyse customer behaviour, run cohort analysis and customer segmentation, and forecast sales. We use PostgreSQL, Python, scikit-learn and Looker. Knowledge of time series, regression and data visualization is required. Experience with A/B tests and Google Analytics is an advantage.",
    "Аналитик BI. Нужен опыт построения дашбордов в Tableau или DataLens, написание сложных SQL-запросов (PostgreSQL, ClickHouse), работа с ETL и хранилищами данных. Умение презентовать результаты бизнесу, коммуникативные навыки. Python или R на уровне анализа данных.",
    "Junior Machine Learning Analyst. Build and evaluate machine learning models (classification, regression, clustering) with Python, scikit-learn and XGBoost. Strong statistics, hypothesis testing and EDA. Git, Docker and Linux are a plus. You communicate results clearly in English, including presentations.",
    "Product Analyst intern. Work with product metrics, funnels and retention, set up experiments and A/B tests, use Amplitude and SQL. Python for analysis is welcome, Excel or Google Sheets for quick reports. Знание английского языка и желание учиться.",
  ];

  return { SKILLS, PROJECTS, DEFAULT_PROFILE, EXAMPLES, ROLES, LEVELS, roleSkills, resolveRole, analyseRole, compareRoles, extractSkills, analyseVacancy, splitVacancies, analyseMarket, categoryOf };
});
