# newstopicglobe

A globe visualization, map selector for geographic based topic analysis data. Here used to compare different news sources from G20 countries (- the EU + permanent guest Spain) The topic analysis visualizations were made using gensim and pyLDAvis using the mallet algorithm for LDA. It attempts to characterize media outlets in each country by mapping the topics for each country+language combination into the same feature space. Topics are not comparable across languages. Some of the stopwords lists used during pre-processing are of lower quality and so topics aren't great for some of the included languages.

Click a country in the map view to display the various topic analysis visualizations associated with the country. Multiple countries can be selected at once, and topic map cards can be dragged around to more easily visually compare 2 media outlets.

Topics are generated from news articles collected in early 2020.
 
## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
