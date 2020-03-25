<template>
  <div>
    <div class="pos-f-t mainMapContainer">
      <div class="navbar-collapse collapse show" id="navbarToggleExternalContent">
        <div class="bg-dark p-4">
          <svg
            ref="mainMap"
            viewBox="0 0 1500 900"
            width="1500"
            height="auto"
            preserveAspectRatio="xMidYMid"
          />
        </div>
      </div>
      <nav class="navbar navbar-dark bg-dark">
        <button
          class="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarToggleExternalContent"
          aria-controls="navbarToggleExternalContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          visibility="hidden"
          @click="handleCollapse"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div ref="miniPicContainer"></div>
      </nav>
    </div>
    <div>
      <br />
      <br />
      <br />
    </div>
    <!-- Draggable default card start -->
    <div class="card">
      <div class="card-header">
        <h5>Drag and drop cards</h5>
      </div>
      <div class="card-block">
        <div class="row" id="sortable">
          <!-- <div class="col-xxl-6">
            <div class="card-sub">
              <div class="embed-responsive embed-responsive-4by3 myCard">
                <iframe
                  scrolling="no"
                  frameborder="0"
                  style="position:absolute;top:0px;width:100vw;height:100vh;min-width:1680px;min-height:866px;"
                  src="/lda_visualizations/en-mallet.html"
                ></iframe>
              </div>
            </div>
          </div>
          <div class="col-xxl-6">
            <div class="card-sub">
              <div class="embed-responsive embed-responsive-4by3 myCard">
                <iframe
                  scrolling="no"
                  frameborder="0"
                  style="position:absolute;top:0px;width:100vw;height:100vh;min-width:1680px;min-height:866px;"
                  src="/lda_visualizations/en-default.html"
                ></iframe>
              </div>
            </div>
          </div>
          <div class="col-xxl-6">
            <div class="card-sub">
              <div class="embed-responsive embed-responsive-4by3 myCard">
                <iframe
                  scrolling="no"
                  frameborder="0"
                  style="position:absolute;top:0px;width:100vw;height:100vh;min-width:1680px;min-height:866px;"
                  src="/lda_visualizations/en-default.html"
                ></iframe>
              </div>
            </div>
          </div> -->
        </div>
      </div>
    </div>
    <!-- Draggable default card start -->
  </div>
</template>
<script>
import { loadAndProcessData } from "../utils/loadAndProcessData.js";
// import {colorLegend} from './colorLegend.js';
import { topicDisplay } from "../utils/topicDisplay.js";
import * as d3 from "d3";
import $ from "jquery";
import "jquery-ui/themes/base/core.css";
import "jquery-ui/themes/base/theme.css";
import "jquery-ui/themes/base/selectable.css";
import "jquery-ui/ui/core";
import "jquery-ui/ui/widgets/selectable";
import "jquery-ui/ui/widgets/sortable";
import "jquery-ui/ui/disable-selection";

var vm;
// import Vue from 'vue';

function showMap() {
  const svg = d3.select("svg");
  
  const width = parseFloat(svg.attr("width"));
  const aspectRatio = 900 / 1500;
  const height = width * aspectRatio;
  const clickMsg = svg.append('text')
                .text('click to start')
                .attr('fill','white')
                .attr('x', width/2)
                .attr('text-anchor','middle')
                .attr('y',15)
                .attr('font-size','1.3em');
  // const sensitivity = 75;
  const velocity = 0.015;
  const topicLifeTimer = 200;
  const minTopicDistance = 50;
  const projection0 = d3
    .geoOrthographic()
    .scale(height / 2.5)
    .translate([width / 2, height / 2]);

  let projection = projection0;
  let projection1 = d3
    .geoNaturalEarth1()
    .translate([width / 2, height / 2])

    .scale(height / 10);
  let curProjection = 0;
  var timer;

  var pathGenerator = d3.geoPath().projection(projection);
  let features;
  // let centroid;
  let selectedCountryMinArea;
  let topicVisibleWindow = [300, 600];
  var initialized = false;
  var setFrance = false;

  const inRange = (x, min, max) => {
    return (x - min) * (x - max) <= 0;
  };
  const desiredCountries = [
    "Australia",
    "Canada",
    "Saudi Arabia",
    "United States of America",
    "India",
    "Russia",
    "South Africa",
    "Turkey",
    "Argentina",
    "Brazil",
    "Mexico",
    "France",
    "Germany",
    "Italy",
    "United Kingdom",
    "China",
    "Indonesia",
    "Japan",
    "South Korea",
    "Spain"
  ];
  //possible paths for the line showing a given topic, there are 4 options
  //first element is path string, second is relative end coordinates
  const possTopicPaths = [
    ["M 0 0 L -10 -10 L -60 -10", [-60, -10]], //upleft
    ["M 0 0 L 10 -10 L 60 -10", [60, -10]], //upright
    ["M 0 0 L 10 10 L 60 10", [60, 10]], //downright
    ["M 0 0 L -10 10 L -60 10", [-60, 10]] //downleft
  ];
  var desiredCountryPaths = [];
  const g = svg.append("g");
  let gPool = [];
  for (let i = 0; i < 10; i++) {
    let tmp_g = g.append("g");
    gPool.push(tmp_g);
  }
  let activeGs = [];

  g.append("path")
    .attr("d", pathGenerator({ type: "Sphere" }))
    .attr("class", "horizon");

  // const colorValue = d => d.properties.name;
  let selectedCountry = null;
  let selectedCountries = [];
  // const colorLegendG = svg.append('g');
  const topicG = g.append("g");

  const distance2 = (p1, p2) => {
    var dx = p1[0] - p2[0],
      dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
  };
  var franceCopy;
  //   var franceCopy1;
  // var franceCopy2;

  // render fxn
  const render = () => {
    const paths = g.selectAll("path").data(features);

    const colorScale = t => d3.interpolateTurbo(t);
    // colorScale.domain(d3.range(features.length));
    // colorScale.range(d3.schemeRdYlGn[colorScale.domain().length]);
    // colorScale.domain(colorScale.domain().sort());

    const pathsG = paths.enter().append("g");
    if (selectedCountry) {
      if (pathGenerator.area(selectedCountry) > selectedCountryMinArea) {
        let tmp_c = pathGenerator.centroid(selectedCountry);
        topicG
          .attr("visibility", "visible")
          .attr("transform", `translate(${tmp_c[0]},${tmp_c[1]})`);
      } else {
        topicG.attr("visibility", "hidden");
      }
    }
    pathsG
      .append("path")
      .attr("class", "countries")
      .merge(paths)
      .attr("d", pathGenerator)
      .attr("fill", (d, i) => {
        // return selectedCountries.includes(d) // === selectedCountry
        //   ? colorScale(i / features.length)
        //   : "grey";
        if (selectedCountries.includes(d)){
          return colorScale(i / features.length);
        }
        else if(desiredCountries.includes(d.properties.name)){
          return "grey";
        }
        else{
          return "darkgrey";
        }
      })
      .on("click", d => {
        if (initialized) {
          selectedCountry = d;
          // console.log(d);

          if (!desiredCountries.includes(selectedCountry.properties.name)) {
            return;
          }
          let sortable = document.getElementById('sortable');
          if (selectedCountries.includes(d)) {
            selectedCountries.splice(selectedCountries.indexOf(d), 1);
            vm.ldaElsByCountry[d.properties.name].forEach(lda => {
              sortable.removeChild(lda);
            });
          } else {
            selectedCountries.push(d);
            //       <div class="col-xxl-6">
            //                             <div class="card-sub">
            //                                   <div class="embed-responsive embed-responsive-4by3 myCard">
            //                                     <iframe  scrolling="no" frameborder="0"
            // style="position:absolute;top:0px;width:100vw;height:100vh;min-width:1680px;min-height:866px;" src="/lda_visualizations/en-mallet.html"></iframe>
            //                                   </div>

            //                             </div>
            //                         </div>
            // let tmpDivOuter = document.createElement("div");
            // tmpDivOuter.setAttribute("class", "col-xxl-6");
            // let tmpDivCard = document.createElement("div");
            // tmpDivCard.setAttribute("class", "card-sub");
            // let tmpDivInner = document.createElement("div");
            // tmpDivInner.setAttribute(
            //   "class",
            //   "embed-responsive embed-responsive-4by3 myCard"
            // );
            // let tmpIframe = document.createElement("iframe");
            // tmpIframe.setAttribute("scrolling", "no");
            // tmpIframe.setAttribute("frameborder", "0");
            // tmpIframe.setAttribute("class", "lda-vis");
            // tmpIframe.setAttribute("src", "/lda_visualizations/en-mallet.html");
            // tmpDivInner.appendChild(tmpIframe);
            // tmpDivCard.appendChild(tmpDivInner);
            // tmpDivOuter.appendChild(tmpDivCard);

            vm.ldaElsByCountry[d.properties.name].forEach(lda => {
              sortable.appendChild(lda);
            })
          }
          //   centroid = pathGenerator.centroid(d);
          // selectedCountryMinArea = pathGenerator.area(selectedCountry) / 10;
          // topicG.attr('transform', `translate(${centroid[0]},${centroid[1]})`)
          // topicG.call(topicDisplay, { topicData: '', path:possTopicPaths[0][0]})
          // pathGenerator = d3.geoPath().projection(projection);
          render();
        }
      });

    pathsG.append("svg:title").text(d => d.properties.name);
    let toReclaim = [];
    for (let i = 0; i < activeGs.length; i++) {
      let d = activeGs[i];
      if (d[2] <= 0) {
        d[0].selectAll("path").remove();
        d[0].selectAll("text").remove();
        toReclaim.push(i);
      } else {
        let c;
        let a;
        if (d[1].properties.name === "France") {
          c = pathGenerator.centroid(franceCopy);
          a = pathGenerator.area(franceCopy);
        } else {
          c = pathGenerator.centroid(d[1]);
          a = pathGenerator.area(d[1]);
        }
        if (d[0]) {
          if (a > d[3]) {
            d[0].attr("visibility", "visible");
            d[0].attr("transform", `translate(${c[0]},${c[1]})`);
          } else {
            d[0].attr("visibility", "hidden");
          }
        } else {
          // console.log(activeGs[i]);
        }
        d[2]--;
      }
    }
    toReclaim.reverse().forEach(idx => {
      gPool.push(activeGs[idx][0]);
      activeGs.splice(idx, 1);
    });

    if (!initialized) {
      //loop through countries with data
      if (gPool.length > 0) {
        //check if g available
        for (let i = 0; i < desiredCountryPaths.length; i++) {
          let d = desiredCountryPaths[i];
          // console.log(d);
          var desiredCountryCentroid;
          if (d.properties.name === "France") {
            if (!setFrance) {
              franceCopy = {
                type: "Polygon",
                coordinates: [d.geometry.coordinates[1][0]]
              };
              setFrance = true;
            }

            desiredCountryCentroid = pathGenerator.centroid(franceCopy);
          } else {
            desiredCountryCentroid = pathGenerator.centroid(d);
          }
          if (
            inRange(
              desiredCountryCentroid[0],
              topicVisibleWindow[0],
              topicVisibleWindow[1]
            )
          ) {
            if (Math.random() > 0.9) {
              if (gPool.length > 0) {
                let abortFlag = false;
                let topicPath;
                //decide the topic path
                if (activeGs.length > 0) {
                  let clashing = []; //
                  activeGs.forEach(activeG => {
                    //check if existing topic paths clash with bounding box around potential topic paths for new node
                    let activeCent = pathGenerator.centroid(activeG[1]);
                    let activeEnd = activeG[4];
                    let activePos = [
                      activeCent[0] + activeEnd[0],
                      activeCent[1] + activeEnd[1]
                    ]; // rough textbox position
                    if (
                      inRange(
                        activePos[0],
                        desiredCountryCentroid[0] - 80,
                        desiredCountryCentroid[0] + 80
                      ) &&
                      inRange(
                        activePos[1],
                        desiredCountryCentroid[1] - 25,
                        desiredCountryCentroid[1] + 25
                      )
                    ) {
                      clashing.push(activePos);
                    }
                  });

                  if (clashing.length > 0) {
                    // get far away enough possible path from all clashing activeGs
                    for (let i = 0; i < possTopicPaths.length; i++) {
                      let curDist = 0;
                      let hypPoint = possTopicPaths[i][1];
                      let curPoint = [
                        hypPoint[0] + desiredCountryCentroid[0],
                        hypPoint[1] + desiredCountryCentroid[1]
                      ];
                      let pathOk = true;
                      for (let j = 0; j < clashing.length; j++) {
                        curDist = distance2(clashing[j], curPoint);
                        if (curDist < minTopicDistance) {
                          // not good enough
                          pathOk = false;
                          break;
                        }
                      }
                      if (pathOk) {
                        topicPath = possTopicPaths[i];
                        break;
                      }
                    }
                    if (!topicPath) {
                      abortFlag = true;
                    }
                  } else {
                    topicPath =
                      possTopicPaths[
                        Math.floor(Math.random() * possTopicPaths.length)
                      ];
                  }
                } else {
                  topicPath =
                    possTopicPaths[
                      Math.floor(Math.random() * possTopicPaths.length)
                    ];
                }
                if (!abortFlag) {
                  let curG = gPool.pop();
                  curG.attr(
                    "transform",
                    `translate(${desiredCountryCentroid[0]},${desiredCountryCentroid[1]})`
                  );
                  curG.call(topicDisplay, {
                    topicData: d.topics[d.curTopicIdx],
                    path: topicPath[0]
                  });
                  d.curTopicIdx++;
                  d.curTopicIdx %= d.topics.length;
                  let minArea;
                  if (d.properties.name === "France") {
                    minArea = pathGenerator.area(franceCopy) / 10;
                  } else {
                    minArea = pathGenerator.area(d) / 10;
                  }
                  activeGs.push([
                    curG, //g element to render the topic line
                    d, //associated data element
                    topicLifeTimer, //life time for topic to be visible
                    minArea, //minimum visible area of country for topic to be visible
                    topicPath[1] //path rel end position?
                  ]);
                }
              } else {
                break;
              }
            }
          }
        }
      }
    }
  };
  // const selectCat = (d) => {
  //   selectedCat = d;
  //   render();
  // }
  function toggleProjection() {
    if (!initialized) {
      clickMsg.attr('stroke','none');
      let toProjection;
      selectedCountry = null;
      toProjection = projection1;
      curProjection = 1;
      activeGs.forEach(elem => {
        elem[0]
          .select("g")
          .selectAll("path")
          .remove();
        elem[0]
          .select("g")
          .selectAll("text")
          .remove();
      });
      topicG
        .selectAll("g")
        .selectAll("text")
        .remove();
      topicG
        .selectAll("g")
        .selectAll("path")
        .remove();
      gPool = null;
      activeGs = [];
      svg.selectAll("text").remove();
      // console.log(franceCopy);
      



      timer.stop();

      svg
        .selectAll("path")
        .transition()
        .duration(1000)
        .attrTween("d", function(d) {
          let currentScale = projection.scale();
          let nextScale = height / 4;
          // let curTranslate = projection.translate();
          var r = d3.interpolate(projection.rotate(), [0, 0, 0]);
          var s = d3.interpolate(currentScale, nextScale);
          // var trans = d3.interpolate(curTranslate, [
          //   curTranslate[0],
          //   height / 5
          // ]);
          return function(t) {
            projection
              .rotate(r(Math.pow(t, 0.33)))
              // .translate(trans(t))
              .scale(
                currentScale > nextScale
                  ? s(Math.pow(t, 0.1))
                  : s(Math.pow(t, 3))
              );
            pathGenerator.projection(projection);
            if (t === 1) {
              if (curProjection === 1) projection = projection1;
              else if (curProjection === 0) projection = projection0;
              // projection.translate([projection.translate()[0], height / 4.3]);
              pathGenerator.projection(projection);
            }
            return pathGenerator(d);
          };
        })
        .transition()
        .duration(1000)
        .attrTween("d", projectionTween(projection, toProjection));
      pathGenerator = d3.geoPath().projection(toProjection);
      // svg.call(d3.zoom()
      //         .on('zoom', () => {
      //           g.attr('transform', d3.event.transform);

      //           // gPool.forEach(elem => {
      //           //   elem.attr('transform', d3.event.transform);
      //           // })
      //         }));
      initialized = true;
      svg
        .transition()
        .duration(1000)
        .attr("width", 900);
        
      svg.append('text')
        .text('Click one of the available countries to see the topic models')
        .attr('fill','white')
        .attr('x', width/2)
        .attr('y',30)
        .attr('text-anchor','middle')
        .attr('font-size','2em');
        
    }
  }

  function projectionTween(projection0, projection1) {
    return function(d) {
      var t = 0;
      var projection = d3
        .geoProjection(project)
        .scale(1)
        .translate(projection0.translate());
      var path = d3.geoPath(projection);

      function project(λ, φ) {
        (λ *= 180 / Math.PI), (φ *= 180 / Math.PI);
        var p0 = projection0([λ, φ]),
          p1 = projection1([λ, φ]);
        return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
      }
      return function(_) {
        t = _;
        if (path(d)) return path(d);
        else return "M 0 0";
      };
    };
  }

  // let selectedCat = null;
  loadAndProcessData().then(countries => {
    countries.features.forEach(d => {
      if (desiredCountries.includes(d.properties.name)) {
        desiredCountryPaths.push(d);
      }
    });
    features = countries.features;
    timer = d3.timer(t => {
      projection.rotate([velocity * t]);
      render();
    });
  });
  // let btn = document.createElement('button')
  // btn.innerHTML = 'toggle'
  document.querySelector("svg").onclick = toggleProjection;
  // document.getElementById('buttonContainer').appendChild(btn);
}

export default {
  data() {
    return {
      ldaElsByCountry: {
        
      },
      
    };
  },
  mounted() {
    vm = this;
    showMap();
    $("#sortable").sortable();
    $("#sortable").disableSelection();
    d3.json('/g20TopicMap/visualizationPathsByCountry.json').then(visPathsByCountry => {
      let countryKeys = Object.keys(visPathsByCountry);
      countryKeys.forEach(country => {
        this.ldaElsByCountry[country] = [];
        visPathsByCountry[country].forEach(ldaPath => {
          let tmpDivOuter = document.createElement("div");
          tmpDivOuter.setAttribute("class", "col-xxl-6");
          let tmpDivCard = document.createElement("div");
          tmpDivCard.setAttribute("class", "card-sub");
          let tmpDivInner = document.createElement("div");
          tmpDivInner.setAttribute(
            "class",
            "embed-responsive embed-responsive-4by3 myCard"
          );
          let tmpIframe = document.createElement("iframe");
          tmpIframe.setAttribute("scrolling", "no");
          tmpIframe.setAttribute("frameborder", "0");
          tmpIframe.setAttribute("class", "lda-vis");
          tmpIframe.setAttribute("src", ldaPath);
          tmpDivInner.appendChild(tmpIframe);
          tmpDivCard.appendChild(tmpDivInner);
          tmpDivOuter.appendChild(tmpDivCard);

          this.ldaElsByCountry[country].push(tmpDivOuter);

        })





      })

    })
  },
  methods: {
    
    handleCollapse() {
      var miniSvg = this.$refs.mainMap.cloneNode(true);
      while (this.$refs.miniPicContainer.lastChild) {
        this.$refs.miniPicContainer.removeChild(
          this.$refs.miniPicContainer.lastChild
        );
      }
      miniSvg.setAttribute("class", "miniSvg");
      this.$refs.miniPicContainer.appendChild(miniSvg);
    }
  }
};
</script>
<style lang="scss">
.countries {
  cursor: pointer;
}
// svg {
//   border: solid 3px blue;
// }
g text {
  color: white;
}
.miniSvg {
  width: 20%;
  opacity: 0.7;
}
.mainMapContainer {
  position: absolute;
  z-index: 99;
  width: 100%;
}
.card {
  z-index: 0;
  // display: flex;
  height: 100%;
  width: 100%;
  // flex-direction: column;
}
// .flex {
//     -webkit-box-flex: 1;
//     -ms-flex: 1 1 auto;
//     flex: 1 1 auto
// }

.lda-vis {
  position: absolute;
  top: 0px;
  width: 100vw;
  height: 100vh;
  min-width: 1680px;
  min-height: 866px;
}
@media (max-width: 991.98px) {
  .padding {
    padding: 1.5rem;
  }
}

@media (max-width: 767.98px) {
  .padding {
    padding: 1rem;
  }
}

.padding {
  padding: 3rem !important;
}

.card-sub {
  cursor: move;
  border: none;
  display: inline-block;
  min-width: 800px;
  min-height: 600px;
  max-width: 800px;
  // min-width: 800px;
  // flex-direction: column;
  position: relative;
  -webkit-box-shadow: 0 0 1px 2px rgba(0, 0, 0, 0.05),
    0 -2px 1px -2px rgba(0, 0, 0, 0.04), 0 0 0 -1px rgba(0, 0, 0, 0.05);
  box-shadow: 0 0 1px 2px rgba(0, 0, 0, 0.05),
    0 -2px 1px -2px rgba(0, 0, 0, 0.04), 0 0 0 -1px rgba(0, 0, 0, 0.05);
}

.card-block {
  padding: 1.25rem;
  background-color: #fff !important;
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
}
myCard {
  min-width: 800px;
  min-height: 600px;
}
iframe {
  -ms-zoom: 0.75;
  -moz-transform: scale(0.6);
  -moz-transform-origin: 0 0;
  -o-transform: scale(0.6);
  -o-transform-origin: 0 0;
  -webkit-transform: scale(0.6);
  -webkit-transform-origin: 0 0;
}
// File: theme.scss
// Override default BT variables:
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1900px
);

$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1140px,
  xxl: 1610px
);
</style>
