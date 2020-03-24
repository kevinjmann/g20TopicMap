import {loadAndProcessData}from './loadAndProcessData.js';
import {colorLegend} from './colorLegend.js';
import {topicDisplay} from './topicDisplay.js';

const svg = d3.select("svg");
const height = parseFloat(svg.attr('height'));
const width = parseFloat(svg.attr('width'));
const sensitivity = 75;
const velocity = 0.015;
const topicLifeTimer = 200;
const minTopicDistance = 50;
const projection0 = d3.geoOrthographic().scale(height/2)
                      .translate([width/2,height/2])

let projection = projection0;
let projection1 = d3.geoNaturalEarth1().scale(height/5)
let curProjection = 0;
var timer;

var pathGenerator = d3.geoPath().projection(projection);
let features;
let centroid;
let selectedCountryMinArea;
let topicVisibleWindow = [300, 600];
var initialized= false;






const inRange = (x, min, max) => {
  return ((x-min)*(x-max) <= 0);
}
const desiredCountries = ['Japan', 'Korea', 'Germany', 'Peru', 'China', 'Indonesia', 'India', 'United States'];
//possible paths for the line showing a given topic, there are 4 options
//first element is path string, second is relative end coordinates
const possTopicPaths = [
                        ['M 0 0 L -10 -10 L -60 -10', [-60, -10]], //upleft
                        ['M 0 0 L 10 -10 L 60 -10', [60, -10]],//upright
                        ['M 0 0 L 10 10 L 60 10', [60, 10]],//downright
                        ['M 0 0 L -10 10 L -60 10', [-60, 10]] //downleft
                      ] 
var desiredCountryPaths = [];
const g = svg.append('g');
let gPool = [];
for(let i = 0; i<5; i++){
  let tmp_g = g.append('g');
  gPool.push(tmp_g);
}
let activeGs = [];
// svg.call(d3.drag().on('drag', () => {
//   const rotate = projection.rotate()
//   const k = sensitivity / projection.scale()
//   projection.rotate([
//     rotate[0] + d3.event.dx * k,
//     rotate[1] - d3.event.dy * k
//   ])
//   pathGenerator = d3.geoPath().projection(projection)
//   // svg.selectAll('path').attr('d', pathGenerator);
//   render();
// }))
// function getVisibility(d) {
//   const visible = pathGenerator(
//     {type:'Point', coordinates: [d[0], d[1]]});
//     return visible ? 'visible' : 'hidden';
// }
// function closestPoint(pathNode, point) {
//   var pathLength = pathNode.getTotalLength(),
//       precision = 8,
//       best,
//       bestLength,
//       bestDistance = Infinity;

//   // linear scan for coarse approximation
//   for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
//     if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
//       best = scan, bestLength = scanLength, bestDistance = scanDistance;
//     }
//   }

//   // binary search for precise estimate
//   precision /= 2;
//   while (precision > 0.5) {
//     var before,
//         after,
//         beforeLength,
//         afterLength,
//         beforeDistance,
//         afterDistance;
//     if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
//       best = before, bestLength = beforeLength, bestDistance = beforeDistance;
//     } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
//       best = after, bestLength = afterLength, bestDistance = afterDistance;
//     } else {
//       precision /= 2;
//     }
//   }

//   best = [best.x, best.y];
//   best.distance = Math.sqrt(bestDistance);
//   return best;

//   function distance2(p) {
//     var dx = p.x - point[0],
//         dy = p.y - point[1];
//     return dx * dx + dy * dy;
//   }
// }
// svg.call(d3.zoom()
//           .on('zoom', () => {
//             g.attr('transform', d3.event.transform);

//             // gPool.forEach(elem => {
//             //   elem.attr('transform', d3.event.transform);
//             // })
//           }));

const horizon = g.append('path')
  .attr('d', pathGenerator({type:'Sphere'}))
  .attr('class', 'horizon');

const colorValue = d => d.properties.income_grp;
let selectedCountry = null;
let selectedCountries = [];
const colorLegendG = svg.append('g');
const topicG = g.append('g');

const distance2 = (p1, p2) => {
  var dx = p1[0] - p2[0],
      dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// render fxn
const render = () => {
  const paths = g.selectAll('path')
    .data(features);
  
  const colorScale = d3.scaleOrdinal()
    .domain(features.map(colorValue))
  colorScale.range(d3.schemeRdYlGn[colorScale.domain().length])
  colorScale.domain(colorScale.domain().sort());

  // colorLegendG.attr('transform', 'translate(-50,230)')
  // colorLegendG.call(colorLegend, {colorScale, selectCat, selectedCat});
  
   const pathsG = paths.enter().append('g');
   if(selectedCountry){
     if(pathGenerator.area(selectedCountry) > selectedCountryMinArea){
      let tmp_c = pathGenerator.centroid(selectedCountry);
        topicG
          .attr('visibility','visible')
          .attr('transform', `translate(${tmp_c[0]},${tmp_c[1]})`)

     }else {
       topicG.attr('visibility','hidden')
     }
   }
    pathsG.append('path')
      .attr('class','countries')
      .merge(paths)
      .attr('d', pathGenerator)
      .attr('fill', d=> {
       return selectedCountries.includes(d)// === selectedCountry
          ? colorScale(colorValue(d))
          : 'grey'

      })
      .on('click',d => {
        if(initialized){
          selectedCountry = d;
          console.log(projection.translate());
          if(selectedCountries.includes(d)){
            selectedCountries.splice(selectedCountries.indexOf(d),1);
          }else{

            selectedCountries.push(d);
          }
          centroid = pathGenerator.centroid(d);
          selectedCountryMinArea = pathGenerator.area(selectedCountry)/10; 
          // topicG.attr('transform', `translate(${centroid[0]},${centroid[1]})`)
          // topicG.call(topicDisplay, { topicData: '', path:possTopicPaths[0][0]})
          pathGenerator = d3.geoPath().projection(projection);
          render();
      }
        
      })

      
      pathsG.append('svg:title')
        .text(d=>d.properties.name +': '+colorValue(d))
      let toReclaim = [];
        for(let i =0; i<activeGs.length; i++){
        let d = activeGs[i];
        if(d[2] <=0 ){
          d[0].selectAll('path').remove();
          d[0].selectAll('text').remove();
          toReclaim.push(i);

        }else {
          let c = pathGenerator.centroid(d[1]);
          let a = pathGenerator.area(d[1]);
          if(d[0]){
            if(a > d[3]){
              d[0].attr('visibility', 'visible')
              d[0].attr('transform', `translate(${c[0]},${c[1]})`)
            }else{
              d[0].attr('visibility', 'hidden');
            }
            // if(getVisibility(c[0],c[1])){

              // d[0].attr('transform', `translate(${c[0]},${c[1]})`); //update the g pos
            // }
          }else{
            // console.log(activeGs[i]);
          }
          d[2]--; 
        } 
      }
      toReclaim.reverse().forEach(idx => {
        gPool.push(activeGs[idx][0]);
        activeGs.splice(idx,1);
      })
      
      if(!initialized){//loop through countries with data
      if(gPool.length>0){ //check if g available
        for(let i =0; i< desiredCountryPaths.length; i++){
          let d = desiredCountryPaths[i];
          
          if(inRange(pathGenerator.centroid(d)[0], topicVisibleWindow[0], topicVisibleWindow[1])){
            if(Math.random()>0.9){ 
              if(gPool.length >0){
                let abortFlag = false;
                let c = pathGenerator.centroid(d);
                let topicPath;
                //decide the topic path
                if(activeGs.length>0){
                  let clashing = []; // 
                  activeGs.forEach(activeG => { //check if existing topic paths clash with bounding box around potential topic paths for new node
                    let activeCent = pathGenerator.centroid(activeG[1]);
                    let activeEnd = activeG[4];
                    let activePos  = [ activeCent[0]+activeEnd[0], activeCent[1] + activeEnd[1]]; // rough textbox position
                    if(inRange(activePos[0], c[0]-60, c[0]+60) 
                      && inRange(activePos[1], c[1]-15, c[1]+15)){
                        clashing.push(activePos);
                      }
                  })
                  
                  if(clashing.length>0){ // get far away enough possible path from all clashing activeGs
                    for(let i=0; i<possTopicPaths.length; i++){
                      let curDist = 0;
                      let hypPoint = possTopicPaths[i][1];
                      let curPoint = [hypPoint[0]+c[0], hypPoint[1]+c[1]]; 
                      let pathOk = true;
                      for(let j=0; j<clashing.length; j++)
                      {
                        
                        curDist = distance2(clashing[j], curPoint);
                        if(curDist < minTopicDistance){ // not good enough
                          pathOk = false;
                          break;
                        }
                      }
                      if(pathOk){
                        topicPath = possTopicPaths[i];
                        break;
                      }
                    }
                    if(!topicPath){
                      abortFlag = true;
                    }  
                  }else {
                    topicPath = possTopicPaths[Math.floor(Math.random()*possTopicPaths.length)];
                  }
                }else {
                  topicPath = possTopicPaths[Math.floor(Math.random()*possTopicPaths.length)];
                }
                if(!abortFlag){
                  let curG = gPool.pop();
                  curG.attr('transform', `translate(${c[0]},${c[1]})`);
                  curG.call(topicDisplay, {topicData: '', path:topicPath[0]});
                  activeGs.push([ 
                                  curG, //g element to render the topic line 
                                  d, //associated data element
                                  topicLifeTimer, //life time for topic to be visible
                                  pathGenerator.area(d)/10, //minimum visible area of country for topic to be visible
                                  topicPath[1] //path rel end position?
                                ]);
                  
                }else {
                  
                }
              }
              else{
                break;
              }
            }
          }
        }
      }}


      
        
}
const selectCat = (d) => {
  selectedCat = d;
  render();
}
function toggleProjection() {
  if(!initialized){
    let toProjection;
    selectedCountry=null;
    toProjection = projection1;
      curProjection=1;
      activeGs.forEach(elem => {
        elem[0].select('g').selectAll('path').remove();
        elem[0].select('g').selectAll('text').remove();
      })
      topicG.selectAll('g').selectAll('text').remove();
      topicG.selectAll('g').selectAll('path').remove();
      gPool = null;
      activeGs = null;
      svg.selectAll('text').remove();

      timer.stop();
    // if(curProjection===0){
    //   toProjection = projection1;
    //   curProjection=1;
    //   activeGs.forEach(elem => {
    //     elem[0].select('g').selectAll('path').remove();
    //     elem[0].select('g').selectAll('text').remove();
    //   })
    //   topicG.selectAll('g').selectAll('text').remove();
    //   topicG.selectAll('g').selectAll('path').remove();
    //   timer.stop();
    // }
    // else if(curProjection===1){
    //   toProjection = projection0;
    //   curProjection=0;
    //   activeGs.forEach(elem => {
    //     elem[0].select('g').selectAll('path').remove();
    //     elem[0].select('g').selectAll('text').remove();
    //   })
    //   topicG.selectAll('g').selectAll('text').remove();
    //   topicG.selectAll('g').selectAll('path').remove();
    //   timer = d3.timer((t) => {
    //     projection.rotate([velocity*t]);
    //     render();
    //   });
    
    svg.selectAll("path").transition()
        .duration(1000)
        .attrTween('d', function(d) {
          let currentScale = projection.scale();
          let nextScale = height/6;
          let curTranslate = projection.translate();
          var r = d3.interpolate(projection.rotate(), [0,0,0]);
          var s = d3.interpolate(currentScale, nextScale);
          var trans = d3.interpolate(curTranslate, [width/5,height/5]);
            return function(t) {
              projection
                .rotate(r(Math.pow(t,0.33)))
                .translate(trans(t))
                .scale( currentScale > nextScale ? s(Math.pow(t,0.1)) : s(Math.pow(t,3)) );
              pathGenerator.projection(projection);
              if(t===1){
                if(curProjection===1)
                  projection = projection1;
                else if(curProjection===0)
                  projection = projection0;
                projection.translate([width/4,height/4.3]);
                pathGenerator.projection(projection);
              }
              return pathGenerator(d);
            }
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
    initialized=true;
    }
  }




function projectionTween(projection0, projection1) {
  return function(d) {
    var t = 0;
    var projection = d3.geoProjection(project)
        .scale(1)
        .translate(projection0.translate());
    var path = d3.geoPath(projection);
    
    function project(λ, φ) {
      λ *= 180 / Math.PI, φ *= 180 / Math.PI;
      var p0 = projection0([λ, φ]), p1 = projection1([λ, φ]);
      return [(1 - t) * p0[0] + t * p1[0]
      , (1 - t) * -p0[1] + t * -p1[1]
      ];
    }
    return function(_) {
      t = _;
      if(path(d))
        return path(d);
      else return 'M 0 0';
    };
  };
}

let selectedCat = null;
loadAndProcessData().then(countries => {
  countries.features.forEach(d => {
    if(desiredCountries.includes(d.properties.name)){
      desiredCountryPaths.push(d);
    }
  });
  features = countries.features;
timer =  d3.timer((t) => {
    projection.rotate([velocity*t]);
    render();
  })
    
})
// let btn = document.createElement('button')
// btn.innerHTML = 'toggle'
document.querySelector('svg').onclick = toggleProjection;
// document.getElementById('buttonContainer').appendChild(btn);



  
