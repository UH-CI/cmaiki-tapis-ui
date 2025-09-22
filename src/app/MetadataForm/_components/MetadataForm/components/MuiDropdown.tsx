import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, TextField, Paper } from '@mui/material';
import styles from '../MetadataForm.module.scss';

interface MUIAutocompleteDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onSelectionMade?: () => void;
  placeholder?: string;
}

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
            style: styles['mui-dropdown-input-props'],
          }}
          inputProps={{
            ...params.inputProps,
            style: styles['mui-dropdown-input-props-inner'],
          }}
        />
      )}
      PaperComponent={(props) => (
        <Paper
          {...props}
          style={{
            ...props.style,
            ...styles['mui-dropdown-paper'],
          }}
        />
      )}
      ListboxProps={{
        style: styles['mui-dropdown-listbox'],
      }}
      size="small"
      disablePortal={false}
      style={styles['mui-dropdown-container']}
      autoHighlight
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
    />
  );
};
