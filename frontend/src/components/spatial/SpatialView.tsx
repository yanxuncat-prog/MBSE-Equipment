import { useState, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Equipment, Zone } from '../../types';
import { AircraftSideView } from './AircraftSideView';
import { AircraftTopView } from './AircraftTopView';
import { SectionView } from './SectionView';

// Lazy load 3D scene (Three.js is heavy)
const AircraftScene3D = lazy(() =>
  import('../spatial3d/AircraftScene3D').then(m => ({ default: m.AircraftScene3D }))
);

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

export function SpatialView({ equipment, zones, selectedId, onSelect }: Props) {
  const [sta, setSta] = useState(400);

  return (
    <div className="h-full">
      <Tabs defaultValue="3d">
        <TabsList>
          <TabsTrigger value="3d">3D 视图</TabsTrigger>
          <TabsTrigger value="side">侧视图</TabsTrigger>
          <TabsTrigger value="top">俯视图</TabsTrigger>
          <TabsTrigger value="section">截面图</TabsTrigger>
        </TabsList>

        <TabsContent value="3d">
          <div className="h-[calc(100vh-240px)] min-h-[500px]">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">加载 3D 引擎...</span>
              </div>
            }>
              <AircraftScene3D equipment={equipment} zones={zones} selectedId={selectedId} onSelect={onSelect} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="side">
          <div className="h-[calc(100vh-240px)]">
            <AircraftSideView equipment={equipment} zones={zones} selectedId={selectedId} onSelect={onSelect} />
          </div>
        </TabsContent>

        <TabsContent value="top">
          <div className="h-[calc(100vh-240px)]">
            <AircraftTopView equipment={equipment} zones={zones} selectedId={selectedId} onSelect={onSelect} />
          </div>
        </TabsContent>

        <TabsContent value="section">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">STA位置:</span>
              <input
                type="range"
                min={100}
                max={1100}
                value={sta}
                onChange={e => setSta(Number(e.target.value))}
                className="w-[300px] accent-primary"
              />
              <span className="text-xs font-mono text-muted-foreground">{sta}</span>
            </div>
            <div className="h-[calc(100vh-280px)]">
              <SectionView equipment={equipment} staCurrent={sta} selectedId={selectedId} onSelect={onSelect} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
