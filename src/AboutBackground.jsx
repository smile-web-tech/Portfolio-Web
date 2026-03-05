import { useRef, useCallback, useMemo } from 'react';

const SectionBackground = ({ variant = 'left', showOrbs = false }) => {
    const containerRef = useRef(null);

    const handleClick = useCallback((e) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('div');
        ripple.className = 'about-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        container.appendChild(ripple);

        const ripple2 = document.createElement('div');
        ripple2.className = 'about-ripple about-ripple--delayed';
        ripple2.style.left = `${x}px`;
        ripple2.style.top = `${y}px`;
        container.appendChild(ripple2);

        ripple.addEventListener('animationend', () => ripple.remove());
        ripple2.addEventListener('animationend', () => ripple2.remove());
    }, []);

    // Twisted ribbon mesh
    const ribbonPaths = useMemo(() => {
        const paths = [];
        const lineCount = 35;
        const pointsPerLine = 60;
        const baseX = 250;
        const width = 120;
        const height = 800;

        for (let i = 0; i < lineCount; i++) {
            const progress = i / (lineCount - 1);
            const offsetX = (progress - 0.5) * width;
            let d = '';
            for (let j = 0; j < pointsPerLine; j++) {
                const yProgress = j / (pointsPerLine - 1);
                const y = yProgress * height;
                const twist = Math.sin(yProgress * Math.PI * 2.5) * width * 0.8;
                const wave = Math.sin(yProgress * Math.PI * 3 + progress * Math.PI) * width * 0.3;
                const x = baseX + offsetX + twist + wave;
                d += j === 0 ? `M${x},${y}` : `L${x},${y}`;
            }
            const alpha = 0.06 + 0.14 * (1 - Math.abs(progress - 0.5) * 2);
            paths.push(<path key={`v-${i}`} d={d} fill="none" stroke={`rgba(200,200,200,${alpha})`} strokeWidth="0.6" />);
        }

        const crossCount = 50;
        for (let j = 0; j < crossCount; j++) {
            const yProgress = j / (crossCount - 1);
            const y = yProgress * height;
            let d = '';
            for (let i = 0; i < lineCount; i++) {
                const progress = i / (lineCount - 1);
                const offsetX = (progress - 0.5) * width;
                const twist = Math.sin(yProgress * Math.PI * 2.5) * width * 0.8;
                const wave = Math.sin(yProgress * Math.PI * 3 + progress * Math.PI) * width * 0.3;
                const x = baseX + offsetX + twist + wave;
                d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
            }
            const alpha = 0.03 + 0.06 * Math.sin(yProgress * Math.PI);
            paths.push(<path key={`h-${j}`} d={d} fill="none" stroke={`rgba(200,200,200,${alpha})`} strokeWidth="0.4" />);
        }

        return paths;
    }, []);

    // Small horizontal accent lines for top-left corner
    const accentLines = useMemo(() => {
        const paths = [];
        const count = 8;
        for (let i = 0; i < count; i++) {
            const y = 10 + i * 6;
            const length = 80 - i * 8;
            const alpha = 0.08 + 0.06 * (1 - i / count);
            paths.push(
                <line key={`a-${i}`} x1="5" y1={y} x2={length} y2={y + 2}
                    stroke={`rgba(200,200,200,${alpha})`} strokeWidth="0.5" />
            );
        }
        return paths;
    }, []);

    const isRight = variant === 'right';

    return (
        <div className="about-bg" ref={containerRef} onClick={handleClick}>
            {/* Main ribbon mesh */}
            <svg
                className={`about-bg-mesh ${isRight ? 'about-bg-mesh--right' : ''}`}
                viewBox="0 0 500 800"
                preserveAspectRatio={isRight ? 'xMaxYMid slice' : 'xMinYMid slice'}
                xmlns="http://www.w3.org/2000/svg"
            >
                {ribbonPaths}
            </svg>

            {/* Small accent lines in opposite corner */}
            {isRight && (
                <svg className="about-bg-accent" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                    {accentLines}
                </svg>
            )}

            {showOrbs && (
                <>
                    <div className="section-orb section-orb--1"></div>
                    <div className="section-orb section-orb--2"></div>
                    <div className="section-orb section-orb--3"></div>
                </>
            )}
        </div>
    );
};

export default SectionBackground;
