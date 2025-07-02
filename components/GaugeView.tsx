/**
 * GaugeView.tsx
 *
 *
 */

import React, {useEffect, useRef} from "react";

type Props = {
  value: number;
  size?: number;
  title?: string;
  unit?: string;
  min: number;
  max: number;
  colors: string[];
  thresholds?: number[];
};

const getColor = (value: number, colors: string[], thresholds: number[]) => {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) {
      return colors[i];
    }
  }
  return colors[colors.length - 1];
}

const polarToCartesian = (x: number, y: number, radius: number, theta: number) => {
  return {
    x: x + Number((radius * Math.cos(theta)).toFixed(0)),
    y: y + Number((radius * Math.sin(theta)).toFixed(0)),
  };
};

type DrawGaugeOptions = {
  strokeWidth?: number;
  clockWise?: boolean;
}

const drawGauge = (x: number, y: number, radius: number, startAngle: number, endAngle: number, options: DrawGaugeOptions) => {
  const {clockWise, strokeWidth} = options;
  const outerStart = polarToCartesian(x, y, radius, startAngle);
  const outerEnd = polarToCartesian(x, y, radius, endAngle);
  const innerRadius = radius - (strokeWidth ?? 30);
  const innerStart = polarToCartesian(x, y, innerRadius, endAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${radius} ${radius} 0 0 ${clockWise ? '1' : '0'} ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerEnd.x} ${innerEnd.y} Z`,
  ].join(' ');
};

export default function GaugeView({value, title, unit, min, max, colors, thresholds, ...props}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const backgroundRef = useRef<SVGPathElement>(null);
  const foregroundRef = useRef<SVGPathElement>(null);
  const minLabelRef = useRef<SVGTextElement>(null);
  const maxLabelRef = useRef<SVGTextElement>(null);
  const unitLabelRef = useRef<SVGTextElement>(null);
  const valueLabelRef = useRef<SVGTextElement>(null);
  const width = useRef(props.size ?? 300);
  const height = useRef((props.size ?? 300) * 0.75);
  const isMounted = useRef(false);

  useEffect(() => {
    const centerX = (width.current) / 2;
    const centerY = height.current - (height.current * 0.2);
    const startAngle = Math.PI;
    const radius = centerX;
    const strokeWidth = width.current * 0.15;
    if (!isMounted.current) {
      const endAngle = 0;
      // draw background layer
      const path = backgroundRef.current;
      const minLabel = minLabelRef.current;
      const maxLabel = maxLabelRef.current;
      const unitLabel = unitLabelRef.current;
      if (path) {
        path.setAttribute(
          'd',
          drawGauge(centerX, centerY, radius, startAngle, endAngle, {strokeWidth, clockWise: true})
        );
        path.setAttribute('fill', '#7f7f7f');
        path.setAttribute('fill-opacity', '0.5');
        path.setAttribute('stroke', 'none');
      }
      if (minLabel) {
        const start = polarToCartesian(centerX, centerY, radius, startAngle);
        const labelWidth = minLabel.getBoundingClientRect().width;
        const labelHeight = minLabel.getBoundingClientRect().height;
        const labelX = start.x + strokeWidth / 2 - labelWidth / 2;
        minLabel.setAttribute('x', `${labelX}`);
        minLabel.setAttribute('y', `${start.y + labelHeight}`);
      }
      if (maxLabel) {
        const end = polarToCartesian(centerX, centerY, radius, endAngle);
        const labelWidth = maxLabel.getBoundingClientRect().width;
        const labelHeight = maxLabel.getBoundingClientRect().height;
        const labelX = end.x - strokeWidth / 2 - labelWidth / 2;
        maxLabel.setAttribute('x', `${labelX}`);
        maxLabel.setAttribute('y', `${end.y + labelHeight}`);
      }
      if (unitLabel) {
        const labelWidth = unitLabel.getBoundingClientRect().width;
        const labelHeight = unitLabel.getBoundingClientRect().height;
        const labelX = centerX - (labelWidth / 2);
        unitLabel.setAttribute('x', `${labelX}`);
        unitLabel.setAttribute('y', `${centerY + labelHeight}`);
      }
      isMounted.current = true;
    }

    // draw
    const newValue = value < min ? min : value > max ? max : value;
    const percent = (newValue - min) / (max - min);
    const endAngle = Math.PI * (1 - percent) * -1;
    const path = foregroundRef.current;
    const label = valueLabelRef.current;
    let color = '';
    let filtered = thresholds;
    if (filtered !== undefined) {
      color = getColor(newValue, colors, filtered);
    } else {
      let i = 0;
      filtered = [];
      for (i = 0; i < colors.length - 1; i++) {
        filtered.push((i + 1) / colors.length);
      }
      color = getColor(percent, colors, filtered);
    }
    if (path && label) {
      const labelX = centerX - (label.getBoundingClientRect().width / 2) - 5;
      const labelY = centerY;
      path.setAttribute(
        'd',
        drawGauge(centerX, centerY, radius, startAngle, endAngle, {strokeWidth, clockWise: true})
      );
      path.setAttribute('fill', color);
      path.setAttribute('stroke', 'none');
      label.setAttribute('x', `${labelX}`);
      label.setAttribute('y', `${labelY}`);
    }
  }, [colors, max, min, value, thresholds]);

  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center'}}>
      {title && (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <p style={{fontFamily: 'inherit', fontSize: '24px'}}>{title}</p>
        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column'}}>
        <svg
          ref={svgRef}
          width={width.current}
          height={height.current}
          xmlns={'http://www.w3.org/2000/svg'}>
          <path ref={backgroundRef} />
          <path ref={foregroundRef} />
          <text
            ref={unitLabelRef}
            fontFamily={'inherit'}
            fontSize={'10px'}>
            <tspan dy={0}>{unit ?? ''}</tspan>
          </text>
          <text
            ref={valueLabelRef}
            style={{fontWeight: 'bold'}}
            fontFamily={'inherit'}
            fontSize={'18px'}>
            <tspan dy={0}>{value}</tspan>
          </text>
          <text
            ref={minLabelRef}
            fontFamily={'inherit'}
            fontSize={'10px'}>
            <tspan dy={0}>{min}</tspan>
          </text>
          <text
            ref={maxLabelRef}
            fontFamily={'inherit'}
            fontSize={'10px'}>
            <tspan dy={0}>{max}</tspan>
          </text>
        </svg>
      </div>
    </div>
  );
}
