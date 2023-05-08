import { useEffect, useRef, useState } from "react";
import { groot } from "@grootio/web-runtime";
import { PropMetadataComponent } from "@grootio/common";

type PropType = {
  children: React.ReactElement[] & { _groot?: PropMetadataComponent },
  minHeight?: number,
  padding?: number
}


export const ComponentSlot: React.FC<PropType> = ({ children, minHeight = 100, padding = 100 }) => {
  const containerRef = useRef<HTMLDivElement>();
  const [dragZoneStyles, setDragZoneStyles] = useState<React.CSSProperties>({
    display: 'flex',
    backgroundColor: 'rgb(216 244 255)',
    height: `${minHeight}px`,
    alignItems: 'center',
    justifyContent: 'center'
  });

  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).highlight = () => {
        setDragZoneStyles({ ...dragZoneStyles, backgroundColor: 'rgb(255 216 216)' });
      }

      (containerRef.current as any).cancelHighlight = () => {
        setDragZoneStyles({ ...dragZoneStyles, backgroundColor: 'rgb(216 244 255)' });
      }
    }
  }, [containerRef.current]);

  if (!children) {
    console.warn('插槽未在组件原型中进行配置！');
    return null;
  } else if (!children._groot) {
    return <div>参数异常！</div>
  }

  {/* 预留自由布局 */ }
  return <div data-groot-slot={children._groot.$$runtime?.parentId}
    data-groot-key-chain={children._groot.$$runtime?.propKeyChain}
    {...{ 'data-groot-allow-highlight': !children?.length ? true : undefined }}
    ref={containerRef}
    style={{
      display: 'grid',
    }}>
    {
      children.map((child, index) => {
        return <div data-groot-slot-item={index} key={(child as any).key}>
          {child}
        </div>
      })
    }

    {
      groot.controlMode && !children.length && (
        <div data-groot-slot-drag-zone="true" style={dragZoneStyles} >
          拖拽组件到这里
        </div>
      )
    }
  </div>
}
