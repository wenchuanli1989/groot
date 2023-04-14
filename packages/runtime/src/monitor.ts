import { DragAddComponentEventData, ComponentDragAnchor, ComponentAnchor, Metadata, PostMessageType, PropMetadataComponent, PropMetadataType } from "@grootio/common";
import { controlMode } from "./config";

let _viewEleMap: Map<number, HTMLElement>;
let _viewMetadataMap: Map<number, Metadata>;
let monitorRunning = false;
let outlineSelectedInstanceId, outlineHoverInstanceId;
let draging;
let activeSlotEle: HTMLElement & {
  highlight?: () => void,
  cancelHighlight?: () => void,
};

export const launchWatch = (viewEleMap: Map<number, HTMLElement>, viewMetadataMap: Map<number, Metadata>) => {
  if (monitorRunning || !controlMode) {
    return () => { };
  }
  _viewEleMap = viewEleMap;
  _viewMetadataMap = viewMetadataMap;

  monitorRunning = true;
  document.body.addEventListener('mousemove', outlineHoverAction, true);
  document.body.addEventListener('mousedown', outlineMousedownAction, true);
  window.addEventListener('resize', updateActiveRect, true);
  document.addEventListener('scroll', updateActiveRect, true);

  return () => {
    document.body.removeEventListener('mousemove', outlineHoverAction, true);
    document.body.removeEventListener('mousedown', outlineMousedownAction, true);
    window.removeEventListener('resize', updateActiveRect, true);
    document.removeEventListener('scroll', updateActiveRect, true);
  }
}

export const resetWatch = (type?: 'hover' | 'selected') => {
  if (type === 'hover') {
    outlineHoverInstanceId = undefined;
  } else if (type === 'selected') {
    outlineSelectedInstanceId = undefined;
  } else {
    outlineHoverInstanceId = undefined;
    outlineSelectedInstanceId = undefined;
  }
}

export function outerSelected(instanceId: number) {
  const selectedEle = _viewEleMap.get(instanceId);
  if (!selectedEle) {
    return;
  }

  outlineSelectedInstanceId = instanceId;
  const metadata = _viewMetadataMap.get(outlineSelectedInstanceId);
  const clientRect = selectedEle.getBoundingClientRect();
  window.parent.postMessage({
    type: PostMessageType.InnerOutlineSelect,
    data: {
      clientRect,
      tagName: `${metadata.packageName}/${metadata.componentName}`,
      instanceId,
      parentInstanceId: metadata.parentId,
      rootInstanceId: metadata.rootId,
      propItemId: metadata.$$runtime.propItemId,
      abstractValueIdChain: metadata.$$runtime.abstractValueIdChain
    } as ComponentAnchor
  }, '*');
}

export function updateActiveRect() {
  if (!outlineSelectedInstanceId && !outlineHoverInstanceId) {
    return;
  }

  let selectedInfo: ComponentAnchor, hoverInfo: ComponentAnchor;
  if (outlineSelectedInstanceId) {
    const selectedEle = _viewEleMap.get(outlineSelectedInstanceId);
    const selectedMetadata = _viewMetadataMap.get(outlineSelectedInstanceId);

    if (selectedEle && selectedMetadata) {
      selectedInfo = {
        clientRect: selectedEle.getBoundingClientRect(),
        tagName: `${selectedMetadata.packageName}/${selectedMetadata.componentName}`,
        instanceId: outlineSelectedInstanceId,
        parentInstanceId: selectedMetadata.parentId,
        rootInstanceId: selectedMetadata.rootId,
        propItemId: selectedMetadata.$$runtime.propItemId,
        abstractValueIdChain: selectedMetadata.$$runtime.abstractValueIdChain
      }
    } else {
      outlineSelectedInstanceId = undefined;
    }
  }

  if (outlineHoverInstanceId) {
    const hoverEle = _viewEleMap.get(outlineHoverInstanceId);
    const hoverMetadata = _viewMetadataMap.get(outlineHoverInstanceId);

    if (hoverEle && hoverMetadata) {
      hoverInfo = {
        clientRect: hoverEle.getBoundingClientRect(),
        tagName: `${hoverMetadata.packageName}/${hoverMetadata.componentName}`,
        instanceId: outlineHoverInstanceId,
        parentInstanceId: hoverMetadata.parentId,
        rootInstanceId: hoverMetadata.rootId,
        propItemId: hoverMetadata.$$runtime.propItemId,
        abstractValueIdChain: hoverMetadata.$$runtime.abstractValueIdChain
      }
    } else {
      outlineHoverInstanceId = undefined;
    }
  }


  window.parent.postMessage({
    type: PostMessageType.InnerOutlineUpdate,
    data: {
      selected: selectedInfo,
      hover: hoverInfo
    }
  }, '*');
}

export function respondDragOver(positionX: number, positionY: number) {
  const slotEle = detectWrapperEle(positionX, positionY, 'grootSlot');
  if (slotEle !== activeSlotEle) {
    activeSlotEle?.cancelHighlight();
    activeSlotEle = slotEle;
  }

  if (!slotEle) {
    window.parent.postMessage({ type: PostMessageType.InnerUpdateDragAnchor }, '*');
    return;
  }

  if (activeSlotEle.dataset.grootAllowHighlight) {
    activeSlotEle.highlight();
    window.parent.postMessage({ type: PostMessageType.InnerUpdateDragAnchor }, '*');
  } else {
    const markerInfo = calcDragRect(positionX, positionY, slotEle);
    delete markerInfo.hitEle;
    window.parent.postMessage({ type: PostMessageType.InnerUpdateDragAnchor, data: markerInfo }, '*');
  }
}

export function respondDragEnter() {
  draging = true;
}

export function respondDragLeave() {
  activeSlotEle?.cancelHighlight();
  window.parent.postMessage({ type: PostMessageType.InnerUpdateDragAnchor }, '*');
  activeSlotEle = null;
  draging = false;
}

export function respondDragDrop(positionX: number, positionY: number, componentId: number, componentVersionId: number) {
  if (!activeSlotEle) {
    return;
  }

  const parentInstanceId = +activeSlotEle.dataset.grootSlot;
  const keyChain = activeSlotEle.dataset.grootKeyChain;
  const parentMetadata = _viewMetadataMap.get(parentInstanceId);
  const propMetadata = parentMetadata.advancedProps.find(item => item.keyChain === keyChain);
  if (propMetadata.type !== PropMetadataType.Component) {
    throw new Error('参数错误')
  }
  const { propItemId, abstractValueIdChain, solutionInstanceId } = propMetadata.data.$$runtime;
  if (activeSlotEle.dataset.grootAllowHighlight) {
    window.parent.postMessage({
      type: PostMessageType.InnerDragHitSlot,
      data: {
        parentInstanceId,
        componentId,
        propItemId,
        abstractValueIdChain,
        solutionInstanceId,
        componentVersionId
      } as DragAddComponentEventData
    }, '*');
  } else {
    const markerInfo = calcDragRect(positionX, positionY, activeSlotEle);
    const instanceEle = markerInfo.hitEle.children[0] as HTMLElement;
    const currentInstanceId = +instanceEle.dataset.grootComponentInstanceId;

    window.parent.postMessage({
      type: PostMessageType.InnerDragHitSlot,
      data: {
        parentInstanceId,
        componentId,
        propItemId,
        abstractValueIdChain,
        currentInstanceId,
        solutionInstanceId,
        componentVersionId,
        direction: { top: 'pre', bottom: 'next' }[markerInfo.direction]
      } as DragAddComponentEventData
    }, '*');
  }
  respondDragLeave();
}



function outlineHoverAction({ clientX, clientY }: MouseEvent) {
  if (draging) return;

  let hitEle = detectWrapperEle(clientX, clientY, 'grootComponentInstanceId');
  let instanceId, metadata;
  if (hitEle) {
    instanceId = +hitEle.dataset.grootComponentInstanceId;
    metadata = _viewMetadataMap.get(instanceId);
    if (!metadata) {
      return;
    }

    if (!metadata.parentId) {
      // 根组件不需要选中操作
      hitEle = instanceId = metadata = null;
    }
  }

  if (hitEle) {
    outlineHoverInstanceId = instanceId;
    const clientRect = hitEle.getBoundingClientRect();
    window.parent.postMessage({
      type: PostMessageType.InnerOutlineHover,
      data: {
        clientRect,
        tagName: `${metadata.packageName}/${metadata.componentName}`,
        instanceId,
        parentInstanceId: metadata.parentId,
        rootInstanceId: metadata.rootId,
        propItemId: metadata.$$runtime.propItemId,
        abstractValueIdChain: metadata.$$runtime.abstractValueIdChain
      } as ComponentAnchor
    }, '*');
  } else {
    outlineHoverInstanceId = undefined;
    window.parent.postMessage({
      type: PostMessageType.InnerOutlineHover
    }, '*');
  }
}

function outlineMousedownAction() {
  if (!outlineHoverInstanceId) {
    return;
  }

  outlineSelectedInstanceId = outlineHoverInstanceId;
  const hitEle = _viewEleMap.get(outlineSelectedInstanceId);
  const metadata = _viewMetadataMap.get(outlineSelectedInstanceId);
  const clientRect = hitEle.getBoundingClientRect();
  window.parent.postMessage({
    type: PostMessageType.InnerOutlineSelect,
    data: {
      clientRect,
      tagName: `${metadata.packageName}/${metadata.componentName}`,
      instanceId: outlineSelectedInstanceId,
      parentInstanceId: metadata.parentId,
      rootInstanceId: metadata.rootId,
      propItemId: metadata.$$runtime.propItemId,
      abstractValueIdChain: metadata.$$runtime.abstractValueIdChain
    } as ComponentAnchor
  }, '*');
}

function detectWrapperEle(positionX: number, positionY: number, datasetKey: string, endParentElement?: HTMLElement) {
  let hitEle = document.elementFromPoint(positionX, positionY) as HTMLElement;

  while (hitEle) {
    if (hitEle === document.body || hitEle === document.documentElement || hitEle === endParentElement) {
      return null;
    } else if (hitEle.dataset[datasetKey]) {
      return hitEle;
    }
    hitEle = hitEle.parentElement;
  }

  return null;
}

function calcDragRect(positionX: number, positionY: number, slotEle: HTMLElement): ComponentDragAnchor {
  let hitEle = detectWrapperEle(positionX, positionY, 'grootSlotItem', slotEle);
  if (!hitEle) {
    const children = slotEle.querySelectorAll('[data-groot-slot-item]');
    if (children.length) {
      hitEle = children.item(children.length - 1) as HTMLElement;
    } else {
      return null;
    }
  }

  const slotEleRect = slotEle.getBoundingClientRect();
  const hitEleRect = hitEle.getBoundingClientRect();
  const middleHeight = hitEleRect.top + (hitEleRect.height / 2);

  if (positionY > middleHeight) {
    return {
      direction: 'bottom',
      left: slotEleRect.left,
      width: slotEleRect.width,
      top: hitEleRect.bottom,
      hitEle,
      slotRect: slotEleRect
    };
  } else {
    return {
      direction: 'top',
      left: slotEleRect.left,
      width: slotEleRect.width,
      top: hitEleRect.top,
      hitEle,
      slotRect: slotEleRect
    };
  }
}
