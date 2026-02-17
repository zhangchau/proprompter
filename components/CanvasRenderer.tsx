
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { TeleprompterSettings } from '../types';

interface CanvasRendererProps {
    settings: TeleprompterSettings;
    isPlaying: boolean;
    width: number;
    height: number;
    onScrollUpdate?: (progress: number) => void;
    onFinish?: () => void;
}

export interface CanvasRendererHandle {
    getCanvas: () => HTMLCanvasElement | null;
}

const CanvasRenderer = forwardRef<CanvasRendererHandle, CanvasRendererProps>(({
    settings,
    isPlaying,
    width,
    height,
    onScrollUpdate,
    onFinish
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const scrollPosRef = useRef(0);
    const lastTimeRef = useRef<number>(0);
    const [renderedLines, setRenderedLines] = useState<string[]>([]);
    const [lineHeightPx, setLineHeightPx] = useState(48);

    // Expose canvas ref
    useImperativeHandle(ref, () => ({
        getCanvas: () => canvasRef.current
    }));

    // Font configurations (MATCHES EDITOR)
    const getFontConfig = (size: 'small' | 'medium' | 'large') => {
        switch (size) {
            case 'small': return { size: 24, lineHeight: 36 };
            case 'medium': return { size: 32, lineHeight: 48 };
            case 'large': return { size: 48, lineHeight: 72 };
            default: return { size: 32, lineHeight: 48 };
        }
    };

    // Calculate lines when script/width/font changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { size, lineHeight } = getFontConfig(settings.fontSize);
        setLineHeightPx(lineHeight);

        ctx.font = `bold ${size}px Inter, sans-serif`;

        const maxWidth = width * 0.8; // 80% width for padding

        // Improved Text Wrapping (Character-level for CJK support)
        const lines: string[] = [];
        const paragraphs = settings.script.replace(/\r\n/g, "\n").split('\n');

        paragraphs.forEach(paragraph => {
            if (paragraph === '') {
                lines.push('');
                return;
            }

            // Check if text likely contains CJK (no spaces)
            // If it has spaces, use word wrapping. If not, use char wrapping.
            // Hybrid approach: Split by characters, but respect words if possible?
            // Simple robust approach for CJK: iterate characters.

            const chars = Array.from(paragraph); // Handles emojis correctly
            let currentLine = '';

            for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);
        });

        setRenderedLines(lines);
    }, [settings.script, width, settings.fontSize]);

    // Main render loop
    const render = (time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        if (lastTimeRef.current === 0) {
            lastTimeRef.current = time;
        }

        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // --- ALIGNMENT LOGIC ---
        // StartY such that the FIRST LINE is centered in the Focus Line.
        const paddingY = (height / 2) - (lineHeightPx / 2);

        const maxScroll = Math.max(0, (renderedLines.length - 1) * lineHeightPx);

        // Calculate speed
        const speedFactor = settings.speed * 0.6;

        if (isPlaying) {
            const nextPos = scrollPosRef.current + speedFactor * (deltaTime / 1000);
            if (nextPos >= maxScroll) {
                scrollPosRef.current = maxScroll;
                if (onFinish && isPlaying) onFinish();
            } else {
                scrollPosRef.current = nextPos;
            }
        }

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Config font
        const { size } = getFontConfig(settings.fontSize);
        ctx.font = `bold ${size}px Inter, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        // Apply mirror transformation
        ctx.save();
        if (settings.mirrorMode) {
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
        }

        // Draw text
        const startY = paddingY - scrollPosRef.current;
        const centerX = width / 2;

        // Render Logic
        renderedLines.forEach((line, index) => {
            const y = startY + (index * lineHeightPx);
            // Draw only if visible (with generous buffer)
            if (y + lineHeightPx > -100 && y < height + 100) {
                ctx.fillText(line, centerX, y);
            }
        });

        ctx.restore(); // Restore mirror state

        // Draw Focus Line (Static UI)
        if (settings.showFocusLine) {
            const focusYCenter = height / 2;
            const focusTop = focusYCenter - (lineHeightPx / 2);
            const focusBottom = focusYCenter + (lineHeightPx / 2);

            ctx.strokeStyle = 'rgba(13, 127, 242, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, focusTop);
            ctx.lineTo(width, focusTop);
            ctx.moveTo(0, focusBottom);
            ctx.lineTo(width, focusBottom);
            ctx.stroke();

            ctx.shadowColor = 'rgba(13, 127, 242, 0.2)';
            ctx.shadowBlur = 15;
        }

        requestRef.current = requestAnimationFrame(render);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(render);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, settings, width, height, renderedLines, lineHeightPx]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full block"
        />
    );
});

export default CanvasRenderer;
