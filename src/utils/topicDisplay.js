import * as d3 from 'd3';
export const topicDisplay = (selection, props) => {
    const {
        topicData,
        path
    } = props
    selection.raise();
    // const rectangleWidth = 120;
    const animateLine = (pathElem, finalPath, stepDuration) => {
        finalPath = finalPath.trim();
        pathElem.attr('fill', 'none')
            .attr('stroke', 'white');
        if (!finalPath.startsWith('M 0 0')) {
            console.log('path needs to start from origin M 0 0');
            return;
        }
        let pathSoFar = 'M 0 0';
        let pathSpl = finalPath.split(' L ');
        let cumulDelay = 0;
        let endPos;
        for (let i = 1; i < pathSpl.length; i++) {
            endPos = pathSpl[i].split(' ');
            pathElem.transition()
                .delay(cumulDelay)
                .duration(stepDuration)
                .attrTween('d', lineTween(pathSoFar, endPos));
            pathSoFar += ' L ' + pathSpl[i];
            cumulDelay += stepDuration;
        }
        return {delay: cumulDelay, endPos: endPos}
    }
    const prepareTextBox = (gElem, finalPath, stepDuration) => {
        let {delay, endPos} = animateLine(gElem.append('path'), finalPath, stepDuration);
        gElem.append('text')
            .text(topicData)
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('x', endPos[0])
            .attr('y', endPos[1])
            .attr('text-anchor', endPos[0] > 0 ? 'start': 'end')
            .transition()
            .delay(delay)
            .duration(stepDuration)
            .attr('opacity', 1);
    }
    const lineTween = (existingPath, endPos) => {
        return function () {
            let pathSpl = existingPath.split('L');
            let lastL = pathSpl[pathSpl.length - 1];
            let lastLSpl = lastL.split(' ');
            let lastCoords = [lastLSpl[lastLSpl.length - 2], lastLSpl[lastLSpl.length - 1]]
            let x0 = lastCoords[0]
            let y0 = lastCoords[1]
            let x1 = endPos[0]
            let y1 = endPos[1]
            var interpolate = d3.interpolate([x0, y0], [x1, y1]);
            return function (t) {
                return t < 1 ? `${existingPath} L ` + interpolate(t).join(' ') : `${existingPath} L  ${x1} ${y1}`;
            }
        }
    }
    selection.selectAll('path').remove();
    selection.selectAll('text').remove();
    selection.selectAll('rect').remove();
    

    let topic = selection.append('g');
    
    let topicPath = path;
    
    prepareTextBox(topic, topicPath, 1000);
   


}