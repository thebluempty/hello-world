import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CalendarHeatmap({ records }) {
    const svgRef = useRef();

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const containerWidth = svgRef.current.parentElement.clientWidth || 600;
        const isMobile = containerWidth < 500;
        const WEEKS = 16;

        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const endDate = new Date(today);
        const startDate = new Date(endDate.getTime() - WEEKS * 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);

        // 날짜별 기록 집계
        const dayMap = {};
        records.forEach(record => {
            const d = new Date(record.timestamp);
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            if (!dayMap[key]) dayMap[key] = { count: 0, emotions: [] };
            dayMap[key].count += 1;
            record.emotions.forEach(e => {
                if (!dayMap[key].emotions.includes(e.name)) dayMap[key].emotions.push(e.name);
            });
        });

        const maxCount = Math.max(1, d3.max(Object.values(dayMap), d => d.count) || 1);
        const colorScale = d3.scaleLinear()
            .domain([0, 1, maxCount])
            .range(['#ebedf0', '#b8a7e8', '#764ba2']);

        const leftPad = isMobile ? 22 : 28;
        const cellSize = Math.max(isMobile ? 12 : 16, Math.floor((containerWidth - leftPad - 20) / (WEEKS + 1) - 2));
        const cellPad = 3;
        const topPad = 42;
        const totalH = topPad + 7 * (cellSize + cellPad) + 40;

        svg.attr('width', containerWidth).attr('height', totalH);

        const g = svg.append('g').attr('transform', `translate(${leftPad}, ${topPad})`);

        // 모든 날짜 생성 (startDate부터 today까지)
        const days = d3.timeDays(startDate, new Date(today.getTime() + 1));

        // 툴팁
        const tooltip = d3.select('body').selectAll('.cal-tip').data([null]).join('div')
            .attr('class', 'tooltip cal-tip')
            .style('position', 'absolute').style('opacity', 0).style('pointer-events', 'none');

        days.forEach(date => {
            const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
            const dayData = dayMap[key];
            const count = dayData ? dayData.count : 0;
            const weekNum = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
            const dow = date.getDay();

            const rect = g.append('rect')
                .attr('x', weekNum * (cellSize + cellPad))
                .attr('y', dow * (cellSize + cellPad))
                .attr('width', cellSize).attr('height', cellSize)
                .attr('rx', 2).attr('fill', colorScale(count))
                .style('cursor', count > 0 ? 'pointer' : 'default');

            if (count > 0) {
                const showTip = (px, py) => {
                    tooltip.style('opacity', 1)
                        .html(`<strong>${date.toLocaleDateString('ko-KR')}</strong><br/>${count}개 기록<br/>${dayData.emotions.join(', ')}`)
                        .style('left', (px + 10) + 'px').style('top', (py - 36) + 'px');
                };
                rect
                    .on('mouseover', (event) => showTip(event.pageX, event.pageY))
                    .on('mouseout', () => tooltip.style('opacity', 0))
                    .on('touchstart', (event) => {
                        event.preventDefault();
                        showTip(event.touches[0].pageX, event.touches[0].pageY);
                        setTimeout(() => tooltip.style('opacity', 0), 2500);
                    });
            }
        });

        // 요일 라벨 (일~토)
        ['일','월','화','수','목','금','토'].forEach((label, i) => {
            if (i % 2 === 0 || !isMobile) {
                g.append('text')
                    .attr('x', -6).attr('y', i * (cellSize + cellPad) + cellSize / 2 + 1)
                    .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
                    .attr('font-size', isMobile ? '9px' : '10px').attr('fill', '#888')
                    .text(label);
            }
        });

        // 월 라벨
        const months = d3.timeMonths(startDate, new Date(today.getTime() + 1));
        months.forEach(month => {
            const weekNum = Math.ceil((month - startDate) / (7 * 24 * 60 * 60 * 1000));
            g.append('text')
                .attr('x', weekNum * (cellSize + cellPad))
                .attr('y', -10)
                .attr('font-size', isMobile ? '9px' : '11px').attr('fill', '#666').attr('font-weight', '600')
                .text(`${month.getMonth() + 1}월`);
        });

        // 제목
        svg.append('text')
            .attr('x', containerWidth / 2).attr('y', 18)
            .attr('text-anchor', 'middle').attr('font-size', '15px').attr('font-weight', 'bold').attr('fill', '#333')
            .text('감정 기록 달력 (최근 4개월)');

        // 범례
        const legendG = svg.append('g').attr('transform', `translate(${leftPad}, ${totalH - 16})`);
        legendG.append('text').attr('x', 0).attr('y', 0).attr('font-size', '10px').attr('fill', '#888').attr('dominant-baseline', 'middle').text('없음');
        [0, 1, 2, 3, 4].forEach((v, i) => {
            legendG.append('rect')
                .attr('x', 30 + i * (cellSize + 2)).attr('y', -cellSize / 2)
                .attr('width', cellSize).attr('height', cellSize).attr('rx', 2)
                .attr('fill', colorScale(v === 0 ? 0 : Math.ceil(maxCount * v / 4)));
        });
        legendG.append('text').attr('x', 30 + 5 * (cellSize + 2) + 4).attr('y', 0).attr('font-size', '10px').attr('fill', '#888').attr('dominant-baseline', 'middle').text('많음');

        return () => d3.selectAll('.cal-tip').remove();
    }, [records]);

    return (
        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            <svg ref={svgRef} className="calendar-heatmap-svg"></svg>
        </div>
    );
}
