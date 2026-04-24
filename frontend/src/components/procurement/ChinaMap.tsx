import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Simplified China outline path (approximation)
const CHINA_OUTLINE =
  'M 180,40 L 220,30 L 260,25 L 300,30 L 340,20 L 380,25 L 420,35 L 450,30 L 480,40 L 500,60 L 520,80 L 530,100 L 540,120 L 535,140 L 520,160 L 530,180 L 540,200 L 530,220 L 510,240 L 490,250 L 470,260 L 450,270 L 420,280 L 390,290 L 360,295 L 330,290 L 300,280 L 280,290 L 260,300 L 240,310 L 220,305 L 200,290 L 180,280 L 160,260 L 140,240 L 120,220 L 110,200 L 100,180 L 90,160 L 80,140 L 75,120 L 80,100 L 90,80 L 110,60 L 140,45 Z';

// Major aerospace/manufacturing cities with approximate SVG coordinates
const CITIES: { name: string; x: number; y: number }[] = [
  { name: '北京', x: 380, y: 80 },
  { name: '上海', x: 460, y: 185 },
  { name: '西安', x: 310, y: 150 },
  { name: '成都', x: 260, y: 210 },
  { name: '沈阳', x: 420, y: 55 },
  { name: '哈尔滨', x: 440, y: 35 },
  { name: '南京', x: 440, y: 180 },
  { name: '杭州', x: 450, y: 195 },
  { name: '武汉', x: 370, y: 200 },
  { name: '广州', x: 370, y: 275 },
  { name: '深圳', x: 380, y: 280 },
  { name: '天津', x: 390, y: 88 },
  { name: '重庆', x: 290, y: 220 },
  { name: '长沙', x: 360, y: 230 },
  { name: '珠海', x: 365, y: 280 },
  { name: '贵阳', x: 290, y: 245 },
  { name: '昆明', x: 240, y: 260 },
  { name: '南昌', x: 400, y: 220 },
  { name: '合肥', x: 415, y: 180 },
  { name: '郑州', x: 360, y: 145 },
  { name: '大场', x: 462, y: 188 },
];

interface CityData {
  name: string;
  count: number;
  ataBreakdown: Record<string, number>;
}

interface Props {
  equipmentByCity: CityData[];
}

export function ChinaMap({ equipmentByCity }: Props) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const cityDataMap = useMemo(() => {
    const map = new Map<string, CityData>();
    for (const cd of equipmentByCity) {
      map.set(cd.name, cd);
    }
    return map;
  }, [equipmentByCity]);

  const maxCount = useMemo(
    () => Math.max(...equipmentByCity.map(c => c.count), 1),
    [equipmentByCity],
  );

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>设备地理分布</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox="60 10 500 310"
          className="w-full"
          style={{ maxHeight: 400 }}
          role="img"
          aria-label="设备地理分布图"
        >
          <title>设备地理分布图</title>

          {/* China outline */}
          <path
            d={CHINA_OUTLINE}
            fill="var(--muted)"
            fillOpacity={0.3}
            stroke="var(--border)"
            strokeWidth={1.5}
          />

          {/* Cities without data shown as small dots */}
          {CITIES.filter(c => !cityDataMap.has(c.name)).map(city => (
            <g key={city.name}>
              <circle
                cx={city.x}
                cy={city.y}
                r={2}
                fill="var(--muted-foreground)"
                fillOpacity={0.3}
              />
              <text
                x={city.x}
                y={city.y + 10}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize={7}
                opacity={0.5}
              >
                {city.name}
              </text>
            </g>
          ))}

          {/* City markers with data */}
          {CITIES.map(city => {
            const data = cityDataMap.get(city.name);
            const count = data?.count || 0;
            const r =
              count > 0
                ? Math.max(4, Math.min(16, Math.sqrt(count / maxCount) * 16))
                : 0;
            const isHovered = hoveredCity === city.name;

            if (count === 0) return null;

            return (
              <g
                key={city.name}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Marker circle */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={r}
                  fill="var(--chart-1)"
                  fillOpacity={isHovered ? 0.9 : 0.6}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                />
                {/* Count label */}
                {r > 6 && (
                  <text
                    x={city.x}
                    y={city.y + 3}
                    textAnchor="middle"
                    fill="var(--primary-foreground)"
                    fontSize={8}
                    fontWeight={600}
                  >
                    {count}
                  </text>
                )}
                {/* City name */}
                <text
                  x={city.x}
                  y={city.y + r + 10}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize={8}
                >
                  {city.name}
                </text>
                {/* Hover tooltip */}
                {isHovered && data && (
                  <g>
                    <rect
                      x={city.x + r + 4}
                      y={city.y - 20}
                      width={100}
                      height={36}
                      rx={4}
                      fill="var(--popover)"
                      stroke="var(--border)"
                      strokeWidth={0.5}
                    />
                    <text
                      x={city.x + r + 10}
                      y={city.y - 6}
                      fill="var(--popover-foreground)"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {city.name}: {count} 台
                    </text>
                    <text
                      x={city.x + r + 10}
                      y={city.y + 8}
                      fill="var(--muted-foreground)"
                      fontSize={8}
                    >
                      {Object.entries(data.ataBreakdown)
                        .slice(0, 3)
                        .map(([ata, n]) => `ATA${ata}:${n}`)
                        .join(' ')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
