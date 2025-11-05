import React from 'react';
import { Cell, CellStyle, MenuItem } from '../types';
import { COLORS } from '../constants';
import {
  CutIcon, CopyIcon, PasteIcon, StyleIcon, FontSizeIcon, FontWeightIcon,
} from './icons';

// --- Color Menu Generation ---

const createColorMenuItem = (
  colorInfo: { name: string; color?: string; swatchColor?: string; backgroundColor?: string },
  type: 'text' | 'background',
  onSelect: (value: string) => void
): MenuItem => ({
  type: 'item',
  label: colorInfo.name,
  icon: <div className="color-swatch" style={{ backgroundColor: type === 'text' ? colorInfo.color : colorInfo.swatchColor }}></div>,
  action: () => onSelect(type === 'text' ? colorInfo.color! : colorInfo.backgroundColor!),
});

export const createColorSubMenu = (
  type: 'text' | 'background',
  onSelect: (value: string) => void
): MenuItem => {
  const colors = type === 'text' ? COLORS.text : COLORS.background;
  const label = type === 'text' ? 'Text color' : 'Background color';
  return {
    type: 'submenu',
    label,
    subMenu: colors.map(c => createColorMenuItem(c, type, onSelect)),
  };
};

// --- Cell-Specific Style Menu Generation ---

const FontSizeMenuItem: React.FC<{ value: number; onChange: (size: number) => void }> = ({ value, onChange }) => (
  <div className="menu-item" onClick={(e) => e.stopPropagation()}>
    <div className="menu-item-content">
      <span className="menu-item-icon"><FontSizeIcon /></span>
      <span>Font Size</span>
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const newSize = parseInt(e.target.value, 10);
        if (!isNaN(newSize)) onChange(newSize);
      }}
      className="font-size-input"
    />
  </div>
);

export const createCellStyleSubMenu = (
  cell: Cell,
  onStyleChange: (styles: Partial<CellStyle>) => void
): MenuItem => ({
  type: 'submenu',
  icon: <StyleIcon />,
  label: 'Style',
  subMenu: [
    createColorSubMenu('text', (color) => onStyleChange({ color })),
    createColorSubMenu('background', (backgroundColor) => onStyleChange({ backgroundColor })),
    { type: 'divider' },
    { type: 'custom', content: <FontSizeMenuItem value={cell.fontSize} onChange={(fontSize) => onStyleChange({ fontSize })} /> },
    {
      type: 'toggle',
      icon: <FontWeightIcon />,
      label: 'Bold',
      checked: cell.fontWeight === 'bold',
      action: () => onStyleChange({ fontWeight: cell.fontWeight === 'bold' ? 'normal' : 'bold' }),
    },
  ],
});


export const createCopyPasteStyleMenuItems = (
  onCopyStyle: () => void,
  onPasteStyle: () => void,
  isPasteStyleDisabled: boolean
): MenuItem[] => [
    { type: 'item', icon: <CopyIcon />, label: 'Copy Style', action: onCopyStyle },
    { type: 'item', icon: <PasteIcon />, label: 'Paste Style', action: onPasteStyle, disabled: isPasteStyleDisabled },
];

// --- General Clipboard Menu Generation ---

export const createClipboardMenuItems = (
    onCut: () => void,
    onCopy: () => void,
    onPaste: () => void,
): MenuItem[] => [
    { type: 'item', icon: <CutIcon />, label: 'Cut', action: onCut },
    { type: 'item', icon: <CopyIcon />, label: 'Copy', action: onCopy },
    { type: 'item', icon: <PasteIcon />, label: 'Paste', action: onPaste },
];