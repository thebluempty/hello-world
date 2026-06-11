import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { emotionColors } from '../constants.js';

export default function SineWaveVisualization({ records }) {
    const svgRef = useRef();
    const [timeScale, setTimeScale] = useState('week');

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current.clientWidth || 600;
        const height = svgRef.current.clientHeight || 420;
        const isMobile = width < 500;
        const margin = { top: 50, right: isMobile ? 15 : 40, bottom: isMobile ? 50 : 60, left: isMobile ? 38 : 55 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // 그라데이션 defs
        const defs = svg.append('defs');

        // 시간 범위 계산
        const now = new Date();
        let startTime, endTime;
        switch(timeScale) {
            case 'day':
                startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                const dow = now.getDay();
                startTime = new Date(now.getTime() - dow * 24 * 60 * 60 * 1000);
                startTime.setHours(0, 0, 0, 0);
                endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startTime = new Date(now.getFullYear(), now.getMonth(), 1);
                endTime = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                startTime = new Date(now.getFullYear(), 0, 1);
                endTime = new Date(now.getFullYear() + 1, 0, 1);
                break;
        }
        const cycleMs = endTime - startTime;

        // 해당 기간 기록 필터 + 감정별 그룹화
        const filteredRecords = records.filter(r => {
            const t = new Date(r.timestamp);
            return t >= startTime && t < endTime;
        });

        const emotionGroups = {};
        filteredRecords.forEach(record => {
            const timeOffset = new Date(record.timestamp) - startTime;
            record.emotions.forEach(emotion => {
                if (!emotionGroups[emotion.name]) emotionGroups[emotion.name] = [];
                emotionGroups[emotion.name].push({
                    time: timeOffset,
                    intensity: emotion.intensity,
                    timestamp: record.timestamp,
                    location: record.location.value
                });
            });
        });

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // 배경 그리드
        const xScale = d3.scaleLinear().domain([0, cycleMs]).range([0, innerWidth]);
        const yScale = d3.scaleLinear().domain([0, 10]).range([innerHeight, 0]);

        g.append('g')
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(''))
            .call(gg => gg.select('.domain').remove())
            .call(gg => gg.selectAll('.tick line').attr('stroke', '#f0f2ff').attr('stroke-width', 1));

        // 감정별 에리어 + 라인 + 도트 그리기
        const emotionEntries = Object.entries(emotionGroups);
        const tooltip = d3.select('body').selectAll('.emo-tip').data([null]).join('div')
            .attr('class', 'tooltip emo-tip')
            .style('position', 'absolute')
            .style('opacity', 0)
            .style('pointer-events', 'none');

        emotionEntries.forEach(([emotionName, pts]) => {
            const color = emotionColors[emotionName] || '#667eea';
            const sorted = [...pts].sort((a, b) => a.time - b.time);
            const gradId = `ag_${emotionName.replace(/\W/g, '_')}_${timeScale}`;

            const grad = defs.append('linearGradient')
                .attr('id', gradId)
                .attr('x1', '0').attr('y1', '0')
                .attr('x2', '0').attr('y2', '1');
            grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.35);
            grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.03);

            if (sorted.length > 1) {
                const areaGen = d3.area()
                    .x(d => xScale(d.time)).y0(innerHeight).y1(d => yScale(d.intensity))
                    .curve(d3.curveMonotoneX);
                g.append('path').datum(sorted)
                    .attr('fill', `url(#${gradId})`).attr('d', areaGen);

                const lineGen = d3.line()
                    .x(d => xScale(d.time)).y(d => yScale(d.intensity))
                    .curve(d3.curveMonotoneX);
                g.append('path').datum(sorted)
                    .attr('fill', 'none').attr('stroke', color)
                    .attr('stroke-width', 2.5).attr('stroke-linejoin', 'round')
                    .attr('d', lineGen);
            }

            sorted.forEach(pt => {
                const cx = xScale(pt.time);
                const cy = yScale(pt.intensity);
                const r = isMobile ? 5 : 6;
                const circle = g.append('circle')
                    .attr('cx', cx).attr('cy', cy).attr('r', r)
                    .attr('fill', color).attr('stroke', 'white').attr('stroke-width', 2)
                    .style('cursor', 'pointer');

                const showTip = (pageX, pageY) => {
                    circle.transition().duration(150).attr('r', r * 1.6);
                    tooltip.transition().duration(150).style('opacity', 1);
                    const t = new Date(pt.timestamp);
                    tooltip.html(`<strong>${emotionName}</strong><br/>강도: ${pt.intensity}<br/>시간: ${t.toLocaleString('ko-KR')}<br/>장소: ${pt.location}`)
                        .style('left', (pageX + 12) + 'px')
                        .style('top', (pageY - 36) + 'px');
                };
                const hideTip = () => {
                    circle.transition().duration(150).attr('r', r);
                    tooltip.transition().duration(200).style('opacity', 0);
                };

                circle
                    .on('mouseover', (event) => showTip(event.pageX, event.pageY))
                    .on('mouseout', hideTip)
                    .on('touchstart', (event) => {
                        event.preventDefault();
                        showTip(event.touches[0].pageX, event.touches[0].pageY);
                        setTimeout(hideTip, 2000);
                    });

                if (!isMobile) {
                    g.append('text')
                        .attr('x', cx).attr('y', cy - r - 5)
                        .attr('text-anchor', 'middle').attr('font-size', '9px')
                        .attr('fill', color).attr('font-weight', '600')
                        .text(emotionName);
                }
            });
        });

        // 기간 내 데이터 없을 때 메시지
        if (filteredRecords.length === 0) {
            g.append('text')
                .attr('x', innerWidth / 2).attr('y', innerHeight / 2)
                .attr('text-anchor', 'middle').attr('fill', '#adb5bd').attr('font-size', '14px')
                .text('이 기간에 기록이 없습니다');
        }

        // X축
        const xAxis = d3.axisBottom(xScale)
            .ticks(isMobile ? 5 : 8)
            .tickFormat(d => {
                const t = new Date(startTime.getTime() + d);
                switch(timeScale) {
                    case 'day': return t.getHours() + '시';
                    case 'week': return ['일','월','화','수','목','금','토'][t.getDay()];
                    case 'month': return t.getDate() + '일';
                    case 'year': return (t.getMonth() + 1) + '월';
                }
            });
        g.append('g').attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('text').attr('font-size', isMobile ? '10px' : '12px');

        // Y축
        g.append('g').call(d3.axisLeft(yScale).ticks(isMobile ? 5 : 10))
            .selectAll('text').attr('font-size', isMobile ? '10px' : '12px');

        // Y축 라벨
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', isMobile ? -28 : -42).attr('x', -innerHeight / 2)
            .attr('text-anchor', 'middle').attr('font-size', '11px').attr('fill', '#888')
            .text('감정 강도 (1~10)');

        // 제목
        svg.append('text')
            .attr('x', width / 2).attr('y', 22)
            .attr('text-anchor', 'middle').attr('font-size', '15px').attr('font-weight', 'bold').attr('fill', '#333')
            .text(`감정 강도 흐름 · ${timeScale === 'day' ? '하루' : timeScale === 'week' ? '이번 주' : timeScale === 'month' ? '이번 달' : '올해'}`);

        // 범례
        if (emotionEntries.length > 0) {
            const legendG = svg.append('g')
                .attr('transform', `translate(${margin.left}, ${height - (isMobile ? 12 : 14)})`);
            emotionEntries.slice(0, 8).forEach(([name], i) => {
                const color = emotionColors[name] || '#667eea';
                const x = i * (isMobile ? 60 : 72);
                legendG.append('circle').attr('cx', x + 5).attr('cy', 0).attr('r', 5).attr('fill', color);
                legendG.append('text').attr('x', x + 13).attr('y', 4).attr('font-size', isMobile ? '9px' : '11px').attr('fill', '#555').text(name);
            });
        }

        return () => d3.selectAll('.emo-tip').remove();
    }, [records, timeScale]);

    return (
        <div>
            <div className="viz-tab-buttons" style={{ marginBottom: '12px' }}>
                {[['day','하루'],['week','이번 주'],['month','이번 달'],['year','올해']].map(([val, label]) => (
                    <button key={val}
                        className={`viz-tab-btn ${timeScale === val ? 'active' : ''}`}
                        onClick={() => setTimeScale(val)}
                    >{label}</button>
                ))}
            </div>
            <svg ref={svgRef} id="sine-wave-chart" className="visualization-container"></svg>
        </div>
    );
}
