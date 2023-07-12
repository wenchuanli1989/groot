import { DeleteOutlined, UpOutlined } from '@ant-design/icons';
import { ComponentAnchor, PostMessageType } from '@grootio/common';
import { grootManager } from 'context';
import { useEffect, useRef } from 'react';

import styles from './index.module.less';

const ViewportOutlineMarker: React.FC = () => {
  const hoverRef = useRef<HTMLDivElement>();
  const selectedRef = useRef<HTMLDivElement>();
  const hoverCacheRef = useRef<ComponentAnchor>();
  const selectedCacheRef = useRef<ComponentAnchor>();
  const { registerHook, callHook } = grootManager.hook
  const { executeCommand } = grootManager.command

  useEffect(() => {
    registerHook(PostMessageType.InnerOutlineHover, onHover);

    registerHook(PostMessageType.InnerOutlineSelect, onSelected);

    // iframe页面内部滚动或者窗口尺寸变化
    registerHook(PostMessageType.InnerOutlineUpdate, onUpdate);

    registerHook(PostMessageType.OuterRefreshView, () => {
      clear();
    })

    // 切换组件到根组件或者删除根组件下子组件需要清空边框
    registerHook(PostMessageType.OuterOutlineReset, clear)

    hoverRef.current.parentElement.addEventListener('mouseleave', () => {
      callHook(PostMessageType.OuterOutlineReset, 'hover')
    })

  }, [])

  function clear(type?: 'hover' | 'selected') {
    if (!type || type === 'hover') {
      hoverCacheRef.current = null;
      hoverRef.current.style.display = 'none';
    }

    if (!type || type === 'selected') {
      selectedCacheRef.current = null;
      selectedRef.current.style.display = 'none';
    }
  }

  function onHover(data: ComponentAnchor) {

    if (data) {
      updateEle(hoverRef.current, data, true);
    } else {
      hoverRef.current.style.display = 'none';
    }

    hoverCacheRef.current = data;
  }

  function onSelected(data: ComponentAnchor) {
    updateEle(selectedRef.current, data, true);
    selectedCacheRef.current = data;

    executeCommand('gc.switchIstance', data.instanceId, data.viewId)
  }

  function onUpdate({ selected, hover }: { selected: ComponentAnchor, hover: ComponentAnchor }) {

    if (hover) {
      updateEle(hoverRef.current, hover);
    } else {
      hoverRef.current.style.display = 'none';
    }
    hoverCacheRef.current = hover;

    if (selected) {
      updateEle(selectedRef.current, selected);
    } else {
      selectedRef.current.style.display = 'none';
    }
    selectedCacheRef.current = selected;
  }

  function updateEle(ele: HTMLElement, data: ComponentAnchor, refreshToolbar = false) {
    ele.style.display = 'inline-block';
    ele.style.left = `${data.clientRect.x}px`;
    ele.style.top = `${data.clientRect.y}px`;
    ele.style.width = `${data.clientRect.width}px`;
    ele.style.height = `${data.clientRect.height}px`;

    if (data.clientRect.y <= 20 && data.clientRect.y >= -20) {
      ele.dataset.innerTop = 'true';
    } else {
      delete ele.dataset.innerTop;
    }

    if (refreshToolbar) {
      const tagNameEle = ele.querySelector(`.${styles.tagName}`) as HTMLElement;
      tagNameEle.innerText = data.tagName;
      const toolbarEle = ele.querySelector(`.${styles.toolbar}`) as HTMLElement;
      toolbarEle.style.left = '0px';

      const selectParentEle = toolbarEle.querySelector('.select-parent') as HTMLDivElement;
      if (!data.parentInstanceId) {
        selectParentEle.style.display = 'none';
      } else {
        selectParentEle.style.display = 'inline-block';
      }

      const { width: tagNameWidth } = tagNameEle.getBoundingClientRect();
      const { width: toolbarWidth } = toolbarEle.getBoundingClientRect();
      let toolbarX = data.clientRect.width - toolbarWidth;
      toolbarX = Math.max(tagNameWidth + 5, toolbarX);
      toolbarEle.style.left = `${toolbarX}px`;
    }
  }

  function toolbarAction(type: 'hover' | 'selected', action: 'select-parent' | 'remove') {
    const ctx = type === 'hover' ? hoverCacheRef.current : selectedCacheRef.current;
    const { executeCommand } = grootManager.command
    if (action === 'select-parent') {
      executeCommand('gc.selectInstance', ctx.parentInstanceId)
    } else if (action === 'remove') {
      executeCommand('gc.removeChildInstance', ctx.instanceId, ctx.propItemId, ctx.abstractValueIdChain)
    }
  }

  return <>
    <div className={styles.hover} ref={hoverRef} >
      <div className={styles.tagName} ></div>

      <div className={styles.toolbar} >
        <div className={`${styles.toolbarItem} select-parent`}
          onClick={() => toolbarAction('hover', 'select-parent')}>
          <UpOutlined />
        </div>

        <div className={styles.toolbarItem} onClick={() => toolbarAction('hover', 'remove')}>
          <DeleteOutlined />
        </div>
      </div>
    </div>

    <div className={styles.selected} ref={selectedRef} >
      <div className={styles.tagName} ></div>

      <div className={styles.toolbar} >
        <div className={`${styles.toolbarItem} select-parent`}
          onClick={() => toolbarAction('selected', 'select-parent')}>
          <UpOutlined />
        </div>

        <div className={styles.toolbarItem} onClick={() => toolbarAction('selected', 'remove')}>
          <DeleteOutlined />
        </div>
      </div>
    </div>
  </>
}


export default ViewportOutlineMarker;