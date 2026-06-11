import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { emotionColors } from '../constants.js';

export default function LightFlowBody({ records, hiddenModesDetected }) {
    const svgRef = useRef();
    const animationRef = useRef(null);

    useEffect(() => {
        if (!records.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current.clientWidth || 600;
        const height = svgRef.current.clientHeight || 700;

        // 신체 부위별 좌표 (BodyHeatmap과 동일)
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

        // 중심점 (심장/단전)
        const centerX = 150;
        const centerY = 200;

        const bodyWidth = 300;
        const bodyHeight = 500;
        const bodyX = (width - bodyWidth) / 2;
        const bodyY = 50;

        // 신체 부위별 감정 데이터 집계
        const bodyData = {};
        records.forEach(record => {
            record.bodySensations.forEach(sensation => {
                const area = sensation.area;
                if (!bodyData[area]) {
                    bodyData[area] = { count: 0, emotions: [] };
                }
                bodyData[area].count += 1;
                record.emotions.forEach(e => {
                    bodyData[area].emotions.push({ name: e.name, intensity: e.intensity });
                });
            });
        });

        if (Object.keys(bodyData).length === 0) {
            svg.append('text')
                .attr('x', width / 2).attr('y', height / 2)
                .attr('text-anchor', 'middle').attr('fill', '#adb5bd').attr('font-size', '14px')
                .text('신체 감각이 기록된 항목이 없습니다');
            return;
        }

        // 그룹
        const bodyG = svg.append('g')
            .attr('transform', `translate(${bodyX},${bodyY})`);

        // 배경 인체 윤곽
        bodyG.append('rect')
            .attr('width', bodyWidth)
            .attr('height', bodyHeight)
            .attr('fill', hiddenModesDetected.size > 0 ? '#1a1a2e' : '#f8f9fa')
            .attr('stroke', hiddenModesDetected.size > 0 ? '#ffd700' : '#dee2e6')
            .attr('stroke-width', hiddenModesDetected.size > 0 ? 3 : 2)
            .attr('rx', 10);

        // 그라디언트 정의
        const defs = svg.append('defs');

        // 빛 입자용 그라디언트
        const radialGrad = defs.append('radialGradient')
            .attr('id', 'light-particle-grad');
        radialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fff').attr('stop-opacity', 1);
        radialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ffd700').attr('stop-opacity', 0);

        // 통합된 빛용 그라디언트 (금색)
        const integrationGrad = defs.append('radialGradient')
            .attr('id', 'integration-grad');
        integrationGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fff').attr('stop-opacity', 1);
        integrationGrad.append('stop').attr('offset', '50%').attr('stop-color', '#ffd700').attr('stop-opacity', 0.8);
        integrationGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ff8c00').attr('stop-opacity', 0);

        // 빛 입자 데이터 생성
        const particles = [];
        Object.entries(bodyData).forEach(([area, data]) => {
            const pos = bodyPositions[area];
            if (!pos) return;

            // 감정별 색상
            data.emotions.forEach((emotion, i) => {
                const color = emotionColors[emotion.name] || '#667eea';
                particles.push({
                    area,
                    x: pos.x,
                    y: pos.y,
                    color,
                    intensity: emotion.intensity,
                    emotionName: emotion.name,
                    offsetAngle: (i / data.emotions.length) * 2 * Math.PI
                });
            });
        });

        // 일반 모드: 신체 부위에 빛 입자 표시
        if (hiddenModesDetected.size === 0) {
            particles.forEach(p => {
                bodyG.append('circle')
                    .attr('cx', p.x)
                    .attr('cy', p.y)
                    .attr('r', 5 + p.intensity * 2)
                    .attr('fill', p.color)
                    .attr('opacity', 0.7)
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1)
                    .append('title')
                    .text(`${p.area} - ${p.emotionName} (${p.intensity})`);
            });

            // 제목
            svg.append('text')
                .attr('x', width / 2).attr('y', 25)
                .attr('text-anchor', 'middle').attr('font-size', '16px').attr('font-weight', 'bold')
                .attr('fill', '#333')
                .text('신체 감정 지도');

        // 숨은 모드: 빛의 흐름 애니메이션
        } else {
            // 애니메이션용 입자 그룹
            const particlesG = bodyG.append('g').attr('class', 'particles');

            // 중심 빛 (단전/심장)
            const centerLight = bodyG.append('circle')
                .attr('cx', centerX)
                .attr('cy', centerY)
                .attr('r', 0)
                .attr('fill', 'url(#integration-grad)')
                .attr('opacity', 0);

            // 입자들
            const particleCircles = particlesG.selectAll('circle')
                .data(particles)
                .enter()
                .append('circle')
                .attr('cx', d => d.x)
                .attr('cy', d => d.y)
                .attr('r', d => 3 + d.intensity)
                .attr('fill', 'url(#light-particle-grad)')
                .attr('opacity', 0.8);

            // 애니메이션 시퀀스
            let animationTime = 0;

            function animate() {
                animationTime += 0.02;

                // Phase 1: 입자들이 중심으로 모임 (0~3초)
                if (animationTime < 3) {
                    const t = animationTime / 3; // 0 to 1
                    particleCircles
                        .attr('cx', d => d.x + (centerX - d.x) * t)
                        .attr('cy', d => d.y + (centerY - d.y) * t)
                        .attr('r', d => (3 + d.intensity) * (1 - t * 0.5));

                    centerLight
                        .attr('r', 5 + t * 40)
                        .attr('opacity', t * 0.9);
                }
                // Phase 2: 중심에서 확산 (3~6초)
                else if (animationTime < 6) {
                    const t = (animationTime - 3) / 3; // 0 to 1

                    // 입자들 사라짐
                    particleCircles.attr('opacity', Math.max(0, 0.8 - t));

                    // 중심 빛 확대
                    centerLight
                        .attr('r', 45 + t * 120)
                        .attr('opacity', Math.max(0, 0.9 - t * 0.7));

                    // 확산 링
                    if (t > 0.3) {
                        const ringT = (t - 0.3) / 0.7;
                        bodyG.selectAll('.expansion-ring').remove();
                        for (let i = 0; i < 3; i++) {
                            const delay = i * 0.2;
                            if (ringT > delay) {
                                const rt = (ringT - delay) / (1 - delay);
                                bodyG.append('circle')
                                    .attr('class', 'expansion-ring')
                                    .attr('cx', centerX)
                                    .attr('cy', centerY)
                                    .attr('r', 50 + rt * 200)
                                    .attr('fill', 'none')
                                    .attr('stroke', '#ffd700')
                                    .attr('stroke-width', 3 - rt * 2)
                                    .attr('opacity', Math.max(0, 0.8 - rt));
                            }
                        }
                    }
                }
                // Phase 3: 리셋 후 반복 (6초 이후)
                else {
                    animationTime = 0;
                    bodyG.selectAll('.expansion-ring').remove();
                }

                animationRef.current = requestAnimationFrame(animate);
            }

            animate();

            // 제목
            svg.append('text')
                .attr('x', width / 2).attr('y', 25)
                .attr('text-anchor', 'middle').attr('font-size', '16px').attr('font-weight', 'bold')
                .attr('fill', '#ffd700')
                .text('✨ 감정의 통합과 흐름 ✨');
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [records, hiddenModesDetected]);

    return (
        <div>
            <svg ref={svgRef} className="visualization-container" style={{ height: '700px' }}></svg>
        </div>
    );
}
