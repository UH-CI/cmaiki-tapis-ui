import React, { useEffect, useRef, useState, forwardRef } from 'react';
import {
  Autocomplete,
  TextField,
  Paper,
  createFilterOptions,
} from '@mui/material';
import { List, RowComponentProps } from 'react-window';

interface MUIAutocompleteDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onSelectionMade?: () => void;
  placeholder?: string;
}

const filterOptions = createFilterOptions<string>({
  limit: 1200,
});

const LISTBOX_PADDING = 8;
const ITEM_SIZE = 36;
const MAX_VISIBLE_ITEMS = 8;

type ItemData = React.ReactNode[];

function RowComponent({
  index,
  itemData,
  style,
}: RowComponentProps & { itemData: ItemData }) {
  const item = itemData[index] as React.ReactElement;
  const inlineStyle = {
    ...style,
    top: ((style.top as number) ?? 0) + LISTBOX_PADDING,
  };
  return React.cloneElement(item, { style: inlineStyle });
}

interface ListboxProps extends React.HTMLAttributes<HTMLElement> {}

const ListboxComponent = forwardRef<HTMLDivElement, ListboxProps>(
  function ListboxComponent(props, ref) {
    const { children, className, ...other } = props;
    const itemData = React.Children.toArray(children);
    const itemCount = itemData.length;

    const height =
      Math.min(MAX_VISIBLE_ITEMS, itemCount) * ITEM_SIZE + 2 * LISTBOX_PADDING;

    return (
      <div ref={ref} {...other}>
        <List
          className={className}
          rowCount={itemCount}
          rowHeight={ITEM_SIZE}
          rowComponent={RowComponent}
          rowProps={{ itemData }}
          style={{ height, width: '100%' }}
          overscanCount={5}
          tagName="ul"
        />
      </div>
    );
  }
);

export const MUIAutocompleteDropdown: React.FC<
  MUIAutocompleteDropdownProps
> = ({
  value,
  options,
  onChange,
  onKeyDown,
  onSelectionMade,
  placeholder = 'Type to search...',
}) => {
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    const input = autocompleteRef.current?.querySelector('input');
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  return (
    <Autocomplete
      ref={autocompleteRef}
      freeSolo
      open={open}
      onOpen={() => setOpen(true)}
      onClose={(_event, reason) => {
        setOpen(false);
        if (reason === 'selectOption') {
          setTimeout(() => onSelectionMade?.(), 0);
        }
      }}
      value={value || null}
      inputValue={inputValue}
      options={options}
      filterOptions={filterOptions}
      disableListWrap
      ListboxComponent={ListboxComponent}
      onChange={(_event, newValue) => {
        const selectedValue = newValue || '';
        onChange(selectedValue);
        setInputValue(selectedValue);
      }}
      onInputChange={(_event, newInputValue, reason) => {
        setInputValue(newInputValue);
        if (reason === 'input') {
          onChange(newInputValue);
          setOpen(true);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="standard"
          InputProps={{
            ...params.InputProps,
            disableUnderline: true,
            onKeyDown: (e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                setOpen(true);
                return;
              }
              if (e.key === 'Enter' && !open) {
                onSelectionMade?.();
                return;
              }
              if (e.key === 'Tab') {
                setOpen(false);
                e.preventDefault();
                e.stopPropagation();
                onKeyDown?.(e);
                return;
              }
              if (e.key === 'Escape') {
                setOpen(false);
              }
            },
            style: { fontSize: 'inherit', padding: '4px 8px' },
          }}
          inputProps={{
            ...params.inputProps,
            style: { padding: '4px 8px', fontSize: 'inherit' },
          }}
        />
      )}
      PaperComponent={(props) => (
        <Paper
          {...props}
          style={{ ...props.style, marginTop: '4px', zIndex: 9999 }}
        />
      )}
      size="small"
      disablePortal={false}
      style={{ width: '100%', height: '100%' }}
      autoHighlight
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
    />
  );
};
