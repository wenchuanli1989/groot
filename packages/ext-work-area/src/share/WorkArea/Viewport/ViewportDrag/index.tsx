import { DragCursor, PostMessageType } from "@grootio/common";
import { grootManager } from "context";
import { useEffect, useRef } from "react";

import styles from './index.module.less';

const ViewportDrag: React.FC = () => {
  const dragAnchorRef = useRef<HTMLDivElement>();
  const dragSlotRef = useRef<HTMLDivElement>();
  const containerRef = useRef<HTMLDivElement>();
  const { registerHook, callHook } = grootManager.hook

  useEffect(() => {
    registerHook('gh.component.dragStart', () => {
      // 开始响应外部组件拖入操作
      containerRef.current.style.display = 'inline-block';
    })
    registerHook('gh.component.dragEnd', () => {
      containerRef.current.style.display = 'none';
    })
    registerHook(PostMessageType.InnerDragRefreshCursor, setDragAnchor)
  }, []);

  function onDragEnter() {
    callHook(PostMessageType.OuterDragAddComponentEnter)
  }

  // 必须有监听dragover事件否则drop事件无法触发
  function onDragOver(event) {
    event.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    callHook(PostMessageType.OuterDragAddComponentOver, {
      positionX: event.pageX - rect.left,
      positionY: event.pageY - rect.top,
    })
  }

  function onDrop(event) {
    const componentId = event.dataTransfer.getData('componentId');
    const componentVersionId = event.dataTransfer.getData('componentVersionId');
    const solutionComponentId = event.dataTransfer.getData('solutionComponentId');
    const solutionVersionId = event.dataTransfer.getData('solutionVersionId');
    const rect = containerRef.current.getBoundingClientRect();
    callHook(PostMessageType.OuterDragAddComponentDrop, {
      positionX: event.pageX - rect.left,
      positionY: event.pageY - rect.top,
      componentId,
      componentVersionId,
      solutionComponentId,
      solutionVersionId
    })
    containerRef.current.style.display = 'none';
  }

  function onDragLeave() {
    callHook(PostMessageType.OuterDragAddComponentLeave)
  }

  function setDragAnchor(data: DragCursor) {
    if (data) {
      let styles = dragAnchorRef.current.style;
      styles.display = 'inline-block';
      styles.left = `${data.left}px`;
      styles.top = `${data.top}px`;
      styles.width = `${data.width}px`;

      styles = dragSlotRef.current.style;
      styles.display = 'inline-block';
      styles.top = `${data.slotRect.top}px`;
      styles.left = `${data.slotRect.left}px`;
      styles.width = `${data.slotRect.width}px`;
      styles.height = `${data.slotRect.height}px`;
    } else {
      dragAnchorRef.current.style.display = 'none';
      dragSlotRef.current.style.display = 'none';
    }
  }

  return <div className={styles.container} ref={containerRef}
    onDragOver={onDragOver} onDrop={onDrop}
    onDragEnter={onDragEnter} onDragLeave={onDragLeave} >
    <div ref={dragAnchorRef} className={styles.dragAnchor} />
    <div ref={dragSlotRef} className={styles.dragSlot} />
  </div>
}

export default ViewportDrag;