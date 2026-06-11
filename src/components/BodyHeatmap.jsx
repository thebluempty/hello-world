import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function BodyHeatmap({ records }) {
    const svgRef = useRef();

    useEffect(() => {
        if (!records.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current.clientWidth || 600;
        const height = svgRef.current.clientHeight || 700;

        // 신체 부위별 감각 집계
        const bodyData = {};
        records.forEach(record => {
            record.bodySensations.forEach(sensation => {
                const area = sensation.area;
                if (!bodyData[area]) {
                    bodyData[area] = { count: 0, emotions: new Set() };
                }
                bodyData[area].count += 1;
                record.emotions.forEach(e => bodyData[area].emotions.add(e.name));
            });
        });

        const data = Object.entries(bodyData).map(([area, info]) => ({
            area,
            count: info.count,
            emotions: Array.from(info.emotions)
        })).sort((a, b) => b.count - a.count);

        if (data.length === 0) {
            svg.append('text')
                .attr('x', width / 2).attr('y', height / 2)
                .attr('text-anchor', 'middle').attr('fill', '#adb5bd').attr('font-size', '14px')
                .text('신체 감각이 기록된 항목이 없습니다');
            return;
        }

        // 최대 값 계산
        const maxCount = d3.max(data, d => d.count) || 1;

        // 색상 스케일
        const colorScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range(['#e9ecef', '#667eea']);

        // 신체 다이어그램 영역
        const bodyWidth = 300;
        const bodyHeight = 500;
        const bodyX = (width - bodyWidth) / 2;
        const bodyY = 50;

        // 신체 윤곽
        const bodyG = svg.append('g')
            .attr('transform', `translate(${bodyX},${bodyY})`);

        bodyG.append('rect')
            .attr('width', bodyWidth)
            .attr('height', bodyHeight)
            .attr('fill', '#f8f9fa')
            .attr('stroke', '#dee2e6')
            .attr('stroke-width', 2)
            .attr('rx', 10);

        // 신체 부위 매핑 (간단한 레이아웃)
        const bodyPositions = {
            '머리': { x: 150, y: 50 },
            '이마': { x: 150, y: 40 },
            '눈': { x: 150, y: 60 },
            '코': { x: 150, y: 70 },
            '입': { x: 150, y: 80 },
            '턱': { x: 150, y: 95 },
            '목': { x: 150, y: 120 },
            '어깨': { x: 150, y: 150 },
            '왼어깨': { x: 80, y: 150 },
            '오른어깨': { x: 220, y: 150 },
            '가슴': { x: 150, y: 200 },
            '배': { x: 150, y: 260 },
            '등': { x: 150, y: 230 },
            '골반': { x: 150, y: 310 },
            '팔': { x: 80, y: 210 },
            '왼팔뚝': { x: 60, y: 190 },
            '오른팔뚝': { x: 240, y: 190 },
            '왼팔목': { x: 45, y: 240 },
            '오른팔목': { x: 255, y: 240 },
            '손': { x: 50, y: 280 },
            '왼손': { x: 35, y: 280 },
            '오른손': { x: 265, y: 280 },
            '다리': { x: 150, y: 370 },
            '왼허벅지': { x: 110, y: 360 },
            '오른허벅지': { x: 190, y: 360 },
            '왼종아리': { x: 105, y: 430 },
            '오른종아리': { x: 195, y: 430 },
            '발': { x: 150, y: 480 },
            '왼발': { x: 105, y: 490 },
            '오른발': { x: 195, y: 490 }
        };

        // 히트맵 원 그리기
        data.forEach(d => {
            const pos = bodyPositions[d.area];
            if (!pos) return;

            const radius = 20 + (d.count / maxCount) * 30;

            bodyG.append('circle')
                .attr('cx', pos.x)
                .attr('cy', pos.y)
                .attr('r', radius)
                .attr('fill', colorScale(d.count))
                .attr('opacity', 0.7)
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 1);
                    d3.selectAll('.tooltip').remove();
                    d3.select('body').append('div')
                        .attr('class', 'tooltip')
                        .style('position', 'absolute')
                        .style('opacity', 1)
                        .html(`
                            <strong>${d.area}</strong><br/>
                            기록 수: ${d.count}<br/>
                            감정: ${d.emotions.join(', ')}
                        `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', 0.7);
                    d3.selectAll('.tooltip').remove();
                });

            bodyG.append('text')
                .attr('x', pos.x)
                .attr('y', pos.y + 5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', 'white')
                .text(d.area);
        });

        // 범례
        const legendY = bodyY + bodyHeight + 30;
        const legendG = svg.append('g')
            .attr('transform', `translate(${bodyX},${legendY})`);

        legendG.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('font-size', '14px')
            .text('기록 빈도:');

        const legendScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([0, 200]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5);

        // 그라디언트
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'heatmap-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#e9ecef');

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#667eea');

        legendG.append('rect')
            .attr('x', 0)
            .attr('y', 10)
            .attr('width', 200)
            .attr('height', 20)
            .style('fill', 'url(#heatmap-gradient)');

        legendG.append('g')
            .attr('transform', 'translate(0,30)')
            .call(legendAxis);

        // 제목
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text('신체 부위별 감각 히트맵');

        return () => d3.selectAll('.tooltip').remove();
    }, [records]);

    return (
        <div>
            <svg ref={svgRef} className="visualization-container" style={{ height: '700px' }}></svg>
        </div>
    );
}
