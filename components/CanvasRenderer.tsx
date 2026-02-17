
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

        // Wrap text logic
        const lines: string[] = [];
        // Convert newlines to paragraphs (preserve empty lines)
        const paragraphs = settings.script.replace(/\r\n/g, "\n").split('\n');

        paragraphs.forEach(paragraph => {
            // If empty line, push empty string
            if (paragraph === '') {
                lines.push('');
                return;
            }

            const words = paragraph.split(' ');
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
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
        // Focus Line is at Center (height/2)
        // We want the FIRST line (index 0) to start exactly centered in the Focus Line.
        // Focus Line Top = height/2 - lineHeight/2
        // So StartY (when scroll=0) = Focus Line Top.
        // paddingY = height/2 - lineHeightPx/2

        const paddingY = (height / 2) - (lineHeightPx / 2);

        const totalTextHeight = renderedLines.length * lineHeightPx;
        // Stop when the LAST line is centered.
        // Last Line Y = startY + (lines-1)*LH
        // We want Last Line Y = Focus Line Top
        // paddingY - scroll + (lines-1)*LH = paddingY
        // scroll = (lines-1)*LH
        // So Max Scroll = (lines-1)*lineHeightPx
        // Let's add a bit of buffer
        const maxScroll = Math.max(0, (renderedLines.length - 1) * lineHeightPx);

        // Calculate speed (Scale factor tuning)
        const speedFactor = settings.speed * 0.6; // Tuned for px/sec

        if (isPlaying) {
            // Only scroll if content > 1 line? No, allow scrolling anyway
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

        // Render logic
        renderedLines.forEach((line, index) => {
            const y = startY + (index * lineHeightPx);
            // Optimize: Draw only if visible (with buffer)
            if (y + lineHeightPx > -50 && y < height + 50) {
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

            // Optional: shadow
            ctx.shadowColor = 'rgba(13, 127, 242, 0.2)';
            ctx.shadowBlur = 15;
        }

        // Loop
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
