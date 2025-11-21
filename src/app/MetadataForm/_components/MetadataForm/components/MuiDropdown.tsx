import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  TextField,
  Paper,
  createFilterOptions,
} from '@mui/material';

interface MUIAutocompleteDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onSelectionMade?: () => void;
  placeholder?: string;
}

const filterOptions = createFilterOptions<string>({
  limit: 50,
});

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
    // Focus the input when component mounts
    const input = autocompleteRef.current?.querySelector('input');
    if (input) {
      setTimeout(() => {
        input.focus();
      }, 100);
    }
  }, []);

  // Sync inputValue with value prop
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  return (
    <Autocomplete
      ref={autocompleteRef}
      freeSolo
      open={open}
      onOpen={() => setOpen(true)}
      onClose={(event, reason) => {
        setOpen(false);
        // If closed due to selection, exit edit mode
        if (reason === 'selectOption') {
          setTimeout(() => {
            onSelectionMade?.();
          }, 0);
        }
      }}
      value={value || null}
      inputValue={inputValue}
      options={options}
      filterOptions={filterOptions}
      onChange={(event, newValue) => {
        // Handle selection from dropdown
        const selectedValue = newValue || '';
        onChange(selectedValue);
        setInputValue(selectedValue);
        // Don't call onSelectionMade here - let onClose handle it
      }}
      onInputChange={(event, newInputValue, reason) => {
        // Handle typing in the input
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
              // Handle keyboard navigation
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                setOpen(true);
                return;
              }

              if (e.key === 'Enter') {
                // If dropdown is open, let Autocomplete handle it
                if (open) {
                  return;
                }
                // If dropdown is closed, exit edit mode and let DataGrid handle navigation
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
                return;
              }
            },
            style: {
              fontSize: 'inherit',
              padding: '4px 8px',
            },
          }}
          inputProps={{
            ...params.inputProps,
            style: {
              padding: '4px 8px',
              fontSize: 'inherit',
            },
          }}
        />
      )}
      PaperComponent={(props) => (
        <Paper
          {...props}
          style={{
            ...props.style,
            marginTop: '4px',
            maxHeight: '200px',
            overflow: 'auto',
            zIndex: 9999,
          }}
        />
      )}
      ListboxProps={{
        style: {
          maxHeight: '200px',
          fontSize: 'inherit',
        },
      }}
      size="small"
      disablePortal={false}
      style={{
        width: '100%',
        height: '100%',
      }}
      autoHighlight
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
    />
  );
};
