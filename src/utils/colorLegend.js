export const colorLegend = (selection, props) => {
    const {
        colorScale,
        selectCat,
        selectedCat
    } = props;
    
    const groups = selection.selectAll('.tick')
        .data(colorScale.domain());
    const groupsEnter = groups.enter().append('g')
        .attr('class', 'tick');
    groupsEnter
        .merge(groups)
        .attr('transform', (d,i)=>`translate(100,${i*25})`)
        .attr('opacity', d => 
            (d === selectedCat) ? 1 : 0.2    
        )
        .on('click', selectCat);
    groups.exit()
        .remove();
    groupsEnter.append('circle')
        .attr('r', 10)
        .attr('fill', colorScale);
    groupsEnter.append('text')
        .attr('x', 25)
        .attr('y', 5)
        .text((d,i)=>colorScale.domain()[i])


    // for(let i = 0; i< colD.length; i++){
    //     let tmp_g = svg.append('g')
    //     .attr('transform', `translate(${50},${300+i*20})`);
    //     tmp_g.append('rect')
    //     .attr('width',10)
    //     .attr('height',10)
    //     .attr('fill', colR[i]);
    //     tmp_g.append('text')
    //     .attr('x', 14)
    //     .attr('y', 10)
    //     .text(colD[i]);
    // }


}