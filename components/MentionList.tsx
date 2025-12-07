'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { SuggestionProps } from '@tiptap/suggestion';

interface MentionListProps extends SuggestionProps {
  items: Array<{ id: string; label: string; type: string }>;
  command: (item: { id: string; label: string }) => void;
}

const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="mention-list">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={item.id}
            onClick={() => selectItem(index)}
            type="button"
          >
            <span className="mention-type">{item.type}</span>
            <span className="mention-label">{item.label}</span>
          </button>
        ))
      ) : (
        <div className="mention-item empty">digite nome</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
