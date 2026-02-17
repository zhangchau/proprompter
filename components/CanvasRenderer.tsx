
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

    // Font configurations
    const getFontConfig = (size: 'small' | 'medium' | 'large') => {
        switch (size) {
            case 'small': return { size: 24, lineHeight: 36 }; // ~text-lg
            case 'medium': return { size: 32, lineHeight: 48 }; // ~text-2xl
            case 'large': return { size: 48, lineHeight: 72 }; // ~text-4xl
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
        const paragraphs = settings.script.split('\n');

        paragraphs.forEach(paragraph => {
            if (paragraph.trim() === '') {
                lines.push(''); // Empty line
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
        // Reset scroll when script changes?
        // scrollPosRef.current = 0; 
    }, [settings.script, width, settings.fontSize]);

    // Main render loop
    const render = (time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for non-transparent
        if (!ctx) return;

        if (lastTimeRef.current === 0) {
            lastTimeRef.current = time;
        }

        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Calculate max scroll
        // Content starts at paddingY (35% height).
        // We want to scroll until the LAST line is near the focus line (center) or top?
        // Usually teleprompter scrolls until end.
        // Total Text Height = lines.length * lineHeight
        // If we want last line to reach top: Max Scroll = Total Height + Padding.
        // Let's stop when the last line moves out of view? Or stops at center?
        // Let's stop when end of content reaches middle (Focus Line).
        // Start Y of first line = paddingY - scrollPos.
        // Y of last line = paddingY - scrollPos + (lines.length-1)*lineHeight.
        // We want last line to be at FocusY (roughly middle).
        // height/2 = paddingY - scrollPos + (lines.length-1)*lineHeight
        // scrollPos = paddingY + (lines.length-1)*lineHeight - height/2

        const paddingY = height * 0.35;
        const totalTextHeight = renderedLines.length * lineHeightPx;
        // Allow scrolling until the end of text passes the view?
        // Or just stop when the specific text ends.
        // Let's play it safe and let it scroll past a bit.
        const maxScroll = totalTextHeight + paddingY;

        // Calculate speed
        const speedFactor = settings.speed * 0.5;

        if (isPlaying) {
            const nextPos = scrollPosRef.current + speedFactor * (deltaTime / 1000);
            if (nextPos >= maxScroll) {
                scrollPosRef.current = maxScroll;
                if (onFinish) onFinish(); // Notify parent to stop playing
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
            // Draw only if visible (with buffer)
            if (y + lineHeightPx > -100 && y < height + 100) {
                ctx.fillText(line, centerX, y);
            }
        });

        ctx.restore(); // Restore mirror state

        // Draw Focus Line (Static UI)
        if (settings.showFocusLine) {
            const focusY = height / 2 - (lineHeightPx / 2);

            ctx.strokeStyle = 'rgba(13, 127, 242, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, focusY);
            ctx.lineTo(width, focusY);
            ctx.moveTo(0, focusY + lineHeightPx);
            ctx.lineTo(width, focusY + lineHeightPx);
            ctx.stroke();

            // Optional: shadow
            ctx.shadowColor = 'rgba(13, 127, 242, 0.2)';
            ctx.shadowBlur = 20;
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
