import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { emotionColors } from '../constants.js';

export default function LocationVisualization({ records }) {
    const svgRef = useRef();

    useEffect(() => {
        if (!records.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current.clientWidth || 600;
        const height = svgRef.current.clientHeight || 420;
        const isMobile = width < 500;
        const margin = { top: 50, right: isMobile ? 15 : 130, bottom: 50, left: isMobile ? 35 : 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // 등장하는 모든 감정 이름
        const allEmotionNames = [...new Set(records.flatMap(r => r.emotions.map(e => e.name)))];

        // 장소별 감정 카운트
        const locationMap = {};
        records.forEach(record => {
            const loc = record.location.value;
            if (!locationMap[loc]) {
                locationMap[loc] = { location: loc };
                allEmotionNames.forEach(e => { locationMap[loc][e] = 0; });
            }
            record.emotions.forEach(e => {
                locationMap[loc][e.name] = (locationMap[loc][e.name] || 0) + 1;
            });
        });

        const data = Object.values(locationMap).sort((a, b) => {
            const sumA = allEmotionNames.reduce((s, e) => s + (a[e] || 0), 0);
            const sumB = allEmotionNames.reduce((s, e) => s + (b[e] || 0), 0);
            return sumB - sumA;
        });

        const activeEmotions = allEmotionNames.filter(e => data.some(d => d[e] > 0));
        const stack = d3.stack().keys(activeEmotions)(data);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.location))
            .range([0, innerWidth]).padding(0.3);

        const yMax = d3.max(data, d => activeEmotions.reduce((s, e) => s + (d[e] || 0), 0)) || 1;
        const yScale = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice();

        // 배경 그리드
        g.append('g')
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(''))
            .call(gg => gg.select('.domain').remove())
            .call(gg => gg.selectAll('.tick line').attr('stroke', '#f0f2ff').attr('stroke-width', 1));

        const tooltip = d3.select('body').selectAll('.loc-tip').data([null]).join('div')
            .attr('class', 'tooltip loc-tip')
            .style('position', 'absolute').style('opacity', 0).style('pointer-events', 'none');

        // 스택드 바 (진입 애니메이션)
        stack.forEach(layer => {
            const emoName = layer.key;
            const color = emotionColors[emoName] || '#667eea';

            g.selectAll(null)
                .data(layer)
                .enter()
                .append('rect')
                .attr('x', d => xScale(d.data.location))
                .attr('width', xScale.bandwidth())
                .attr('rx', 3)
                .attr('fill', color)
                .attr('y', innerHeight)
                .attr('height', 0)
                .on('mouseover', function(event, d) {
                    d3.select(this).attr('opacity', 0.75);
                    tooltip.style('opacity', 1)
                        .html(`<strong>${d.data.location}</strong><br/>${emoName}: ${d[1] - d[0]}회`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 32) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 1);
                    tooltip.style('opacity', 0);
                })
                .on('touchstart', function(event, d) {
                    event.preventDefault();
                    tooltip.style('opacity', 1)
                        .html(`<strong>${d.data.location}</strong><br/>${emoName}: ${d[1] - d[0]}회`)
                        .style('left', (event.touches[0].pageX + 10) + 'px')
                        .style('top', (event.touches[0].pageY - 32) + 'px');
                    setTimeout(() => tooltip.style('opacity', 0), 2000);
                })
                .transition().duration(700).delay((d, i) => i * 60)
                .attr('y', d => yScale(d[1]))
                .attr('height', d => Math.max(0, yScale(d[0]) - yScale(d[1])));
        });

        // X축
        g.append('g').attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text').attr('font-size', isMobile ? '10px' : '12px');

        // Y축
        g.append('g').call(d3.axisLeft(yScale).ticks(5))
            .selectAll('text').attr('font-size', isMobile ? '10px' : '12px');

        // 제목
        svg.append('text')
            .attr('x', width / 2).attr('y', 25)
            .attr('text-anchor', 'middle').attr('font-size', '15px').attr('font-weight', 'bold').style('fill', 'var(--text)')
            .text('장소별 감정 분포');

        // 범례 (데스크탑: 우측)
        if (!isMobile) {
            const legendG = svg.append('g').attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);
            activeEmotions.forEach((name, i) => {
                const color = emotionColors[name] || '#667eea';
                legendG.append('rect').attr('x', 0).attr('y', i * 22 - 9).attr('width', 13).attr('height', 13).attr('fill', color).attr('rx', 3);
                legendG.append('text').attr('x', 18).attr('y', i * 22).attr('font-size', '11px').style('fill', 'var(--text-soft)').text(name);
            });
        }

        return () => d3.selectAll('.loc-tip').remove();
    }, [records]);

    return (
        <div>
            <svg ref={svgRef} className="visualization-container"></svg>
        </div>
    );
}
