import * as d3 from 'd3';
import * as topojson from 'topojson';
export const loadAndProcessData = () =>

        Promise.all([
            d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
            d3.json('/g20TopicMap/countryTopics.json')
            // d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/110m.tsv')
        ])
        .then(([topoData, countryTopics]) => {
            // const rowById = tsvData.reduce((accumulator, d) => {
            //     accumulator[d.iso_n3] = d;
            //     return accumulator;
            //     }, {})

            const countries = topojson.feature(topoData, topoData.objects.countries);
            countries.features.forEach(d => {
                // Object.assign(d.properties, rowById[d.id]);  
                if(countryTopics[d.properties.name]){
                    d.topics = countryTopics[d.properties.name];
                    d.curTopicIdx =0;
                }
            })

            return countries;
        })
    
