import type * as monacoInstance from 'monaco-editor';
import type * as monacoNamespace from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { monacoLoader } from 'util/monaco-loader';

type propsType = {
  value?: string;
  onChange?: (value: string) => void,
  type?: 'json' | 'function'
}

type MonacoType = typeof monacoInstance;

let monaco: MonacoType;


function TextEditor({ onChange, value, type = 'json' }: propsType) {
  const editorSubscriptionRef = useRef({} as any);
  const editorRef = useRef({} as any);
  const codeEditorContainerRef = useRef({} as any);
  const [ready, setReady] = useState(false);

  // 初始化默认执行一次文档格式化
  useEffect(() => {
    if (!ready) return () => { };

    const action = editorRef.current.getAction('editor.action.formatDocument');

    const initRunTimeout = setTimeout(() => {
      action.run();
    }, 100);

    return () => {
      clearTimeout(initRunTimeout);
    }
  }, [ready]);

  useEffect(() => {
    monacoLoader().then(() => {
      if (!codeEditorContainerRef.current) {
        return
      }

      monaco = (window as any).monaco;
      const [model, modelUri] = createModel(type) as any;

      if (type === 'json') {
        model.setValue(JSON.stringify(value || ''));
      } else {
        model.setValue(value || '');
      }

      // http://json-schema.org/learn/getting-started-step-by-step
      // http://json-schema.org/understanding-json-schema/
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: 'https://groot.dev/metadata-list.schema.json',
            fileMatch: [modelUri.toString()],
          }
        ]
      });

      monaco.languages.typescript.typescriptDefaults.addExtraLib(`
        declare const _groot:{
          readonly version: string;
          readonly controlMode: boolean;
          readonly controlType: 'prototype' | 'instance';
        };
        
        declare const _shared: Record<string, any>;
        declare let _exportFn: Function;
        declare const _props: any;
    `, '');

      editorRef.current = monaco.editor.create(codeEditorContainerRef.current, {
        model,
        theme: 'vs-dark',
        formatOnPaste: true,
        minimap: {
          enabled: false
        },
      });

      setReady(true);
    });

    return () => {
      if (!editorRef.current || !ready) {
        return
      }

      editorRef.current.dispose();
      const model = editorRef.current.getModel();
      if (model) {
        model.dispose();
      }
      if (editorSubscriptionRef.current) {
        editorSubscriptionRef.current.dispose();
      }
    }
  }, [])

  // 绑定键盘事件，自动触发更新
  useEffect(() => {
    if (!ready) return;

    let keyDown = false;
    editorRef.current.onKeyDown(() => {
      keyDown = true;
      setTimeout(() => {
        keyDown = false;
      });
    })

    editorSubscriptionRef.current = editorRef.current.onDidChangeModelContent(() => {
      if (keyDown) {
        onChange(editorRef.current.getValue());
      }
    });
  }, [ready]);

  return <div style={{ width: '100%', height: '180px' }} ref={codeEditorContainerRef}></div>
}

let ticket = 0;
function createModel(type: 'json' | 'function'): [monacoNamespace.editor.ITextModel, monacoNamespace.Uri] {
  if (type === 'json') {
    const jsonModelUri = monaco.Uri.parse(`groot://j-${++ticket}.json`);
    const jsonModel = monaco.editor.createModel('', 'json', jsonModelUri);
    return [jsonModel, jsonModelUri];
  } else {
    const functionModelUri = monaco.Uri.parse(`groot://f-${++ticket}.json`);
    const functionModel = monaco.editor.createModel('', 'typescript', functionModelUri);
    return [functionModel, functionModelUri];
  }
}
export default TextEditor;